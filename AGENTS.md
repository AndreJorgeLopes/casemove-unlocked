# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds



<!-- BEGIN BEADS INTEGRATION -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs with git:

- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

<!-- END BEADS INTEGRATION -->
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
