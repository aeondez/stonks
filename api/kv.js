// This endpoint is deprecated and disabled.
export default function handler(req, res) {
  res.status(410).json({ error: "gone" });
}
