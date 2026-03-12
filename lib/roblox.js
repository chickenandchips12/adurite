"use strict";
const ROBLOX_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

async function validateRobloxCookie(cookie) {
  const cleanCookie = typeof cookie === "string" ? cookie.trim() : "";
  if (!cleanCookie) throw new Error("Cookie is required");

  // Handle various paste formats
  let cookieValue = cleanCookie
    .replace(/\r?\n/g, "") // remove newlines
    .replace(/\s+/g, " ")   // collapse spaces
    .trim();
  if (cookieValue.startsWith(".ROBLOSECURITY=")) {
    cookieValue = cookieValue.slice(".ROBLOSECURITY=".length);
  }
  if (cookieValue.startsWith("_ROBLOSECURITY=")) {
    cookieValue = cookieValue.slice("_ROBLOSECURITY=".length);
  }

  // Try with full cookie first (some clients need the WARNING prefix), then without
  const cookieVariants = [cookieValue];
  if (cookieValue.includes("_|WARNING:")) {
    cookieVariants.push(cookieValue.split("_|WARNING:")[0].trim());
  }

  let res;
  let lastError;
  for (const variant of cookieVariants) {
    if (!variant) continue;
    res = await fetch("https://users.roblox.com/v1/users/authenticated", {
      method: "GET",
      headers: { ...ROBLOX_HEADERS, Cookie: `.ROBLOSECURITY=${variant}` },
    });
    if (res.ok) break;
    lastError = res.status;
  }
  if (!res) res = { ok: false, status: 401, headers: { get: () => "" }, text: () => "" };

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
    if (res.status === 401) {
      throw new Error(
        "Roblox rejected the request (401). Your cookie may be valid, but Roblox often blocks requests from cloud servers (e.g. Vercel). Try running the app locally: npm start, then open http://localhost:3000"
      );
    }
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
