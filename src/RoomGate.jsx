import { useState } from "react";

const MONO = "'Share Tech Mono', 'Courier New', monospace";
const BG = "#060807";
const GREEN = "#44ff88";
const GREEN_DIM = "#b8ddb8";
const GREEN_MID = "#5a9a5a";
const GREEN_DARK = "#3a5a3a";
const RED = "#ff4455";

export default function RoomGate() {
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const createGame = async () => {
    setCreating(true);
    setError("");
    try {
      const r = await fetch("/api/room", { method: "POST" });
      if (!r.ok) throw new Error();
      const { code } = await r.json();
      window.location.href = `/room/${code}`;
    } catch {
      setError("Could not create game. Try again.");
      setCreating(false);
    }
  };

  const joinGame = () => {
    const code = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError("Enter a valid 6-character game code.");
      return;
    }
    window.location.href = `/room/${code}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: MONO, padding: "20px", position: "relative", overflow: "hidden" }}>

      {/* Scanlines */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)" }} />

      <div style={{ width: "100%", maxWidth: "380px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ color: "#c8ffc8", fontSize: "10px", letterSpacing: "0.3em",
          marginBottom: "8px", opacity: 0.4 }}>
          SECTOR FINANCIAL NETWORK
        </div>
        <div style={{ color: "#e8ffe8", fontSize: "clamp(18px, 5vw, 24px)", letterSpacing: "0.15em",
          fontWeight: "bold", textShadow: "0 0 20px rgba(140,255,140,0.3)", marginBottom: "8px" }}>
          CORPORATE TICKER
        </div>
        <div style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.2em", marginBottom: "48px" }}>
          ● LIVE MARKET FEED
        </div>

        <button onClick={createGame} disabled={creating}
          style={{ display: "block", width: "100%", background: creating ? "rgba(68,255,136,0.05)" : "none",
            border: `1px solid ${creating ? GREEN_MID : GREEN_DARK}`,
            color: creating ? GREEN_MID : GREEN_DIM,
            fontFamily: MONO, fontSize: "12px", letterSpacing: "0.2em",
            padding: "16px", cursor: creating ? "default" : "pointer",
            marginBottom: "24px", transition: "all 0.2s" }}>
          {creating ? "GENERATING ROOM CODE..." : "CREATE NEW GAME"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: GREEN_DARK, opacity: 0.4 }} />
          <span style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.2em" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: GREEN_DARK, opacity: 0.4 }} />
        </div>

        <input
          value={joinCode}
          onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && joinGame()}
          maxLength={6}
          placeholder="ENTER GAME CODE"
          style={{ width: "100%", background: "transparent",
            border: `1px solid ${GREEN_DARK}`, color: "#e8ffe8",
            fontFamily: MONO, fontSize: "20px", textAlign: "center",
            letterSpacing: "0.4em", padding: "14px", outline: "none",
            boxSizing: "border-box", marginBottom: "12px" }}
        />

        <button onClick={joinGame}
          style={{ display: "block", width: "100%", background: "none",
            border: `1px solid #1a2a3a`, color: "#6688aa", fontFamily: MONO,
            fontSize: "12px", letterSpacing: "0.2em", padding: "14px",
            cursor: "pointer", marginBottom: "20px" }}>
          JOIN GAME
        </button>

        {error && (
          <div style={{ color: RED, fontSize: "11px", letterSpacing: "0.1em" }}>
            {error}
          </div>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}
