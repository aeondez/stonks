# Stonks

> A live corporate stock market ticker for tabletop RPGs.

Players connect on their phones and watch prices move in real time. The Warden controls everything from a PIN-protected dashboard — publishing headlines, advancing the economy, triggering mergers, and watching corporations collapse.

Built for [Mothership RPG](https://www.tuesdayknightgames.com/mothership), but usable with any game that needs a living corporate economy at the table.

---

## Features

- 📈 **Live ticker** — 12 corporations with health, volatility, and price tracking
- 📰 **News feed** — push headlines to players instantly, including auto-generated merger and acquisition announcements
- 🏦 **Economy engine** — roll-based market advancement with bankruptcy checks, collapse cycles, and OmniCorp absorption
- 🤝 **Merger system** — three pending mergers that trigger automatically or manually, with suppression logic for protected companies
- 📊 **History** — players can browse the full news archive and past market snapshots
- 🔒 **Warden dashboard** — PIN-gated, mobile-friendly, separate from the player view
- 💾 **Persistent** — data survives page refreshes and server restarts

---

## Two Ways to Play

### 🏠 Local (same Wi-Fi)
Run the server on your PC. Players connect from their phones on the same network. Data saves to a local file. No accounts, no cloud, no internet required.

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
3. Import the repo into [Vercel](https://vercel.com), add the two Upstash env vars, deploy

Total setup time: ~15 minutes. Total cost: $0.

Once deployed, go to your Vercel URL, click **CREATE NEW GAME**, and share the room link with your players.

---

## Warden Access

On the player view, scroll to the very bottom and tap **WARDEN ACCESS**. Default PIN is `000000`. Change it from the Settings panel inside the dashboard.

**Lost your PIN (local):** Open `data.json`, find `stonks:pin`, change the value to `"000000"`.

**Lost your PIN (online):** Run this with your credentials:
```bash
curl -X POST "https://your-app.vercel.app/api/store?k=ROOMCODE:pin" \
  -H "Content-Type: application/json" \
  -d '{"value":"000000"}'
```

---

## Fresh Campaign

**Local:** Delete `data.json` and restart the server.

**Online:** Flush your Upstash database from the Upstash Console (CLI tab → `FLUSHDB`), then create a new room.

---

## Troubleshooting

**Players can't connect (local):** Everyone must be on the same Wi-Fi. Use the `192.168.x.x` address, not `localhost`.

**Port already in use:** Open `server.js` and change `const PORT = 3000` to something else like `3001`.

**App blank or crashing:** Stop the server (`Ctrl+C`) and run `stonks` again.

**Online data not saving:** Check your Vercel function logs and confirm both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set under Settings → Environment Variables.

---

## Stack

- [React](https://react.dev) + [Vite](https://vitejs.dev) — frontend
- [Express](https://expressjs.com) — local server
- [Vercel](https://vercel.com) — cloud hosting
- [Upstash Redis](https://upstash.com) — cloud persistence
- [qrcode-terminal](https://github.com/gtanner/qrcode-terminal) — QR code in the terminal, because why not
