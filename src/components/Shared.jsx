import { useState, useEffect, useRef } from "react";
import {
  DEFAULT_PIN, THEMES, BG, GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID,
  AMBER, RED, HEADER_GREEN, MONO, healthColor, volColor,
} from "../constants.js";

  BG, GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  healthColor, volColor, THEMES,
} from "../constants.js";

// Scanlines + FictionDate
export function Scanlines({ color }) {
  useEffect(() => {
    const gridColor  = color ? color.replace(/[\d.]+\)$/, "0.05)") : "rgba(0,0,0,0.07)";
    const sweepColor = color ? color.replace(/[\d.]+\)$/, "0.5)") : "rgba(180,255,180,0.18)";

    const base = {
      position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "99999",
    };

    const grid = document.createElement("div");
    Object.assign(grid.style, { ...base,
      background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${gridColor} 2px, ${gridColor} 4px)`,
    });

    const sweep = document.createElement("div");
    Object.assign(sweep.style, { ...base,
      height: "3px", background: sweepColor, opacity: "0.4",
    });

    document.body.appendChild(grid);
    document.body.appendChild(sweep);

    let pct = 0;
    const iv = setInterval(() => {
      pct = (pct + 1) % 100;
      sweep.style.top = pct + "vh";
    }, 30);

    return () => {
      clearInterval(iv);
      if (grid.parentNode) grid.parentNode.removeChild(grid);
      if (sweep.parentNode) sweep.parentNode.removeChild(sweep);
    };
  }, [color]);

  return null;
}

export function FictionDate({ date, yearLabel = "YEAR", cycleLabel = "CYC" }) {
  return (
    <span style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.15em" }}>
      {yearLabel.toUpperCase()} {date.year} · {cycleLabel.toUpperCase()} {String(date.cycle).padStart(2, "0")}
    </span>
  );
}


// ─── StockRows ──────────────────────────────────────────────────────────────
export function StockRows({ stocks, history, visible, expandedStock, setExpandedStock, catalogs }) {
  catalogs = catalogs || {};
  const STATUS_COLORS = { hidden:"transparent", unlocked:GREEN, revoked:"#cc5555", ineligible:AMBER };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {stocks.map((s, i) => {
        const isUp = s.change > 0;
        const isDown = s.change < 0;
        const changeColor = s.is_omnicorp ? AMBER : isUp ? GREEN : isDown ? RED : "#888";
        const rowBg = s.is_omnicorp ? "rgba(80,60,0,0.15)" : i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent";
        const isVis = visible.includes(i);
        const isExpanded = expandedStock === s.name;

        // Build price history for this stock from history snapshots
        const priceHistory = history
          .filter(h => h.stocks)
          .map(h => {
            const snap = h.stocks.find(x => x.name === s.name);
            return snap ? { price: snap.price, date: h.date } : null;
          })
          .filter(Boolean)
          .slice(-10); // last 10 entries

        return (
          <div key={s.name} style={{
            opacity: isVis ? (s.is_collapsed ? 0.3 : 1) : 0,
            transform: isVis ? "translateX(0)" : "translateX(-8px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            border: isExpanded ? `1px solid ${s.is_omnicorp ? "rgba(255,200,0,0.3)" : "rgba(255,255,255,0.1)"}` : "1px solid transparent",
            background: isExpanded ? "rgba(0,0,0,0.3)" : rowBg,
          }}>
            {/* Main row */}
            <div
              onClick={() => setExpandedStock(isExpanded ? null : s.name)}
              style={{ display: "flex", alignItems: "center", padding: "10px 14px", cursor: "pointer" }}>
              <div style={{ flex: 1, color: s.is_omnicorp ? AMBER : s.is_collapsed ? "#444" : GREEN_DIM,
                fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {s.name}
                {s.is_collapsed && <span style={{ color: "#444", marginLeft: "8px" }}>— DELISTED</span>}
                {s.is_frozen && !s.is_collapsed && <span style={{ color: "#4488cc", marginLeft: "8px", fontSize: "10px" }}>❄</span>}
                <span style={{ color: GREEN_DARK, fontSize: "10px", marginLeft: "8px" }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
              <div style={{ color: s.is_omnicorp ? AMBER : s.is_collapsed ? "#444" : HEADER_GREEN,
                fontSize: "14px", minWidth: "80px", textAlign: "right", fontWeight: "bold" }}>
                {!s.is_collapsed && s.price.toLocaleString()+"cr"}
              </div>
              <div style={{ minWidth: "70px", textAlign: "right", fontSize: "13px",
                color: changeColor, paddingLeft: "16px" }}>
                {!s.is_collapsed && (isUp ? "▲" : isDown ? "▼" : "—") + " " + Math.abs(s.change)}
              </div>
            </div>
            {/* Expanded history */}
            {isExpanded && (
              <div style={{ padding: "8px 14px 14px", borderTop: `1px solid ${GREEN_DARK}` }}>
                <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "10px", textTransform: "uppercase" }}>
                  {s.industry}
                </div>
                <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.2em", marginBottom: "8px" }}>
                  PRICE HISTORY (LAST {priceHistory.length} CYCLES)
                </div>
                {priceHistory.length === 0 ? (
                  <div style={{ color: GREEN_DARK, fontSize: "10px" }}>No history recorded yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {[...priceHistory].reverse().map((h, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between",
                        fontSize: "10px", color: GREEN_DARK, padding: "1px 0" }}>
                        <span style={{ color: GREEN_DARK }}>CYC {String(h.date?.cycle ?? "?").padStart(2,"0")}</span>
                        <span style={{ color: HEADER_GREEN }}>{h.price.toLocaleString()}cr</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Catalog & Benefits */}
                {(() => {
                  const cat = catalogs[s.name];
                  if (!cat || cat.status === "hidden") return null;
                  const color = STATUS_COLORS[cat.status] || GREEN_DARK;
                  const isRevoked = cat.status === "revoked";
                  const isIneligible = cat.status === "ineligible";
                  return (
                    <div style={{ marginTop: "12px", borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "10px" }}>
                      <div style={{ color, fontSize: "9px", letterSpacing: "0.2em", marginBottom: "6px" }}>
                        {cat.status.toUpperCase()}{isIneligible && cat.ineligibleReason ? ` — ${cat.ineligibleReason}` : ""}
                      </div>
                      {!isIneligible && cat.benefits && (
                        <div style={{ color: isRevoked ? GREEN_DARK : GREEN_MID, fontSize: "10px", lineHeight: 1.6, marginBottom: "8px",
                          textDecoration: isRevoked ? "line-through" : "none", opacity: isRevoked ? 0.5 : 1 }}>
                          {cat.benefits}
                        </div>
                      )}
                      {!isIneligible && cat.items && cat.items.length > 0 && (
                        <div>
                          <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "5px" }}>CATALOG</div>
                          {cat.items.map(it => (
                            <div key={it.id} style={{ padding: "5px 0",
                              borderBottom: `1px solid rgba(68,100,68,0.1)`,
                              opacity: isRevoked ? 0.4 : 1,
                              textDecoration: isRevoked ? "line-through" : "none" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "10px" }}>
                                <span style={{ color: isRevoked ? GREEN_DARK : GREEN_DIM }}>{it.name}</span>
                                <span style={{ color: isRevoked ? GREEN_DARK : GREEN_MID, whiteSpace: "nowrap" }}>{it.price}</span>
                              </div>
                              {it.notes && (
                                <div style={{ color: GREEN_DARK, fontSize: "9px", lineHeight: 1.5, marginTop: "2px", wordBreak: "break-word" }}>
                                  {it.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ─── History Log ────────────────────────────────────────────────────────────
export function HistoryLog({ history, headlines }) {
  const [tab, setTab] = useState("news"); // "news" | "market"

  // Collect all past headlines from history entries (deduped by id), most recent first
  const pastHeadlines = [];
  const seenIds = new Set();
  [...history].reverse().forEach((entry) => {
    if (entry.headlines) entry.headlines.forEach((h) => {
      const key = h.id || h.headline;
      if (!seenIds.has(key)) { seenIds.add(key); pastHeadlines.push({ ...h, _cycle: entry.date }); }
    });
  });

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)}
      style={{ background: "none", border: "none", borderBottom: tab === id ? `2px solid ${GREEN_MID}` : "2px solid transparent",
        color: tab === id ? GREEN_MID : GREEN_DARK, fontFamily: MONO, fontSize: "10px",
        letterSpacing: "0.15em", padding: "6px 12px", cursor: "pointer" }}>
      {label}
    </button>
  );

  return (
    <div style={{ marginTop: "24px", borderTop: `1px solid ${GREEN_DARK}` }}>
      <div style={{ display: "flex", gap: "4px", paddingTop: "12px", marginBottom: "16px",
        borderBottom: `1px solid ${GREEN_DARK}` }}>
        {tabBtn("news", "NEWS ARCHIVE")}
        {tabBtn("market", "MARKET HISTORY")}
      </div>

      {tab === "news" && (
        pastHeadlines.length === 0
          ? <div style={{ color: GREEN_DARK, fontSize: "11px", padding: "8px 0" }}>NO ARCHIVED HEADLINES</div>
          : pastHeadlines.map((h, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${GREEN_DARK}`,
              paddingLeft: "12px", marginBottom: "14px", opacity: i === 0 ? 0.85 : 0.5 }}>
              <div style={{ color: GREEN_DIM, fontSize: "12px", letterSpacing: "0.05em" }}>{h.headline}</div>
              {h.subtext && <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "2px" }}>{h.subtext}</div>}
              <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "3px" }}>
                <FictionDate date={h.date || h._cycle} />
              </div>
            </div>
          ))
      )}

      {tab === "market" && (
        history.length === 0
          ? <div style={{ color: GREEN_DARK, fontSize: "11px", padding: "8px 0" }}>NO MARKET HISTORY</div>
          : [...history].reverse().map((entry, ei) => (
            <div key={ei} style={{ marginBottom: "20px", paddingBottom: "16px",
              borderBottom: `1px solid rgba(42,58,42,0.3)` }}>
              <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "8px" }}>
                <FictionDate date={entry.date} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {entry.stocks.map((s) => (
                  <div key={s.name} style={{ display: "flex", fontSize: "11px", padding: "2px 0",
                    color: s.is_collapsed ? "#333" : s.is_omnicorp ? AMBER : GREEN_DIM }}>
                    <span style={{ flex: 1, textTransform: "uppercase" }}>{s.name}</span>
                    <span style={{ minWidth: "70px", textAlign: "right" }}>{s.price.toLocaleString()}cr</span>
                    <span style={{ minWidth: "60px", textAlign: "right", paddingLeft: "12px",
                      color: s.change > 0 ? GREEN : s.change < 0 ? RED : "#555" }}>
                      {s.change > 0 ? "▲" : s.change < 0 ? "▼" : "—"} {Math.abs(s.change)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}


// ─── PIN Gate ───────────────────────────────────────────────────────────────
export function PinGate({ onSuccess, onCancel, storedPin, roomCode, onClearLockout }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryError, setRecoveryError] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  useEffect(() => { refs[0].current?.focus(); }, []);

  const handleKey = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    setError(false);
    if (val && i < 5) refs[i + 1].current?.focus();
    if (!val && i > 0) refs[i - 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError(false);
    const focusIdx = Math.min(pasted.length, 5);
    refs[focusIdx].current?.focus();
    if (pasted.length === 6) setTimeout(submit, 50);
  };

  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const entered = digits.join("");
    if (entered.length < 6) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomCode, pin: entered }),
      });
      if (r.ok) {
        onSuccess(entered);
      } else {
        const data = await r.json();
        if (data.error === "locked") {
          setLocked(true);
        }
        setError(true);
        setDigits(["", "", "", "", "", ""]);
        refs[0].current?.focus();
      }
    } catch {
      setError(true);
      setDigits(["", "", "", "", "", ""]);
      refs[0].current?.focus();
    }
    setSubmitting(false);
  };

  const submitRecovery = async () => {
    const ok = await onClearLockout(recoveryInput.trim());
    if (ok) {
      setRecoveryInput("");
      setShowRecovery(false);
      setError(false);
      setRecoveryError(false);
      refs[0].current?.focus();
    } else {
      setRecoveryError(true);
      setRecoveryInput("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: MONO }}>
      <Scanlines />
      <div style={{ zIndex: 1, textAlign: "center" }}>
        <div style={{ color: GREEN_DARK, fontSize: "11px", letterSpacing: "0.3em", marginBottom: "8px" }}>
          SECTOR FINANCIAL NETWORK
        </div>
        <div style={{ color: GREEN_DIM, fontSize: "18px", letterSpacing: "0.2em", marginBottom: "40px" }}>
          WARDEN TERMINAL
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
          {digits.map((d, i) => (
            <input key={i} ref={refs[i]} value={d} maxLength={1}
              inputMode="numeric" pattern="[0-9]*" autoComplete="off"
              onChange={(e) => { if (!locked) handleKey(i, e.target.value); }}
              onPaste={handlePaste}
              onKeyDown={(e) => { if (!locked && e.key === "Enter") submit(); if (e.key === "Backspace" && !d && i > 0) refs[i-1].current?.focus(); }}
              disabled={locked || submitting}
              style={{ width: "42px", height: "52px", background: "transparent",
                border: `1px solid ${error ? RED : GREEN_DARK}`, color: HEADER_GREEN,
                fontFamily: MONO, fontSize: "22px", textAlign: "center", outline: "none",
                boxShadow: error ? `0 0 8px rgba(255,68,85,0.3)` : "none" }} />
          ))}
        </div>
        {error && <div style={{ color: RED, fontSize: "11px", letterSpacing: "0.15em", marginBottom: "16px" }}>
          {locked ? "ERROR: LOCKED — TRY AGAIN IN 30 MIN" : "ACCESS DENIED"}
        </div>}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button onClick={submit} disabled={locked || submitting}
            style={{ background: "none", border: `1px solid ${locked ? RED : GREEN_DARK}`,
              color: locked ? RED : GREEN_DIM, fontFamily: MONO, fontSize: "12px",
              letterSpacing: "0.15em", padding: "10px 24px",
              cursor: locked || submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.5 : 1 }}>
            {submitting ? "VERIFYING..." : locked ? "LOCKED" : "AUTHENTICATE"}
          </button>
          <button onClick={onCancel}
            style={{ background: "none", border: "none", color: GREEN_DARK,
              fontFamily: MONO, fontSize: "12px", letterSpacing: "0.15em", padding: "10px", cursor: "pointer" }}>
            CANCEL
          </button>
        </div>
        <div style={{ color: GREEN_DARK, opacity: 0.4, fontSize: "10px", marginTop: "32px", letterSpacing: "0.1em" }}>
          DEFAULT PIN: {DEFAULT_PIN}
        </div>
        {/* Recovery passphrase — invisible trigger */}
        <div style={{ marginTop: "24px" }}>
          <button onClick={() => { setShowRecovery(r => !r); setRecoveryError(false); }}
            style={{ background: "none", border: "none", color: GREEN_DARK, opacity: 0.3,
              fontFamily: MONO, fontSize: "8px", letterSpacing: "0.1em", cursor: "pointer" }}>
            EMERGENCY OVERRIDE
          </button>
        </div>
        {showRecovery && (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <input
              type="password"
              value={recoveryInput}
              onChange={e => { setRecoveryInput(e.target.value); setRecoveryError(false); }}
              onKeyDown={e => { if (e.key === "Enter") submitRecovery(); }}
              placeholder="recovery passphrase"
              autoComplete="off"
              style={{ background: "transparent", border: `1px solid ${recoveryError ? RED : GREEN_DARK}`,
                color: GREEN_DIM, fontFamily: MONO, fontSize: "11px", padding: "8px 12px",
                outline: "none", width: "220px", textAlign: "center" }}
            />
            {recoveryError && <div style={{ color: RED, fontSize: "10px", letterSpacing: "0.1em" }}>INVALID PASSPHRASE</div>}
            <button onClick={submitRecovery}
              style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_MID,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.15em",
                padding: "6px 16px", cursor: "pointer" }}>
              OVERRIDE
            </button>
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}

