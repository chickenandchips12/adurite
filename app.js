// Adurite — App Logic

document.addEventListener("DOMContentLoaded", () => {
  initGiveawayCountdown();
  initFilters();
  initMobileMenu();
  renderItems(MARKETPLACE_ITEMS);
});

// Mobile menu toggle
function initMobileMenu() {
  const btn = document.querySelector(".mobile-menu-btn");
  const nav = document.querySelector(".nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("nav--open");
    btn.classList.toggle("mobile-menu-btn--open");
  });
}

// Giveaway countdown timer
function initGiveawayCountdown() {
  // Set end date (55 days from now for demo)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 55);
  endDate.setHours(12, 0, 0, 0);

  function updateCountdown() {
    const now = new Date();
    const diff = endDate - now;

    if (diff <= 0) {
      document.getElementById("days").textContent = "0";
      document.getElementById("hours").textContent = "0";
      document.getElementById("minutes").textContent = "0";
      document.getElementById("seconds").textContent = "0";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("days").textContent = String(days).padStart(2, "0");
    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Filters
function initFilters() {
  const priceRange = document.getElementById("price-range");
  const priceDisplay = document.getElementById("price-display");
  const paymentFilter = document.getElementById("payment-filter");
  const sortFilter = document.getElementById("sort-filter");
  const resetBtn = document.getElementById("reset-filters");

  function applyFilters() {
    const maxPrice = parseInt(priceRange.value, 10);
    const payment = paymentFilter.value;
    const sort = sortFilter.value;

    let items = [...MARKETPLACE_ITEMS].filter((item) => item.price <= maxPrice);

    // Sort
    switch (sort) {
      case "rap-high":
        items.sort((a, b) => b.rap - a.rap);
        break;
      case "rap-low":
        items.sort((a, b) => a.rap - b.rap);
        break;
      case "price-high":
        items.sort((a, b) => b.price - a.price);
        break;
      case "price-low":
        items.sort((a, b) => a.price - b.price);
        break;
      case "rate":
        items.sort((a, b) => b.rap / b.price - a.rap / a.price);
        break;
    }

    renderItems(items);
  }

  priceRange.addEventListener("input", () => {
    const max = parseInt(priceRange.value, 10);
    priceDisplay.textContent = `$0 - $${max.toLocaleString()}`;
    applyFilters();
  });

  paymentFilter.addEventListener("change", applyFilters);
  sortFilter.addEventListener("change", applyFilters);

  resetBtn.addEventListener("click", () => {
    priceRange.value = 50000;
    priceDisplay.textContent = "$0 - $50,000";
    paymentFilter.value = "all";
    sortFilter.value = "rap-high";
    applyFilters();
  });
}

// Render item cards
function renderItems(items) {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-card";

    const isRare = item.rap >= 1000000;
    card.innerHTML = `
      <div class="item-card-header">
        <h3 class="item-name">${escapeHtml(item.name)}</h3>
        ${isRare ? '<span class="item-badge">Rare</span>' : ""}
      </div>
      <div class="item-stats">
        <span class="item-rap">RAP ${formatRap(item.rap)}</span>
        <span class="item-price">${formatPrice(item.price)}</span>
      </div>
      <button class="btn btn--primary btn--sm">Buy Now</button>
    `;

    grid.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
