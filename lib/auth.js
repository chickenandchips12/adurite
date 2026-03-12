"use strict";
const { SignJWT, jwtVerify } = require("jose");

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "adurite-dev-secret-change-in-production"
);

const COOKIE_NAME = "adurite_token";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

function getCookieHeader(token) {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`;
}

function clearCookieHeader() {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

module.exports = { createToken, verifyToken, getCookieHeader, clearCookieHeader };
