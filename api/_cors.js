// Shared CORS middleware — restricts API to same-origin requests only.
// Call applyCors(req, res) at the top of each handler.
// Returns true if the request was handled (preflight), false if processing should continue.

export function applyCors(req, res) {
  // Only accept requests from the app's own origin
  const origin = req.headers["origin"];
  const host = req.headers["host"];

  // Allow same-origin (no Origin header) and requests from our own host
  if (origin && host && !origin.endsWith(host)) {
    res.status(403).json({ error: "forbidden" });
    return true; // handled
  }

  // Reject cross-origin preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}
