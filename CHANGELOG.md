# Changelog

All notable changes to Stonks will be documented here.

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
