const { validateRobloxCookie } = require("../../lib/roblox");

/**
 * Debug endpoint: Test if a cookie works with Roblox (without creating a session)
 * POST /api/auth/verify-cookie
 * Body: { cookie: string }
 * Returns: { ok: true, user: {...} } or { ok: false, status, message }
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { cookie } = req.body || {};
    const robloxUser = await validateRobloxCookie(cookie);

    res.status(200).json({
      ok: true,
      user: { id: robloxUser.id, name: robloxUser.name },
      message: "Cookie is valid. Roblox accepted the request.",
    });
  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message,
      hint: "If your cookie expires in 2027, Roblox may be blocking requests from this server. Try: npm start (local) → http://localhost:3000",
    });
  }
};
