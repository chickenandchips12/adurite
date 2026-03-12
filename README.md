# Adurite — Roblox Limiteds Marketplace

A player-to-player marketplace where Roblox users connect their accounts and sell their limited items.

## Features

- **Connect Roblox account** — Paste your `.ROBLOSECURITY` cookie to verify and link your account
- **View your limiteds** — Fetches your collectible inventory from Roblox
- **List items for sale** — Set your price in USD and list any limited
- **Browse marketplace** — See all listings from real players with filters and sorting
- **My Listings** — Manage and remove your active listings

## How to Connect

1. Log into [roblox.com](https://www.roblox.com)
2. Open DevTools (F12) → **Application** → **Cookies** → roblox.com
3. Copy the value of `.ROBLOSECURITY`
4. Click **Connect Roblox** and paste it

> ⚠️ **Security:** Never share your cookie. We use it only to verify your account and fetch your inventory. We never store it.

## Tech Stack

- **Backend:** Node.js, Express, sql.js (SQLite)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **APIs:** Roblox (users.roblox.com, inventory.roblox.com)

## Run Locally

```bash
npm install
npm start
```

Then open http://localhost:3000

## Project Structure

```
adurite/
├── server.js      # Express API + Roblox integration
├── index.html     # Main page
├── styles.css     # Styles
├── app.js         # Frontend logic
├── utils.js       # Helpers (formatRap, formatPrice)
├── data.db        # SQLite DB (created on first run)
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/connect | Connect with Roblox cookie |
| GET | /api/auth/me | Current user |
| POST | /api/auth/logout | Log out |
| GET | /api/users/me/inventory | My limiteds (from Roblox) |
| POST | /api/listings | Create listing |
| GET | /api/listings | All listings (with filters) |
| GET | /api/listings/mine | My listings |
| DELETE | /api/listings/:id | Remove listing |
