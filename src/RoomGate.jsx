import { useState, useRef } from "react";

const MONO = "'Share Tech Mono', 'Courier New', monospace";
const BG = "#060807";
const GREEN = "#44ff88";
const GREEN_DIM = "#b8ddb8";
const GREEN_MID = "#5a9a5a";
const GREEN_DARK = "#3a5a3a";
const RED = "#ff4455";
const AMBER = "#ffcc44";

export default function RoomGate() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creationKey, setCreationKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [error, setError] = useState("");
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleDigit = (i, val) => {
    const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!clean && val) return; // reject non-alphanum
    const next = [...digits];
    next[i] = clean.slice(-1);
    setDigits(next);
    setError("");
    if (clean && i < 5) refs[i + 1].current?.focus();
    if (!clean && i > 0) refs[i - 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError("");
    const focusIdx = Math.min(pasted.length, 5);
    refs[focusIdx].current?.focus();
  };

  const createGame = async () => {
    if (!creationKey.trim()) { setKeyError("Enter the creation key."); return; }
    setCreating(true);
    setKeyError("");
    setError("");
    try {
      const r = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creationKey: creationKey.trim() }),
      });
      if (r.status === 403) {
        setKeyError("Invalid creation key.");
        setCreating(false);
        return;
      }
      if (!r.ok) throw new Error();
      const { code } = await r.json();
      window.location.href = `/room/${code}`;
    } catch {
      setError("Could not create game. Try again.");
      setCreating(false);
    }
  };

  const joinGame = () => {
    const code = digits.join("").toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError("Enter a valid 6-character game code.");
      return;
    }
    window.location.href = `/room/${code}`;
  };

  const boxStyle = {
    width: "42px", height: "52px", background: "transparent",
    border: `1px solid ${GREEN_DARK}`, color: GREEN,
    fontFamily: MONO, fontSize: "22px", textAlign: "center", outline: "none",
    letterSpacing: 0, boxSizing: "border-box",
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

        {/* JOIN section — 6-digit boxes */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ color: "#4a7a4a", fontSize: "9px", letterSpacing: "0.2em", marginBottom: "10px" }}>GAME CODE</div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "14px" }}>
            {digits.map((d, i) => (
              <input key={i} ref={refs[i]} value={d} maxLength={1}
                autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false}
                onChange={(e) => handleDigit(i, e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Enter") joinGame();
                  if (e.key === "Backspace" && !d && i > 0) { refs[i-1].current?.focus(); }
                }}
                style={{ ...boxStyle, borderColor: error ? RED : GREEN_DARK }} />
            ))}
          </div>
          <button onClick={joinGame}
            style={{ display: "block", width: "100%", background: "none",
              border: `1px solid ${GREEN_DARK}`, color: GREEN_DIM, fontFamily: MONO,
              fontSize: "12px", letterSpacing: "0.2em", padding: "14px",
              cursor: "pointer" }}>
            JOIN GAME
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "1px", background: GREEN_DARK, opacity: 0.4 }} />
          <span style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.2em" }}>WARDEN</span>
          <div style={{ flex: 1, height: "1px", background: GREEN_DARK, opacity: 0.4 }} />
        </div>

        {/* CREATE section — collapsed behind key */}
        {!showCreate ? (
          <button onClick={() => setShowCreate(true)}
            style={{ display: "block", width: "100%", background: "none",
              border: `1px solid #1a3a1a`, color: "#4a7a4a", fontFamily: MONO,
              fontSize: "11px", letterSpacing: "0.2em", padding: "12px",
              cursor: "pointer" }}>
            CREATE NEW GAME
          </button>
        ) : (
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "#4a6a4a", fontSize: "9px", letterSpacing: "0.2em", marginBottom: "6px" }}>
              CREATION KEY
            </div>
            <input
              value={creationKey}
              onChange={(e) => { setCreationKey(e.target.value); setKeyError(""); }}
              onKeyDown={(e) => e.key === "Enter" && createGame()}
              type="password"
              placeholder="enter key"
              style={{ width: "100%", background: "transparent",
                border: `1px solid ${GREEN_DARK}`, color: "#e8ffe8",
                fontFamily: MONO, fontSize: "13px", textAlign: "center",
                letterSpacing: "0.1em", padding: "12px", outline: "none",
                boxSizing: "border-box", marginBottom: "8px" }}
            />
            {keyError && (
              <div style={{ color: RED, fontSize: "10px", letterSpacing: "0.1em", marginBottom: "8px" }}>
                {keyError}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={createGame} disabled={creating}
                style={{ flex: 1, background: creating ? "rgba(68,255,136,0.05)" : "none",
                  border: `1px solid ${creating ? GREEN_MID : GREEN_DARK}`,
                  color: creating ? GREEN_MID : GREEN_DIM,
                  fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em",
                  padding: "12px", cursor: creating ? "default" : "pointer" }}>
                {creating ? "GENERATING..." : "CREATE"}
              </button>
              <button onClick={() => { setShowCreate(false); setCreationKey(""); setKeyError(""); }}
                style={{ background: "none", border: `1px solid #1a2a1a`, color: "#3a5a3a",
                  fontFamily: MONO, fontSize: "11px", padding: "12px 16px", cursor: "pointer" }}>
                CANCEL
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: RED, fontSize: "11px", letterSpacing: "0.1em", marginTop: "12px" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: "40px", color: "#1a2a1a", fontSize: "9px", letterSpacing: "0.1em" }}>
          SFNET MARKET DATA TERMINAL v2.1
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}
