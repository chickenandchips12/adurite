const { getMyListings } = require("../../lib/db");
const { verifyToken } = require("../../lib/auth");

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
    const listings = await getMyListings(payload.robloxId);
    res.status(200).json({ listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
