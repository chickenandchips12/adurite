const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

let db = null;

async function initDb() {
  const initSqlJs = require("sql.js");
  const SQL = await initSqlJs();

  const dbPath = path.join(__dirname, "data.db");
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roblox_id INTEGER UNIQUE NOT NULL,
      username TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      user_asset_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      rap INTEGER NOT NULL,
      price REAL NOT NULL,
      serial_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
    CREATE INDEX IF NOT EXISTS idx_listings_asset ON listings(asset_id);
  `);

  // Persist to file periodically
  setInterval(() => {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }, 30000);

  return db;
}

// Helper: run query and return rows
function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push(row);
  }
  stmt.free();
  return rows;
}

// Helper: run query and return single row
function dbGet(sql, params = []) {
  const rows = dbAll(sql, params);
  return rows[0] || null;
}

// Helper: run insert/update
function dbRun(sql, params = []) {
  db.run(sql, params);
  return { lastInsertRowid: db.getRowsModified() ? db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] : 0 };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "adurite-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

// Roblox API helpers
const ROBLOX_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

async function validateRobloxCookie(cookie) {
  const cleanCookie = typeof cookie === "string" ? cookie.trim() : "";
  if (!cleanCookie) throw new Error("Cookie is required");

  // Strip _|WARNING:... if user pasted the full cookie value
  const cookieValue = cleanCookie.includes("_|WARNING:")
    ? cleanCookie.split("_|WARNING:")[0].trim()
    : cleanCookie;

  const res = await fetch("https://users.roblox.com/v1/users/authenticated", {
    headers: {
      ...ROBLOX_HEADERS,
      Cookie: `.ROBLOSECURITY=${cookieValue}`,
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!contentType.includes("application/json")) {
    if (res.status === 401) throw new Error("Invalid or expired cookie. Get a fresh cookie from Roblox.");
    throw new Error("Roblox returned an error. Try again in a few minutes.");
  }

  let user;
  try {
    user = JSON.parse(text);
  } catch {
    throw new Error("Invalid or expired cookie. Make sure you copied the full .ROBLOSECURITY value.");
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid or expired cookie. Get a fresh cookie from Roblox.");
    throw new Error(user?.errors?.[0]?.message || "Failed to validate with Roblox");
  }

  if (!user?.id) throw new Error("Invalid response from Roblox. Try again.");

  return user;
}

async function fetchUserDetails(userId) {
  const res = await fetch(`https://users.roblox.com/v1/users/${userId}`, {
    headers: ROBLOX_HEADERS,
  });
  if (!res.ok) return null;
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function fetchUserInventory(userId) {
  const items = [];
  let cursor = null;

  do {
    const url = new URL(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles`);
    url.searchParams.set("limit", "100");
    url.searchParams.set("sortOrder", "Desc");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), { headers: ROBLOX_HEADERS });
    if (!res.ok) throw new Error("Failed to fetch inventory");

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Failed to load inventory. Try again later.");
    }
    items.push(...(data.data || []));
    cursor = data.nextPageCursor || null;
  } while (cursor);

  return items;
}

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// API: Connect Roblox account
app.post("/api/auth/connect", async (req, res, next) => {
  try {
    const { cookie } = req.body;
    const robloxUser = await validateRobloxCookie(cookie);

    const details = await fetchUserDetails(robloxUser.id);
    const username = details?.name || robloxUser.name || "Unknown";
    const displayName = details?.displayName || username;

    db.run(
      `INSERT INTO users (roblox_id, username, display_name, avatar_url) VALUES (?, ?, ?, ?)
       ON CONFLICT(roblox_id) DO UPDATE SET username = excluded.username, display_name = excluded.display_name, avatar_url = excluded.avatar_url`,
      [robloxUser.id, username, displayName, null]
    );

    const row = dbGet("SELECT id, roblox_id, username, display_name FROM users WHERE roblox_id = ?", [robloxUser.id]);

    req.session.userId = row.id;
    req.session.robloxId = robloxUser.id;
    req.session.username = row.username;

    res.json({
      user: {
        id: row.id,
        robloxId: row.roblox_id,
        username: row.username,
        displayName: row.display_name,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to connect account" });
  }
});

// API: Get current user
app.get("/api/auth/me", (req, res) => {
  if (!req.session?.userId) {
    return res.json({ user: null });
  }

  const row = dbGet("SELECT id, roblox_id, username, display_name FROM users WHERE id = ?", [req.session.userId]);
  if (!row) {
    req.session.destroy();
    return res.json({ user: null });
  }

  res.json({
    user: {
      id: row.id,
      robloxId: row.roblox_id,
      username: row.username,
      displayName: row.display_name,
    },
  });
});

// API: Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// API: Get my inventory (limiteds from Roblox)
app.get("/api/users/me/inventory", requireAuth, async (req, res) => {
  try {
    const row = dbGet("SELECT roblox_id FROM users WHERE id = ?", [req.session.userId]);
    if (!row) return res.status(404).json({ error: "User not found" });

    const inventory = await fetchUserInventory(row.roblox_id);

    const limiteds = inventory.map((item) => ({
      assetId: item.assetId,
      userAssetId: item.userAssetId,
      name: item.name,
      rap: item.recentAveragePrice || 0,
      serialNumber: item.serialNumber,
    }));

    res.json({ items: limiteds });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch inventory" });
  }
});

// API: Create listing
app.post("/api/listings", requireAuth, (req, res) => {
  try {
    const { assetId, userAssetId, name, rap, price } = req.body;

    if (!assetId || !userAssetId || !name || price == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const rapNum = parseInt(rap, 10) || 0;
    const priceNum = parseFloat(price);
    if (priceNum <= 0) return res.status(400).json({ error: "Price must be positive" });

    const existing = dbGet("SELECT id FROM listings WHERE user_asset_id = ?", [userAssetId]);
    if (existing) return res.status(400).json({ error: "This item is already listed" });

    db.run(
      `INSERT INTO listings (seller_id, asset_id, user_asset_id, name, rap, price, serial_number) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.session.userId, assetId, userAssetId, name, rapNum, priceNum, req.body.serialNumber || null]
    );

    const result = db.exec("SELECT last_insert_rowid() as id");
    const lastId = result[0]?.values[0]?.[0] || 0;
    const listing = dbGet("SELECT * FROM listings WHERE id = ?", [lastId]);
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create listing" });
  }
});

