const { verifyToken } = require("../../lib/auth");

/**
 * Validate: Returns whether the provided Adurite auth token is valid
 * POST /api/auth/validate
 * Body: { token: string } OR Header: Authorization: Bearer <token>
 * Returns: { valid: true } or { valid: false }
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let token = null;

  // From Authorization header
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // From body (POST)
  if (!token && req.body?.token) {
    token = req.body.token;
  }

  // From query (GET)
  if (!token && req.query?.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(400).json({ valid: false, error: "No token provided" });
  }

  const payload = await verifyToken(token);
  res.status(200).json({ valid: !!payload });
};
