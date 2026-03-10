import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import qrcode from "qrcode-terminal";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function getLocalIPs() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const iface of Object.values(ifaces)) {
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  return ips;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

app.get("/api/kv/:key", (req, res) => {
  const data = loadData();
  const key = decodeURIComponent(req.params.key);
  if (key in data) {
    res.json({ value: data[key] });
  } else {
    res.status(404).json({ error: "not found" });
  }
});

app.post("/api/kv/:key", (req, res) => {
  const data = loadData();
  const key = decodeURIComponent(req.params.key);
  data[key] = req.body.value;
  saveData(data);
  res.json({ ok: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  const ips = getLocalIPs();
  const networkURL = ips.length > 0 ? `http://${ips[0]}:${PORT}` : null;

  console.log("\n  ┌─────────────────────────────────────────┐");
  console.log("  │         STONKS SERVER         │");
  console.log("  └─────────────────────────────────────────┘\n");
  console.log(`  Local:    http://localhost:${PORT}`);

  if (ips.length > 0) {
    ips.forEach(ip => console.log(`  Network:  http://${ip}:${PORT}`));
  } else {
    console.log("  Network:  (no network interface found)");
  }

  console.log(`  Data:     ${DATA_FILE}\n`);

  if (networkURL) {
    console.log("  ── Player QR Code ──────────────────────────\n");
    qrcode.generate(networkURL, { small: true });
    console.log(`  Send players to: ${networkURL}\n`);
  }
});
