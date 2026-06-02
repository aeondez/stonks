# Changelog

All notable changes to Stonks will be documented here.

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
