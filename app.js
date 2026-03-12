// Adurite — App Logic

const API = "/api";

let currentUser = null;
let selectedInventoryItem = null;

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initMobileMenu();
  initConnectModal();
  initListModal();
  initFilters();
  initSellFlow();
  loadListings();

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#sell" && currentUser) loadInventory();
    if (window.location.hash === "#dashboard" && currentUser) loadMyListings();
  });
});

// Auth
async function initAuth() {
  try {
    const res = await fetch(`${API}/auth/me`, { credentials: "include" });
    const data = await res.json();
    currentUser = data.user;
    updateAuthUI();
    if (currentUser) loadMyListings();
  } catch {
    updateAuthUI();
  }
}

function updateAuthUI() {
  const btnLogin = document.getElementById("btn-login");
  const userMenu = document.getElementById("user-menu");
  const userDisplayName = document.getElementById("user-display-name");
  const navSell = document.getElementById("nav-sell");
  const navDashboard = document.getElementById("nav-dashboard");

  if (currentUser) {
    btnLogin.style.display = "none";
    userMenu.style.display = "flex";
    userDisplayName.textContent = currentUser.displayName || currentUser.username;
    navDashboard.style.display = "";
  } else {
    btnLogin.style.display = "";
    userMenu.style.display = "none";
    navDashboard.style.display = "none";
  }
}

// Connect Modal
function initConnectModal() {
  const modal = document.getElementById("connect-modal");
  const backdrop = modal.querySelector(".modal-backdrop");
  const closeBtn = document.getElementById("modal-close");
  const connectBtn = document.getElementById("btn-connect");
  const cookieInput = document.getElementById("cookie-input");
  const connectError = document.getElementById("connect-error");

  function openModal() {
    modal.classList.add("modal--open");
    cookieInput.value = "";
    connectError.style.display = "none";
  }

  function closeModal() {
    modal.classList.remove("modal--open");
  }

  document.getElementById("btn-login").addEventListener("click", openModal);
  document.getElementById("btn-connect-sell").addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  connectBtn.addEventListener("click", async () => {
    const cookie = cookieInput.value.trim();
    if (!cookie) {
      connectError.textContent = "Please paste your cookie";
      connectError.style.display = "block";
      return;
    }

    connectError.style.display = "none";
    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting...";

    try {
      const res = await fetch(`${API}/auth/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cookie }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error. Please try again.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to connect");
      }

      currentUser = data.user;
      updateAuthUI();
      closeModal();

      // If on sell section, load inventory
      if (window.location.hash === "#sell") {
        loadInventory();
      }

      loadListings();
      loadMyListings();
    } catch (err) {
      connectError.textContent = err.message;
      connectError.style.display = "block";
    } finally {
      connectBtn.disabled = false;
      connectBtn.textContent = "Connect";
    }
  });
}

// Logout
document.getElementById("btn-logout").addEventListener("click", async () => {
  await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
  currentUser = null;
  updateAuthUI();
  document.getElementById("sell-cta").style.display = "block";
  document.getElementById("inventory-section").style.display = "none";
  loadListings();
});

// List Modal
function initListModal() {
  const modal = document.getElementById("list-modal");
  const backdrop = modal.querySelector(".modal-backdrop");
  const closeBtn = document.getElementById("list-modal-close");
  const listBtn = document.getElementById("btn-list-item");
  const priceInput = document.getElementById("list-price");
  const listError = document.getElementById("list-error");

  function closeModal() {
    modal.classList.remove("modal--open");
    selectedInventoryItem = null;
  }

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  listBtn.addEventListener("click", async () => {
    if (!selectedInventoryItem) return;

    const price = parseFloat(priceInput.value);
    if (!price || price <= 0) {
      listError.textContent = "Enter a valid price";
      listError.style.display = "block";
      return;
    }

    listError.style.display = "none";
    listBtn.disabled = true;

    try {
      const res = await fetch(`${API}/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assetId: selectedInventoryItem.assetId,
          userAssetId: selectedInventoryItem.userAssetId,
          name: selectedInventoryItem.name,
          rap: selectedInventoryItem.rap,
          serialNumber: selectedInventoryItem.serialNumber,
          price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to list item");
      }

      closeModal();
      loadListings();
      loadMyListings();
      loadInventory(); // Refresh to remove listed item from available
    } catch (err) {
      listError.textContent = err.message;
      listError.style.display = "block";
    } finally {
      listBtn.disabled = false;
    }
  });
}

// Inventory & Sell Flow
function initSellFlow() {
  document.getElementById("hero-sell-btn").addEventListener("click", () => {
    if (currentUser) {
      loadInventory();
    } else {
      document.getElementById("connect-modal").classList.add("modal--open");
    }
  });
}

