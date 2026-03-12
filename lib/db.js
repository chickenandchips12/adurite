"use strict";
const { Redis } = require("@upstash/redis");

// Support both standard and Vercel KV integration variable names
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
const redis = new Redis({ url, token });

async function getOrCreateUser(robloxId, username, displayName) {
  const key = `user:${robloxId}`;
  const raw = await redis.get(key);
  const existing = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;
  if (existing) {
    const updated = { ...existing, username, displayName };
    await redis.set(key, JSON.stringify(updated));
    return { id: robloxId, robloxId, username, displayName };
  }
  const user = { id: robloxId, robloxId, username, displayName };
  await redis.set(key, JSON.stringify(user));
  return user;
}

async function getUser(robloxId) {
  const raw = await redis.get(`user:${robloxId}`);
  return raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;
}

async function getListings(maxPrice = 50000, sort = "rap-high") {
  const listings = await redis.lrange("listings", 0, -1);
  const parsed = listings.map((l) => (typeof l === "string" ? JSON.parse(l) : l));
  const users = {};
  for (const l of parsed) {
    if (!users[l.seller_id]) {
      const u = await redis.get(`user:${l.seller_id}`);
      users[l.seller_id] = u ? (typeof u === "string" ? JSON.parse(u) : u) : { username: "Unknown" };
    }
  }
  const withSeller = parsed
    .filter((l) => l.price <= maxPrice)
    .map((l) => ({ ...l, seller_username: users[l.seller_id]?.username || "Unknown" }));

  const order = {
    "rap-high": (a, b) => b.rap - a.rap,
    "rap-low": (a, b) => a.rap - b.rap,
    "price-high": (a, b) => b.price - a.price,
    "price-low": (a, b) => a.price - b.price,
    rate: (a, b) => b.rap / b.price - a.rap / a.price,
  };
  withSeller.sort(order[sort] || order["rap-high"]);
  return withSeller;
}

async function getMyListings(robloxId) {
  const listings = await redis.lrange("listings", 0, -1);
  const parsed = listings.map((l) => (typeof l === "string" ? JSON.parse(l) : l));
  return parsed.filter((l) => l.seller_id === robloxId).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
}

async function createListing(sellerId, listing) {
  const existing = await redis.lrange("listings", 0, -1);
  const parsed = existing.map((l) => (typeof l === "string" ? JSON.parse(l) : l));
  if (parsed.some((l) => l.user_asset_id === listing.userAssetId)) {
    throw new Error("This item is already listed");
  }
  const id = (await redis.incr("listing:id")) || Date.now();
  const full = {
    id,
    seller_id: sellerId,
    asset_id: listing.assetId,
    user_asset_id: listing.userAssetId,
    name: listing.name,
    rap: listing.rap || 0,
    price: listing.price,
    serial_number: listing.serialNumber || null,
    created_at: Date.now(),
  };
  await redis.rpush("listings", JSON.stringify(full));
  return full;
}

async function deleteListing(id, sellerId) {
  const listings = await redis.lrange("listings", 0, -1);
  const parsed = listings.map((l) => (typeof l === "string" ? JSON.parse(l) : l));
  const idx = parsed.findIndex((l) => String(l.id) === String(id));
  if (idx < 0) throw new Error("Listing not found");
  if (parsed[idx].seller_id !== sellerId) throw new Error("Not your listing");
  const toRemove = listings[idx];
  await redis.lrem("listings", 1, toRemove);
  return true;
}

module.exports = { getOrCreateUser, getUser, getListings, getMyListings, createListing, deleteListing };
