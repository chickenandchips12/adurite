const { fetchUserInventory } = require("../../../lib/roblox");
const { getUser } = require("../../../lib/db");
const { verifyToken } = require("../../../lib/auth");

function getToken(req) {
  const cookie = req.headers?.cookie || "";
  const match = cookie.match(/adurite_token=([^;]+)/);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = getToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload?.robloxId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await getUser(payload.robloxId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const inventory = await fetchUserInventory(user.robloxId);
    const limiteds = inventory.map((item) => ({
      assetId: item.assetId,
      userAssetId: item.userAssetId,
      name: item.name,
      rap: item.recentAveragePrice || 0,
      serialNumber: item.serialNumber,
    }));

    res.status(200).json({ items: limiteds });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch inventory" });
  }
}
