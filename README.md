# G4 Mission Control

> **God • Goals • Grinding • Gratitude**

A premium, offline-first **Personal Life Operating System** — your Mission Control for discipline, health, finance, faith, learning, and progress.

Built for local ownership: no backend, no paid hosting required. Everything runs in the browser with IndexedDB.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Dexie.js (IndexedDB)
- Zustand
- Framer Motion
- Recharts
- PWA (vite-plugin-pwa)

## Quick start

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. On first launch:

1. Complete **Setup** (display name, username, password)
2. Credentials are hashed with **PBKDF2** and stored only in IndexedDB
3. Default habits, quotes, and achievement definitions are seeded automatically

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build
npm run typecheck
```

## Install on your phone (PWA)

This app is a **Progressive Web App**. After you deploy it (HTTPS), you can install it to your home screen and use it offline. All data stays in the phone’s browser storage.

### 1) Deploy (required for real phones)

Phones cannot install from `localhost` on your PC. Deploy for free:

```bash
npm run build
```

Then either:
- **Netlify Drop** — drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
- **Netlify Git** — connect this repo (`netlify.toml` is included)
- **GitHub Pages** — publish `dist/` (HashRouter already used for static hosting)

### 2) Android (Chrome)
1. Open your live Netlify/GitHub URL in **Chrome**
2. Log in once (so data is created on that phone)
3. Tap menu **⋮ → Install app** / **Add to Home screen**
4. Or use the in-app **Install** banner / **Settings → Install on your phone**

### 3) iPhone (Safari)
1. Open the live URL in **Safari** (not Chrome)
2. Tap **Share** → **Add to Home Screen** → **Add**
3. Open the new icon — it launches full-screen like an app

### Offline
After the first successful load, the service worker caches the app. You can open it without internet; habits, goals, and journals remain on the device.

> Tip: Use **Settings → Export backup** regularly so you can restore if you clear browser data or switch phones.

## Architecture

```
src/
  components/   # UI kit + brand
  db/           # Dexie schema, migrations, backup
  features/     # Feature hooks / forms
  hooks/        # Shared hooks (theme, mission scores)
  layouts/      # App shell, sidebar, top bar
  pages/        # Route screens (lazy-loaded)
  services/     # Auth provider, AI coach, achievements, notifications, rewards
  stores/       # Zustand (auth, settings, UI)
  types/        # Domain model
```

### Design principles

- **Local-first** — Dexie/IndexedDB is the source of truth
- **Auth adapter** — `LocalAuthProvider` today; swap via `getAuthProvider()` for future cloud auth
- **Feature folders** — pages stay thin; hooks own data access
- **Versioned schema** — Dexie versions for forward-compatible migrations
- **Code splitting** — routes lazy-loaded; vendor/charts/db chunks split in Vite

## Modules

| Area | What you get |
|------|----------------|
| Dashboard | Mission scores, quote, habits, goals, finance snapshot |
| Habits | Streaks, today toggle, 7-day heatmap, CRUD |
| Goals | Pillars, milestones, progress |
| Tasks | Filters, board view, subtasks, Pomodoro |
| Health | Metrics, workouts, body measurements, charts |
| Finance | Transactions, budgets, savings, net worth |
| Business | Businesses, clients, projects, ideas |
| Wishlist | Price, savings progress, priorities |
| Learning | Courses, books, study sessions, streak |
| Spiritual | Prayer, Bible, faith journal, requests |
| Gratitude / Journal | Daily reflection + mood tracking |
| Calendar | Month grid + events |
| AI Coach | Rule-based local insights (motivational, never shaming) |
| Achievements | Badge unlocks from real activity |
| Statistics | Habits, cashflow, workouts, study charts |
| Settings | Theme, sidebar accordion mode, backup import/export |

## Data & privacy

- All data stays on **your device**
- **Settings → Export backup** downloads JSON
- Import restores from a previous backup
- Password never leaves the machine (hashed at rest in IndexedDB)

## Philosophy

Small consistent actions lead to extraordinary success. Every screen supports one or more of the **4 G's**:

**God** · **Goals** · **Grinding** · **Gratitude**

## License

Private personal project — use and extend for your own Mission Control.
