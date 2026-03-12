# Adurite — Roblox Limiteds Marketplace

A player-to-player marketplace where Roblox users connect their accounts and sell their limited items.

## Features

- **Connect Roblox account** — Paste your `.ROBLOSECURITY` cookie to verify and link your account
- **View your limiteds** — Fetches your collectible inventory from Roblox
- **List items for sale** — Set your price in USD and list any limited
- **Browse marketplace** — See all listings from real players with filters and sorting
- **My Listings** — Manage and remove your active listings

## Deploy to Vercel

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Add **Upstash Redis** from [Vercel Marketplace](https://vercel.com/marketplace) (Storage → Redis)
3. Add environment variable: `JWT_SECRET` (any random string for signing auth tokens)
4. Deploy

The Upstash integration adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` automatically.

## Run Locally

```bash
npm install
npm start
```

Then open http://localhost:3000

For local dev, the Express server uses SQLite. For Vercel, the serverless API uses Upstash Redis.

## Authorization API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/generate` | POST | Exchange a Roblox cookie for an Adurite auth token. Body: `{ "cookie": "..." }` |
| `/api/auth/validate` | POST/GET | Check if an Adurite token is valid. Body: `{ "token": "..." }` or `Authorization: Bearer <token>` |

## Tech Stack

- **Local:** Node.js, Express, sql.js (SQLite)
- **Vercel:** Serverless functions, Upstash Redis, JWT auth
- **Frontend:** Vanilla HTML, CSS, JavaScript
