"use strict";
const ROBLOX_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

async function validateRobloxCookie(cookie) {
  const cleanCookie = typeof cookie === "string" ? cookie.trim() : "";
  if (!cleanCookie) throw new Error("Cookie is required");

  const cookieValue = cleanCookie.includes("_|WARNING:")
    ? cleanCookie.split("_|WARNING:")[0].trim()
    : cleanCookie;

  const res = await fetch("https://users.roblox.com/v1/users/authenticated", {
    headers: { ...ROBLOX_HEADERS, Cookie: `.ROBLOSECURITY=${cookieValue}` },
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

module.exports = { validateRobloxCookie, fetchUserDetails, fetchUserInventory };