async function loadInventory() {
  if (!currentUser) {
    document.getElementById("sell-cta").style.display = "block";
    document.getElementById("inventory-section").style.display = "none";
    return;
  }

  document.getElementById("sell-cta").style.display = "none";
  document.getElementById("inventory-section").style.display = "block";

  const grid = document.getElementById("inventory-grid");
  grid.innerHTML = '<div class="loading">Loading your limiteds...</div>';

  try {
    const res = await fetch(`${API}/users/me/inventory`, { credentials: "include" });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to load inventory");

    grid.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>No limited items in your inventory.</p></div>';
      return;
    }

    // Filter out already-listed items
    let myListings = [];
    try {
      const listRes = await fetch(`${API}/listings/mine`, { credentials: "include" });
      const listData = await listRes.json();
      myListings = listData.listings || [];
    } catch {}
    const listedUserAssetIds = new Set(myListings.map((l) => l.user_asset_id));
    const availableItems = data.items.filter((i) => !listedUserAssetIds.has(i.userAssetId));

    if (availableItems.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>All your limiteds are already listed!</p></div>';
      return;
    }

    availableItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "inventory-card";
      card.innerHTML = `
        <div class="inventory-card-name">${escapeHtml(item.name)}</div>
        <div class="inventory-card-rap">RAP ${formatRap(item.rap)}</div>
        <button class="btn btn--primary btn--sm">List for Sale</button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        selectedInventoryItem = item;
        document.getElementById("list-item-name").textContent = item.name;
        document.getElementById("list-item-rap").textContent = `RAP ${formatRap(item.rap)}`;
        document.getElementById("list-price").value = "";
        document.getElementById("list-modal").classList.add("modal--open");
      });
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<div class="empty-state error"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

// Listings
async function loadListings() {
  const maxPrice = document.getElementById("price-range")?.value || 50000;
  const sort = document.getElementById("sort-filter")?.value || "rap-high";

  try {
    const res = await fetch(`${API}/listings?maxPrice=${maxPrice}&sort=${sort}`);
    const data = await res.json();

    const grid = document.getElementById("items-grid");
    const emptyEl = document.getElementById("empty-marketplace");

    if (!data.listings || data.listings.length === 0) {
      grid.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.id = "empty-marketplace";
      empty.innerHTML = "<p>No listings yet. Be the first to sell — connect your Roblox account above!</p>";
      grid.appendChild(empty);
      updateSoldTicker([]);
      return;
    }

    grid.innerHTML = "";
    renderListings(grid, data.listings);
    updateSoldTicker(data.listings);
  } catch (err) {
    const grid = document.getElementById("items-grid");
    grid.innerHTML = `<div class="empty-state"><p>Failed to load listings. Refresh to try again.</p></div>`;
  }
}

function renderListings(container, listings) {
  listings.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-card";
    const isRare = (item.rap || 0) >= 1000000;
    card.innerHTML = `
      <div class="item-card-header">
        <h3 class="item-name">${escapeHtml(item.name)}</h3>
        ${isRare ? '<span class="item-badge">Rare</span>' : ""}
      </div>
      <div class="item-seller">by ${escapeHtml(item.seller_username || "Seller")}</div>
      <div class="item-stats">
        <span class="item-rap">RAP ${formatRap(item.rap)}</span>
        <span class="item-price">${formatPrice(item.price)}</span>
      </div>
      <button class="btn btn--primary btn--sm">Buy Now</button>
    `;
    container.appendChild(card);
  });
}

function updateSoldTicker(listings) {
  const track = document.getElementById("sold-ticker-track");
  if (!listings || listings.length === 0) {
    track.innerHTML = '<div class="sold-item" data-price="0">No listings yet</div>';
    return;
  }

  const items = listings.slice(0, 15).map((l) => ({
    name: l.name,
    price: l.price,
  }));

  track.innerHTML = items
    .map(
      (i) =>
        `<div class="sold-item" data-price="${i.price}">${escapeHtml(i.name)}</div>`
    )
    .join("");
  track.innerHTML += items.map((i) => `<div class="sold-item" data-price="${i.price}">${escapeHtml(i.name)}</div>`).join("");
}

async function loadMyListings() {
  if (!currentUser) return;

  try {
    const res = await fetch(`${API}/listings/mine`, { credentials: "include" });
    const data = await res.json();

    const container = document.getElementById("my-listings");
    const emptyEl = document.getElementById("empty-listings");

    if (!data.listings || data.listings.length === 0) {
      container.innerHTML = '<div class="empty-state" id="empty-listings"><p>You haven\'t listed any items yet. <a href="#sell">List your first item</a></p></div>';
      return;
    }

    container.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "items-grid";
    renderListings(grid, data.listings);

    data.listings.forEach((item, i) => {
      const card = grid.children[i];
      const buyBtn = card.querySelector(".btn");
      if (buyBtn) {
        buyBtn.textContent = "Remove";
        buyBtn.classList.remove("btn--primary");
        buyBtn.classList.add("btn--ghost");
        buyBtn.addEventListener("click", async () => {
          if (!confirm("Remove this listing?")) return;
          await fetch(`${API}/listings/${item.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          loadMyListings();
          loadListings();
        });
      }
    });

    container.appendChild(grid);
  } catch {}
}

// Filters
function initFilters() {
  const priceRange = document.getElementById("price-range");
  const priceDisplay = document.getElementById("price-display");
  const sortFilter = document.getElementById("sort-filter");
  const resetBtn = document.getElementById("reset-filters");

  function applyFilters() {
    if (priceDisplay) {
      const max = parseInt(priceRange.value, 10);
      priceDisplay.textContent = `$0 - $${max.toLocaleString()}`;
    }
    loadListings();
  }

  priceRange?.addEventListener("input", applyFilters);
  sortFilter?.addEventListener("change", applyFilters);

  resetBtn?.addEventListener("click", () => {
    priceRange.value = 50000;
    priceDisplay.textContent = "$0 - $50,000";
    sortFilter.value = "rap-high";
    applyFilters();
  });
}

// Mobile menu
function initMobileMenu() {
  const btn = document.querySelector(".mobile-menu-btn");
  const nav = document.querySelector(".nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("nav--open");
  });
}
