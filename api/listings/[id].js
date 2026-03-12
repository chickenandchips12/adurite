const { deleteListing } = require("../../lib/db");
const { verifyToken } = require("../../lib/auth");

function getToken(req) {
  const cookie = req.headers?.cookie || "";
  const match = cookie.match(/adurite_token=([^;]+)/);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const token = getToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload?.robloxId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: "Missing listing ID" });

  try {
    await deleteListing(id, payload.robloxId);
    res.status(200).json({ ok: true });
  } catch (err) {
    if (err.message === "Listing not found") return res.status(404).json({ error: err.message });
    if (err.message === "Not your listing") return res.status(403).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
}
