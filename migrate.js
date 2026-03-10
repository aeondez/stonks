// One-time migration: renames corpo-rot: keys to stonks: in data.json
import fs from "fs";
const file = "./data.json";
if (!fs.existsSync(file)) { console.log("No data.json found — nothing to migrate."); process.exit(0); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));
let changed = 0;
const migrated = {};
for (const [k, v] of Object.entries(data)) {
  const newKey = k.startsWith("corpo-rot:") ? k.replace("corpo-rot:", "stonks:") : k;
  if (newKey !== k) changed++;
  migrated[newKey] = v;
}
if (changed === 0) { console.log("Already up to date — nothing to migrate."); process.exit(0); }
fs.writeFileSync(file, JSON.stringify(migrated, null, 2));
console.log(`Migrated ${changed} key(s). Your data is intact.`);
