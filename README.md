# Stonks — v1.0

> A live corporate stock market ticker for tabletop RPGs.

Players connect on their phones and watch prices move in real time. The Warden controls everything from a PIN-protected dashboard — publishing headlines, advancing the economy, triggering mergers, managing crew and contracts, and watching corporations collapse.

Built for [Mothership RPG](https://www.tuesdayknightgames.com/mothership), but usable with any game that needs a living corporate economy at the table.

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## Features

**Market**
- 📈 **Live ticker** — 12 corporations with health, volatility, and price tracking
- 📰 **News feed** — push headlines to players instantly, with auto-generated merger and acquisition announcements
- 🏦 **Economy engine** — roll-based market advancement with configurable dice, bankruptcy checks, collapse cycles, and absorption mechanics
- 🤝 **Merger system** — configurable pending mergers that trigger automatically or manually
- 📊 **History** — players can browse the full news archive and past market snapshots
- 💹 **Market cap** — total market cap of all active non-OmniCorp corporations displayed in the player header

**Session Tools (Warden)**
- 💼 **Jobs → Payout** — per-crew salary based on skill tiers (Trained/Expert/Master), hazard pay, negotiation adjustments, jump bonuses, flat bonuses, and equity conversion
- 📋 **Jobs → Board** — freeform and template contract postings with status tracking (Active / Completed / Revoked), sticky jobs, auto-linked to payout calculator
- 🕳️ **Shadow Exchange (Black Market)** — separate warden panel with freeform job board, pool/active/archive workflow, Warden-only notes per contract, COMPLETE / EXPIRE actions, random or bespoke rotation, and built-in generation tables for Bounty, Repo, and Heist jobs; 7 seed contracts pre-loaded
- 🏢 **Corps → Catalog** — per-corporation contractor perks and item catalogs with visibility gating (Hidden / Unlocked / Revoked / Ineligible); shown to players in the market view when unlocked
- 👥 **Crew roster** — profiles with skill counts, payment types (cash or equity), disposition tracking, and beneficiary fields (via Jobs → Payout)
- 🏗️ **Session → Contractors** — occupation dropdown with default salaries, paid-status tracking with loyalty roll reminders
- 💳 **Session → Debt** — per-creditor entries with monthly payment and term; reflected as minimum Stress increase in the player Downtime tab
- 📦 **Session → Portfolio** — equity holdings with grant price, live value, and scenario-based lock/unlock
- 🚢 **Session → Ship** — named balance ledger (e.g. "Diamond Club, LLC") with deposit/withdraw history, owner-operator mode, crew payment mode, and bankruptcy save reference table
- 📜 **Session → House Rules** — create, edit, and delete house rules with an all-caps title and freeform description; published rules appear in the player Downtime tab

**Session Tools (Player)**
- 🗓️ **Downtime tab** — collapsible sections: payout calculator, post-session checklist, debt obligations, contractors, medical treatments, shore leave, skill training, ship repairs and maintenance, house rules
- 💰 **Portfolio** — equity holdings with live value and lock status; ship/group account balance if set; accessible from the Market tab

**Shadow Exchange (Player)**
- 🔴 **Hidden access** — the total market cap is displayed in the player header; entering it into the honeypot terminal grants access to the Shadow Exchange
- 📋 **Red terminal aesthetic** — 3 active contracts displayed as raw preformatted text; collapsible archive of completed/expired contracts
- 🔒 **Secure** — access code verified server-side only; never exposed in the client or console; honeypot headline fires on every attempt regardless of outcome

**Display**
- 🎨 **Five themes** — GREEN, AMBER, BLUE, MONO, HI-VIS; all UI elements adapt to the selected theme

**Infrastructure**
- 🔒 **Warden dashboard** — PIN-gated, mobile-friendly, tabbed interface with inline theme switcher
- 📱 **PWA support** — installs as a fullscreen app on Android, iPhone, iPad, and desktop
- 💾 **Persistent** — data survives page refreshes; rooms expire after 90 days of inactivity
- 🛡️ **Hardened** — server-side PIN auth, read-protected PIN key, per-room lockout after 5 failed attempts, IP rate limiting, honeypot terminal with hidden black market access
- 🚪 **Room validation** — direct URL navigation to unknown room codes returns to the gate with an error rather than opening a blank session

---

## Two Ways to Play

### 🏠 Local (same Wi-Fi)
Run the server on your PC. Players connect from their phones on the same network. No accounts, no cloud, no internet required.

### 🌐 Online (anywhere)
Deploy to Vercel + Upstash. Each game gets a unique 6-character room code. Share the link and anyone can join from anywhere. Free to host.

---

## Local Setup

**Requirements:** [Node.js](https://nodejs.org) LTS

**First time — run this in the `stonks/` folder:**

```bash
npm install && echo "alias stonks=\"bash $(pwd)/stonks.sh\"" >> ~/.bashrc
source ~/.bashrc
```

> If you use **zsh**, replace `~/.bashrc` with `~/.zshrc`.

**Every session:**

```bash
stonks
```

Or without the alias:

```bash
npm start
```

When running, you'll see your network address and a QR code players can scan:

```
  ┌─────────────────────────────────────────┐
  │              STONKS SERVER              │
  └─────────────────────────────────────────┘

  Local:    http://localhost:3000
  Network:  http://192.168.1.42:3000

  ── Player QR Code ──────────────────────────

  [QR code]
```

Players open the Network address on their phones. You open `localhost:3000` on your PC. Stop the server with `Ctrl+C`.

---

## Online Deployment

See **[DEPLOY.md](DEPLOY.md)** for the full walkthrough. Short version:

1. Push this repo to GitHub
2. Create a free [Upstash](https://upstash.com) Redis database — copy the REST URL and token
3. Import the repo into [Vercel](https://vercel.com), add the env vars below, deploy

Total setup time: ~15 minutes. Total cost: $0.

Once deployed, go to your Vercel URL, click **CREATE NEW GAME**, and share the room link with your players.

**Required environment variables in Vercel:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RECOVERY_PASSPHRASE` — your emergency override passphrase (set this before your first session)
- `ROOM_CREATION_KEY` — a secret key required to create new rooms (set this before sharing the URL publicly)

---

## Installing as a PWA

Players can install Stonks as a fullscreen app directly from the browser — no app store required.

- **Android (Chrome):** Open the room link → tap the install banner or ⋮ → Add to Home Screen
- **iPhone/iPad (Safari):** Open the room link → tap Share → Add to Home Screen
- **Desktop (Chrome/Edge):** Install icon appears in the address bar

> Install from the room URL directly so the app always launches back to your game.

---

## Warden Access

On the player view, scroll to the very bottom and tap **WARDEN ACCESS**. Default PIN is `000000` — change it immediately from the Settings panel inside the dashboard.

**Security:** PIN verification is server-side only. The PIN is never readable via the API — only writable. After 5 failed attempts the room locks for 30 minutes. Every failed attempt pushes a security alert headline to all players and triggers a decoy terminal for the attacker.

**Lost your PIN (local):** Open `data.json`, find `stonks:pin`, change the value to `"000000"`.

**Lost your PIN (online):** Use the **EMERGENCY OVERRIDE** link on the PIN screen and enter your recovery passphrase to clear the lockout.

---

## Backups

Use **⬇ EXPORT BACKUP** in Warden Settings before every session. The JSON file includes all room data: stocks, headlines, history, date, mergers, job board, crew profiles, debt, portfolio, catalogs, and house rules.

To restore, use **⬆ IMPORT BACKUP** and select the file — it will overwrite all current data and save to Redis automatically.

Room data expires after **90 days of inactivity**. Keep a local backup if your campaign has long gaps between sessions.

---

## Warden Settings Reference

| Setting | Location | Options | Effect |
|---|---|---|---|
| Training time unit | Settings | Months / Years | Controls duration labels in player Downtime tab |
| Ship ownership | Session → Ship | Company/Military · Owner-Operator · Freelancer | Shows bankruptcy save table in Ship Account when owner-operator; also shown in account balance display |
| Crew payment mode | Session → Ship | All Same / Per Crew | Cash/equity toggle global vs per-crew in Payout tab |
| Account name | Session → Ship | Free text | Names the account (e.g. "Diamond Club, LLC"); shown to players in Portfolio |
| Bump on complete | Settings | On / Off | Auto-bumps corporation health when a job is marked complete |

---

## Testing Checklist

After deploying an update, verify the following:

**Player view — Market tab**
- [ ] Stocks display with correct prices and change indicators
- [ ] Headlines appear and animate correctly
- [ ] Clicking a stock expands it to show price history and catalog (if unlocked)
- [ ] `[ PORTFOLIO ]` button shows `●` dot if account balance or equity holdings exist
- [ ] Portfolio shows account balance at top (if Warden has set one), followed by equity holdings

**Player view — Jobs tab**
- [ ] Active contracts display correctly
- [ ] Completed/revoked contracts toggle works

**Player view — Downtime tab**
- [ ] Payout calculator: Months, Jumps, Hazard, Negotiation steppers work without scrolling to top
- [ ] Skill Tiers (T/E/M) grid renders without overflow on narrow screens
- [ ] Hazard and Corp dropdowns don't cause page jump on change
- [ ] Training table shows no PREREQ column; prerequisite note appears above table
- [ ] Debt obligations section appears if Warden has added debts
- [ ] HOUSE RULES section appears at the bottom of Downtime if Warden has added rules; hidden if none

**Warden view — general**
- [ ] All five themes (GREEN, AMBER, BLUE, MONO, HI-VIS) are readable; no green-tinted boxes in non-green themes
- [ ] Warden nav tabs, sub-tabs all use theme colors for active/inactive states
- [ ] Panel backgrounds are neutral dark, not green-tinted

**Warden — Session → Ship**
- [ ] Account Name field accepts input and persists
- [ ] Ownership Type buttons work (COMPANY / OWNER-OP / FREELANCER)
- [ ] Crew Payment Mode buttons work (ALL SAME / PER CREW)
- [ ] Deposit and Withdraw update the balance and add to recent transactions
- [ ] Bankruptcy save table appears when Ownership = OWNER-OP

**Warden — Session → House Rules**
- [ ] ADD HOUSE RULE opens inline form
- [ ] Title input auto-uppercases
- [ ] SAVE creates rule; rule appears in list
- [ ] EDIT loads existing rule into form and updates on SAVE
- [ ] DELETE removes rule immediately
- [ ] Rule count badge appears on HOUSE RULES tab when rules exist
- [ ] Rules persist across page reload

**Warden — Jobs → Payout**
- [ ] Crew cards show TRAINED / EXPERT / MASTER tier grid without overflow
- [ ] Salary calculates correctly

**Warden — Settings**
- [ ] Training time unit toggle works
- [ ] Theme switcher works
- [ ] Export/Import backup round-trips correctly (including house rules)

**Room gate**
- [ ] Direct navigation to unknown room code `/room/XXXXXX` shows "Game not found" error at gate
- [ ] Direct navigation to valid room code enters the room normally
- [ ] Brief "VERIFYING ACCESS..." state shown while check is in flight

---

## Fresh Campaign

**Local:** Delete `data.json` and restart the server.

**Online:** Create a new room from the landing page, or flush your Upstash database from the Upstash Console (CLI tab → `FLUSHDB`) and recreate.

---

## Troubleshooting

**Players can't connect (local):** Everyone must be on the same Wi-Fi. Use the `192.168.x.x` address, not `localhost`.

**Port already in use:** Open `server.js` and change `const PORT = 3000` to something else like `3001`.

**App blank or crashing:** Stop the server (`Ctrl+C`) and run `stonks` again.

**Online data not saving:** Check your Vercel function logs and confirm both Upstash env vars are set under Settings → Environment Variables.

**Room locked out:** Use the EMERGENCY OVERRIDE link on the PIN screen, or clear it manually via the Upstash Console (`DEL lockout:ROOMCODE`).

---

## Project Structure

```
stonks/
├── api/                    # Vercel serverless functions
│   ├── auth.js             # PIN verification
│   ├── blackmarket-auth.js # Shadow Exchange access
│   ├── honeypot.js         # Decoy terminal handler
│   ├── kv.js               # Upstash Redis client
│   ├── room.js             # Room creation & existence check
│   ├── store.js            # Generic KV read/write
│   └── unlock.js           # Emergency PIN recovery
├── public/
│   └── sw.js               # Service worker (PWA)
├── src/
│   ├── StonksApp.jsx       # The entire live app — state, data loading, view routing, Warden dashboard, Player view, all panels, all inline
│   ├── RoomGate.jsx        # Room entry / creation screen
│   ├── main.jsx            # Entry point with room validation
│   ├── constants.js        # Game data, themes, style vars, storage helpers (used by StonksApp.jsx)
│   ├── logic.js            # Economy engine, dice, merger helpers (used by StonksApp.jsx)
│   └── (legacy, unused) PlayerView.jsx, WardenView.jsx, components/*.jsx
│       # Leftovers from a one-time modularization attempt. Never imported by main.jsx —
│       # StonksApp.jsx is self-contained. Don't edit these expecting it to affect the app.
├── index.html
├── package.json
├── server.js               # Local Express server
├── vite.config.js
├── vercel.json
├── CHANGELOG.md
└── README.md
```

---

## Stack

- [React](https://react.dev) + [Vite](https://vitejs.dev) — frontend
- [Express](https://expressjs.com) — local server
- [Vercel](https://vercel.com) — cloud hosting
- [Upstash Redis](https://upstash.com) — cloud persistence
- [qrcode-terminal](https://github.com/gtanner/qrcode-terminal) — QR code in the terminal
