// CORS middleware — rejects OPTIONS preflight requests from cross-origin callers.
// Same-origin fetch POSTs don't send preflight, so this is belt-and-suspenders.
// The real security layer is PIN auth on all warden endpoints.

export function applyCors(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
