# Casemove Agent Instructions

This file is the primary guide for agentic work in this repo. It complements
`agents.md` and should be preferred for build/test/style guidance.

## Quick Commands

- Dev app: `npm run start`
- Dev app (Wayland): `npm run start -- -- --ozone-platform=wayland`
- Dev app with Steam session debug: `DEBUG=steam-session* npm run start -- -- --ozone-platform=wayland`
- Lint: `npm run lint`
- Test (all): `npm test`
- Test (single file): `npm test -- src/__tests__/App.test.tsx`
- Test (single test name): `npm test -- -t "pricing helpers"`
- Package (no installer): `npm run package`
- Make (installers/artifacts): `npm run make`

Notes:

- Jest config lives in `package.json` and uses `ts-jest`.
- A build check runs via `.erb/scripts/check-build-exists.ts` before tests.
- Pre-commit runs `lint-staged` (see `package.json`).

Build/Packaging notes:

- README mentions Node 14.18.2 (project history), but package.json pins newer deps.
- Windows signing requires `signtool` (see README) and a local `.env` with
  `SIGNING_TIMESTAMP` and `SIGNING_PATH`.
- `npm run package` creates packaged app without installers.
- `npm run make` creates installer artifacts.

## Repository Layout

- Main process: `src/main/` (Electron main, Steam login, IPC, storage, pricing)
- Renderer: `src/renderer/` (React UI, Redux store, routes, pages)
- Shared: `src/shared/` (interfaces, IPC contracts)
- Tests: `src/__tests__/`
- Packaging: `forge.config.ts`, `webpack.*`

## Tooling & Stack

- Electron Forge + Webpack (see `forge.config.ts` and `webpack.*`).
- React + Redux in renderer; Electron main process under `src/main/`.
- Tailwind + PostCSS configured via `tailwind.config.js` and `postcss.config.js`.
- Lint-staged formats JSON/CSS/HTML/MD via Prettier (see `package.json`).

## Agent Workflow Guardrails

- Prefer `task()` subagents for exploration; avoid background tasks unless forced by the platform.
- Avoid repo-root `Glob`; use scoped `Grep` (e.g., `src/`, `.erb/`) and `Read` on known paths.
- Use `ls` for directory discovery and then narrow searches; exclude `node_modules`, `dist`, and `out`.
- Do not edit plugin integration files: `.vscode/extensions.json`, `.beads/*`, `.sisyphus/*`.

## Code Style & Conventions

### Formatting

- Indent: 2 spaces (see `.editorconfig`).
- Line endings: LF.
- Trim trailing whitespace; keep trailing whitespace in `.md` files.
- Prettier is configured in `package.json` with `singleQuote: true`.

### Linting

- ESLint config: `.eslintrc.json` (extends recommended + TS + import rules).
- Keep code passing `npm run lint` before submitting changes.

### TypeScript

- `tsconfig.json` uses `strict: false`, `allowJs: true`, `noImplicitAny: false`.
- Match existing style: interfaces in `src/renderer/interfaces/` and
  `src/shared/Interfaces.tsx/` are the canonical shapes for state and IPC.
- Avoid introducing stricter constraints unless refactoring a file end-to-end.

### Imports

- Use single quotes for strings/imports (Prettier).
- Follow the local grouping style: external imports first, then internal.
- Prefer explicit named imports where the file already does so.

### Naming

- React components: `PascalCase` (e.g., `TradeupPage`).
- Functions/variables: `camelCase`.
- Constants: existing code varies; follow the local file pattern.
- File names generally use `camelCase` or lower-case; keep consistency per folder.

### Error Handling

- Pattern is usually: log error (often `console.log`) and return a safe default.
- Avoid empty catch blocks. If ignoring errors, add a comment or a logged reason.
- `safeStorage` can be unavailable on Linux; check availability before use.

## Settings & Storage

- Settings are stored with `electron-store`.
- Theme is persisted in store key `theme` (`"dark" | "light"`).
- `safeStorage` encryption can be unavailable on Linux; fallback uses plaintext.

## UI & Routing

- Routes are wrapped with `RouteErrorBoundary` to keep sidebar visible after page crashes.
- Avoid `setState` or Redux dispatch during render; prefer `useEffect`.
- Keep sidebar visible on error routes.

