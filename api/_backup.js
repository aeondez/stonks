// Shared cloud-backup helper — snapshots a room's full state into a
// rotating history so a bad Warden edit isn't unrecoverable.

const MAX_BACKUPS = 3;
const TTL = 60 * 60 * 24 * 90;

const SNAPSHOT_SUBKEYS = [
  "stocks", "headlines", "history", "date", "mergers", "settings",
  "jobs", "crew", "debt", "portfolio", "catalogs", "blackmarket",
  "houseRules", "codex",
];

export async function takeSnapshot(redis, room) {
  try {
    const values = await Promise.all(
      SNAPSHOT_SUBKEYS.map((k) => redis.get(`${room}:${k}`))
    );
    const data = {};
    SNAPSHOT_SUBKEYS.forEach((k, i) => { data[k] = values[i]; });

    const backupsKey = `${room}:backups`;
    const existing = await redis.get(backupsKey);
    const backups = Array.isArray(existing) ? existing : [];
    const next = [{ timestamp: Date.now(), data }, ...backups].slice(0, MAX_BACKUPS);
    await redis.set(backupsKey, next, { ex: TTL });
  } catch {}
}

export { MAX_BACKUPS };
