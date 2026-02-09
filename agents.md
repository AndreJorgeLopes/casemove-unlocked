# Casemove Agents Guide

## Purpose

Casemove is an Electron + React app for managing CS2 storage units using Steam APIs (steam-session, steam-user, globaloffensive). This document centralizes project knowledge and operational conventions for contributors and AI agents.

## Architecture

- **Main process**: `src/main/` (Electron main, Steam login, IPC, storage, pricing, GC interaction)
- **Renderer**: `src/renderer/` (React UI, Redux store, routes, filters, pages)
- **Shared**: `src/shared/` (interfaces, IPC contracts)
- **Packaging**: Electron Forge + Webpack (`forge.config.ts`, `webpack.*`)

## Key Flows

### QR Login

- Start: renderer triggers `ipcRenderer.startQRLogin()`.
- Main: `flowLoginRegularQR()` creates `LoginSession` and emits `qrLogin:show` with the QR URL.
- Renderer: renders QR with `react-qr-code`.
- Notes: Steam can issue **new QR URLs** during polling; main now emits those updates.

### Regular Login

- Renderer calls `ipcRenderer.loginUser(...)`.
- Main uses `steam-session` for auth and `steam-user` + `globaloffensive` for GC session.

### Pricing

- CDN pricing data fetched in main (`src/main/helpers/classes/steam/pricing.tsx`).
- Renderer uses `ConvertPrices` / `ConvertPricesFormatted` for display.
- Price keys must match backend format: `"Item Name (Wear)"`.

## Dev / Run

- **Dev mode**:
  - `npm run start -- -- --ozone-platform=wayland`
- **Debug Steam**:
  - `DEBUG=steam-session* npm run start -- -- --ozone-platform=wayland`
- **Logger UI**:
  - Electron Forge uses loggerPort `19000` (avoid 9000 conflicts).

## Settings & Storage

- Settings are stored with `electron-store`.
- `safeStorage` encryption can be unavailable on Linux; fallback uses plaintext storage.
- Theme is persisted in store key `theme` (`"dark" | "light"`).

## UI & Routing

- Routes are wrapped in `RouteErrorBoundary` to keep sidebar visible after page crashes.
- External links should use `<a href>` not React Router `<Link>` when including `#` fragments.

## Common Issues

- **Huge prices**: caused by invalid price keys or MAX float placeholders. Use `getPriceKey()` + sanitize prices.
- **Trade-up showing few items**: overly strict filtering on `tradeUpConfirmed`. Allow `tradeUpConfirmed || tradeUp`.
- **CSP errors**: add new image domains in `main.ts` CSP if needed.
- **safeStorage errors**: occur if keyring is missing/unlocked.
- **`require is not defined` in renderer (`webpack/hot/emitter` / `reloadApp`)**:
  - Do **not** fix this by flipping `contextIsolation` off.
  - Keep preload architecture stable: `contextIsolation: true` + `contextBridge` in `preload.ts`.
  - Investigate renderer dev client/HMR injection and webpack target/runtime settings first.
- **`EPIPE` + `EADDRINUSE` during `npm run start`**:
  - Usually stale Forge/Electron processes, not an app-logic regression.
  - Always clean-stop old sessions before restart (see Dev Restart Runbook below).

## Dev Restart Runbook

- Before rerunning dev, stop existing Forge sessions:
  - `pgrep -f "electron-forge start|electron-forge-start.js|web-multi-logger" | xargs -r kill -TERM`
  - `sleep 1`
  - `pgrep -f "electron-forge start|electron-forge-start.js|web-multi-logger" | xargs -r kill -KILL`
- Verify no stale processes:
  - `pgrep -af "electron-forge start|electron-forge-start.js|web-multi-logger" || true`
- If ports are still busy, inspect holders:
  - `lsof -i :19000 -i :3001`
- Then start clean:
  - `npm run start`

## Decisions & Changes

- Version checking removed (GitHub 404/NaN errors).
- CSP updated to allow `avatars.fastly.steamstatic.com`.
- Pricing key format unified across renderer + main.
- Added HTTP logging and steam-session debug in dev.
- Theme toggle wired through settings + persisted in store.

## TODOs

- Pricing overflow: route all price calculations through `ConvertPrices.getPrice` and avoid raw multiplications.
  - Update UI totals/rows using raw math in:
    - `src/renderer/views/tradeUp/sidebar/possibleOutcomes.tsx`
    - `src/renderer/views/overview/overview.tsx`
    - `src/renderer/components/content/storageUnits/from/fromSelector.tsx`
    - `src/renderer/components/content/storageUnits/from/fromFilters.tsx`
    - `src/renderer/views/overview/inventoryPickers.tsx`
  - Centralize key normalization in `src/renderer/functionsClasses/prices.tsx` and align with main process `src/main/helpers/classes/steam/pricing.tsx`.
- Trade-up completeness: consolidate eligibility predicate so filters are consistent across UI.
  - Review `src/renderer/views/tradeUp/inventoryPickers.tsx`, `src/renderer/views/tradeUp/filter/collectionsDropdown.tsx`, and `src/renderer/store/reducer/tradeupReducer.tsx`.
- Trade-up sidebar height/scroll: ensure aside fills viewport and scrolls as intended in `src/renderer/views/tradeUp/tradeUp.tsx` and `src/renderer/views/tradeUp/sidebar/sideBar.tsx`.
- Dark mode first paint: avoid flash of incorrect theme by applying theme before render in `src/renderer/App.tsx` and `src/renderer/store/reducer/settings.tsx`.
- SafeStorage + QR verification: run dev flow and capture logs after resolving port 3000 conflict in `src/main/helpers/classes/steam/settings.tsx`, `src/main/helpers/login/flowLoginRegularQR.tsx`, `src/main/main.ts`, `src/main/preload.ts`, `src/renderer/views/login/loginForm.tsx`.

## MCP / Tools

- **Linear MCP**: configured in OpenCode global settings.
- **Additional MCP**: Exa, Playwright, GitHub, Next.js, Electron configured in global settings.

## Skills / Playbooks

- **Debugging**: trace IPC → main → renderer, validate state transitions.
- **UI fixes**: avoid `setState` inside render; prefer `useEffect` + memoization.
- **Pricing**: enforce consistent pricing keys and clamp invalid values.

## DON'Ts

- Don’t store secrets or tokens in repo files or logs.
- Don’t call `safeStorage.encryptString()` without checking availability.
- Don’t use React Router `<Link>` for external URLs with `#` fragments.
- Don’t trigger Redux dispatches or React state updates during render.
- Don’t assume price keys match without parentheses for wear.
