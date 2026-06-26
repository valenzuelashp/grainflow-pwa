# GrainFlow — Rice Retail POS (PWA)

Offline-first point-of-sale and inventory app for **bigasan** (rice retail stores). No backend, database server, or API keys required.

## Quick start

```bash
cd grainflow/grainflow
npm install
npm run dev
```

Open http://localhost:5173, create a store account, and start using the app.

## Install as PWA

1. Run `npm run build && npm run preview` (or deploy the `dist/` folder to any static host).
2. In Chrome/Edge: menu → **Install GrainFlow** (or Add to Home Screen on mobile).
3. The app works offline after the first load.

## Features

- **POS** — sell rice by kg/sack, cash, GCash, or utang (credit)
- **Inventory** — stock tracking, batch queue, low-stock alerts
- **Utang** — track and collect suki credit balances
- **Dashboard & Analytics** — daily revenue, trends, heatmaps, goals
- **Reports** — sales logs, customer archives, PDF export
- **Local storage** — all data stays on this device (IndexedDB)

## Data backup

Go to **Profile → Help Center → Export Store Data** to download a JSON backup of your products and sales.

Clearing browser data will delete your store records.

## Production build

```bash
npm run build
```

Deploy the `dist/` folder to Netlify, Vercel, GitHub Pages, or any static file host.

## What changed from the full version

This MVP removes:

- Laravel/PHP backend and Render deployment
- Google OAuth and email verification
- Gemini AI chat (GrainBot)
- External email services

Everything runs in the browser as a installable PWA.
