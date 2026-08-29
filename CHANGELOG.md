# Changelog

All notable changes to Stonks will be documented here.

---

## [Unreleased] — 2026-08-29

### Fixed
- **House Rules not persisting** — The session-token security rewrite reverted `StonksApp.jsx` to an older, pre-modularization version that never had House Rules ported in, so rules only ever lived in React state and vanished on refresh. Re-added the `houseRules` key, load-on-mount, and Warden/Player UI to the live app.
- **House Rules unreadable by players** — `houseRules` was classified as a warden-only read in `api/store.js`, so even once persisted, players could never fetch it for the Downtime tab. Moved to the public-read key list (writes remain Warden-only, same as `blackmarket`).
- **Every page load self-locked the room** — `StonksApp.jsx` fetched `mergers`, `settings`, `crew`, `debt`, and `portfolio` unconditionally on mount, before any PIN was entered. Those 5 keys were classified warden-only reads in `api/store.js`, and `MAX_FAILURES` is 5 — so a single page load maxed the failure counter and locked the room for 30 minutes, every time, for everyone. `settings`, `crew`, `debt`, and `portfolio` are genuinely player-facing (Downtime tab, payout calculator, stress badge) so they're now public-read like `houseRules`/`blackmarket`. `mergers` is GM-facing only and stays warden-gated, but is now fetched after PIN verification instead of on mount.

---

## [1.0.4] — 2026-06-07

### Changed
- **Honeypot terminal copy and layout** — Rewrote the terminal text to feel less like a form letter and more like a live system. Lowercase output lines, tighter incident commands, a random node ID per session alongside the ticket number, a thin rule separator before the legal notice, and cleaned-up legal copy. Fixed the header box spacing so `v4.7.2` is properly padded.

### Fixed
- **Security: `storedPin` not cleared on Warden logout** — The verified PIN was held in React state after logout, meaning it could be reused by the next person to sit down. Now cleared to `null` on logout.
- **Security: PIN comparison not timing-safe in `store.js` and `auth.js`** — Both handlers were using plain `!==` string equality. Replaced with `timingSafeEqual`, consistent with `unlock.js`. Length-oracle bypass included.
- **Security: Fresh room accepts any read on warden keys** — A brand-new room (no PIN set) previously allowed any caller to read warden-only keys without credentials. Now requires the caller to send no PIN header at all (the Warden's first load) — any explicit PIN attempt on a fresh room is rejected.
- **Security: `room.js` `safeEqual` length oracle** — Same `timingSafeEqual` throw-on-length-mismatch bug fixed in `unlock.js` previously; now fixed in `room.js` as well.
- **Security: No CORS policy** — Added `api/_cors.js` helper, applied to all six API handlers. Cross-origin requests (different host in `Origin` header) are rejected with 403. Prevents a malicious page visited by a player from making API calls to the app in their browser.

---

## [1.0.3] — 2026-06-07

### Fixed
- **Warden data load no longer fires on page mount** — The initial data load was fetching all keys (including warden-only ones) for every visitor, triggering auth failures, fake headlines, and lockouts on every page load. Public keys (`stocks`, `headlines`, `history`, `date`, `jobs`, `catalogs`) still load on mount for all visitors. Warden-only keys (`mergers`, `settings`, `crew`, `debt`, `portfolio`, `blackmarket`, `houseRules`) now only load after PIN verification succeeds, using the verified PIN. `safeGet` updated to accept an optional PIN parameter.

---

## [1.0.2] — 2026-06-05

### Fixed
- **Security: `auth.js` missing IP rate limit** — PIN verification endpoint now enforces 10 attempts per 5 minutes per IP, independent of the per-room lockout. Previously a single IP could hammer any number of rooms with no IP-level throttle.
- **Security: Black market brute-force window too wide** — `/api/blackmarket-auth` rate limit tightened from 10 attempts/minute to 5 attempts/10 minutes per IP and 8 attempts/10 minutes per room. Market cap is a small integer; the old limit was feasibly brute-forceable with a short script.
- **Security: Black market headline fires on correct guess** — The "UNAUTHORIZED ACCESS ATTEMPT" headline previously fired on every attempt including successful ones, breaking immersion the moment a legitimate player entered the right code. Headline now fires only on failed attempts.
- **Security: `unlock.js` HMAC key was hardcoded in public source** — Recovery passphrase comparison was wrapped in `createHmac("sha256", "stonks")` with `"stonks"` as the key, visible to anyone reading the code. Replaced with direct `timingSafeEqual` comparison. Also fixed a length oracle — differing-length inputs now consume constant time before returning false.
- **Security: `room.js` GET had no rate limit** — Room existence checks are now rate limited to 30 requests/minute per IP, preventing scripted room code enumeration.

---

## [1.0.1] — 2026-06-05

### Fixed
- **Security: Warden data now requires PIN to read** — `/api/store` GET requests for sensitive keys (`crew`, `debt`, `portfolio`, `blackmarket`, `mergers`, `settings`, `houseRules`) now require the `x-warden-pin` header, subject to the same lockout and rate-limiting as writes. Previously any player with the room code could read all Warden data directly from the API with no authentication. Public keys (`stocks`, `headlines`, `history`, `date`, `jobs`, `catalogs`) remain unauthenticated as players need them. `pin` remains unreadable at all times.

---

## [1.0.0] — 2026-06-02

### Added
- **House Rules** — Wardens can now create, edit, and delete house rules from the Session panel (new HOUSE RULES sub-tab alongside DEBT, PORTFOLIO, SHIP, CONTRACTORS). Rules have an all-caps title and freeform description body. Published rules appear to players in the Downtime tab under a new collapsible HOUSE RULES section at the bottom, below SHIP REPAIRS & MAINTENANCE. The section is hidden when no rules are set.
- **Room validation on direct URL navigation** — Navigating directly to `/room/XXXXXX` now checks whether the room actually exists before mounting the app. Unknown codes redirect back to the gate with a "Game not found" error instead of silently opening an empty session.
- **CHANGELOG.md** — This file.

### Changed
- **Source modularized** — The single 5,400-line `StonksApp.jsx` has been split into purpose-specific modules:
  - `src/constants.js` — All static game data, themes, style variables, and storage helpers
  - `src/logic.js` — Dice, economy engine, merger helpers, market cap computation
  - `src/components/Shared.jsx` — Scanlines, FictionDate, StockRows, HistoryLog, PinGate
  - `src/components/JobBoard.jsx` — JobCard, JobEditor, JobBoardPanel, PlayerJobBoard
  - `src/components/SessionPanels.jsx` — PayoutCalculator, DebtPanel, PortfolioPanel, ShipAccountPanel, ContractorPanel, CatalogPanel, HouseRulesPanel, PlayerSessionTab
  - `src/components/BlackMarket.jsx` — HoneypotTerminal, BlackMarketView, WardenBMJobEditor, WardenBlackMarketPanel
  - `src/components/WardenPanels.jsx` — HeadlineFeedManager, AddCorpRow, CustomMergerForm
  - `src/PlayerView.jsx` — Player-facing view shell
  - `src/WardenView.jsx` — Warden dashboard shell
  - `src/StonksApp.jsx` — Root app: state, data loading, view routing (~194 lines)