## App-Specific Rules

- External links with `#` fragments should use `<a href>` (not React Router `<Link>`).
- Pricing keys must match backend format: `"Item Name (Wear)"`.
- Routes are wrapped with `RouteErrorBoundary` to keep the sidebar visible.
- Logger UI uses `loggerPort` 19000 (avoid 9000 conflicts).

## Common Issues

- Huge prices: invalid price keys or MAX float placeholders.
  - Use `getPriceKey()` and sanitize prices before display.
- Trade-up showing few items: filters are too strict on `tradeUpConfirmed`.
  - Allow `tradeUpConfirmed || tradeUp` where appropriate.
- CSP errors: add new image domains in `src/main/main.ts` CSP.

## Common Flows (from `agents.md`)

- QR login:
  - Renderer triggers `ipcRenderer.startQRLogin()`.
  - Main `flowLoginRegularQR()` emits `qrLogin:show` with updated QR URLs.
- Regular login:
  - Renderer calls `ipcRenderer.loginUser(...)`.
  - Main uses `steam-session` + `steam-user` + `globaloffensive`.
- Pricing:
  - Main fetches CDN pricing in `src/main/helpers/classes/steam/pricing.tsx`.
  - Renderer uses `ConvertPrices` / `ConvertPricesFormatted`.

## Tests

- Jest + ts-jest, jsdom environment.
- Test files live in `src/__tests__/`.
- Prefer running the single test file or name before full suite.

## Renderer Startup Crash Prevention (Required)

- Treat persisted Redux data as untrusted input. Any persisted slice may be
  `null`, malformed, or from an older schema.
- Keep migration sanitization in `src/renderer/store/configureStore.tsx`
  (`sanitizePersistedState`) and ensure iterable/object contracts before any
  reducer/UI iteration.
- Keep reducer-level normalization in crash-prone reducers
  (`settingsReducer`, `tradeUpReducer`) so action handlers are resilient even
  if migration is bypassed.
- Keep devtools extension install opt-in only via
  `CASEMOVE_ENABLE_REACT_DEVTOOLS=true` (see `src/main/helpers/devtools.ts`).
  Default dev startup should not install extensions automatically.
- User need for this flow:
  - Startup and navigation must not emit
    `TypeError: object null is not iterable`.
  - Related UI paths must render without silent failure.

## Spec-Driven + TDD Workflow (Required)

- Write a lightweight spec before edits for runtime bugs:
  - Problem signature (exact log/error text).
  - Scope and non-goals.
  - Acceptance criteria with observable checks.
- Follow red-green-refactor:
  - Red: add/adjust failing test for the exact regression.
  - Green: implement minimal fix.
  - Refactor: tighten tests and simplify code while tests stay green.
- For startup/runtime crash fixes, include at least:
  - Unit tests for guard/helper behavior (example: devtools gating).
  - Contract tests for persisted-state sanitization.
  - Reducer tests that execute real actions with malformed state.

## Live Runtime Verification Playbook

- Run the app locally for verification:
  - `npm run start -- -- --ozone-platform=wayland`
- For deterministic checks, capture logs and scan patterns:
  - Start in background and write logs to a file.
  - Search with `rg` for:
    - `sandboxed_renderer.bundle.js script failed to run`
    - `object null is not iterable`
- If either signature appears, fix is incomplete.
- Always stop lingering processes and free logger port `19000` before reruns.
- Treat these as informational unless behavior is impacted:
  - `Autofill.enable` / `Autofill.setAddresses` devtools protocol warnings.
  - browserslist staleness warnings.

## PR Quality Checklist for This Area

- Crash signature absent from local startup logs.
- Added or updated regression tests for sanitize + reducer action paths.
- Full test suite passes (`npm test -- --runInBand --watchAll=false`).
- Commit message clearly ties fix to the runtime crash symptom.

## Security & Data

- Do not store secrets or tokens in repo files or logs.
- If a change requires new external domains, update CSP in `src/main/main.ts`.

## Cursor/Copilot Rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## Don’ts

- Don’t call `safeStorage.encryptString()` without checking availability.
- Don’t use React Router `<Link>` for external URLs with `#` fragments.
- Don’t dispatch Redux actions or update React state during render.
- Don’t assume pricing keys are valid without wear parentheses.
