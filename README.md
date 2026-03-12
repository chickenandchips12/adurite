# Adurite — The #1 Gaming Item Marketplace

A modern remake of [adurite.com](https://adurite.com/), the Roblox limited item marketplace.

## Features

- **Hero section** — Bold headline with trust stats (4.2 rating, 1,204 reviews)
- **Recently sold ticker** — Animated marquee of live sales
- **Giveaway** — Countdown timer and entry CTA
- **Marketplace** — Filterable item grid (price, payment, sort)
- **Responsive** — Mobile-first design with collapsible nav

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- No build step — open `index.html` or use a local server

## Run Locally

```bash
# Option 1: Open directly
start index.html

# Option 2: With a local server (recommended)
npx serve .
# or
python -m http.server 8000
```

Then visit `http://localhost:3000` (or 8000).

## Project Structure

```
adurite/
├── index.html    # Main page
├── styles.css    # All styles
├── data.js       # Item data & formatters
├── app.js        # Filters, countdown, rendering
└── README.md
```
