const { getListings, createListing } = require("../../lib/db");
const { verifyToken } = require("../../lib/auth");

function getToken(req) {
  const cookie = req.headers?.cookie || "";
  const match = cookie.match(/adurite_token=([^;]+)/);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const maxPrice = parseFloat(req.query?.maxPrice) || 50000;
    const sort = req.query?.sort || "rap-high";
    try {
      const listings = await getListings(maxPrice, sort);
      res.status(200).json({ listings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === "POST") {
    const token = getToken(req);
    const payload = token ? await verifyToken(token) : null;
    if (!payload?.robloxId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { assetId, userAssetId, name, rap, price, serialNumber } = req.body || {};
      if (!assetId || !userAssetId || !name || price == null) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const priceNum = parseFloat(price);
      if (priceNum <= 0) return res.status(400).json({ error: "Price must be positive" });

      const listing = await createListing(payload.robloxId, {
        assetId,
        userAssetId,
        name,
        rap: parseInt(rap, 10) || 0,
        price: priceNum,
        serialNumber,
      });
      res.status(201).json(listing);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to create listing" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
