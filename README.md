# Stonks

> A live corporate stock market ticker for tabletop RPGs.

Players connect on their phones and watch prices move in real time. The Warden controls everything from a PIN-protected dashboard — publishing headlines, advancing the economy, triggering mergers, managing crew and contracts, and watching corporations collapse.

Built for [Mothership RPG](https://www.tuesdayknightgames.com/mothership), but usable with any game that needs a living corporate economy at the table.

---

## Features

**Market**
- 📈 **Live ticker** — 12 corporations with health, volatility, and price tracking
- 📰 **News feed** — push headlines to players instantly, with auto-generated merger and acquisition announcements
- 🏦 **Economy engine** — roll-based market advancement with configurable dice, bankruptcy checks, collapse cycles, and absorption mechanics
- 🤝 **Merger system** — configurable pending mergers that trigger automatically or manually
- 📊 **History** — players can browse the full news archive and past market snapshots

**Session Tools (Warden)**
- 💼 **Payout calculator** — per-crew salary based on skill tiers (Trained/Expert/Master), hazard pay, negotiation adjustments, jump bonuses, flat bonuses, and equity conversion
- 🏢 **Catalog system** — per-corporation contractor perks and item catalogs with visibility gating (Hidden / Unlocked / Revoked / Ineligible); shown to players in the market view when unlocked
- 📋 **Job board** — freeform and template contract postings, status tracking (Active / Completed), auto-linked to payout calculator
- 👥 **Crew roster** — profiles with skill counts, payment types (cash or equity), disposition tracking, and beneficiary fields
- 🏗️ **Contractors** — salary and paid-status tracking with loyalty roll reminders
- 💳 **Debt tracker** — per-creditor entries with monthly payment and term; reflected as minimum Stress increase in the player Downtime tab
- 📦 **Portfolio** — equity holdings with grant price, live value, G/L, and scenario-based lock/unlock
- 🚢 **Ship account** — balance ledger with deposit/withdraw history and bankruptcy save reference table (owner-operator mode)

**Session Tools (Player)**
- 🗓️ **Downtime tab** — post-session checklist, debt obligations, payout calculator, medical treatment costs, shore leave table, skill training reference, military enlistment, ship repair costs, and fuel calculator

**Infrastructure**
- 🔒 **Warden dashboard** — PIN-gated, mobile-friendly, tabbed interface
- 📱 **PWA support** — installs as a fullscreen app on Android, iPhone, iPad, and desktop
- 💾 **Persistent** — data survives page refreshes; rooms expire after 90 days of inactivity
- 🛡️ **Hardened** — server-side PIN auth, read-protected PIN key, per-room lockout after 5 failed attempts, IP rate limiting, honeypot terminal for failed access attempts

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

Use **⬇ EXPORT BACKUP** in Warden Settings before every session. The JSON file includes all room data: stocks, headlines, history, date, mergers, job board, crew profiles, debt, portfolio, and catalogs.

To restore, use **⬆ IMPORT BACKUP** and select the file — it will overwrite all current data and save to Redis automatically.

Room data expires after **90 days of inactivity**. Keep a local backup if your campaign has long gaps between sessions.

---

## Warden Settings Reference

| Setting | Options | Effect |
|---|---|---|
| Training time unit | Months / Years | Controls duration labels in player Downtime tab |
| Ship ownership | Company/Military · Owner-Operator · Freelancer | Shows bankruptcy save table in Ship Account when owner-operator |
| Crew payment mode | All Same / Per Crew | Cash/equity toggle global vs per-crew in Payout tab |
| Bump on complete | On / Off | Auto-bumps corporation health when a job is marked complete |

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

## Stack

- [React](https://react.dev) + [Vite](https://vitejs.dev) — frontend
- [Express](https://expressjs.com) — local server
- [Vercel](https://vercel.com) — cloud hosting
- [Upstash Redis](https://upstash.com) — cloud persistence
- [qrcode-terminal](https://github.com/gtanner/qrcode-terminal) — QR code in the terminal
