# Coin Book — Expense Ledger (React + PWA)

A ledger-styled expense tracker: multi-currency, multi-language (EN/SR/RU), day/week/month/year views, a category donut chart, CSV/JSON import-export, and a customizable number format. All data is stored locally in the browser via `localStorage` — nothing leaves the device.

This is a real React app (Vite) exported from the original interactive prototype, and configured as an installable Progressive Web App (works offline, "Add to Home Screen" on mobile).

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). On your phone, open the same URL from your computer's LAN IP (or deploy it — see below) and use the browser's "Add to Home Screen" / install prompt to install it as a standalone app.

## Building for production / installing as a PWA

```bash
npm run build
npm run preview
```

`npm run build` outputs a static `dist/` folder (deployable to Vercel, Netlify, GitHub Pages, any static host, or just opened locally). Once served over `https://` (or `localhost`), mobile browsers will offer to install it as an app — it'll get its own icon, launch full-screen, and keep working offline thanks to the generated service worker.

## Project structure

```
coinbook-pwa/
  index.html          Vite entry HTML (fonts, manifest link, theme color)
  vite.config.js       Vite + vite-plugin-pwa config (manifest + service worker)
  public/icons/        App icons (192px, 512px, and the original source icon)
  src/
    main.jsx           React root
    App.jsx            The whole app: state, logic, and rendering
    App.css            All styles (including every animation/keyframe)
    data.js            Static data: category list, translations, starter/seed entries
    utils.js           Small pure helpers (money formatting, CSV parsing, dates, etc.)
```

Everything lives in one `App.jsx` component (class component, mirroring the original design prototype's structure) for straightforward readability — feel free to split it into smaller components as the app grows.

## Data & storage

- All expenses, categories, currency/rate settings, language, and number-format preferences are persisted to `localStorage` under the key `coinbook_v1_state`.
- The app ships with ~20 illustrative starter entries (seeded relative to today's date) so the ledger isn't empty on first launch. Clear them anytime via **Settings → Danger Zone → Delete All Data**.
- **Export JSON / Export CSV** (in Settings) download your data; **Import JSON / Import CSV** merge data back in (new categories are created automatically on import).

## Notes for further development

- Hover/press states are plain CSS (`:hover` / `:active` classes in `App.css`) rather than JS-tracked state, for performance.
- The coin-styled category badges use a small `coinFace()` gradient helper (`src/utils.js`) applied over any flat category color — reuse it for new UI that needs the same coin look.
- The total-spent counter animates via `requestAnimationFrame` with a `setTimeout` safety net so it never gets stuck mid-count if the tab is backgrounded/throttled.
