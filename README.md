# Stonks

A live corporate stock ticker for your tabletop game. Players see a terminal-style market feed on their phones. You control everything from a password-protected Warden dashboard.

---

## Quick Start (do this once)

**Step 1** — Open a terminal in this folder and run this to install and set up the alias:

```bash
npm install && echo "alias stonks=\"bash $(pwd)/stonks.sh\"" >> ~/.bashrc
```

**Step 2** — Load the alias into your current session:

```bash
source ~/.bashrc
```

> You only need Step 2 once per terminal session after setup. Next time you open a terminal, `stonks` will just work.
> **If you use zsh instead of bash** (you'd know), replace `~/.bashrc` with `~/.zshrc` in Step 1.

**Step 3 and every time after** — Start the server:

```
stonks
```

---

## Requirements

- [Node.js](https://nodejs.org) (LTS version) — just download and run the installer if you don't have it.

---

## Manual Commands (if you prefer not to use the alias)

First time only:
```
npm install
```

Every session:
```
npm start
```

---

## What You'll See When It's Running

```
  ┌─────────────────────────────────────────┐
  │              STONKS SERVER              │
  └─────────────────────────────────────────┘

  Local:    http://localhost:3000
  Network:  http://192.168.1.42:3000
  Data:     /home/you/stonks/data.json

  ── Player QR Code ──────────────────────────

  [QR code]

  Send players to: http://192.168.1.42:3000
```

- **Your PC:** open `http://localhost:3000` in your browser
- **Players:** connect to the Network address, or scan the QR code — everyone needs to be on the same Wi-Fi
- **Stop the server:** press `Ctrl+C` in the terminal

---

## Warden Access

On the player view, scroll to the very bottom and tap **WARDEN ACCESS**. Enter the PIN (default: `000000`). You can change the PIN from the Settings panel inside the Warden dashboard.

---

## Your Data

Everything is saved automatically to `data.json` in this folder the moment you make any change. It survives restarts, reboots, and closing the browser. To wipe and start a fresh campaign, delete `data.json` and restart the server.

---

## Migrating Existing Save Data

If you already have a `data.json` from a previous version, run this once to update the key names:

```
node migrate.js
```

Then start the server as normal. Your campaign data will be intact.

---

## Troubleshooting

**Players can't connect:** Make sure everyone is on the same Wi-Fi. Use the Network address (the `192.168.x.x` one), not `localhost`.

**Port already in use:** Something else is using port 3000. Either stop that thing, or open `server.js` and change `const PORT = 3000` to another number like `3001`.

**Page is blank or erroring:** Stop the server (`Ctrl+C`) and run `stonks` again.

**Lost your PIN:** Open `data.json` in a text editor, find the line with `stonks:pin`, and change the value to `"000000"`. Save and restart.
