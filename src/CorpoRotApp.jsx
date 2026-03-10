import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PIN = "000000";
const HEALTH_STEPS = ["Bankrupt", "Bad", "OK", "Good"];
const VOLATILITY_STEPS = ["Low", "Medium", "High"];
const VOLATILITY_DIE = { High: 20, Medium: 10, Low: 5 };

const INITIAL_STOCKS = [
  { name: "Koo Mediatek",            industry: "Data/News",   price: 1100, change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Rhodes Driveyards",       industry: "Shipyards",   price: 900,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Hayden Enterprises",      industry: "Fuel",        price: 800,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Koga Cybersystems",       industry: "Cyber/Tech",  price: 700,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Conduit Interstellar",    industry: "Logistics",   price: 600,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Sterling Credit Solutions",industry: "Finance",    price: 500,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Vance Pharmaceuticals",   industry: "Pharma",      price: 400,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Torsten Defense Unlimited",industry: "Weapons",    price: 300,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Citadel Labor Union",     industry: "Labor",       price: 200,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Albedo Agrosystems",      industry: "Food",        price: 100,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "Bortek",                  industry: "Mining",      price: 100,  change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
  { name: "OmniCorp",                industry: "Conglomerate",price: 50,   change: 0, health: "Good", volatility: "High", is_omnicorp: true,  is_collapsed: false },
];

const OMNICORP_HEADLINES = [
  { company: "Koo Mediatek",             headline: "OMNICORP MEDIA DIVISION PULLS KOO MEDIATEK BROADCAST LICENSE AFTER MERGER", subtext: "Company representatives have no comment at this time, says company representative." },
  { company: "Rhodes Driveyards",        headline: "OMNICORP SHIPYARD DIVISION DECOMMISSIONS PLANNED GENERATION SHIP AFTER MERGER", subtext: "Company representatives shift focus to more immediate concerns, says company representative." },
  { company: "Hayden Enterprises",       headline: "OMNICORP ENERGY DIVISION REFINES HAYDEN ENTERPRISES OPERATIONS AFTER MERGER", subtext: "Fuel prices expected to stabilize, says company representative." },
  { company: "Koga Cybersystems",        headline: "OMNICORP TECHNOLOGY DIVISION ISSUES UPDATE ON KOGA CYBERSYSTEMS LEADERSHIP AFTER MERGER", subtext: "Cyberware firmware update cadence not impacted, says company representative." },
  { company: "Conduit Interstellar",     headline: "OMNICORP LOGISTICS DIVISION REROUTES SHIPPING LANES AFTER MERGER", subtext: "No shortages expected, says company representative." },
  { company: "Sterling Credit Solutions",headline: "OMNICORP FINANCIAL DIVISION AUDITS STERLING CREDIT SOLUTIONS HOLDINGS AFTER BANKRUPTCY", subtext: "Rates expected to stabilize, says company representative." },
  { company: "Vance Pharmaceuticals",    headline: "OMNICORP MEDICAL DIVISION RECALLS NUMEROUS PRODUCTS AFTER MERGER", subtext: "Safe and effective medications will remain in distribution, says company representative." },
  { company: "Torsten Defense Unlimited",headline: "OMNICORP DEFENSE DIVISION TERMINATES TORSTEN DEFENSE UNLIMITED BOARD AMID HOSTILE TAKEOVER", subtext: "Ammo shortages unlikely, says company representative." },
  { company: "Citadel Labor Union",      headline: "OMNICORP WORKFORCE DIVISION NEGOTIATES DEAL WITH CITADEL LABOR UNION AFTER MASS LAYOFFS", subtext: "Pay expected to stabilize, says company representative." },
  { company: "Albedo Agrosystems",       headline: "OMNICORP AGRICULTURAL DIVISION ASSUMES CONTROL OF ALBEDO AGROSYSTEMS PRODUCTION", subtext: "Food shortages expected to end, says company representative." },
  { company: "Bortek",                   headline: "OMNICORP EXTRACTION DIVISION ACQUIRES BORTEK AMIDST FINANCIAL IMPLOSION", subtext: "Industrial safety regulations expected to improve, says company representative." },
  { company: "Torsten-Koga CyberDefense",headline: "OMNICORP DEFENSE DIVISION ASSUMES CONTROLLING STAKE IN TORSTEN-KOGA CYBERDEFENSE", subtext: "Weapons manufacturing and cyberware divisions to be restructured, says company representative." },
  { company: "Vance-Albedo LifeSystems", headline: "OMNICORP MEDICAL DIVISION ABSORBS VANCE-ALBEDO LIFESYSTEMS PORTFOLIO AMID DEBT RESTRUCTURING", subtext: "Distribution of essential products will not be impacted, says company representative." },
  { company: "Hayden-Rhodes Dynamics",   headline: "OMNICORP ENERGY DIVISION TAKES MAJORITY POSITION IN HAYDEN-RHODES DYNAMICS AFTER MARKET INSTABILITY", subtext: "Fuel and transit operations expected to continue under new oversight, says company representative." },
];

// Auto-push headlines when a merger fires
const MERGER_HEADLINES = {
  "Torsten-Koga CyberDefense": { headline: "TORSTEN DEFENSE UNLIMITED AND KOGA CYBERSYSTEMS ANNOUNCE EMERGENCY MERGER", subtext: "Combined entity to operate as Torsten-Koga CyberDefense effective immediately, says company representative." },
  "Vance-Albedo LifeSystems":  { headline: "VANCE PHARMACEUTICALS AND ALBEDO AGROSYSTEMS COMPLETE DEFENSIVE MERGER", subtext: "Combined entity to operate as Vance-Albedo LifeSystems, says company representative." },
  "Hayden-Rhodes Dynamics":    { headline: "HAYDEN ENTERPRISES AND RHODES DRIVEYARDS FINALIZE MERGER AMID MARKET PRESSURES", subtext: "Combined entity to operate as Hayden-Rhodes Dynamics, says company representative." },
};

// Companies protected from individual OmniCorp acquisition buttons while their merger is pending
// key = company name, value = merger name that protects it
const MERGER_PROTECTED = {
  "Torsten Defense Unlimited": "Torsten-Koga CyberDefense",
  "Koga Cybersystems":         "Torsten-Koga CyberDefense",
  "Vance Pharmaceuticals":     "Vance-Albedo LifeSystems",
  "Albedo Agrosystems":        "Vance-Albedo LifeSystems",
  "Hayden Enterprises":        "Hayden-Rhodes Dynamics",
  "Rhodes Driveyards":         "Hayden-Rhodes Dynamics",
};

const INITIAL_MERGERS = [
  { name: "Torsten-Koga CyberDefense", partner1: "Torsten Defense Unlimited", partner2: "Koga Cybersystems",   industry: "Defense/Cyber", triggered: false },
  { name: "Vance-Albedo LifeSystems",  partner1: "Vance Pharmaceuticals",     partner2: "Albedo Agrosystems", industry: "Pharma/Food",   triggered: false },
  { name: "Hayden-Rhodes Dynamics",    partner1: "Hayden Enterprises",        partner2: "Rhodes Driveyards",  industry: "Fuel/Shipyards",triggered: false },
];

// Compute merger display status from live stocks; only "triggered" is stored.
const getMergerStatus = (merger, stocks) => {
  if (merger.triggered) return "triggered";
  const p1 = stocks.some((s) => s.name === merger.partner1 && !s.is_collapsed && !s.is_delisting);
  const p2 = stocks.some((s) => s.name === merger.partner2 && !s.is_collapsed && !s.is_delisting);
  if (!p1 || !p2) return "unavailable";
  return "pending";
};

// Remove both partners and insert merged entity; caller must sort afterward.
const applyMerger = (stocks, merger) => {
  const p1 = stocks.find((s) => s.name === merger.partner1);
  const p2 = stocks.find((s) => s.name === merger.partner2);
  const mergedPrice = (p1?.price ?? 0) + (p2?.price ?? 0);
  const mergedEntity = {
    name: merger.name, industry: merger.industry,
    price: mergedPrice, change: 0,
    health: "OK", volatility: "Medium",
    is_omnicorp: false, is_collapsed: false, is_merged: true,
  };
  return stocks.filter((s) => s.name !== merger.partner1 && s.name !== merger.partner2).concat([mergedEntity]);
};

const sortByPrice = (stocks) => [...stocks].sort((a, b) => b.price - a.price);

// ─── Dice & Economy Logic ─────────────────────────────────────────────────────

const roll = (sides) => Math.floor(Math.random() * sides) + 1;

const shiftIndex = (arr, current, delta) => {
  const idx = arr.indexOf(current);
  return arr[Math.max(0, Math.min(arr.length - 1, idx + delta))];
};

const d10ShiftDelta = (r) => r === 1 ? 1 : r >= 8 ? -1 : 0;

function computeAdvance(stocks) {
  const results = stocks.map((s) => {
    if (s.is_collapsed) return { ...s, healthRoll: null, volRoll: null, priceRoll: null, coinFlip: null };

    const healthRoll = roll(10);
    const volRoll = roll(10);
    const healthDelta = d10ShiftDelta(healthRoll);
    const volDelta = d10ShiftDelta(volRoll);

    let newHealth = shiftIndex(HEALTH_STEPS, s.health, healthDelta);
    let newVol = shiftIndex(VOLATILITY_STEPS, s.volatility, volDelta);

    // OmniCorp immunities
    if (s.is_omnicorp) {
      const badOrBelow = ["Bad", "Bankrupt"].includes(newHealth);
      if (badOrBelow) newHealth = "OK";
      if (VOLATILITY_STEPS.indexOf(newVol) < VOLATILITY_STEPS.indexOf(s.volatility)) newVol = s.volatility;
    }

    const die = VOLATILITY_DIE[newVol];
    const priceRoll = roll(die);
    let coinFlip = null;
    let priceDelta = 0;

    if (newHealth === "Good") {
      priceDelta = priceRoll;
    } else if (newHealth === "OK") {
      coinFlip = roll(2) === 1 ? "up" : "down";
      priceDelta = coinFlip === "up" ? priceRoll : -priceRoll;
    } else if (newHealth === "Bad") {
      priceDelta = -priceRoll;
    } else if (newHealth === "Bankrupt") {
      // halve first, then subtract
      const halved = Math.max(1, Math.floor(s.price / 2));
      const afterSubtract = Math.max(1, halved - priceRoll);
      priceDelta = afterSubtract - s.price;
    }

    // OmniCorp price never decreases
    if (s.is_omnicorp && priceDelta < 0) priceDelta = 0;

    const newPrice = Math.max(1, s.price + priceDelta);

    return {
      ...s,
      health: newHealth,
      volatility: newVol,
      price: newPrice,
      change: newPrice - s.price,
      healthRoll,
      volRoll,
      priceRoll,
      coinFlip,
      healthShift: healthDelta,
      volShift: volDelta,
    };
  });
  return results;
}

// Health bump from scenario/day job reward — capped at OK.
// Good health is only reachable through natural advancement rolls.
// This cap is enforced here in the data layer, not in the UI.
const BUMP_CAP = "OK";
function bumpHealth(stock) {
  if (["OK", "Good"].includes(stock.health)) return stock; // already at or above cap
  return { ...stock, health: shiftIndex(HEALTH_STEPS, stock.health, 1) };
}

function computeBankruptcyCheck(stocks, mergers = [], alwaysMerge = true) {
  return stocks.map((s) => {
    if (s.is_collapsed || s.is_omnicorp) return { ...s, bankruptRoll: null, collapses: false, triggersMerger: null };
    if (s.health !== "Bankrupt") return { ...s, bankruptRoll: null, collapses: false, triggersMerger: null };
    const bankruptRoll = roll(10);
    const collapses = bankruptRoll >= 7;
    let triggersMerger = null;
    if (collapses && alwaysMerge) {
      const m = mergers.find((m) => !m.triggered &&
        getMergerStatus(m, stocks) === "pending" &&
        (m.partner1 === s.name || m.partner2 === s.name));
      if (m) triggersMerger = m.name;
    }
    return { ...s, bankruptRoll, collapses, triggersMerger };
  });
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const makeKeys = (prefix) => ({
  stocks:    `${prefix}:stocks`,
  headlines: `${prefix}:headlines`,
  history:   `${prefix}:history`,
  date:      `${prefix}:date`,
  pin:       `${prefix}:pin`,
  mergers:   `${prefix}:mergers`,
  settings:  `${prefix}:settings`,
});

const safeGet = async (key, fallback) => {
  try {
    const r = await fetch(`/api/kv/${encodeURIComponent(key)}`);
    if (!r.ok) return fallback;
    const data = await r.json();
    return data.value !== undefined ? data.value : fallback;
  } catch { return fallback; }
};

const safeSet = async (key, value) => {
  try {
    await fetch(`/api/kv/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
  } catch {}
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const BG = "#060807";
const GREEN = "#44ff88";
const GREEN_DIM = "#b8ddb8";
const GREEN_DARK = "#4a7a4a";
const GREEN_MID = "#5a9a5a";
const AMBER = "#ffdd77";
const RED = "#ff4455";
const HEADER_GREEN = "#e8ffe8";
const MONO = "'Share Tech Mono', 'Courier New', monospace";

const healthColor = (h) => ({
  Good: "#44ff88", OK: "#aaffcc", Bad: "#ff8844", Bankrupt: "#ff4455"
}[h] || "#888");

const volColor = (v) => ({
  High: "#ff8844", Medium: "#aaffcc", Low: "#44ff88"
}[v] || "#888");

// ─── Sub-components ───────────────────────────────────────────────────────────

function Scanlines() {
  const [pos, setPos] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPos((p) => (p + 1) % 100), 30);
    return () => clearInterval(iv);
  }, []);
  return (
    <>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)" }} />
      <div style={{ position: "fixed", top: `${pos}%`, left: 0, right: 0, height: "2px",
        background: "rgba(180,255,180,0.04)", pointerEvents: "none", zIndex: 11 }} />
    </>
  );
}

function FictionDate({ date }) {
  return (
    <span style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.15em" }}>
      YEAR {date.year} · CYC {String(date.cycle).padStart(2, "0")}
    </span>
  );
}

// ─── Player View ──────────────────────────────────────────────────────────────

function PlayerView({ stocks, headlines, history, date, onWardenAccess }) {
  const [showHistory, setShowHistory] = useState(false);
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    setVisible([]);
    stocks.forEach((_, i) => {
      setTimeout(() => setVisible((p) => [...p, i]), i * 80);
    });
  }, []);

  const recentHeadlines = headlines.slice(0, 3);

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column",
      alignItems: "center", fontFamily: MONO, padding: "40px 20px", position: "relative", overflow: "hidden" }}>
      <Scanlines />

      <div style={{ width: "100%", maxWidth: "720px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${GREEN_DARK}`, paddingBottom: "18px", marginBottom: "20px",
          display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: HEADER_GREEN, fontSize: "clamp(15px, 4.5vw, 22px)", letterSpacing: "0.12em", fontWeight: "bold",
              textShadow: "0 0 20px rgba(140,255,140,0.3)" }}>
              CORPORATE TICKER
            </div>
            <div style={{ color: "#c8ffc8", fontSize: "10px", letterSpacing: "0.2em", marginTop: "4px", opacity: 0.5 }}>
              SFN MARKET DATA
            </div>
          </div>
          <div style={{ textAlign: "right", lineHeight: 1.8 }}>
            <FictionDate date={date} />
            <div style={{ color: "#6aaa6a", fontSize: "11px", letterSpacing: "0.2em", marginTop: "4px" }}>● LIVE</div>
          </div>
        </div>

        {/* Headlines */}
        {recentHeadlines.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            {recentHeadlines.map((h, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${i === 0 ? GREEN : GREEN_DARK}`,
                paddingLeft: "12px", marginBottom: "12px", opacity: i === 0 ? 1 : 0.55 }}>
                <div style={{ color: i === 0 ? HEADER_GREEN : GREEN_DIM, fontSize: "12px",
                  letterSpacing: "0.08em", fontWeight: "bold" }}>{h.headline}</div>
                {h.subtext && (
                  <div style={{ color: GREEN_MID, fontSize: "11px", marginTop: "2px", letterSpacing: "0.04em" }}>
                    {h.subtext}
                  </div>
                )}
                <div style={{ color: "#2a4a2a", fontSize: "10px", marginTop: "3px" }}>
                  <FictionDate date={h.date} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stock rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "24px" }}>
          {stocks.map((s, i) => {
            const isUp = s.change > 0;
            const isDown = s.change < 0;
            const changeColor = s.is_omnicorp ? AMBER : isUp ? GREEN : isDown ? RED : "#888";
            const rowBg = s.is_omnicorp ? "rgba(80,60,0,0.15)" : i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent";
            const isVis = visible.includes(i);

            return (
              <div key={s.name} style={{ display: "flex", alignItems: "center", padding: "10px 14px",
                background: rowBg, border: s.is_omnicorp ? `1px solid rgba(255,200,0,0.15)` : "1px solid transparent",
                opacity: isVis ? (s.is_collapsed ? 0.3 : 1) : 0,
                transform: isVis ? "translateX(0)" : "translateX(-8px)",
                transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div style={{ flex: 1, color: s.is_omnicorp ? AMBER : s.is_collapsed ? "#444" : GREEN_DIM,
                  fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {s.name}{s.is_collapsed && <span style={{ color: "#444", marginLeft: "8px" }}>— DELISTED</span>}
                </div>
                <div style={{ color: s.is_omnicorp ? AMBER : s.is_collapsed ? "#444" : HEADER_GREEN,
                  fontSize: "14px", minWidth: "80px", textAlign: "right", fontWeight: "bold" }}>
                  {s.price.toLocaleString()}cr
                </div>
                <div style={{ minWidth: "70px", textAlign: "right", fontSize: "13px",
                  color: changeColor, paddingLeft: "16px" }}>
                  {isUp ? "▲" : isDown ? "▼" : "—"} {Math.abs(s.change)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            color: "#4a7a4a", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "8px" }}>
            <span>ALL VALUES IN CREDITS (cr)</span>
            <span>● LIVE FEED</span>
          </div>
          <button onClick={() => setShowHistory(!showHistory)}
            style={{ background: "none", border: `1px solid ${showHistory ? GREEN_DARK : "#2a3a2a"}`,
              color: showHistory ? GREEN_MID : "#4a7a4a", cursor: "pointer", fontFamily: MONO,
              fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px", width: "100%" }}>
            {showHistory ? "[ HIDE HISTORY ]" : "[ VIEW HISTORY ]"}
          </button>
        </div>

        {/* History log */}
        {showHistory && (
          <HistoryLog history={history} headlines={headlines} />
        )}

        {/* Hidden warden link */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <button onClick={onWardenAccess}
            style={{ background: "none", border: "none", color: "#1a2a1a", cursor: "pointer",
              fontFamily: MONO, fontSize: "9px", letterSpacing: "0.15em" }}>
            WARDEN ACCESS
          </button>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}

// ─── PIN Gate ─────────────────────────────────────────────────────────────────

function PinGate({ onSuccess, onCancel, storedPin }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
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

  const submit = () => {
    const entered = digits.join("");
    const pin = storedPin || DEFAULT_PIN;
    if (entered === pin) { onSuccess(); }
    else { setError(true); setDigits(["", "", "", "", "", ""]); refs[0].current?.focus(); }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: MONO }}>
      <Scanlines />
      <div style={{ zIndex: 1, textAlign: "center" }}>
        <div style={{ color: "#444", fontSize: "11px", letterSpacing: "0.3em", marginBottom: "8px" }}>
          SECTOR FINANCIAL NETWORK
        </div>
        <div style={{ color: GREEN_DIM, fontSize: "18px", letterSpacing: "0.2em", marginBottom: "40px" }}>
          WARDEN TERMINAL
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
          {digits.map((d, i) => (
            <input key={i} ref={refs[i]} value={d} maxLength={1}
              inputMode="numeric" pattern="[0-9]*" autoComplete="off"
              onChange={(e) => handleKey(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Backspace" && !d && i > 0) refs[i-1].current?.focus(); }}
              style={{ width: "42px", height: "52px", background: "transparent",
                border: `1px solid ${error ? RED : GREEN_DARK}`, color: HEADER_GREEN,
                fontFamily: MONO, fontSize: "22px", textAlign: "center", outline: "none",
                boxShadow: error ? `0 0 8px rgba(255,68,85,0.3)` : "none" }} />
          ))}
        </div>
        {error && <div style={{ color: RED, fontSize: "11px", letterSpacing: "0.15em", marginBottom: "16px" }}>
          ACCESS DENIED
        </div>}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button onClick={submit}
            style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DIM,
              fontFamily: MONO, fontSize: "12px", letterSpacing: "0.15em", padding: "10px 24px", cursor: "pointer" }}>
            AUTHENTICATE
          </button>
          <button onClick={onCancel}
            style={{ background: "none", border: "none", color: "#4a7a4a",
              fontFamily: MONO, fontSize: "12px", letterSpacing: "0.15em", padding: "10px", cursor: "pointer" }}>
            CANCEL
          </button>
        </div>
        <div style={{ color: "#1e2e1e", fontSize: "10px", marginTop: "32px", letterSpacing: "0.1em" }}>
          DEFAULT PIN: {DEFAULT_PIN}
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}

// ─── History Log (Player) ────────────────────────────────────────────────────

function HistoryLog({ history, headlines }) {
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
        color: tab === id ? GREEN_MID : "#4a7a4a", fontFamily: MONO, fontSize: "10px",
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
          ? <div style={{ color: "#4a7a4a", fontSize: "11px", padding: "8px 0" }}>NO ARCHIVED HEADLINES</div>
          : pastHeadlines.map((h, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${i === 0 ? GREEN_DARK : "#2a3a2a"}`,
              paddingLeft: "12px", marginBottom: "14px", opacity: i === 0 ? 0.85 : 0.5 }}>
              <div style={{ color: GREEN_DIM, fontSize: "12px", letterSpacing: "0.05em" }}>{h.headline}</div>
              {h.subtext && <div style={{ color: "#4a7a4a", fontSize: "10px", marginTop: "2px" }}>{h.subtext}</div>}
              <div style={{ color: "#2a4a2a", fontSize: "10px", marginTop: "3px" }}>
                <FictionDate date={h.date || h._cycle} />
              </div>
            </div>
          ))
      )}

      {tab === "market" && (
        history.length === 0
          ? <div style={{ color: "#4a7a4a", fontSize: "11px", padding: "8px 0" }}>NO MARKET HISTORY</div>
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

// ─── Headline Feed Manager (Warden) ──────────────────────────────────────────

function HeadlineFeedManager({ headlines, setHeadlines, date }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editHL, setEditHL] = useState("");
  const [editSub, setEditSub] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editCycle, setEditCycle] = useState("");

  const startEdit = (i) => {
    const h = headlines[i];
    setEditingIdx(i);
    setEditHL(h.headline);
    setEditSub(h.subtext || "");
    setEditYear(String(h.date?.year ?? date.year));
    setEditCycle(String(h.date?.cycle ?? date.cycle));
  };

  const saveEdit = () => {
    const next = headlines.map((h, i) => i !== editingIdx ? h : {
      ...h,
      headline: editHL.toUpperCase().trim(),
      subtext: editSub.trim(),
      date: { year: parseInt(editYear,10) || h.date?.year, cycle: parseInt(editCycle,10) || h.date?.cycle },
    });
    setHeadlines(next);
    safeSet(KEYS.headlines, next);
    setEditingIdx(null);
  };

  const removeHL = (i) => {
    const next = headlines.filter((_, j) => j !== i);
    setHeadlines(next);
    safeSet(KEYS.headlines, next);
    if (editingIdx === i) setEditingIdx(null);
  };

  const inputS = { background: "transparent", border: `1px solid #1a2a3a`, color: "#ccddff",
    fontFamily: MONO, fontSize: "11px", padding: "5px 8px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ marginTop: "24px", borderTop: `1px solid #1a2a3a`, paddingTop: "16px" }}>
      <div style={{ color: "#6688aa", fontSize: "10px", letterSpacing: "0.2em", marginBottom: "10px" }}>
        PLAYER FEED — {headlines.length} HEADLINE{headlines.length !== 1 ? "S" : ""}
      </div>
      {headlines.map((h, i) => (
        <div key={h.id || i} style={{ borderBottom: `1px solid rgba(26,42,58,0.4)`, padding: "8px 0" }}>
          {editingIdx === i ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <input value={editHL} onChange={(e) => setEditHL(e.target.value)}
                style={{ ...inputS, width: "100%" }} placeholder="HEADLINE TEXT" />
              <input value={editSub} onChange={(e) => setEditSub(e.target.value)}
                style={{ ...inputS, width: "100%" }} placeholder="subtext (optional)" />
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "#6688aa", fontSize: "10px" }}>YEAR</span>
                <input value={editYear} onChange={(e) => setEditYear(e.target.value)}
                  style={{ ...inputS, width: "70px" }} inputMode="numeric" />
                <span style={{ color: "#6688aa", fontSize: "10px" }}>CYC</span>
                <input value={editCycle} onChange={(e) => setEditCycle(e.target.value)}
                  style={{ ...inputS, width: "50px" }} inputMode="numeric" />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={saveEdit}
                  style={{ background: "none", border: `1px solid #4488ff`, color: "#88bbff",
                    fontFamily: MONO, fontSize: "10px", padding: "3px 12px", cursor: "pointer" }}>
                  SAVE
                </button>
                <button onClick={() => setEditingIdx(null)}
                  style={{ background: "none", border: `1px solid #1a2a3a`, color: "#6688aa",
                    fontFamily: MONO, fontSize: "10px", padding: "3px 10px", cursor: "pointer" }}>
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#7799bb", fontSize: "11px" }}>{h.headline}</div>
                {h.subtext && <div style={{ color: "#556677", fontSize: "10px", marginTop: "2px" }}>{h.subtext}</div>}
                {h.date && <div style={{ color: "#334455", fontSize: "9px", marginTop: "3px", letterSpacing: "0.1em" }}>
                  YEAR {h.date.year} · CYC {String(h.date.cycle).padStart(2,"0")}
                </div>}
              </div>
              <button onClick={() => startEdit(i)}
                style={{ background: "none", border: `1px solid #1a3a1a`, color: "#4a7a4a",
                  fontFamily: MONO, fontSize: "10px", padding: "2px 7px", cursor: "pointer", flexShrink: 0 }}>
                EDIT
              </button>
              <button onClick={() => removeHL(i)}
                style={{ background: "none", border: `1px solid #3a2a2a`, color: "#664444",
                  fontFamily: MONO, fontSize: "10px", padding: "2px 7px", cursor: "pointer", flexShrink: 0 }}>
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Warden View ──────────────────────────────────────────────────────────────

function WardenView({ stocks, setStocks, headlines, setHeadlines, history, setHistory, date, setDate,
  storedPin, setStoredPin, mergers, setMergers, alwaysMerge, setAlwaysMerge, onLogout }) {

  const [panel, setPanel] = useState(null); // "headline" | "advance" | "bankruptcy" | "mergers" | "settings"
  const [pendingAdvance, setPendingAdvance] = useState(null);
  const [pendingBankruptcy, setPendingBankruptcy] = useState(null);

  const [headlineText, setHeadlineText] = useState("");
  const [headlineSubtext, setHeadlineSubtext] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [lastPublished, setLastPublished] = useState(null);

  const saveAll = useCallback(async (s, h, hist, d, m) => {
    await safeSet(KEYS.stocks, s);
    await safeSet(KEYS.headlines, h);
    await safeSet(KEYS.history, hist);
    await safeSet(KEYS.date, d);
    if (m !== undefined) await safeSet(KEYS.mergers, m);
  }, []);

  const pushHeadline = (h) => {
    const entry = { headline: h.headline, subtext: h.subtext || "", date: { ...date }, id: Date.now() };
    const next = [entry, ...headlines];
    setHeadlines(next);
    safeSet(KEYS.headlines, next);
    setLastPublished(entry.headline);
    clearTimeout(window._lpTimer);
    window._lpTimer = setTimeout(() => setLastPublished(null), 3500);
  };

  const handlePublishHeadline = () => {
    if (!headlineText.trim()) return;
    pushHeadline({ headline: headlineText.toUpperCase().trim(), subtext: headlineSubtext.trim() });
    setHeadlineText("");
    setHeadlineSubtext("");
  };

  const handleAdvanceRoll = () => {
    const advanceResult = computeAdvance(stocks);
    const bankruptcyResult = computeBankruptcyCheck(advanceResult, mergers, alwaysMerge);
    setPendingAdvance({ advance: advanceResult, bankruptcy: bankruptcyResult });
    setPanel("advance");
  };

  const handleAdvanceConfirm = () => {
    const { advance, bankruptcy } = pendingAdvance;
    // Finalize companies that were already in their halved delisting cycle
    let working = advance.map((s) => {
      const { healthRoll, volRoll, priceRoll, coinFlip, healthShift, volShift, ...clean } = s;
      if (clean.is_delisting) return { ...clean, is_collapsed: true, is_delisting: false, price: 1, change: 1 - clean.price };
      return clean;
    });
    // Determine which collapses trigger mergers vs normal delist
    const collapsingWithMerger = bankruptcy.filter((b) => b.collapses && b.triggersMerger);
    const collapsingNormal = bankruptcy.filter((b) => b.collapses && !b.triggersMerger);
    // Apply mergers for early-trigger collapses
    let updatedMergers = [...mergers];
    let autoHeadlines = [];
    const mergerNames = new Set(collapsingWithMerger.map((b) => b.triggersMerger));
    for (const mName of mergerNames) {
      const merger = mergers.find((m) => m.name === mName);
      if (merger) {
        working = applyMerger(working, merger);
        updatedMergers = updatedMergers.map((m) => m.name === mName ? { ...m, triggered: true } : m);
        if (MERGER_HEADLINES[mName]) autoHeadlines.push({ ...MERGER_HEADLINES[mName], date: { ...date }, id: Date.now() + autoHeadlines.length });
      }
    }
    // Auto-push OmniCorp acquisition headlines for normal collapses
    collapsingNormal.forEach((b, idx) => {
      const match = OMNICORP_HEADLINES.find((h) => h.company === b.name);
      if (match) autoHeadlines.push({ ...match, date: { ...date }, id: Date.now() + autoHeadlines.length + idx + 100 });
    });
    // Normal collapses: halve price, mark is_delisting
    const omniGain = collapsingNormal.reduce((sum, b) => sum + b.price, 0);
    working = working.map((s) => {
      const b = collapsingNormal.find((b) => b.name === s.name);
      if (b) {
        const halved = Math.max(1, Math.floor(s.price / 2));
        return { ...s, is_delisting: true, price: halved, change: halved - s.price };
      }
      return s;
    }).map((s) => {
      if (s.is_omnicorp && omniGain > 0) return { ...s, price: s.price + omniGain, change: omniGain };
      return s;
    });
    const sorted = sortByPrice(working);
    const newDate = { ...date, cycle: date.cycle + 1 };
    const histEntry = { date: { ...date }, stocks: stocks.map(({ healthRoll, volRoll, priceRoll, coinFlip, healthShift, volShift, ...rest }) => rest), headlines: headlines.slice(0, 5) };
    const newHistory = [...history, histEntry];
    const newHeadlines = autoHeadlines.length > 0 ? [...autoHeadlines, ...headlines] : headlines;
    if (autoHeadlines.length > 0) autoHeadlines.forEach((h) => { setLastPublished(h.headline); clearTimeout(window._lpTimer); window._lpTimer = setTimeout(() => setLastPublished(null), 3500); });
    setStocks(sorted);
    setMergers(updatedMergers);
    setDate(newDate);
    setHistory(newHistory);
    setHeadlines(newHeadlines);
    saveAll(sorted, newHeadlines, newHistory, newDate, updatedMergers);
    setPendingAdvance(null);
    setPanel(null);
  };

  const handleSavePin = () => {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) { setPinMsg("PIN must be exactly 6 digits."); return; }
    if (newPin !== confirmPin) { setPinMsg("PINs do not match."); return; }
    setStoredPin(newPin);
    safeSet(KEYS.pin, newPin);
    setPinMsg("PIN updated.");
    setNewPin(""); setConfirmPin("");
  };

  const handleDateInput = (field, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    setDate((d) => {
      const next = { ...d, [field]: Math.max(1, n) };
      safeSet(KEYS.date, next);
      return next;
    });
  };

  const shiftLabel = (d) => d > 0 ? `▲ ${d}` : d < 0 ? `▼ ${Math.abs(d)}` : "—";

  return (
    <div style={{ minHeight: "100vh", background: "#06080a", fontFamily: MONO, padding: "32px 20px",
      position: "relative", overflow: "hidden" }}>
      <Scanlines />
      <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Warden Header */}
        <div style={{ borderBottom: `1px solid #1a2a3a`, paddingBottom: "16px", marginBottom: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ color: "#aaccee", fontSize: "11px", letterSpacing: "0.3em", marginBottom: "4px", opacity: 0.5 }}>
              SECTOR FINANCIAL NETWORK — RESTRICTED
            </div>
            <div style={{ color: "#ccddff", fontSize: "20px", letterSpacing: "0.15em", fontWeight: "bold" }}>
              WARDEN TERMINAL
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <FictionDate date={date} />
          </div>
        </div>
        {/* Toolbar — scrollable on mobile */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px",
          overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {["headline","advance","bankruptcy","mergers","settings"].map((p) => (
            <button key={p} onClick={() => setPanel(panel === p ? null : p)}
              style={{ background: panel === p ? "rgba(68,136,255,0.1)" : "none",
                border: `1px solid ${panel === p ? "#4488ff" : "#1a2a3a"}`,
                color: panel === p ? "#88bbff" : "#6688aa", fontFamily: MONO,
                fontSize: "11px", letterSpacing: "0.1em", padding: "7px 12px",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {p === "headline" ? "HEADLINE" : p === "advance" ? "ADVANCE" : p === "bankruptcy" ? "BANKRUPT" : p === "mergers" ? "MERGERS" : "SETTINGS"}
            </button>
          ))}
          <button onClick={onLogout}
            style={{ background: "none", border: "none", color: "#6688aa", fontFamily: MONO,
              fontSize: "11px", letterSpacing: "0.1em", padding: "7px 8px", cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0, marginLeft: "auto" }}>
            ← EXIT
          </button>
        </div>

        {/* Panel: Publish Headline */}
        {panel === "headline" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid #1a2a3a`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: "#aaccee", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>
              PUBLISH HEADLINE
            </div>
            <input value={headlineText} onChange={(e) => setHeadlineText(e.target.value)}
              placeholder="HEADLINE TEXT (auto-uppercased)"
              style={{ width: "100%", background: "transparent", border: `1px solid #1a2a3a`,
                color: "#ccddff", fontFamily: MONO, fontSize: "12px", padding: "8px 10px",
                marginBottom: "8px", outline: "none", boxSizing: "border-box" }} />
            <input value={headlineSubtext} onChange={(e) => setHeadlineSubtext(e.target.value)}
              placeholder="subtext (optional, lowercase)"
              style={{ width: "100%", background: "transparent", border: `1px solid #1a2a3a`,
                color: "#8899aa", fontFamily: MONO, fontSize: "11px", padding: "8px 10px",
                marginBottom: "16px", outline: "none", boxSizing: "border-box" }} />
            <div style={{ color: "#6688aa", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "10px" }}>
              OMNICORP ACQUISITION TRIGGERS:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              {OMNICORP_HEADLINES.filter((h) => {
                const protectedBy = MERGER_PROTECTED[h.company];
                if (!protectedBy) return true; // not a merger partner, always show
                const merger = mergers.find((m) => m.name === protectedBy);
                if (!merger) return true; // merger doesn't exist, show
                // Hide if merger is still pending (both partners alive)
                return getMergerStatus(merger, stocks) !== "pending";
              }).map((h) => (
                <button key={h.company} onClick={() => pushHeadline(h)}
                  style={{ background: "rgba(80,60,0,0.2)", border: `1px solid rgba(255,200,0,0.15)`,
                    color: AMBER, fontFamily: MONO, fontSize: "10px", padding: "4px 8px",
                    cursor: "pointer", letterSpacing: "0.08em" }}>
                  {h.company.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <button onClick={handlePublishHeadline}
                style={{ background: "none", border: `1px solid #4488ff`, color: "#88bbff",
                  fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                PUBLISH TO PLAYER FEED
              </button>
              {lastPublished && (
                <div style={{ color: GREEN, fontSize: "11px", letterSpacing: "0.08em",
                  animation: "fadeIn 0.2s ease" }}>
                  ✓ PUBLISHED: {lastPublished.length > 48 ? lastPublished.slice(0, 48) + "…" : lastPublished}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel: Advance Scenario */}
        {panel === "advance" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid #1a2a3a`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: "#aaccee", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>
              ADVANCE TO NEXT SCENARIO
            </div>
            {!pendingAdvance ? (
              <button onClick={handleAdvanceRoll}
                style={{ background: "none", border: `1px solid #4488ff`, color: "#88bbff",
                  fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                ROLL ECONOMY
              </button>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", color: "#8899aa" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid #1a2a3a` }}>
                        {["COMPANY","HEALTH","H.ROLL","H.SHIFT","VOL","V.ROLL","V.SHIFT","DIE ROLL","COIN","Δ PRICE","NEW PRICE"].map((h) => (
                          <th key={h} style={{ padding: "6px 8px", textAlign: "left", letterSpacing: "0.08em", color: "#6688aa", fontWeight: "normal" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAdvance.advance.filter((s) => !s.is_collapsed).map((s) => (
                        <tr key={s.name} style={{ borderBottom: `1px solid rgba(26,42,58,0.4)` }}>
                          <td style={{ padding: "6px 8px", color: s.is_omnicorp ? AMBER : "#aabbcc", fontSize: "10px", textTransform: "uppercase" }}>{s.name.split(" ")[0]}</td>
                          <td style={{ padding: "6px 8px", color: healthColor(s.health) }}>{s.health}</td>
                          <td style={{ padding: "6px 8px", color: "#ccc" }}>{s.healthRoll}</td>
                          <td style={{ padding: "6px 8px", color: s.healthShift > 0 ? GREEN : s.healthShift < 0 ? RED : "#555" }}>{shiftLabel(s.healthShift)}</td>
                          <td style={{ padding: "6px 8px", color: volColor(s.volatility) }}>{s.volatility}</td>
                          <td style={{ padding: "6px 8px", color: "#ccc" }}>{s.volRoll}</td>
                          <td style={{ padding: "6px 8px", color: s.volShift > 0 ? GREEN : s.volShift < 0 ? RED : "#555" }}>{shiftLabel(s.volShift)}</td>
                          <td style={{ padding: "6px 8px", color: "#ccc" }}>{s.priceRoll}</td>
                          <td style={{ padding: "6px 8px", color: s.coinFlip === "up" ? GREEN : s.coinFlip === "down" ? RED : "#333" }}>{s.coinFlip ?? "—"}</td>
                          <td style={{ padding: "6px 8px", color: s.change > 0 ? GREEN : s.change < 0 ? RED : "#555", fontWeight: "bold" }}>{s.change > 0 ? "+" : ""}{s.change}</td>
                          <td style={{ padding: "6px 8px", color: s.is_omnicorp ? AMBER : HEADER_GREEN, fontWeight: "bold" }}>{s.price.toLocaleString()}cr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pendingAdvance.bankruptcy.some((s) => s.bankruptRoll !== null && s.bankruptRoll !== undefined) && (
                  <div style={{ borderTop: `1px solid #2a1a1a`, marginTop: "20px", paddingTop: "16px" }}>
                    <div style={{ color: "#cc5555", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "10px" }}>
                      BANKRUPTCY CHECK
                    </div>
                    {pendingAdvance.bankruptcy.filter((s) => s.bankruptRoll !== null && s.bankruptRoll !== undefined).map((s) => (
                      <div key={s.name} style={{ display: "flex", gap: "16px", alignItems: "center",
                        padding: "5px 0", borderBottom: `1px solid rgba(26,42,58,0.4)` }}>
                        <span style={{ flex: 1, color: "#aabbcc", fontSize: "11px", textTransform: "uppercase" }}>{s.name}</span>
                        <span style={{ color: healthColor(s.health), fontSize: "11px" }}>{s.health}</span>
                        <span style={{ color: "#ccc", fontSize: "11px" }}>rolled {s.bankruptRoll}</span>
                        <span style={{ color: s.collapses ? (s.triggersMerger ? AMBER : RED) : GREEN, fontSize: "11px", fontWeight: "bold" }}>
                          {s.collapses ? (s.triggersMerger ? `⚡ MERGER: ${s.triggersMerger}` : "⚠ COLLAPSE") : "SURVIVES"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                  <button onClick={handleAdvanceConfirm}
                    style={{ background: "none", border: `1px solid #44ff88`, color: GREEN,
                      fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                    CONFIRM & PUBLISH
                  </button>
                  <button onClick={() => { setPendingAdvance(null); setPanel(null); }}
                    style={{ background: "none", border: `1px solid #3a3a3a`, color: "#666",
                      fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                    CANCEL
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Panel: Bankruptcy Check */}
        {panel === "bankruptcy" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid #1a2a3a`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: "#aaccee", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "8px" }}>
              BANKRUPTCY CHECK
            </div>
            <div style={{ color: "#6688aa", fontSize: "11px", marginBottom: "16px" }}>
              Rolls d10 for all companies at Bankrupt health. 7–10 = collapse. Collapsing companies are halved this cycle and delisted next.
            </div>
            {!pendingBankruptcy ? (
              <button onClick={() => { setPendingBankruptcy(computeBankruptcyCheck(stocks, mergers, alwaysMerge)); }}
                style={{ background: "none", border: `1px solid ${RED}`, color: RED,
                  fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                ROLL BANKRUPTCY CHECKS
              </button>
            ) : (
              <>
                {pendingBankruptcy.filter((s) => s.bankruptRoll !== null && s.bankruptRoll !== undefined).map((s) => (
                  <div key={s.name} style={{ display: "flex", gap: "16px", alignItems: "center",
                    padding: "6px 0", borderBottom: `1px solid #1a2a3a` }}>
                    <span style={{ flex: 1, color: "#aabbcc", fontSize: "11px", textTransform: "uppercase" }}>{s.name}</span>
                    <span style={{ color: healthColor(s.health), fontSize: "11px" }}>{s.health}</span>
                    <span style={{ color: "#ccc", fontSize: "11px" }}>rolled {s.bankruptRoll}</span>
                    <span style={{ color: s.collapses ? (s.triggersMerger ? AMBER : RED) : GREEN, fontSize: "11px", fontWeight: "bold" }}>
                      {s.collapses ? (s.triggersMerger ? `⚡ MERGER: ${s.triggersMerger}` : "⚠ COLLAPSE") : "SURVIVES"}
                    </span>
                  </div>
                ))}
                {pendingBankruptcy.filter((s) => s.bankruptRoll !== null).length === 0 && (
                  <div style={{ color: GREEN, fontSize: "11px", marginTop: "4px" }}>No companies at Bankrupt health.</div>
                )}
                {pendingBankruptcy.filter((s) => s.bankruptRoll !== null).length > 0 && pendingBankruptcy.every((s) => !s.collapses) && (
                  <div style={{ color: GREEN, fontSize: "11px", marginTop: "10px" }}>No collapses this check.</div>
                )}
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button onClick={() => {
                    const collapsingWithMerger = pendingBankruptcy.filter((b) => b.collapses && b.triggersMerger);
                    const collapsingNormal = pendingBankruptcy.filter((b) => b.collapses && !b.triggersMerger);
                    let working = [...stocks];
                    let updatedMergers = [...mergers];
                    const mergerNames = new Set(collapsingWithMerger.map((b) => b.triggersMerger));
                    for (const mName of mergerNames) {
                      const merger = mergers.find((m) => m.name === mName);
                      if (merger) {
                        working = applyMerger(working, merger);
                        updatedMergers = updatedMergers.map((m) => m.name === mName ? { ...m, triggered: true } : m);
                      }
                    }
                    const omniGain = collapsingNormal.reduce((sum, b) => sum + b.price, 0);
                    working = working.map((s) => {
                      const b = collapsingNormal.find((b) => b.name === s.name);
                      if (b) {
                        const halved = Math.max(1, Math.floor(s.price / 2));
                        return { ...s, is_delisting: true, price: halved, change: halved - s.price };
                      }
                      return s;
                    }).map((s) => {
                      if (s.is_omnicorp && omniGain > 0) return { ...s, price: s.price + omniGain, change: omniGain };
                      return s;
                    });
                    const sorted = sortByPrice(working);
                    setStocks(sorted);
                    setMergers(updatedMergers);
                    safeSet(KEYS.stocks, sorted);
                    safeSet(KEYS.mergers, updatedMergers);
                    setPendingBankruptcy(null);
                    setPanel(null);
                  }}
                    style={{ background: "none", border: `1px solid ${RED}`, color: RED,
                      fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                    {pendingBankruptcy.some((s) => s.collapses) ? "CONFIRM COLLAPSES" : "DONE"}
                  </button>
                  <button onClick={() => { setPendingBankruptcy(null); setPanel(null); }}
                    style={{ background: "none", border: `1px solid #3a3a3a`, color: "#666",
                      fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                    CANCEL
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Panel: Mergers */}
        {panel === "mergers" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid #1a2a3a`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: "#aaccee", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>MERGERS</div>
            {mergers.map((m) => {
              const status = getMergerStatus(m, stocks);
              const p1 = stocks.find((s) => s.name === m.partner1);
              const p2 = stocks.find((s) => s.name === m.partner2);
              const combinedPrice = (p1?.price ?? 0) + (p2?.price ?? 0);
              const statusColor = status === "triggered" ? GREEN : status === "unavailable" ? "#6688aa" : AMBER;
              return (
                <div key={m.name} style={{ borderBottom: `1px solid #1a2a3a`, paddingBottom: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <span style={{ color: AMBER, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.name}</span>
                    <span style={{ color: statusColor, fontSize: "10px", letterSpacing: "0.15em" }}>{status.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "24px", fontSize: "11px", color: "#7799bb", marginBottom: "10px" }}>
                    <span>{m.partner1}: <span style={{ color: p1 && !p1.is_collapsed ? HEADER_GREEN : "#444" }}>{p1 ? `${p1.price.toLocaleString()}cr` : "GONE"}</span></span>
                    <span>+</span>
                    <span>{m.partner2}: <span style={{ color: p2 && !p2.is_collapsed ? HEADER_GREEN : "#444" }}>{p2 ? `${p2.price.toLocaleString()}cr` : "GONE"}</span></span>
                    {status === "pending" && <span style={{ color: AMBER }}>= {combinedPrice.toLocaleString()}cr combined</span>}
                  </div>
                  {status === "pending" && (
                    <button onClick={() => setConfirmDialog({
                      msg: `TRIGGER MERGER: ${m.name}?`,
                      submsg: `Both partner companies will be replaced by ${m.name} at ${combinedPrice.toLocaleString()}cr, Health OK, Volatility Medium.`,
                      onConfirm: () => {
                        const merged = sortByPrice(applyMerger(stocks, m));
                        const updatedMergers = mergers.map((x) => x.name === m.name ? { ...x, triggered: true } : x);
                        const mergerHL = MERGER_HEADLINES[m.name];
                        const newHeadlines = mergerHL ? [{ ...mergerHL, date: { ...date }, id: Date.now() }, ...headlines] : headlines;
                        setStocks(merged);
                        setMergers(updatedMergers);
                        setHeadlines(newHeadlines);
                        safeSet(KEYS.stocks, merged);
                        safeSet(KEYS.mergers, updatedMergers);
                        safeSet(KEYS.headlines, newHeadlines);
                        if (mergerHL) { setLastPublished(mergerHL.headline); clearTimeout(window._lpTimer); window._lpTimer = setTimeout(() => setLastPublished(null), 3500); }
                        setConfirmDialog(null);
                        setPanel(null);
                      }
                    })}
                      style={{ background: "none", border: `1px solid ${AMBER}`, color: AMBER,
                        fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em", padding: "5px 14px", cursor: "pointer" }}>
                      TRIGGER MERGER
                    </button>
                  )}
                  {status === "triggered" && <span style={{ color: "#6688aa", fontSize: "10px" }}>Completed — {m.name} is now active on the ticker.</span>}
                  {status === "unavailable" && <span style={{ color: "#6688aa", fontSize: "10px" }}>One or both partners are no longer active.</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Panel: Settings */}
        {panel === "settings" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid #1a2a3a`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: "#aaccee", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>SETTINGS</div>
            <div style={{ color: "#6688aa", fontSize: "11px", marginBottom: "12px" }}>FICTIONAL DATE</div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
              {["year","cycle"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#6688aa", fontSize: "10px", letterSpacing: "0.1em" }}>{f.toUpperCase()}</span>
                  <input
                    value={date[f]}
                    onChange={(e) => handleDateInput(f, e.target.value)}
                    style={{ ...inputStyle, width: f === "year" ? "70px" : "50px", textAlign: "center" }}
                  />
                </div>
              ))}
              <span style={{ color: "#2a4a6a", fontSize: "10px", letterSpacing: "0.1em" }}>
                (cycle auto-increments on each economy roll)
              </span>
            </div>
            <div style={{ color: "#6688aa", fontSize: "11px", marginBottom: "12px" }}>MERGER SETTINGS</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <button onClick={() => { const next = !alwaysMerge; setAlwaysMerge(next); safeSet(KEYS.settings, { alwaysMerge: next }); }}
                style={{ background: alwaysMerge ? "rgba(255,220,100,0.1)" : "none",
                  border: `1px solid ${alwaysMerge ? AMBER : "#1a2a3a"}`,
                  color: alwaysMerge ? AMBER : "#6688aa",
                  fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em",
                  padding: "5px 12px", cursor: "pointer" }}>
                {alwaysMerge ? "ON" : "OFF"}
              </button>
              <span style={{ color: "#6688aa", fontSize: "11px" }}>
                Always merge on partner collapse {alwaysMerge ? "(early trigger active)" : "(early trigger disabled — collapses are normal delists)"}
              </span>
            </div>
            <div style={{ color: "#6688aa", fontSize: "11px", marginBottom: "12px" }}>CHANGE WARDEN PIN</div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <input value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="new 6-digit PIN" maxLength={6}
                style={{ ...inputStyle, width: "140px" }} />
              <input value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="confirm PIN" maxLength={6}
                style={{ ...inputStyle, width: "140px" }} />
              <button onClick={handleSavePin} style={{ ...actionBtn }}>SAVE PIN</button>
            </div>
            {pinMsg && <div style={{ color: pinMsg.includes("updated") ? GREEN : RED, fontSize: "11px", marginTop: "8px" }}>{pinMsg}</div>}
            <div style={{ borderTop: `1px solid #1a2a3a`, marginTop: "24px", paddingTop: "20px" }}>
              <div style={{ color: "#664444", fontSize: "11px", marginBottom: "12px", letterSpacing: "0.15em" }}>DANGER ZONE</div>
              <button onClick={() => setConfirmDialog({
                  msg: "RESET ALL DATA TO DEFAULTS?",
                  submsg: "This will erase all stock prices, headlines, history, and the warden PIN. This cannot be undone.",
                  danger: true,
                  onConfirm: async () => {
                    const defaultDate = { year: 2122, cycle: 1 };
                    setConfirmDialog(null);
                    setPanel(null);
                    setStocks(INITIAL_STOCKS);
                    setHeadlines([]);
                    setHistory([]);
                    setDate(defaultDate);
                    setStoredPin(DEFAULT_PIN);
                    setMergers(INITIAL_MERGERS);
                    setAlwaysMerge(true);
                    await safeSet(KEYS.stocks, INITIAL_STOCKS);
                    await safeSet(KEYS.headlines, []);
                    await safeSet(KEYS.history, []);
                    await safeSet(KEYS.date, defaultDate);
                    await safeSet(KEYS.pin, DEFAULT_PIN);
                    await safeSet(KEYS.mergers, INITIAL_MERGERS);
                    await safeSet(KEYS.settings, { alwaysMerge: true });
                  }
                })}
                style={{ background: "none", border: `1px solid #663333`, color: "#aa4444",
                  fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                RESET TO DEFAULTS
              </button>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        {confirmDialog && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#060a10", border: `1px solid ${confirmDialog.danger ? "#663333" : "#1a2a3a"}`,
              padding: "32px 40px", fontFamily: MONO, textAlign: "center", maxWidth: "400px" }}>
              <div style={{ color: confirmDialog.danger ? "#cc5555" : "#aabbcc",
                fontSize: "13px", letterSpacing: "0.1em", marginBottom: "12px" }}>{confirmDialog.msg}</div>
              {confirmDialog.submsg && (
                <div style={{ color: "#556677", fontSize: "11px", marginBottom: "24px", lineHeight: 1.7 }}>
                  {confirmDialog.submsg}
                </div>
              )}
              <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                <button onClick={confirmDialog.onConfirm}
                  style={{ background: "none", border: `1px solid ${confirmDialog.danger ? "#883333" : "#4488ff"}`,
                    color: confirmDialog.danger ? "#cc5555" : "#88bbff",
                    fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                  {confirmDialog.danger ? "YES, RESET EVERYTHING" : "CONFIRM"}
                </button>
                <button onClick={() => setConfirmDialog(null)}
                  style={{ background: "none", border: `1px solid #3a3a3a`, color: "#666",
                    fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 16px", cursor: "pointer" }}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Stock Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid #1a2a3a` }}>
                {["COMPANY","INDUSTRY","PRICE","Δ","BUMP","VOLATILITY","HEALTH"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#6688aa",
                    fontSize: "10px", letterSpacing: "0.12em", fontWeight: "normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => {
                const adjustStock = (patch) => {
                  const next = stocks.map((x) => x.name === s.name ? { ...x, ...patch } : x);
                  setStocks(next);
                  safeSet(KEYS.stocks, next);
                };
                const adjustPrice = (delta) => {
                  const newPrice = Math.max(1, s.price + delta);
                  adjustStock({ price: newPrice, change: newPrice - s.price });
                };
                const adjustHealth = (delta) => adjustStock({ health: shiftIndex(HEALTH_STEPS, s.health, delta) });
                const handleBumpHealth = () => adjustStock(bumpHealth(s));
                const adjustVol = (delta) => adjustStock({ volatility: shiftIndex(VOLATILITY_STEPS, s.volatility, delta) });
                const adjBtn = (label, onClick, disabled) => (
                  <button onClick={onClick} disabled={disabled}
                    style={{ background: "none", border: `1px solid ${disabled ? "#1a2030" : "#1a2a3a"}`,
                      color: disabled ? "#222" : "#6688aa", fontFamily: MONO, fontSize: "11px",
                      width: "20px", height: "20px", padding: 0, cursor: disabled ? "default" : "pointer",
                      lineHeight: "18px", textAlign: "center" }}>
                    {label}
                  </button>
                );
                return (
                  <tr key={s.name} style={{ borderBottom: `1px solid rgba(26,42,58,0.3)`,
                    background: s.is_omnicorp ? "rgba(80,60,0,0.1)" : "transparent",
                    opacity: s.is_collapsed ? 0.35 : 1 }}>
                    <td style={{ padding: "9px 10px", color: s.is_omnicorp ? AMBER : "#aabbcc",
                      textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.06em" }}>
                      {s.name}{s.is_collapsed && <span style={{ color: "#333", marginLeft: "6px" }}>DELISTED</span>}
                    </td>
                    <td style={{ padding: "9px 10px", color: "#6688aa", fontSize: "10px" }}>{s.industry}</td>
                    <td style={{ padding: "9px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <input
                          type="number"
                          defaultValue={s.price}
                          key={s.price}
                          disabled={s.is_collapsed}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val !== s.price) adjustPrice(val - s.price);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                          style={{ width: "80px", background: "transparent",
                            border: `1px solid #1a2a3a`, color: s.is_omnicorp ? AMBER : HEADER_GREEN,
                            fontFamily: MONO, fontSize: "12px", fontWeight: "bold",
                            padding: "3px 6px", outline: "none", textAlign: "right",
                            opacity: s.is_collapsed ? 0.3 : 1 }}
                        />
                        <span style={{ color: "#6688aa", fontSize: "10px" }}>cr</span>
                      </div>
                    </td>
                    <td style={{ padding: "9px 10px", color: s.change > 0 ? GREEN : s.change < 0 ? RED : "#555", fontSize: "11px" }}>
                      {s.change > 0 ? "+" : ""}{s.change}
                    </td>
                    <td style={{ padding: "4px 10px" }}>
                      {!s.is_collapsed && !s.is_omnicorp && (
                        <button onClick={() => handleBumpHealth()}
                          disabled={["OK","Good"].includes(s.health)}
                          style={{ background: "none", border: `1px solid ${["OK","Good"].includes(s.health) ? "#1a2a1a" : "#1a3a2a"}`,
                            color: ["OK","Good"].includes(s.health) ? "#1a3a1a" : "#4a8a5a",
                            fontFamily: MONO, fontSize: "10px", padding: "3px 8px",
                            cursor: ["OK","Good"].includes(s.health) ? "default" : "pointer",
                            letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          ▲ BUMP
                        </button>
                      )}
                    </td>
                    <td style={{ padding: "9px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {adjBtn("−", () => adjustVol(-1), s.volatility === VOLATILITY_STEPS[0] || s.is_collapsed)}
                        <span style={{ color: volColor(s.volatility), fontSize: "11px", minWidth: "56px", textAlign: "center" }}>
                          {s.volatility}
                        </span>
                        {adjBtn("+", () => adjustVol(1), s.is_omnicorp ? s.volatility === VOLATILITY_STEPS[VOLATILITY_STEPS.length - 1] : s.volatility === VOLATILITY_STEPS[VOLATILITY_STEPS.length - 1] || s.is_collapsed)}
                      </div>
                    </td>
                    <td style={{ padding: "9px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {adjBtn("−", () => adjustHealth(-1), s.is_omnicorp || s.health === HEALTH_STEPS[0] || s.is_collapsed)}
                        <span style={{ color: healthColor(s.health), fontSize: "11px", minWidth: "56px", textAlign: "center" }}>
                          {s.health}
                        </span>
                        {adjBtn("+", () => adjustHealth(1), s.health === HEALTH_STEPS[HEALTH_STEPS.length - 1] || s.is_collapsed)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Headlines Feed Manager */}
        {headlines.length > 0 && (
          <HeadlineFeedManager headlines={headlines} setHeadlines={setHeadlines} date={date} />
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}

const btnSmall = {
  background: "none", border: `1px solid #1a2a3a`, color: "#6688aa",
  fontFamily: MONO, fontSize: "12px", width: "24px", height: "24px", cursor: "pointer", padding: 0
};
const inputStyle = {
  background: "transparent", border: `1px solid #1a2a3a`, color: "#ccddff",
  fontFamily: MONO, fontSize: "11px", padding: "6px 10px", outline: "none"
};
const actionBtn = {
  background: "none", border: `1px solid #4488ff`, color: "#88bbff",
  fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 16px", cursor: "pointer"
};

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function CorpoRotApp({ roomCode = "stonks" }) {
  const KEYS = makeKeys(roomCode);
  const [view, setView] = useState("player"); // "player" | "pin" | "warden"
  const [stocks, setStocks] = useState(INITIAL_STOCKS);
  const [headlines, setHeadlines] = useState([]);
  const [history, setHistory] = useState([]);
  const [date, setDate] = useState({ year: 2122, cycle: 1 });
  const [storedPin, setStoredPin] = useState(null);
  const [mergers, setMergers] = useState(INITIAL_MERGERS);
  const [alwaysMerge, setAlwaysMerge] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await safeGet(KEYS.stocks, INITIAL_STOCKS);
      const h = await safeGet(KEYS.headlines, []);
      const hist = await safeGet(KEYS.history, []);
      const d = await safeGet(KEYS.date, { year: 2122, cycle: 1 });
      const p = await safeGet(KEYS.pin, DEFAULT_PIN);
      const m = await safeGet(KEYS.mergers, INITIAL_MERGERS);
      const sett = await safeGet(KEYS.settings, { alwaysMerge: true });
      setStocks(s);
      setHeadlines(h);
      setHistory(hist);
      setDate(d);
      setStoredPin(p);
      setMergers(m);
      setAlwaysMerge(sett.alwaysMerge ?? true);
      setLoaded(true);
    })();
  }, []);

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: MONO, color: GREEN_MID, letterSpacing: "0.2em", fontSize: "12px" }}>
        INITIALIZING...
      </div>
    );
  }

  if (view === "pin") {
    return <PinGate storedPin={storedPin} onSuccess={() => setView("warden")} onCancel={() => setView("player")} />;
  }

  if (view === "warden") {
    return (
      <WardenView
        stocks={stocks} setStocks={setStocks}
        headlines={headlines} setHeadlines={setHeadlines}
        history={history} setHistory={setHistory}
        date={date} setDate={setDate}
        storedPin={storedPin} setStoredPin={setStoredPin}
        mergers={mergers} setMergers={setMergers}
        alwaysMerge={alwaysMerge} setAlwaysMerge={setAlwaysMerge}
        onLogout={() => setView("player")}
      />
    );
  }

  return (
    <PlayerView
      stocks={stocks} headlines={headlines}
      history={history} date={date}
      onWardenAccess={() => setView("pin")}
    />
  );
}
