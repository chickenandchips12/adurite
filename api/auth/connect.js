const { validateRobloxCookie, fetchUserDetails } = require("../../lib/roblox");
const { getOrCreateUser } = require("../../lib/db");
const { createToken, getCookieHeader } = require("../../lib/auth");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { cookie } = req.body || {};
    const robloxUser = await validateRobloxCookie(cookie);

    const details = await fetchUserDetails(robloxUser.id);
    const username = details?.name || robloxUser.name || "Unknown";
    const displayName = details?.displayName || username;

    const user = await getOrCreateUser(robloxUser.id, username, displayName);

    const token = await createToken({
      robloxId: user.robloxId,
      username: user.username,
    });

    res.setHeader("Set-Cookie", getCookieHeader(token));
    res.status(200).json({
      user: {
        id: user.robloxId,
        robloxId: user.robloxId,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to connect account" });
  }
}