// API: Get all listings
app.get("/api/listings", (req, res) => {
  const maxPrice = parseFloat(req.query.maxPrice) || 50000;
  const sort = req.query.sort || "rap-high";

  const orderBy = {
    "rap-high": "l.rap DESC",
    "rap-low": "l.rap ASC",
    "price-high": "l.price DESC",
    "price-low": "l.price ASC",
    rate: "l.rap / l.price DESC",
  }[sort] || "l.rap DESC";

  const rows = dbAll(
    `SELECT l.*, u.username as seller_username FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.price <= ? ORDER BY ${orderBy}`,
    [maxPrice]
  );
  res.json({ listings: rows });
});

// API: Get my listings
app.get("/api/listings/mine", requireAuth, (req, res) => {
  const rows = dbAll("SELECT * FROM listings WHERE seller_id = ? ORDER BY created_at DESC", [req.session.userId]);
  res.json({ listings: rows });
});

// API: Delete listing
app.delete("/api/listings/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = dbGet("SELECT id, seller_id FROM listings WHERE id = ?", [id]);

  if (!row) return res.status(404).json({ error: "Listing not found" });
  if (row.seller_id !== req.session.userId) return res.status(403).json({ error: "Not your listing" });

  db.run("DELETE FROM listings WHERE id = ?", [id]);
  res.json({ ok: true });
});

// Health check (so we can detect if API server is running)
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Static files (must be after API routes)
app.use(express.static(path.join(__dirname)));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API error handler - ensure JSON for uncaught errors
app.use((err, req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Something went wrong" });
  }
  next(err);
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Adurite running at http://localhost:${PORT}`);
  });
});
