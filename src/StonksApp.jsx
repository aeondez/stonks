import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PIN = "000000";
const HEALTH_STEPS = ["Bankrupt", "Bad", "OK", "Good"];
const VOLATILITY_STEPS = ["Low", "Medium", "High"];
const VOLATILITY_DIE = { High: 20, Medium: 10, Low: 5 };

const INITIAL_STOCKS = [
  { name: "Koo-Ya Interactive",       industry: "Data/News",   price: 1100, change: 0, health: "OK", volatility: "Medium", is_omnicorp: false, is_collapsed: false },
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
  { company: "Koo-Ya Interactive",        headline: "OMNICORP MEDIA DIVISION PULLS KOO-YA INTERACTIVE BROADCAST LICENSE AFTER MERGER", subtext: "Company representatives have no comment at this time, says company representative." },
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

// ─── Roll Config (overridable per room) ───────────────────────────────────────

const DEFAULT_ROLL_CONFIG = {
  shiftDie:   10,  // die used for health and volatility shift rolls
  improveOn:  1,   // roll ≤ this → shift up one step
  worsenOn:   8,   // roll ≥ this → shift down one step
  dieHigh:    20,  // price die for High volatility
  dieMedium:  10,  // price die for Medium volatility
  dieLow:     5,   // price die for Low volatility
  yearLabel:  "Year",
  cycleLabel: "Cycle",
  drawMode: "random",
  bumpOnComplete: false,
  trainingTimeUnit: "months",  // "months" | "years"
  ownershipType: "company",    // "company" | "owner" | "freelancer"
  crewPaymentMode: "all",      // "all" | "per"
};

// ─── Dice & Economy Logic ─────────────────────────────────────────────────────

const roll = (sides) => Math.floor(Math.random() * sides) + 1;

const shiftIndex = (arr, current, delta) => {
  const idx = arr.indexOf(current);
  return arr[Math.max(0, Math.min(arr.length - 1, idx + delta))];
};

const shiftDelta = (r, cfg) => r <= cfg.improveOn ? 1 : r >= cfg.worsenOn ? -1 : 0;

function computeAdvance(stocks, cfg = DEFAULT_ROLL_CONFIG) {
  const priceDice = { High: cfg.dieHigh, Medium: cfg.dieMedium, Low: cfg.dieLow };
  const results = stocks.map((s) => {
    if (s.is_collapsed || s.is_frozen) return { ...s, healthRoll: null, volRoll: null, priceRoll: null, coinFlip: null };

    const healthRoll = roll(cfg.shiftDie);
    const volRoll = roll(cfg.shiftDie);
    const healthDelta = shiftDelta(healthRoll, cfg);
    const volDelta = shiftDelta(volRoll, cfg);

    let newHealth = shiftIndex(HEALTH_STEPS, s.health, healthDelta);
    let newVol = shiftIndex(VOLATILITY_STEPS, s.volatility, volDelta);

    // OmniCorp immunities
    if (s.is_omnicorp) {
      const badOrBelow = ["Bad", "Bankrupt"].includes(newHealth);
      if (badOrBelow) newHealth = "OK";
      if (VOLATILITY_STEPS.indexOf(newVol) < VOLATILITY_STEPS.indexOf(s.volatility)) newVol = s.volatility;
    }

    const die = priceDice[newVol];
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
    if (s.is_collapsed || s.is_omnicorp || s.is_frozen) return { ...s, bankruptRoll: null, collapses: false, triggersMerger: null };
    if (s.health !== "Bankrupt") return { ...s, bankruptRoll: null, collapses: false, triggersMerger: null };
    const bankruptRoll = roll(10);
    const collapses = bankruptRoll >= 7;
    let triggersMerger = null;
    if (collapses && alwaysMerge) {
      const mFound = mergers.find((mr) => !mr.triggered &&
        getMergerStatus(mr, stocks) === "pending" &&
        (mr.partner1 === s.name || mr.partner2 === s.name));
      if (mFound) triggersMerger = mFound.name;
    }
    return { ...s, bankruptRoll, collapses, triggersMerger };
  });
}

function computeVariance(stocks, cfg = DEFAULT_ROLL_CONFIG) {
  const priceDice = { High: cfg.dieHigh, Medium: cfg.dieMedium, Low: cfg.dieLow };
  return stocks.map((s) => {
    if (s.is_collapsed || s.is_frozen) return { ...s, priceRoll: null, coinFlip: null };
    const die = priceDice[s.volatility];
    const priceRoll = roll(die);
    let coinFlip = null;
    let priceDelta = 0;
    if (s.health === "Good") {
      priceDelta = priceRoll;
    } else if (s.health === "OK") {
      coinFlip = roll(2) === 1 ? "up" : "down";
      priceDelta = coinFlip === "up" ? priceRoll : -priceRoll;
    } else if (s.health === "Bad" || s.health === "Bankrupt") {
      priceDelta = -priceRoll;
    }
    if (s.is_omnicorp && priceDelta < 0) priceDelta = 0;
    const newPrice = Math.max(1, s.price + priceDelta);
    return { ...s, price: newPrice, change: newPrice - s.price, priceRoll, coinFlip };
  });
}

function computeHealthOnly(stocks, cfg = DEFAULT_ROLL_CONFIG) {
  return stocks.map((s) => {
    if (s.is_collapsed || s.is_frozen) return { ...s, healthRoll: null, healthShift: 0 };
    const healthRoll = roll(cfg.shiftDie);
    const healthDelta = shiftDelta(healthRoll, cfg);
    let newHealth = shiftIndex(HEALTH_STEPS, s.health, healthDelta);
    if (s.is_omnicorp && ["Bad", "Bankrupt"].includes(newHealth)) newHealth = "OK";
    return { ...s, health: newHealth, healthRoll, healthShift: healthDelta };
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
  jobs:      `${prefix}:jobs`,
  crew:      `${prefix}:crew`,
  debt:      `${prefix}:debt`,
  portfolio: `${prefix}:portfolio`,
  catalogs:  `${prefix}:catalogs`,
});

const safeGet = async (key, fallback) => {
  try {
    const r = await fetch(`/api/store?k=${encodeURIComponent(key)}`);
    if (!r.ok) return fallback;
    const data = await r.json();
    return (data.value !== undefined && data.value !== null) ? data.value : fallback;
  } catch { return fallback; }
};

const safeSet = async (key, value, pin = null) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (pin) headers["x-warden-pin"] = pin;
    await fetch(`/api/store?k=${encodeURIComponent(key)}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ value }),
    });
  } catch {}
};

// ─── Themes ───────────────────────────────────────────────────────────────────

const THEMES = {
  green: {
    label: "GREEN",
    bg: "#060807",
    primary: "#44ff88",
    primaryDim: "#b8ddb8",
    primaryDark: "#4a7a4a",
    primaryMid: "#5a9a5a",
    primaryHeader: "#e8ffe8",
    scanline: "rgba(180,255,180,0.04)",
    accent: "#ffdd77",
  },
  amber: {
    label: "AMBER",
    bg: "#080701",
    primary: "#ffcc44",
    primaryDim: "#ddbb88",
    primaryDark: "#7a6a2a",
    primaryMid: "#9a8a3a",
    primaryHeader: "#fff8e0",
    scanline: "rgba(255,220,100,0.04)",
    accent: "#ff8844",
  },
  blue: {
    label: "BLUE",
    bg: "#060810",
    primary: "#44aaff",
    primaryDim: "#88bbdd",
    primaryDark: GREEN_DARK,
    primaryMid: "#4a7a9a",
    primaryHeader: "#ddeeff",
    scanline: "rgba(100,180,255,0.04)",
    accent: "#ffdd77",
  },
  mono: {
    label: "MONO",
    bg: "#080808",
    primary: "#dddddd",
    primaryDim: "#aaaaaa",
    primaryDark: "#555555",
    primaryMid: "#888888",
    primaryHeader: "#ffffff",
    scanline: "rgba(255,255,255,0.03)",
    accent: "#ffffff",
  },
  hivisibility: {
    label: "HI-VIS",
    bg: "#000000",
    primary: "#00ff00",
    primaryDim: "#ccffcc",
    primaryDark: "#007700",
    primaryMid: "#00aa00",
    primaryHeader: "#ffffff",
    scanline: "rgba(0,255,0,0.02)",
    accent: "#ffff00",
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

var BG = "var(--c-bg, #060807)";
var GREEN = "var(--c-primary, #44ff88)";
var GREEN_DIM = "var(--c-primary-dim, #b8ddb8)";
var GREEN_DARK = "var(--c-primary-dark, #4a7a4a)";
var GREEN_MID = "var(--c-primary-mid, #5a9a5a)";
// Derived shades used for inactive/muted player UI elements
const GREEN_FAINT  = "var(--c-primary-dark, #4a7a4a)";   // same as DARK — borders, inactive text
var GREEN_SUBTLE = "color-mix(in srgb, var(--c-primary-dark, #4a7a4a) 55%, transparent)"; // very dim
var AMBER = "#ffdd77";
var RED = "#ff4455";
var HEADER_GREEN = "var(--c-header, #e8ffe8)";
var MONO = "'Share Tech Mono', 'Courier New', monospace";

var healthColor = (h) => ({
  Good: "var(--c-primary, #44ff88)", OK: "var(--c-primary-dim, #aaffcc)", Bad: "#ff8844", Bankrupt: "#ff4455"
}[h] || "#888");

var volColor = (v) => ({
  High: "#ff8844", Medium: "var(--c-primary-dim, #aaffcc)", Low: "var(--c-primary, #44ff88)"
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
        background: "var(--c-scanline, rgba(180,255,180,0.04))", pointerEvents: "none", zIndex: 11 }} />
    </>
  );
}

function FictionDate({ date, yearLabel = "YEAR", cycleLabel = "CYC" }) {
  return (
    <span style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.15em" }}>
      {yearLabel.toUpperCase()} {date.year} · {cycleLabel.toUpperCase()} {String(date.cycle).padStart(2, "0")}
    </span>
  );
}


// ─── Job Board Components ──────────────────────────────────────────────────────

const HAZARD_LABELS = ["N/A", "x1 — Routine", "x2 — Low-Risk", "x3 — Moderate", "x4 — Dangerous", "x5 — Near-Suicidal"];

function renderJobContent(job) {
  if (job.mode === "freeform") {
    return (
      <pre style={{ fontFamily: MONO, fontSize: "11px", color: GREEN_DIM, margin: 0,
        whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7 }}>
        {job.content}
      </pre>
    );
  }
  // Template render
  const t = job.content || {};
  const hazardLabel = HAZARD_LABELS[t.hazard ?? 0] || "N/A";
  const yn = (v) => v === true || v === "yes" ? "YES" : v === "partial" ? "PARTIAL" : "NO";
  return (
    <div style={{ fontFamily: MONO, fontSize: "11px", color: GREEN_DIM, lineHeight: 1.8 }}>
      <div style={{ color: HEADER_GREEN, fontSize: "12px", letterSpacing: "0.1em", marginBottom: "6px",
        textTransform: "uppercase", fontWeight: "bold" }}>
        {t.jobType || "POSITION"}
      </div>
      <div style={{ color: GREEN_MID, fontSize: "9px", letterSpacing: "0.2em", marginBottom: "10px", textTransform: "uppercase" }}>
        {job.company || "UNKNOWN CLIENT"}
      </div>
      {t.description && (
        <div style={{ color: GREEN_DIM, fontSize: "10px", marginBottom: "10px", lineHeight: 1.6,
          borderLeft: `2px solid ${GREEN_DARK}`, paddingLeft: "10px" }}>
          {t.description}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px", fontSize: "10px" }}>
        <div><span style={{ color: GREEN_DARK }}>PAYOUT: </span><span style={{ color: HEADER_GREEN }}>{t.payout || "NEGOTIABLE"}</span></div>
        <div><span style={{ color: GREEN_DARK }}>HAZARD: </span><span style={{ color: (t.hazard >= 4) ? "#ff8844" : (t.hazard >= 2) ? AMBER : GREEN_DIM }}>{hazardLabel}</span></div>
        <div><span style={{ color: GREEN_DARK }}>TRANSPORT: </span>{yn(t.transport)}</div>
        <div><span style={{ color: GREEN_DARK }}>NDA: </span>{yn(t.nda)}</div>
        <div><span style={{ color: GREEN_DARK }}>SALVAGE: </span>{yn(t.salvage)}</div>
      </div>
    </div>
  );
}

function JobCard({ job, isOmniCorp, minimal = false }) {
  const borderColor = isOmniCorp ? "rgba(255,200,0,0.3)" : `${GREEN_DARK}`;
  const bgColor = isOmniCorp ? "rgba(80,60,0,0.12)" : "rgba(0,12,0,0.4)";
  const postedLabel = job.cycle_posted != null ? `CYC ${String(job.cycle_posted).padStart(2,"0")}` : null;
  return (
    <div style={{ border: `1px solid ${borderColor}`, background: bgColor,
      padding: "14px 16px", marginBottom: minimal ? 0 : "12px" }}>
      {isOmniCorp && (
        <div style={{ color: AMBER, fontSize: "8px", letterSpacing: "0.3em", marginBottom: "6px", opacity: 0.7 }}>
          ▶ OMNICORP CONTRACT
        </div>
      )}
      {renderJobContent(job)}
      {postedLabel && !minimal && (
        <div style={{ color: GREEN_DARK, fontSize: "9px", marginTop: "8px", letterSpacing: "0.1em" }}>
          POSTED {postedLabel}
        </div>
      )}
    </div>
  );
}

// ─── Job Editor ────────────────────────────────────────────────────────────────

function JobEditor({ job, stocks, onSave, onCancel }) {
  const isNew = !job;
  const [mode, setMode] = useState(job?.mode || "template");
  const [company, setCompany] = useState(job?.company || "");
  const [freeContent, setFreeContent] = useState(job?.mode === "freeform" ? (job?.content || "") : "");
  const [tmpl, setTmpl] = useState(job?.mode === "template" ? (job?.content || {}) : {
    jobType: "", payout: "", hazard: 0, transport: "no", nda: false, salvage: false, description: ""
  });
  const [frozen, setFrozen] = useState(job?.frozen ?? false);
  const [preview, setPreview] = useState(false);

  const omniName = stocks.find(s => s.is_omnicorp)?.name || "";
  const activeCorps = stocks.filter(s => !s.is_collapsed && !s.is_merged);

  const buildJob = () => ({
    id: job?.id || `j_${Date.now()}`,
    company,
    mode,
    content: mode === "freeform" ? freeContent : tmpl,
    frozen: frozen || company === omniName,
    status: job?.status || "pool",
    cycle_posted: job?.cycle_posted ?? null,
    cycle_completed: job?.cycle_completed ?? null,
  });

  const canSave = company && (mode === "freeform" ? freeContent.trim() : (tmpl.jobType?.trim()));

  const selStyle = { background: BG, border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
    fontFamily: MONO, fontSize: "11px", padding: "5px 8px", width: "100%" };
  const inStyle = { background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
    fontFamily: MONO, fontSize: "11px", padding: "5px 8px", width: "100%", boxSizing: "border-box", outline: "none" };
  const labelStyle = { color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "3px" };

  return (
    <div style={{ background: "rgba(0,5,15,0.7)", border: `1px solid #2a3a4a`, padding: "16px" }}>
      <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.2em", marginBottom: "14px" }}>
        {isNew ? "NEW JOB" : "EDIT JOB"}
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {["template","freeform"].map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ background: mode === m ? "rgba(68,200,68,0.08)" : "none",
              border: `1px solid ${mode === m ? "#4488ff" : "#1a2a3a"}`,
              color: mode === m ? "#88bbff" : GREEN_DARK,
              fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
              padding: "4px 12px", cursor: "pointer" }}>
            {m.toUpperCase()}
          </button>
        ))}
        <button onClick={() => setPreview(p => !p)}
          style={{ background: preview ? "rgba(68,255,136,0.05)" : "none",
            border: `1px solid ${preview ? GREEN_DARK : "#1a2a3a"}`,
            color: preview ? GREEN_MID : GREEN_DARK,
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
            padding: "4px 12px", cursor: "pointer", marginLeft: "auto" }}>
          PREVIEW
        </button>
      </div>

      {preview ? (
        <div style={{ marginBottom: "12px" }}>
          <JobCard job={buildJob()} isOmniCorp={company === omniName} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
          {/* Company */}
          <div>
            <div style={labelStyle}>CLIENT / COMPANY *</div>
            <select value={company} onChange={e => setCompany(e.target.value)} style={selStyle}>
              <option value="">— select company —</option>
              {activeCorps.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {mode === "freeform" ? (
            <div>
              <div style={labelStyle}>JOB POSTING (raw text, preserves formatting) *</div>
              <textarea value={freeContent} onChange={e => setFreeContent(e.target.value)}
                rows={8} style={{ ...inStyle, resize: "vertical", lineHeight: 1.6 }}
                placeholder={"POSITION: Extraction Specialist\nCLIENT: Redacted\n\nDetails here..."} />
            </div>
          ) : (
            <>
              <div>
                <div style={labelStyle}>JOB TYPE / TITLE *</div>
                <input value={tmpl.jobType || ""} onChange={e => setTmpl(p => ({...p, jobType: e.target.value}))} style={inStyle} placeholder="e.g. Armed Escort" />
              </div>
              <div>
                <div style={labelStyle}>PAYOUT</div>
                <input value={tmpl.payout || ""} onChange={e => setTmpl(p => ({...p, payout: e.target.value}))} style={inStyle} placeholder="e.g. 3,000cr + bonus" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <div style={labelStyle}>HAZARD PAY</div>
                  <select value={tmpl.hazard ?? 0} onChange={e => setTmpl(p => ({...p, hazard: parseInt(e.target.value)}))} style={selStyle}>
                    {HAZARD_LABELS.map((lbl2, i) => <option key={i} value={i}>{lbl2}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>TRANSPORT</div>
                  <select value={tmpl.transport || "no"} onChange={e => setTmpl(p => ({...p, transport: e.target.value}))} style={selStyle}>
                    <option value="yes">YES</option>
                    <option value="no">NO</option>
                    <option value="partial">PARTIAL</option>
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>NDA</div>
                  <select value={tmpl.nda ? "yes" : "no"} onChange={e => setTmpl(p => ({...p, nda: e.target.value === "yes"}))} style={selStyle}>
                    <option value="no">NO</option>
                    <option value="yes">YES</option>
                  </select>
                </div>
              </div>
              <div>
                <div style={labelStyle}>SALVAGE RIGHTS</div>
                <select value={tmpl.salvage ? "yes" : "no"} onChange={e => setTmpl(p => ({...p, salvage: e.target.value === "yes"}))} style={selStyle}>
                  <option value="no">NO</option>
                  <option value="yes">YES</option>
                </select>
              </div>
              <div>
                <div style={labelStyle}>DESCRIPTION / FLAVOR TEXT</div>
                <textarea value={tmpl.description || ""} onChange={e => setTmpl(p => ({...p, description: e.target.value}))}
                  rows={4} style={{ ...inStyle, resize: "vertical", lineHeight: 1.6 }}
                  placeholder="What are they actually being hired to do..." />
              </div>
            </>
          )}

          {/* Frozen toggle (non-OmniCorp only) */}
          {company !== omniName && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => setFrozen(f => !f)}
                style={{ background: frozen ? "rgba(68,200,68,0.08)" : "none",
                  border: `1px solid ${frozen ? "#4488cc" : "#1a2a3a"}`,
                  color: frozen ? "#88ccff" : GREEN_DARK,
                  fontFamily: MONO, fontSize: "10px", padding: "3px 10px", cursor: "pointer" }}>
                {frozen ? "📌 STICKY" : "NOT STICKY"}
              </button>
              <span style={{ color: GREEN_DARK, fontSize: "9px" }}>Sticky jobs stay on the board until manually completed</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => canSave && onSave(buildJob())} disabled={!canSave}
          style={{ background: "none", border: `1px solid ${canSave ? "#4488ff" : "#1a2a3a"}`,
            color: canSave ? "#88bbff" : GREEN_DARK,
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em",
            padding: "6px 16px", cursor: canSave ? "pointer" : "not-allowed" }}>
          SAVE
        </button>
        <button onClick={onCancel}
          style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em",
            padding: "6px 16px", cursor: "pointer" }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ─── Warden Job Board Panel ────────────────────────────────────────────────────

function JobBoardPanel({ jobs, setJobs, stocks, setStocks, date, rollConfig, setRollConfig, alwaysMerge, KEYS, wardenSet, showToast }) {
  const [editingId, setEditingId] = useState(null); // job id being edited, or "new"
  const [editTarget, setEditTarget] = useState("pool"); // where to put new job: "pool" | "active"
  const [subPanel, setSubPanel] = useState("active"); // "active" | "pool" | "completed"

  const omniName = stocks.find(s => s.is_omnicorp)?.name || "";
  const activeJobs = jobs.filter(j => j.status === "active");
  // Sort: OmniCorp first
  const sortedActive = [...activeJobs].sort((a, b) => (b.company === omniName ? 1 : 0) - (a.company === omniName ? 1 : 0));
  const poolJobs = jobs.filter(j => j.status === "pool");
  const completedJobs = jobs.filter(j => j.status === "completed" || j.status === "revoked").reverse();

  const saveJobs = (next) => { setJobs(next); wardenSet(KEYS.jobs, next); };

  const completeJob = (job, skipBump = false) => {
    const next = jobs.map(j => j.id === job.id
      ? { ...j, status: "completed", cycle_completed: date.cycle }
      : j
    );
    saveJobs(next);
    // Auto-bump the posting corp if setting is on and not overridden
    if (rollConfig.bumpOnComplete && !skipBump) {
      const corp = stocks.find(s => s.name === job.company);
      if (corp && !corp.is_omnicorp && !corp.is_collapsed && !["OK","Good"].includes(corp.health)) {
        const bumped = stocks.map(s => s.name === job.company ? { ...s, ...bumpHealth(s) } : s);
        setStocks(bumped); wardenSet(KEYS.stocks, bumped);
        showToast(`JOB COMPLETE — ${job.company.split(" ")[0]} HEALTH ↑`, GREEN_MID);
      } else {
        showToast(`JOB COMPLETED — ${job.company}`);
      }
    } else {
      showToast(`JOB COMPLETED — ${job.company}`);
    }
    // If unfrozen, check if random fill needed
    if (!job.frozen && (rollConfig.drawMode || "random") === "random") {
      const remaining = next.filter(j => j.status === "active").length;
      if (remaining < 3) {
        const pool = next.filter(j => j.status === "pool");
        const omniPool = pool.filter(j => j.company === omniName);
        const stdPool = pool.filter(j => j.company !== omniName).sort(() => Math.random() - 0.5);
        const draw = [...omniPool, ...stdPool].slice(0, 3 - remaining);
        const drawIds = new Set(draw.map(j => j.id));
        const filled = next.map(j => drawIds.has(j.id) ? { ...j, status: "active", cycle_posted: date.cycle } : j);
        saveJobs(filled);
      }
    }
  };

  const removeJob = (id) => {
    if (!window.confirm("Remove this job?")) return;
    saveJobs(jobs.filter(j => j.id !== id));
  };

  const uncompleteJob = (job) => {
    const next = jobs.map(j => j.id === job.id ? { ...j, status: "active", cycle_completed: undefined } : j);
    saveJobs(next);
    showToast("JOB RETURNED TO BOARD", "#88ccff");
  };

  const revokeJob = (job) => {
    const next = jobs.map(j => j.id === job.id ? { ...j, status: "revoked", cycle_completed: date.cycle } : j);
    saveJobs(next);
    showToast(`JOB REVOKED — ${job.company}`, "#cc5533");
  };

  const promoteToActive = (job) => {
    if (activeJobs.length >= 3) { showToast("Board already has 3 active jobs", "#ff8844"); return; }
    const next = jobs.map(j => j.id === job.id ? { ...j, status: "active", cycle_posted: date.cycle } : j);
    saveJobs(next);
    showToast("JOB PROMOTED TO BOARD");
  };

  const saveEdit = (updatedJob) => {
    if (editingId === "new") {
      const withStatus = { ...updatedJob, status: editTarget };
      if (editTarget === "active") withStatus.cycle_posted = date.cycle;
      saveJobs([...jobs, withStatus]);
      showToast(editTarget === "active" ? "JOB ADDED TO BOARD" : "JOB ADDED TO POOL");
    } else {
      saveJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
      showToast("JOB UPDATED");
    }
    setEditingId(null);
  };

  const tabBtn = (id, label, count) => (
    <button key={id} onClick={() => setSubPanel(id)}
      style={{ background: subPanel === id ? "rgba(68,200,68,0.08)" : "none",
        border: `1px solid ${subPanel === id ? "#2a3a5a" : "#1a2a3a"}`,
        color: subPanel === id ? "#7799bb" : GREEN_DARK,
        fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
        padding: "4px 12px", cursor: "pointer" }}>
      {label} {count != null ? `(${count})` : ""}
    </button>
  );

  const jBtnStyle = (col) => ({ background: "none", border: `1px solid ${col || "#1a2a3a"}`,
    color: col || GREEN_DARK, fontFamily: MONO, fontSize: "9px", letterSpacing: "0.08em",
    padding: "2px 8px", cursor: "pointer" });

  const drawMode = rollConfig.drawMode || "random";

  return (
    <div style={{ background: "rgba(0,5,15,0.5)", border: `1px solid ${GREEN_DARK}`, padding: "16px", marginBottom: "16px" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.2em" }}>JOB BOARD</div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ color: GREEN_MID, fontSize: "9px", letterSpacing: "0.1em" }}>ROTATION:</span>
          {["random","bespoke"].map(m => (
            <button key={m} onClick={() => {
              const next = { ...rollConfig, drawMode: m };
              setRollConfig(next);
              wardenSet(KEYS.settings, { alwaysMerge: alwaysMerge ?? true, rollConfig: next });
            }}
              style={{ background: drawMode === m ? "rgba(68,200,68,0.08)" : "none",
                border: `1px solid ${drawMode === m ? "#4488ff" : "#1a2a3a"}`,
                color: drawMode === m ? "#88bbff" : GREEN_DARK,
                fontFamily: MONO, fontSize: "9px", letterSpacing: "0.1em",
                padding: "3px 8px", cursor: "pointer" }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-panel tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
        {tabBtn("active", "ACTIVE BOARD", sortedActive.length)}
        {tabBtn("pool", "POOL", poolJobs.length)}
        {tabBtn("completed", "COMPLETED", completedJobs.length)}
      </div>

      {/* Editor overlay */}
      {editingId && (
        <div style={{ marginBottom: "12px" }}>
          <JobEditor
            job={editingId === "new" ? null : jobs.find(j => j.id === editingId)}
            stocks={stocks}
            onSave={saveEdit}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {/* ACTIVE BOARD */}
      {!editingId && subPanel === "active" && (
        <div>
          {sortedActive.length === 0 && (
            <div style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.1em", padding: "8px 0", marginBottom: "8px" }}>
              No active jobs. Add from pool or create new.
            </div>
          )}
          {sortedActive.map(job => (
            <div key={job.id} style={{ marginBottom: "10px" }}>
              <JobCard job={job} isOmniCorp={job.company === omniName} />
              <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                <button onClick={() => setEditingId(job.id)} style={jBtnStyle(GREEN_DARK)}>EDIT</button>
                <button onClick={() => completeJob(job)} style={jBtnStyle(GREEN_DARK)}>
                  COMPLETE{rollConfig.bumpOnComplete ? " + ▲" : ""}
                </button>
                {rollConfig.bumpOnComplete && (
                  <button onClick={() => completeJob(job, true)} style={jBtnStyle(GREEN_DARK)} title="Complete without health bump">
                    NO BUMP
                  </button>
                )}
                <button onClick={() => revokeJob(job)} style={jBtnStyle("#664422")}>REVOKE</button>
                <button onClick={() => {
                  const next = jobs.map(j => j.id === job.id ? { ...j, frozen: !j.frozen } : j);
                  saveJobs(next);
                  showToast(job.frozen ? "JOB UNSTICKIED" : "JOB STICKIED", "#88ccff");
                }} style={jBtnStyle(job.frozen ? "#4488cc" : GREEN_DARK)}>
                  {job.frozen ? "📌 STICKY" : "STICKY OFF"}
                </button>
                <button onClick={() => removeJob(job.id)} style={jBtnStyle("#664444")}>REMOVE</button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button onClick={() => { setEditTarget("active"); setEditingId("new"); }}
              style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_MID,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "5px 14px", cursor: "pointer" }}>
              + NEW JOB TO BOARD
            </button>
          </div>
        </div>
      )}

      {/* POOL */}
      {!editingId && subPanel === "pool" && (
        <div>
          {poolJobs.length === 0 && (
            <div style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.1em", padding: "8px 0", marginBottom: "8px" }}>
              Pool is empty. Create jobs here to queue them for future rotations.
            </div>
          )}
          {poolJobs.map(job => (
            <div key={job.id} style={{ marginBottom: "10px" }}>
              <JobCard job={job} isOmniCorp={job.company === omniName} />
              <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                <button onClick={() => setEditingId(job.id)} style={jBtnStyle(GREEN_DARK)}>EDIT</button>
                <button onClick={() => promoteToActive(job)} style={jBtnStyle(GREEN_DARK)}>▶ PROMOTE TO BOARD</button>
                <button onClick={() => {
                  const next = jobs.map(j => j.id === job.id ? { ...j, frozen: !j.frozen } : j);
                  saveJobs(next);
                }} style={jBtnStyle(job.frozen ? "#4488cc" : GREEN_DARK)}>
                  {job.frozen ? "📌 STICKY" : "STICKY OFF"}
                </button>
                <button onClick={() => removeJob(job.id)} style={jBtnStyle("#664444")}>REMOVE</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: "8px" }}>
            <button onClick={() => { setEditTarget("pool"); setEditingId("new"); }}
              style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_MID,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "5px 14px", cursor: "pointer" }}>
              + NEW JOB TO POOL
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED + REVOKED */}
      {!editingId && subPanel === "completed" && (
        <div>
          {completedJobs.length === 0 && (
            <div style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.1em", padding: "8px 0" }}>
              No completed or revoked jobs yet.
            </div>
          )}
          {completedJobs.map(job => {
            const isRevoked = job.status === "revoked";
            return (
              <div key={job.id} style={{ marginBottom: "12px", opacity: isRevoked ? 0.85 : 0.7,
                borderLeft: isRevoked ? "2px solid #882200" : "2px solid #224422",
                paddingLeft: "10px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.15em", marginBottom: "4px",
                  color: isRevoked ? "#882200" : GREEN_DARK }}>
                  {isRevoked ? "⚠ REVOKED" : "✓ COMPLETED"} CYC {String(job.cycle_completed ?? "?").padStart(2,"0")} — <span style={{ textDecoration: isRevoked ? "line-through" : "none" }}>{job.company}</span>
                </div>
                <div style={{ opacity: isRevoked ? 0.6 : 1, textDecoration: isRevoked ? "line-through" : "none" }}>
                  <JobCard job={job} isOmniCorp={false} minimal />
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                  <button onClick={() => uncompleteJob(job)} style={jBtnStyle("#4466aa")}>↩ MARK INCOMPLETE</button>
                  {!isRevoked && <button onClick={() => revokeJob(job)} style={jBtnStyle("#664422")}>REVOKE</button>}
                  {isRevoked && <button onClick={() => completeJob(job, true)} style={jBtnStyle(GREEN_DARK)}>MARK COMPLETE</button>}
                  <button onClick={() => removeJob(job.id)} style={jBtnStyle("#664444")}>REMOVE</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Player Job Board View ──────────────────────────────────────────────────────

function PlayerJobBoard({ jobs, stocks }) {
  const omniName = stocks.find(s => s.is_omnicorp)?.name || "";
  const activeJobs = [...jobs.filter(j => j.status === "active")]
    .sort((a, b) => (b.company === omniName ? 1 : 0) - (a.company === omniName ? 1 : 0));
  const completedJobs = jobs.filter(j => j.status === "completed").slice().reverse();
  const revokedJobs = jobs.filter(j => j.status === "revoked").slice().reverse();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);

  return (
    <div>
      <div style={{ color: GREEN_MID, fontSize: "9px", letterSpacing: "0.2em", marginBottom: "16px",
        borderBottom: `1px solid ${GREEN_DARK}`, paddingBottom: "8px" }}>
        AVAILABLE CONTRACTS — {activeJobs.length} POSTED
      </div>

      {activeJobs.length === 0 && (
        <div style={{ color: GREEN_DARK, fontSize: "11px", letterSpacing: "0.1em", padding: "20px 0", textAlign: "center" }}>
          NO CONTRACTS CURRENTLY AVAILABLE<br/>
          <span style={{ fontSize: "9px", opacity: 0.6 }}>CHECK BACK AFTER NEXT MARKET CYCLE</span>
        </div>
      )}

      {activeJobs.map(job => (
        <JobCard key={job.id} job={job} isOmniCorp={job.company === omniName} />
      ))}

      {completedJobs.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setShowCompleted(v => !v)}
            style={{ background: "none", border: `1px solid ${showCompleted ? GREEN_MID : GREEN_DARK}`,
              color: showCompleted ? GREEN_MID : GREEN_DARK, cursor: "pointer", fontFamily: MONO,
              fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px", width: "100%" }}>
            {showCompleted ? "[ HIDE COMPLETED ]" : `[ COMPLETED CONTRACTS (${completedJobs.length}) ]`}
          </button>
          {showCompleted && (
            <div style={{ marginTop: "12px" }}>
              {completedJobs.map(job => (
                <div key={job.id} style={{ marginBottom: "12px", opacity: 0.55 }}>
                  <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "4px" }}>
                    COMPLETED CYC {String(job.cycle_completed ?? "?").padStart(2,"0")} — {job.company}
                  </div>
                  <JobCard job={job} isOmniCorp={false} minimal />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {revokedJobs.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <button onClick={() => setShowRevoked(v => !v)}
            style={{ background: "none", border: `1px solid ${showRevoked ? "#882200" : "#441100"}`,
              color: showRevoked ? "#cc5533" : "#663322", cursor: "pointer", fontFamily: MONO,
              fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px", width: "100%" }}>
            {showRevoked ? "[ HIDE REVOKED ]" : `[ REVOKED CONTRACTS (${revokedJobs.length}) ]`}
          </button>
          {showRevoked && (
            <div style={{ marginTop: "12px" }}>
              {revokedJobs.map(job => (
                <div key={job.id} style={{ marginBottom: "12px", opacity: 0.7,
                  borderLeft: "2px solid #882200", paddingLeft: "10px" }}>
                  <div style={{ color: "#882200", fontSize: "9px", letterSpacing: "0.15em", marginBottom: "4px" }}>
                    ⚠ REVOKED CYC {String(job.cycle_completed ?? "?").padStart(2,"0")} — <span style={{ textDecoration: "line-through" }}>{job.company}</span>
                  </div>
                  <div style={{ opacity: 0.65, textDecoration: "line-through", textDecorationColor: "#882200" }}>
                    <JobCard job={job} isOmniCorp={false} minimal />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── StockRows (player view with expandable history) ────────────────────────

function StockRows({ stocks, history, visible, expandedStock, setExpandedStock, catalogs }) {
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
          .filter(entry => entry.stocks)
          .map(entry => {
            const snap = entry.stocks.find(x => x.name === s.name);
            return snap ? { price: snap.price, date: entry.date } : null;
          })
          .filter(Boolean)
          .slice(-10); // last 10 entries

        return (
          <div key={s.name} style={{
            opacity: isVis ? (s.is_collapsed ? 0.3 : 1) : 0,
            transform: isVis ? "translateX(0)" : "translateX(-8px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            border: isExpanded ? `1px solid ${s.is_omnicorp ? "rgba(255,200,0,0.3)" : "rgba(68,200,68,0.15)"}` : "1px solid transparent",
            background: isExpanded ? "rgba(0,15,0,0.4)" : rowBg,
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
              <div style={{ padding: "8px 14px 14px", borderTop: `1px solid rgba(68,120,68,0.2)` }}>
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
                    {[...priceHistory].reverse().map((ph, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between",
                        fontSize: "10px", color: GREEN_DARK, padding: "1px 0" }}>
                        <span style={{ color: GREEN_DARK }}>CYC {String(ph.date?.cycle ?? "?").padStart(2,"0")}</span>
                        <span style={{ color: HEADER_GREEN }}>{ph.price.toLocaleString()}cr</span>
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
                    <div style={{ marginTop: "12px", borderTop: `1px solid rgba(68,120,68,0.2)`, paddingTop: "10px" }}>
                      <div style={{ color, fontSize: "9px", letterSpacing: "0.2em", marginBottom: "6px" }}>
                        {cat.status.toUpperCase()}{isIneligible && cat.ineligibleReason ? ` — ${cat.ineligibleReason}` : ""}
                      </div>
                      {!isIneligible && cat.benefits && (
                        <div style={{ color: isRevoked ? "#555" : GREEN_MID, fontSize: "10px", lineHeight: 1.6, marginBottom: "8px",
                          textDecoration: isRevoked ? "line-through" : "none", opacity: isRevoked ? 0.5 : 1 }}>
                          {cat.benefits}
                        </div>
                      )}
                      {!isIneligible && cat.items && cat.items.length > 0 && (
                        <div>
                          <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "5px" }}>CATALOG</div>
                          {cat.items.map(it => (
                            <div key={it.id} style={{ display: "flex", gap: "8px", padding: "3px 0", fontSize: "10px",
                              borderBottom: `1px solid rgba(68,100,68,0.1)`,
                              opacity: isRevoked ? 0.4 : 1,
                              textDecoration: isRevoked ? "line-through" : "none" }}>
                              <span style={{ flex: 2, color: isRevoked ? "#444" : GREEN_DIM }}>{it.name}</span>
                              <span style={{ color: isRevoked ? "#444" : "#4a8aaa", whiteSpace: "nowrap" }}>{it.price}</span>
                              {it.notes && <span style={{ flex: 2, color: GREEN_DARK }}>{it.notes}</span>}
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

// ─── Session Panel Sub-Components ─────────────────────────────────────────────

const HAZARD_OPTS = ["N/A","x1","x2","x3","x4","x5"];
const HAZARD_MULT = { "N/A": 0, "x1": 1, "x2": 2, "x3": 3, "x4": 4, "x5": 5 };
const DISPOSITION_OPTS = ["Active","Deceased","Next of Kin","LLC","Other"];
const CLASS_TEMPLATES = {
  Marine: { trained: 2, expert: 1, master: 0 },
  Android: { trained: 3, expert: 1, master: 0 },
  Scientist: { trained: 1, expert: 1, master: 1 },
  Teamster: { trained: 3, expert: 1, master: 0 },
};

function PayoutCalculator({ jobs, crew, setCrew, stocks, portfolio, setPortfolio, rollConfig, date, wardenSet, KEYS, showToast }) {
  const profiles = crew.profiles || [];
  const [selJobId, setSelJobId] = useState("");
  const [months, setMonths] = useState(1);
  const [jumps, setJumps] = useState(0);
  const [hazard, setHazard] = useState("N/A");
  const [negoPct, setNegoPct] = useState(0);
  const [negoManual, setNegoManual] = useState("");
  const [flatBonuses, setFlatBonuses] = useState([]);
  const [globalPayType, setGlobalPayType] = useState("cash");
  const [ledger, setLedger] = useState(null);

  const linkableJobs = jobs.filter(j => j.status === "active" || j.status === "completed");
  const selJob = jobs.find(j => String(j.id) === String(selJobId));
  const jobCorp = selJob?.company || "";
  const corpStock = stocks.find(s => s.name === jobCorp);
  const currentPrice = corpStock?.price || 0;
  const negoFinal = negoManual !== "" ? (parseFloat(negoManual) || 0) : negoPct;
  const flatTotal = flatBonuses.reduce((sum, bonus) => sum + (parseFloat(bonus.amount) || 0), 0);

  const calcPayout = (p) => {
    const salary = (p.trained || 0) * 500 + (p.expert || 0) * 1000 + (p.master || 0) * 2000;
    const basePay = salary * months;
    const hazardPay = salary * months * HAZARD_MULT[hazard];
    const base = basePay + hazardPay;
    const adjusted = base * (1 + negoFinal / 100);
    const total = Math.round(adjusted + jumps * 1000 + flatTotal);
    const equityShares = currentPrice > 0 ? Math.floor(total * 0.6 / currentPrice) : 0;
    return { salary, total, equityCash: Math.round(total * 0.5), equityShares };
  };

  const addProfile = (template) => {
    const t = CLASS_TEMPLATES[template] || { trained: 0, expert: 0, master: 0 };
    const next = { ...crew, profiles: [...profiles, { id: Date.now(), name: template || "New Crew", role: template || "", trained: t.trained, expert: t.expert, master: t.master, disposition: "Active", beneficiary: "", paymentType: "cash" }] };
    setCrew(next); wardenSet(KEYS.crew, next);
  };
  const updateProfile = (id, patch) => {
    const next = { ...crew, profiles: profiles.map(p => p.id === id ? { ...p, ...patch } : p) };
    setCrew(next); wardenSet(KEYS.crew, next);
  };
  const removeProfile = (id) => {
    const next = { ...crew, profiles: profiles.filter(p => p.id !== id) };
    setCrew(next); wardenSet(KEYS.crew, next);
  };

  const handleConfirm = () => {
    if (profiles.length === 0) return;
    const perCrew = rollConfig.crewPaymentMode === "per";
    // Lock equity shares into portfolio
    const equityProfiles = profiles.filter(p => (perCrew ? p.paymentType : globalPayType) === "equity");
    if (equityProfiles.length > 0 && jobCorp) {
      const newHoldings = equityProfiles.map(p => {
        const { equityShares } = calcPayout(p);
        return { id: Date.now() + Math.random(), company: jobCorp, shares: equityShares, grantPrice: currentPrice, lockScenarios: 1 };
      }).filter(holding => holding.shares > 0);
      if (newHoldings.length > 0) {
        const newPortfolio = [...portfolio, ...newHoldings];
        setPortfolio(newPortfolio); wardenSet(KEYS.portfolio, newPortfolio);
      }
    }
    const card = {
      jobName: selJob ? (typeof selJob.content === "string" ? selJob.content : selJob.content?.jobType || selJob.content?.description || "Contract").slice(0, 50) : "No linked job",
      company: jobCorp || "—",
      months, jumps, hazard, negotiation: negoFinal, flatBonuses: [...flatBonuses],
      entries: profiles.map(p => {
        const calc = calcPayout(p);
        const payType = perCrew ? (p.paymentType || "cash") : globalPayType;
        let disposition = "";
        if (p.disposition === "Active") disposition = `Paid in Full — ${calc.total.toLocaleString()}cr`;
        else if (p.disposition === "Deceased") disposition = `Deceased — ${p.beneficiary ? p.beneficiary : "No listed beneficiary"} — ${calc.total.toLocaleString()}cr held in escrow`;
        else if (p.disposition === "Next of Kin") disposition = `Payment sent to next of kin — ${calc.total.toLocaleString()}cr`;
        else if (p.disposition === "LLC") disposition = `Paid to LLC accounts per Will — ${calc.total.toLocaleString()}cr`;
        else disposition = `${p.disposition || "Other"} — ${calc.total.toLocaleString()}cr`;
        return { name: p.name, role: p.role, ...calc, payType, disposition };
      }),
    };
    setLedger(card);
    showToast("LEDGER GENERATED");
  };

  const sI = { background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN, fontFamily: MONO, fontSize: "11px", padding: "4px 8px" };
  const lbl = (t) => <div style={{ color: GREEN_DARK, fontSize: "10px", marginBottom: "3px", letterSpacing: "0.08em" }}>{t}</div>;

  return (
    <div style={{ overflowX: "hidden" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div>{lbl("LINK TO JOB")}
          <select value={selJobId} onChange={e => setSelJobId(e.target.value)} style={{ ...sI, minWidth: "200px" }}>
            <option value="">— none —</option>
            {linkableJobs.map(j => {
              const label = typeof j.content === "string" ? j.content.slice(0,28) : (j.content?.jobType || j.content?.description || "Contract").slice(0,28);
              return <option key={j.id} value={String(j.id)}>{j.company} — {label} [{j.status}]</option>;
            })}
          </select>
        </div>
        <div>{lbl("MONTHS")}
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            <button onClick={()=>setMonths(m=>Math.max(1,m-1))} style={{ ...sI, padding:"2px 8px", cursor:"pointer" }}>−</button>
            <span style={{ color:"#aabbcc", minWidth:"28px", textAlign:"center" }}>{months}</span>
            <button onClick={()=>setMonths(m=>m+1)} style={{ ...sI, padding:"2px 8px", cursor:"pointer" }}>+</button>
          </div>
        </div>
        <div>{lbl("JUMPS (×1kcr)")}
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            <button onClick={()=>setJumps(j=>Math.max(0,j-1))} style={{ ...sI, padding:"2px 8px", cursor:"pointer" }}>−</button>
            <span style={{ color:"#aabbcc", minWidth:"28px", textAlign:"center" }}>{jumps}</span>
            <button onClick={()=>setJumps(j=>j+1)} style={{ ...sI, padding:"2px 8px", cursor:"pointer" }}>+</button>
          </div>
        </div>
        <div>{lbl("HAZARD")}
          <select value={hazard} onChange={e => setHazard(e.target.value)} style={sI}>
            {HAZARD_OPTS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "14px", alignItems: "flex-end" }}>
        <div>{lbl("NEGOTIATION (stepper)")}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <button onClick={() => setNegoPct(p => Math.max(-25, p-5))} style={{ ...sI, padding: "2px 8px", cursor: "pointer" }}>−</button>
            <span style={{ color: negoPct < 0 ? "#cc5555" : negoPct > 0 ? GREEN : "#6688aa", minWidth: "36px", textAlign: "center", fontSize: "13px" }}>{negoPct > 0 ? "+" : ""}{negoPct}%</span>
            <button onClick={() => setNegoPct(p => Math.min(25, p+5))} style={{ ...sI, padding: "2px 8px", cursor: "pointer" }}>+</button>
          </div>
        </div>
        <div>{lbl("MANUAL OVERRIDE %")}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input value={negoManual} onChange={e => setNegoManual(e.target.value)} placeholder="e.g. 12.5" style={{ ...sI, width: "80px" }} />
            {negoManual !== "" && <span style={{ color: GREEN_MID, fontSize: "10px" }}>active — overrides stepper</span>}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        {lbl("FLAT BONUSES")}
        {flatBonuses.map((bonus, i) => (
          <div key={bonus.id} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "center" }}>
            <input value={bonus.label} onChange={e => setFlatBonuses(f => f.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder="Label" style={{ ...sI, flex: 1 }} />
            <input type="number" value={bonus.amount} onChange={e => setFlatBonuses(f => f.map((x,j)=>j===i?{...x,amount:e.target.value}:x))} placeholder="cr" style={{ ...sI, width: "80px" }} />
            <span style={{ color: GREEN_DARK, fontSize: "10px" }}>cr</span>
            <button onClick={() => setFlatBonuses(f=>f.filter((_,j)=>j!==i))} style={{ ...sI, padding:"1px 6px", cursor:"pointer", color:"#664444" }}>✕</button>
          </div>
        ))}
        <button onClick={() => setFlatBonuses(f=>[...f,{id:Date.now(),label:"",amount:""}])}
          style={{ ...sI, padding:"3px 10px", cursor:"pointer", color:GREEN_MID, fontSize:"10px" }}>+ BONUS</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        {lbl("PAYMENT MODE")}
        {["cash","equity"].map(payType => (
          <button key={t} onClick={() => setGlobalPayType(t)}
            style={{ ...sI, padding:"3px 10px", cursor:"pointer", fontSize:"10px",
              color: globalPayType === t ? "#88ccff" : GREEN_DARK,
              borderColor: globalPayType === t ? "#336699" : "#1a2a3a" }}>
            {payType.toUpperCase()}
          </button>
        ))}
        {rollConfig.crewPaymentMode === "per" && <span style={{ color:GREEN_DARK, fontSize:"10px" }}>per-crew override active (set per row below)</span>}
      </div>

      <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em" }}>CREW ROSTER (persists across sessions)</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {Object.keys(CLASS_TEMPLATES).map(cls => (
              <button key={cls} onClick={() => addProfile(cls)}
                style={{ ...sI, padding:"2px 8px", cursor:"pointer", fontSize:"9px", color:"#4a7a8a", letterSpacing:"0.08em" }}>
                + {cls.toUpperCase()}
              </button>
            ))}
            <button onClick={() => addProfile(null)} style={{ ...sI, padding:"2px 8px", cursor:"pointer", fontSize:"9px" }}>+ BLANK</button>
          </div>
        </div>
        {profiles.length === 0 && <div style={{ color:GREEN_DARK, fontSize:"11px", padding:"10px 0" }}>No crew. Add via class template or blank above.</div>}
        {profiles.map(p => {
          const calc = calcPayout(p);
          return (
            <div key={p.id} style={{ border:`1px solid #1a2a3a`, padding:"12px", marginBottom:"8px", overflowX:"hidden" }}>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"8px", alignItems:"center" }}>
                <input value={p.name} onChange={e=>updateProfile(p.id,{name:e.target.value})} placeholder="Name" style={{ ...sI, width:"130px" }} />
                <input value={p.role} onChange={e=>updateProfile(p.id,{role:e.target.value})} placeholder="Class / Role" style={{ ...sI, width:"110px" }} />
                <button onClick={()=>removeProfile(p.id)} style={{ ...sI, padding:"2px 6px", cursor:"pointer", color:"#664444", marginLeft:"auto" }}>✕</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"6px", marginBottom:"8px" }}>
                {[["trained","TRAINED",500],["expert","EXPERT",1000],["master","MASTER",2000]].map(([field,lbl2,rate]) => (
                  <div key={field} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px",
                    border:"1px solid #1a2a3a", padding:"6px 2px", background:"rgba(0,5,15,0.3)", minWidth:0 }}>
                    <span style={{ color:"#6688aa", fontSize:"9px", letterSpacing:"0.06em", textAlign:"center" }}>{lbl2}<br/>×{rate>=1000?(rate/1000)+"k":rate}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                      <button onClick={()=>updateProfile(p.id,{[field]:Math.max(0,(p[field]||0)-1)})} style={{ background:"none", border:"1px solid #1a2a3a", color:"#6688aa", fontFamily:MONO, fontSize:"13px", width:"28px", height:"28px", cursor:"pointer", padding:0, lineHeight:1 }}>−</button>
                      <span style={{ color:"#aabbcc", minWidth:"22px", textAlign:"center", fontSize:"14px" }}>{p[field]||0}</span>
                      <button onClick={()=>updateProfile(p.id,{[field]:(p[field]||0)+1})} style={{ background:"none", border:"1px solid #1a2a3a", color:"#6688aa", fontFamily:MONO, fontSize:"13px", width:"28px", height:"28px", cursor:"pointer", padding:0, lineHeight:1 }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ color:"#6688aa", fontSize:"11px", marginBottom:"4px" }}>= <span style={{ color:"#aabbcc" }}>{calc.salary.toLocaleString()}cr/mo</span></div>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
                <select value={p.disposition} onChange={e=>updateProfile(p.id,{disposition:e.target.value})} style={sI}>
                  {DISPOSITION_OPTS.map(d=><option key={d}>{d}</option>)}
                </select>
                {p.disposition === "Deceased" && (
                  <input value={p.beneficiary} onChange={e=>updateProfile(p.id,{beneficiary:e.target.value})}
                    placeholder="Beneficiary note" style={{ ...sI, flex:1, minWidth:"120px" }} />
                )}
                {rollConfig.crewPaymentMode === "per" && (
                  <select value={p.paymentType||"cash"} onChange={e=>updateProfile(p.id,{paymentType:e.target.value})} style={sI}>
                    <option value="cash">CASH</option>
                    <option value="equity">EQUITY</option>
                  </select>
                )}
                <span style={{ color:"#88ccff", fontSize:"11px", marginLeft:"auto" }}>
                  CASH: {calc.total.toLocaleString()}cr
                  {currentPrice > 0 && (
                    <span style={{ color:"#aaaaff", marginLeft:"10px" }}>
                      EQUITY: {calc.equityCash.toLocaleString()}cr + {calc.equityShares} shares @ {currentPrice.toLocaleString()}cr
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
        {profiles.length > 0 && (
          <button onClick={handleConfirm}
            style={{ background:"none", border:`1px solid #4488ff`, color:"#88bbff",
              fontFamily:MONO, fontSize:"11px", letterSpacing:"0.15em", padding:"8px 20px", cursor:"pointer", marginTop:"8px" }}>
            GENERATE LEDGER
          </button>
        )}
      </div>

      {ledger && (
        <div style={{ marginTop:"20px", border:`1px solid #223344`, padding:"16px", background:"rgba(0,5,15,0.8)" }}>
          <div style={{ color:GREEN_DARK, fontSize:"9px", letterSpacing:"0.25em", marginBottom:"4px" }}>PERSONNEL LEDGER — CONFIDENTIAL</div>
          <div style={{ color:"#aabbcc", fontSize:"13px", marginBottom:"2px" }}>{ledger.company} — {ledger.jobName}</div>
          <div style={{ color:GREEN_DARK, fontSize:"10px", marginBottom:"12px" }}>
            {ledger.months}mo · HAZARD {ledger.hazard} · {ledger.jumps} JUMPS · NEGO {ledger.negotiation > 0 ? "+" : ""}{ledger.negotiation}%
            {ledger.flatBonuses.filter(fb=>fb.label).map(fb => ` · ${fb.label}: ${parseFloat(fb.amount)||0}cr`).join("")}
          </div>
          {ledger.entries.map((e, i) => (
            <div key={i} style={{ borderTop:`1px solid #1a2a3a`, paddingTop:"8px", marginTop:"8px" }}>
              <div style={{ color:"#ccddee", fontSize:"11px", letterSpacing:"0.05em" }}>
                {e.name} <span style={{ color:GREEN_DARK }}>— {e.role}</span>
              </div>
              <div style={{ color:"#7799bb", fontSize:"11px", marginTop:"3px", letterSpacing:"0.02em" }}>{e.disposition}</div>
              {e.payType === "equity" && (
                <div style={{ color:"#8888cc", fontSize:"10px", marginTop:"2px" }}>
                  Equity split: {e.equityCash.toLocaleString()}cr cash + {e.equityShares} shares (locked 1 scenario)
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DebtPanel({ debt, setDebt, wardenSet, KEYS }) {
  const totalOwed = debt.reduce((sum, debt_item) => sum + (parseFloat(debt_item.amount) || 0), 0);
  const sI = { background:"transparent", border:`1px solid #1a2a3a`, color:"#aabbcc", fontFamily:MONO, fontSize:"11px", padding:"4px 8px" };
  const addDebt = () => { const next = [...debt, {id:Date.now(), creditor:"", amount:0, monthlyPayment:0, termMonths:0}]; setDebt(next); wardenSet(KEYS.debt, next); };
  const upd = (id, p) => { const next = debt.map(debt_item=>debt_item.id===id?{...debt_item,...p}:debt_item); setDebt(next); wardenSet(KEYS.debt, next); };
  const del = (id) => { const next = debt.filter(debt_item=>debt_item.id!==id); setDebt(next); wardenSet(KEYS.debt, next); };
  return (
    <div>
      {debt.length > 0 && (
        <div style={{ display:"flex", gap:"24px", marginBottom:"16px", padding:"12px", border:`1px solid #3a1a1a`, background:"rgba(20,5,5,0.5)" }}>
          <div><div style={{ color:"#cc5555", fontSize:"22px", fontWeight:"bold" }}>{debt.length}</div><div style={{ color:"#664444", fontSize:"10px" }}>ACTIVE DEBTORS</div></div>
          <div><div style={{ color:"#cc5555", fontSize:"22px", fontWeight:"bold" }}>+{debt.length}</div><div style={{ color:"#664444", fontSize:"10px" }}>MIN STRESS</div></div>
          <div><div style={{ color:"#cc8855", fontSize:"18px", fontWeight:"bold" }}>{totalOwed.toLocaleString()}cr</div><div style={{ color:"#664444", fontSize:"10px" }}>TOTAL OWED</div></div>
        </div>
      )}
      {debt.length === 0 && <div style={{ color:GREEN_DARK, fontSize:"11px", padding:"10px 0" }}>No active debts.</div>}
      {debt.map(debt_item => (
        <div key={debt_item.id} style={{ border:`1px solid #2a1a1a`, padding:"10px", marginBottom:"8px" }}>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
            <input value={debt_item.creditor} onChange={e=>upd(debt_item.id,{creditor:e.target.value})} placeholder="Creditor name" style={{ ...sI, flex:1, minWidth:"130px" }} />
            <input type="number" value={debt_item.amount} onChange={e=>upd(debt_item.id,{amount:parseFloat(e.target.value)||0})} placeholder="Amount" style={{ ...sI, width:"90px" }} />
            <span style={{ color:GREEN_DARK, fontSize:"10px" }}>cr</span>
            <input type="number" value={debt_item.monthlyPayment} onChange={e=>upd(debt_item.id,{monthlyPayment:parseFloat(e.target.value)||0})} placeholder="mo payment" style={{ ...sI, width:"80px" }} />
            <span style={{ color:GREEN_DARK, fontSize:"10px" }}>cr/mo</span>
            <input type="number" value={debt_item.termMonths} onChange={e=>upd(debt_item.id,{termMonths:parseInt(e.target.value)||0})} placeholder="mo" style={{ ...sI, width:"55px" }} />
            <span style={{ color:GREEN_DARK, fontSize:"10px" }}>cycles remaining</span>
            <button onClick={()=>del(debt_item.id)} style={{ ...sI, padding:"2px 6px", cursor:"pointer", color:"#664444" }}>✕</button>
          </div>
        </div>
      ))}
      <button onClick={addDebt}
        style={{ background:"none", border:`1px solid #3a2a2a`, color:"#664444",
          fontFamily:MONO, fontSize:"10px", letterSpacing:"0.1em", padding:"5px 14px", cursor:"pointer", marginTop:"6px" }}>
        + ADD DEBTOR
      </button>
    </div>
  );
}

function PortfolioPanel({ portfolio, setPortfolio, stocks, wardenSet, KEYS }) {
  const totalValue = portfolio.reduce((sum, holding) => { const st = stocks.find(x=>x.name===holding.company); return sum + (st ? st.price * holding.shares : 0); }, 0);
  const sI = { background:"transparent", border:`1px solid #1a2a3a`, color:"#aabbcc", fontFamily:MONO, fontSize:"11px", padding:"4px 8px" };
  const btnS = { background:"none", border:`1px solid #1a2a3a`, color:"#6688aa", fontFamily:MONO, fontSize:"13px", padding:"2px 9px", cursor:"pointer", lineHeight:1 };
  const add = () => {
    const co = stocks.find(s=>!s.is_collapsed)?.name || "";
    const st = stocks.find(s=>s.name===co);
    const next=[...portfolio,{id:Date.now(),company:co,shares:0,grantPrice:st?.price||0,lockScenarios:0}];
    setPortfolio(next); wardenSet(KEYS.portfolio,next);
  };
  const upd = (id,p) => { const next=portfolio.map(item=>item.id===id?{...item,...p}:item); setPortfolio(next); wardenSet(KEYS.portfolio,next); };
  const del = (id) => { const next=portfolio.filter(item=>item.id!==id); setPortfolio(next); wardenSet(KEYS.portfolio,next); };
  return (
    <div>
      {portfolio.length > 0 && (
        <div style={{ color:"#88ccff", fontSize:"14px", marginBottom:"12px" }}>
          PORTFOLIO VALUE: {totalValue.toLocaleString()}cr
        </div>
      )}
      {portfolio.length === 0 && <div style={{ color:GREEN_DARK, fontSize:"11px", padding:"10px 0" }}>No holdings. Equity payouts (PAYOUT tab) lock shares here automatically.</div>}
      {portfolio.map(holding => {
        const st = stocks.find(x=>x.name===holding.company);
        const cur = st?.price||0;
        const val = cur * holding.shares;
        const gl = (cur - (holding.grantPrice||cur)) * holding.shares;
        const locked = holding.lockScenarios > 0;
        return (
          <div key={holding.id} style={{ border:`1px solid #1a2a3a`, padding:"10px 12px", marginBottom:"8px" }}>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center", marginBottom:"6px" }}>
              <select value={holding.company} onChange={e=>{
                const ns=stocks.find(s=>s.name===e.target.value);
                upd(holding.id,{company:e.target.value,grantPrice:ns?.price||holding.grantPrice});
              }} style={{ ...sI, flex:1, minWidth:"140px" }}>
                {stocks.filter(s=>!s.is_collapsed).map(s=><option key={s.name}>{s.name}</option>)}
              </select>
              <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                <button onClick={()=>upd(holding.id,{shares:Math.max(0,(holding.shares||0)-1)})} style={btnS}>−</button>
                <span style={{ color:"#aabbcc", minWidth:"32px", textAlign:"center", fontSize:"13px" }}>{holding.shares||0}</span>
                <button onClick={()=>upd(holding.id,{shares:(holding.shares||0)+1})} style={btnS}>+</button>
                <span style={{ color:GREEN_DARK, fontSize:"10px", marginLeft:"2px" }}>shares</span>
              </div>
              <button onClick={()=>del(holding.id)} style={{ ...sI, padding:"2px 7px", cursor:"pointer", color:"#664444", marginLeft:"auto" }}>✕</button>
            </div>
            <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", fontSize:"11px" }}>
              <span style={{ color:GREEN_DARK }}>Grant: <span style={{ color:"#6688aa" }}>{(holding.grantPrice||0).toLocaleString()}cr</span></span>
              <span style={{ color:GREEN_DARK }}>Now: <span style={{ color:"#88bbff" }}>{cur.toLocaleString()}cr</span></span>
              <span style={{ color:GREEN_DARK }}>Value: <span style={{ color:"#aaccee" }}>{val.toLocaleString()}cr</span></span>
              <span style={{ color: gl>=0?GREEN:"#cc5555" }}>G/L: {gl>=0?"+":""}{gl.toLocaleString()}cr</span>
              {locked
                ? <span style={{ color:AMBER }}>🔒 {holding.lockScenarios} scenario{holding.lockScenarios!==1?"s":""} locked
                    <button onClick={()=>upd(holding.id,{lockScenarios:0})} style={{ ...sI, padding:"0px 5px", cursor:"pointer", fontSize:"9px", marginLeft:"6px", color:GREEN_DARK }}>UNLOCK</button>
                  </span>
                : <span style={{ color: GREEN }}>● AVAILABLE</span>}
            </div>
          </div>
        );
      })}
      <button onClick={add} style={{ background:"none", border:`1px solid #1a2a3a`, color:"#4a6a8a", fontFamily:MONO, fontSize:"10px", letterSpacing:"0.1em", padding:"5px 14px", cursor:"pointer", marginTop:"4px" }}>+ ADD HOLDING</button>
    </div>
  );
}

function ShipAccountPanel({ crew, setCrew, rollConfig, setRollConfig, saveSettings, wardenSet, KEYS }) {
  const shipBalance = crew.shipBalance || 0;
  const shipExpenses = crew.shipExpenses || [];
  const shipName = crew.shipName || "";
  const [amount, setAmount] = useState("");
  const [txLabel, setTxLabel] = useState("");
  const sI = { background:"transparent", border:`1px solid ${GREEN_DARK}`, color:HEADER_GREEN, fontFamily:MONO, fontSize:"11px", padding:"4px 8px" };
  const upd = (patch) => { const next={...crew,...patch}; setCrew(next); wardenSet(KEYS.crew, next); };
  const transact = (type) => {
    const val = parseFloat(amount)||0; if (!val) return;
    const signed = type === "withdraw" ? -val : val;
    const next = { ...crew, shipBalance: shipBalance + signed,
      shipExpenses: [...shipExpenses, {id:Date.now(), label:txLabel||(type==="deposit"?"Deposit":"Expense"), amount:signed}].slice(-20) };
    setCrew(next); wardenSet(KEYS.crew, next); setAmount(""); setTxLabel("");
  };
  const ownerType = rollConfig.ownershipType || "company";
  const BANKRUPTCY = [
    ["Critical Success","Turn a profit. Choose one: 1 Major Upgrade, repair 1d5 Major Repairs, pay each crew 1d5×100kcr, or raise Save by 1d10."],
    ["Success","Scrape by. Choose one: 1 Minor Upgrade, 1 Minor Repair, pay each crew 2d10 months salary, or raise Save by 1d5."],
    ["Failure","Fall 1d10mcr in debt to ruthless lenders."],
    ["Critical Failure","Company collapses. Massive debt to the worst people imaginable."],
  ];
  return (
    <div>
      {/* Account name + ownership settings */}
      <div style={{ marginBottom:"16px", display:"flex", gap:"16px", flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ flex:"1 1 200px" }}>
          <div style={{ color:GREEN_MID, fontSize:"10px", letterSpacing:"0.1em", marginBottom:"5px" }}>ACCOUNT NAME</div>
          <input value={shipName} onChange={e=>upd({shipName:e.target.value})}
            placeholder="Diamond Club, LLC"
            style={{ ...sI, width:"100%", boxSizing:"border-box" }} />
        </div>
        <div style={{ flex:"1 1 200px" }}>
          <div style={{ color:GREEN_MID, fontSize:"10px", letterSpacing:"0.1em", marginBottom:"5px" }}>OWNERSHIP TYPE</div>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
            {[["company","COMPANY"],["owner","OWNER-OP"],["freelancer","FREELANCER"]].map(([val,lbl]) => (
              <button key={val} onClick={() => { const next={...rollConfig,ownershipType:val}; setRollConfig(next); saveSettings({rollConfig:next}); }}
                style={{ background:ownerType===val?"rgba(68,200,68,0.08)":"none",
                  border:`1px solid ${ownerType===val?GREEN_MID:GREEN_DARK}`,
                  color:ownerType===val?GREEN_MID:GREEN_DARK,
                  fontFamily:MONO, fontSize:"10px", padding:"4px 8px", cursor:"pointer", whiteSpace:"nowrap" }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ flex:"1 1 200px" }}>
          <div style={{ color:GREEN_MID, fontSize:"10px", letterSpacing:"0.1em", marginBottom:"5px" }}>CREW PAYMENT MODE</div>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
            {[["all","ALL SAME"],["per","PER CREW"]].map(([val,lbl]) => (
              <button key={val} onClick={() => { const next={...rollConfig,crewPaymentMode:val}; setRollConfig(next); saveSettings({rollConfig:next}); }}
                style={{ background:(rollConfig.crewPaymentMode||"all")===val?"rgba(68,200,68,0.08)":"none",
                  border:`1px solid ${(rollConfig.crewPaymentMode||"all")===val?GREEN_MID:GREEN_DARK}`,
                  color:(rollConfig.crewPaymentMode||"all")===val?GREEN_MID:GREEN_DARK,
                  fontFamily:MONO, fontSize:"10px", padding:"4px 8px", cursor:"pointer", whiteSpace:"nowrap" }}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding:"12px", border:`1px solid ${GREEN_DARK}`, background:"rgba(0,5,15,0.5)", marginBottom:"16px", display:"inline-block" }}>
        <div style={{ color:HEADER_GREEN, fontSize:"22px", fontWeight:"bold" }}>{shipBalance.toLocaleString()}cr</div>
        <div style={{ color:GREEN_MID, fontSize:"10px" }}>{shipName ? shipName.toUpperCase() + " — ACCOUNT BALANCE" : "ACCOUNT BALANCE"}</div>
        <div style={{ color:GREEN_DARK, fontSize:"10px", marginTop:"2px" }}>Ownership: {ownerType === "company" ? "Company / Military" : ownerType === "owner" ? "Owner-Operator" : "Freelancer"}</div>
      </div>
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap", alignItems:"center", rowGap:"8px" }}>
        <input value={txLabel} onChange={e=>setTxLabel(e.target.value)} placeholder="Label (optional)" style={{ ...sI, flex:1, minWidth:"110px" }} />
        <input type="number" min={0} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount (cr)" style={{ ...sI, width:"110px" }} />
        <button onClick={()=>transact("deposit")} style={{ background:"none", border:`1px solid #224422`, color:GREEN, fontFamily:MONO, fontSize:"10px", padding:"5px 12px", cursor:"pointer" }}>+ DEPOSIT</button>
        <button onClick={()=>transact("withdraw")} style={{ background:"none", border:`1px solid #442222`, color:"#cc5555", fontFamily:MONO, fontSize:"10px", padding:"5px 12px", cursor:"pointer" }}>− WITHDRAW</button>
      </div>
      {shipExpenses.length > 0 && (
        <div style={{ marginBottom:"16px" }}>
          <div style={{ color:GREEN_DARK, fontSize:"10px", marginBottom:"6px" }}>RECENT TRANSACTIONS (last 20)</div>
          {[...shipExpenses].reverse().slice(0,10).map(tx => (
            <div key={tx.id} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:`1px solid #0a1520`, fontSize:"11px" }}>
              <span style={{ color:"#6688aa" }}>{tx.label}</span>
              <span style={{ color:tx.amount>=0?GREEN:"#cc5555" }}>{tx.amount>=0?"+":""}{tx.amount.toLocaleString()}cr</span>
            </div>
          ))}
        </div>
      )}
      {ownerType === "owner" && (
        <div style={{ borderTop:`1px solid #1a2a3a`, paddingTop:"14px" }}>
          <div style={{ color:AMBER, fontSize:"10px", letterSpacing:"0.15em", marginBottom:"8px" }}>BANKRUPTCY SAVE — OWNER-OPERATOR</div>
          <div style={{ color:GREEN_DARK, fontSize:"10px", marginBottom:"10px" }}>Roll quarterly or annually. Make a Luck Save.</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"10px" }}>
            <tbody>{BANKRUPTCY.map(([r,c]) => (
              <tr key={r} style={{ borderTop:`1px solid #0a1520` }}>
                <td style={{ padding:"5px 8px 5px 0", color:r.includes("Critical S")?GREEN:r.includes("Success")?"#88bb88":r.includes("Critical F")?"#cc3333":"#cc7755", minWidth:"100px", whiteSpace:"nowrap" }}>{r}</td>
                <td style={{ padding:"5px 0", color:"#8899aa", lineHeight:1.5 }}>{c}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const CONTRACTOR_TYPES = [
  ["Archaeologist", 6000],
  ["Asteroid Miner", 2000],
  ["Android", 6000],
  ["Bodyguard", 2000],
  ["Captain", 10000],
  ["Chaplain", 750],
  ["Corporate Fixer", 24000],
  ["Doctor", 8000],
  ["Engineer", 7000],
  ["Hacker", 8000],
  ["Marine (Grunt)", 1500],
  ["Marine (Officer)", 3500],
  ["Pilot", 3000],
  ["Pioneer", 1500],
  ["Scientist", 4000],
  ["Survival Guide", 3000],
  ["Surgeon", 12000],
  ["Teamster", 2000],
  ["Therapist", 3000],
  ["Void Urchin", 100],
];

function ContractorPanel({ crew, setCrew, wardenSet, KEYS }) {
  const contractors = crew.contractors || [];
  const sI = { background:"transparent", border:`1px solid #1a2a3a`, color:"#aabbcc", fontFamily:MONO, fontSize:"11px", padding:"4px 8px" };
  const add = () => {
    const next={...crew,contractors:[...contractors,{id:Date.now(),name:"",occupation:"",salary:0,paid:false}]};
    setCrew(next); wardenSet(KEYS.crew,next);
  };
  const upd = (id,p) => { const next={...crew,contractors:contractors.map(ct=>ct.id===id?{...ct,...p}:ct)}; setCrew(next); wardenSet(KEYS.crew,next); };
  const del = (id) => { const next={...crew,contractors:contractors.filter(ct=>ct.id!==id)}; setCrew(next); wardenSet(KEYS.crew,next); };
  return (
    <div>
      <div style={{ color:"#6688aa", fontSize:"10px", marginBottom:"12px", borderBottom:`1px solid #1a2a3a`, paddingBottom:"8px" }}>
        Check Contractor Loyalty if Paid in Full — update in Mothership Companion App.
      </div>
      {contractors.length === 0 && <div style={{ color:GREEN_DARK, fontSize:"11px", padding:"8px 0" }}>No active contractors.</div>}
      {contractors.map(ct => (
        <div key={ct.id} style={{ marginBottom:"8px", padding:"10px 12px", border:`1px solid ${ct.paid?"#1a3a2a":"#2a1a1a"}` }}>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center", marginBottom:"6px" }}>
            {/* Occupation dropdown — auto-fills salary */}
            <select value={ct.occupation||""} onChange={e => {
              const occ = e.target.value;
              const match = CONTRACTOR_TYPES.find(([t]) => t === occ);
              upd(ct.id, { occupation: occ, salary: match ? match[1] : ct.salary });
            }} style={{ ...sI, minWidth:"160px" }}>
              <option value="">— Select type —</option>
              {CONTRACTOR_TYPES.map(([t]) => <option key={t}>{t}</option>)}
            </select>
            {/* Freeform name */}
            <input value={ct.name} onChange={e=>upd(ct.id,{name:e.target.value})}
              placeholder="Name (optional)"
              style={{ ...sI, flex:1, minWidth:"120px" }} />
            <button onClick={()=>del(ct.id)} style={{ ...sI, padding:"2px 6px", cursor:"pointer", color:"#664444", marginLeft:"auto" }}>✕</button>
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
            {/* Salary — editable, pre-filled by occupation */}
            <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <input type="number" min={0} value={ct.salary}
                onChange={e=>upd(ct.id,{salary:parseFloat(e.target.value)||0})}
                style={{ ...sI, width:"80px" }} />
              <span style={{ color:GREEN_DARK, fontSize:"10px" }}>cr/mo</span>
            </div>
            <button onClick={()=>upd(ct.id,{paid:!ct.paid})}
              style={{ background:"none", border:`1px solid ${ct.paid?"#224422":"#442222"}`,
                color:ct.paid?GREEN:"#cc5555",
                fontFamily:MONO, fontSize:"10px", padding:"3px 12px", cursor:"pointer" }}>
              {ct.paid ? "✓ PAID" : "UNPAID"}
            </button>
            {ct.paid && <span style={{ color:GREEN_MID, fontSize:"10px" }}>⚑ Roll loyalty</span>}
          </div>
        </div>
      ))}
      <button onClick={add} style={{ background:"none", border:`1px solid #1a2a3a`, color:GREEN_MID, fontFamily:MONO, fontSize:"10px", letterSpacing:"0.1em", padding:"5px 14px", cursor:"pointer", marginTop:"6px" }}>+ ADD CONTRACTOR</button>
    </div>
  );
}

function CatalogPanel({ catalogs, setCatalogs, stocks, wardenSet, KEYS }) {
  const [selCo, setSelCo] = useState(stocks.find(s=>!s.is_collapsed)?.name || "");
  const cat = catalogs[selCo] || { status:"hidden", ineligibleReason:"", benefits:"", items:[] };
  const sI = { background:"transparent", border:`1px solid #1a2a3a`, color:"#aabbcc", fontFamily:MONO, fontSize:"11px", padding:"4px 8px" };
  const STATUS_OPTS = ["hidden","unlocked","revoked","ineligible"];
  const STATUS_COLORS = { hidden:GREEN_DARK, unlocked:GREEN, revoked:"#cc5555", ineligible:AMBER };
  const upd = (patch) => { const next={...catalogs,[selCo]:{...cat,...patch}}; setCatalogs(next); wardenSet(KEYS.catalogs,next); };
  const addItem = () => upd({ items:[...(cat.items||[]),{id:Date.now(),name:"",price:"",notes:""}] });
  const updItem = (id,p) => upd({ items:(cat.items||[]).map(it=>it.id===id?{...it,...p}:it) });
  const delItem = (id) => upd({ items:(cat.items||[]).filter(it=>it.id!==id) });
  return (
    <div>
      <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"14px", flexWrap:"wrap" }}>
        <select value={selCo} onChange={e=>setSelCo(e.target.value)} style={{ ...sI, minWidth:"160px" }}>
          {stocks.filter(s=>!s.is_collapsed).map(s=><option key={s.name}>{s.name}</option>)}
        </select>
        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
          {STATUS_OPTS.map(st => (
            <button key={st} onClick={()=>upd({status:st})}
              style={{ background:cat.status===st?"rgba(255,255,255,0.04)":"none",
                border:`1px solid ${cat.status===st?STATUS_COLORS[st]:"#1a2a3a"}`,
                color:cat.status===st?STATUS_COLORS[st]:GREEN_DARK,
                fontFamily:MONO, fontSize:"9px", letterSpacing:"0.1em", padding:"3px 9px", cursor:"pointer" }}>
              {st.toUpperCase()}
            </button>
          ))}
        </div>
        <span style={{ color:STATUS_COLORS[cat.status]||GREEN_DARK, fontSize:"10px" }}>{cat.status.toUpperCase()}</span>
      </div>
      {cat.status === "ineligible" && (
        <input value={cat.ineligibleReason||""} onChange={e=>upd({ineligibleReason:e.target.value})}
          placeholder="Reason (e.g. company collapsed, absorbed by OmniCorp)"
          style={{ ...sI, width:"100%", boxSizing:"border-box", marginBottom:"10px" }} />
      )}
      <div style={{ marginBottom:"12px" }}>
        <div style={{ color:GREEN_DARK, fontSize:"10px", marginBottom:"5px" }}>CORPORATE PERKS / BENEFITS TEXT</div>
        <textarea value={cat.benefits||""} onChange={e=>upd({benefits:e.target.value})}
          placeholder="Perks, discounts, reward track description..."
          rows={3} style={{ ...sI, width:"100%", boxSizing:"border-box", resize:"vertical", lineHeight:1.5 }} />
      </div>
      <div>
        <div style={{ color:GREEN_DARK, fontSize:"10px", marginBottom:"8px" }}>CATALOG ITEMS</div>
        {(cat.items||[]).map(it => (
          <div key={it.id} style={{ display:"flex", gap:"6px", marginBottom:"5px", alignItems:"center", flexWrap:"wrap" }}>
            <input value={it.name} onChange={e=>updItem(it.id,{name:e.target.value})} placeholder="Item name" style={{ ...sI, flex:"2 1 100px", minWidth:"80px" }} />
            <input value={it.price} onChange={e=>updItem(it.id,{price:e.target.value})} placeholder="Price" style={{ ...sI, width:"70px", minWidth:"60px" }} />
            <input value={it.notes} onChange={e=>updItem(it.id,{notes:e.target.value})} placeholder="Notes" style={{ ...sI, flex:"3 1 100px", minWidth:"80px" }} />
            <button onClick={()=>delItem(it.id)} style={{ ...sI, padding:"1px 6px", cursor:"pointer", color:"#664444" }}>✕</button>
          </div>
        ))}
        <button onClick={addItem} style={{ background:"none", border:`1px solid #1a2a3a`, color:GREEN_MID, fontFamily:MONO, fontSize:"10px", padding:"4px 12px", cursor:"pointer" }}>+ ADD ITEM</button>
      </div>
    </div>
  );
}

// ─── Player Session Tab ────────────────────────────────────────────────────────

const SHORE_LEAVE_TABLE = [
  ["X","1d100×10kcr","2d10[+]"],["C","2d10×100cr","1d5"],["B","2d10×1kcr","1d10"],["A","2d10×10kcr","2d10"],["S","2d10×100kcr","All"],
];
const SHORE_LEAVE_RESULTS = [
  ["Critical Success","Convert maximum stress for port class. Relieve all remainder."],
  ["Success","Convert stress into permanent Save improvements (1 Stress = +1 to any Save). Relieve remainder to Minimum Stress."],
  ["Failure","No conversion. All Stress relieved to Minimum Stress. Gain 1 Stress for the failed save."],
  ["Critical Failure","No conversion. No relief. Make immediate Panic Check."],
];
const TREATMENTS_TABLE = [
  ["Artificial Wellness Counselor","150cr","Advantage on next Rest Save"],
  ["Immersive Slicksim Therapy","1kcr","Advantage on next Shore Leave Sanity Save"],
  ["Medpod","6kcr","Heals 1 Wound"],
  ["Pseudoflesh Injection","18kcr","Restores lost Stats"],
  ["Deep Tissue Nanogel Massage","24kcr","Reduces Minimum Stress by 1"],
  ["Psychosurgery","28kcr","Removes a Condition or Trauma Response"],
  ["Cognitive Defragmentation","100kcr","Removes all Conditions, resets Minimum Stress to 2"],
];
const TRAINING_TABLE = [
  ["Trained","None","2","10kcr","+10"],
  ["Expert","1 Trained","4","50kcr","+15"],
  ["Master","1 Expert","6","200kcr","+20"],
];
const MILITARY_RESULTS = [
  ["Critical Success","Military Training, Athletics, one Expert Skill. +10 Combat, −10 Stat of choice. Marine Trauma Response."],
  ["Success","Military Training, Athletics, two Trained Skills. +10 Combat, −10 Stat of choice. Marine Trauma Response."],
  ["Failure","Military Training, Athletics, one Trained Skill. Marine Trauma Response."],
  ["Critical Failure","Killed in Action."],
];
const CHECKLIST_ITEMS = [
  "Collect pay",
  "Buy/sell unlocked stocks",
  "Roll contractor loyalty in Mothership Companion",
  "Get treatment",
  "Rest or take shore leave",
  "Train skills if applicable",
  "Check debt obligations",
  "Ship repairs and maintenance",
  "Go shopping",
];

function PlayerSessionTab({ debt, crew, rollConfig, stocks }) {
  const [months, setMonths] = useState(1);
  const [jumps, setJumps] = useState(0);
  const [hazard, setHazard] = useState("N/A");
  const [trained, setTrained] = useState(0);
  const [expert, setExpert] = useState(0);
  const [master, setMaster] = useState(0);
  const [negoPct, setNegoPct] = useState(0);
  const [equityCorp, setEquityCorp] = useState("");
  const [open, setOpen] = useState({ checklist:false, debt:false, contractors:false, payout:false, medical:false, shore:false, training:false, repairs:false });

  // Prevent page scroll-to-top when dropdowns or state updates cause re-layout
  const scrollAnchorRef = useRef(null);
  const lockScroll = (fn) => {
    const y = window.scrollY;
    fn();
    requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: "instant" }); });
  };

  const toggle = (k) => {
    const y = window.scrollY;
    setOpen(o => ({...o,[k]:!o[k]}));
    requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: "instant" }); });
  };

  const salary = trained*500 + expert*1000 + master*2000;
  const base = salary * months + salary * months * HAZARD_MULT[hazard];
  const total = Math.round(base * (1 + negoPct/100) + jumps*1000);
  const timeUnit = rollConfig.trainingTimeUnit === "years" ? "years" : "months";
  const cycleWord = (rollConfig.cycleLabel || "Cycle").toLowerCase();

  // Mobile-safe: font-size 16px on all selects/inputs prevents iOS auto-zoom scroll-jump
  const sel = {
    background:"transparent", border:`1px solid rgba(68,200,68,0.25)`,
    color:GREEN_MID, fontFamily:MONO, fontSize:"16px",
    padding:"10px 12px", minHeight:"44px", width:"100%", boxSizing:"border-box",
    WebkitAppearance:"none", appearance:"none", borderRadius:0,
  };
  const stepBtn = {
    background:"none", border:`1px solid rgba(68,200,68,0.25)`, color:GREEN_MID,
    fontFamily:MONO, fontSize:"20px", lineHeight:1,
    minWidth:"44px", minHeight:"44px", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
  };
  const valDisplay = {
    color:GREEN_MID, minWidth:"36px", textAlign:"center",
    fontSize:"18px", fontFamily:MONO, userSelect:"none",
  };
  const lbl = { color:GREEN_MID, fontSize:"12px", letterSpacing:"0.15em", marginBottom:"6px", display:"block" };
  const TH = { padding:"6px 8px", textAlign:"left", color:GREEN_DARK, fontWeight:"normal", fontSize:"11px" };
  const TD = { padding:"7px 8px", color:GREEN_MID, fontSize:"12px", borderTop:`1px solid rgba(68,100,68,0.2)` };

  const Stepper = ({ value, onChange, min=0 }) => (
    <div style={{ display:"flex", alignItems:"center", gap:"4px", justifyContent:"center" }}>
      <button onClick={()=>onChange(v=>Math.max(min,v-1))} style={{ ...stepBtn, minWidth:"40px", minHeight:"40px" }}>−</button>
      <span style={{ ...valDisplay, minWidth:"28px" }}>{value}</span>
      <button onClick={()=>onChange(v=>v+1)} style={{ ...stepBtn, minWidth:"40px", minHeight:"40px" }}>+</button>
    </div>
  );

  const Section = ({ id, title, badge, children }) => (
    <div style={{ marginBottom:"20px" }}>
      <button onClick={()=>toggle(id)}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%",
          background:"none", border:"none", borderBottom:`1px solid ${GREEN_DARK}`,
          paddingBottom:"8px", marginBottom: open[id]?"14px":"0",
          cursor:"pointer", fontFamily:MONO, textAlign:"left", minHeight:"44px" }}>
        <span style={{ color:HEADER_GREEN, fontSize:"12px", letterSpacing:"0.2em" }}>
          {title}{badge ? <span style={{ color:"#cc6666", marginLeft:"10px" }}>{badge}</span> : null}
        </span>
        <span style={{ color:GREEN_DARK, fontSize:"14px", paddingLeft:"12px" }}>{open[id]?"▲":"▼"}</span>
      </button>
      {open[id] && children}
    </div>
  );

  return (
    <div ref={scrollAnchorRef} style={{ color:GREEN_MID, overflowAnchor:"none" }}>
      <Section id="payout" title="PAYOUT CALCULATOR">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
          {[["MONTHS",months,setMonths,1],["JUMPS (×1kcr)",jumps,setJumps,0]].map(([label,val,set,min]) => (
            <div key={label}>
              <span style={lbl}>{label}</span>
              <Stepper value={val} onChange={set} min={min} />
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
          <div>
            <span style={lbl}>HAZARD</span>
            <div style={{ position:"relative" }}>
              <select value={hazard} onChange={e=>lockScroll(()=>setHazard(e.target.value))} style={sel}>
                {HAZARD_OPTS.map(opt=><option key={opt}>{opt}</option>)}
              </select>
              <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", color:GREEN_DARK, pointerEvents:"none", fontSize:"12px" }}>▾</span>
            </div>
          </div>
          <div>
            <span style={lbl}>NEGOTIATION</span>
            <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
              <button onClick={()=>setNegoPct(p=>Math.max(-25,p-5))} style={stepBtn}>−</button>
              <span style={{ ...valDisplay, color:negoPct<0?"#cc6666":negoPct>0?HEADER_GREEN:GREEN_DARK, minWidth:"48px", fontSize:"17px" }}>
                {negoPct>0?"+":""}{negoPct}%
              </span>
              <button onClick={()=>setNegoPct(p=>Math.min(25,p+5))} style={stepBtn}>+</button>
            </div>
          </div>
        </div>
        <div style={{ marginBottom:"16px" }}>
          <span style={lbl}>SKILL TIERS</span>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"8px" }}>
            {[["T",trained,setTrained,500],["E",expert,setExpert,1000],["M",master,setMaster,2000]].map(([label,val,set,rate]) => (
              <div key={label} style={{ display:"flex", flexDirection:"column", gap:"4px", alignItems:"center",
                border:`1px solid ${GREEN_DARK}`, padding:"8px 4px", background:"rgba(0,20,0,0.2)", minWidth:0 }}>
                <span style={{ color:GREEN_MID, fontSize:"11px", letterSpacing:"0.1em", textAlign:"center" }}>
                  {label} <span style={{ color:GREEN_DARK }}>×{rate >= 1000 ? (rate/1000)+"k" : rate}</span>
                </span>
                <Stepper value={val} onChange={set} />
              </div>
            ))}
          </div>
          {salary > 0 && (
            <div style={{ color:GREEN_MID, fontSize:"13px", marginTop:"10px" }}>
              Base salary: <span style={{ color:GREEN_MID }}>{salary.toLocaleString()}cr/mo</span>
            </div>
          )}
        </div>
        {salary > 0 && (
          <div style={{ padding:"14px 16px", border:`1px solid ${GREEN_DARK}`, background:"rgba(0,20,0,0.3)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <span style={{ color:GREEN_MID, fontSize:"13px" }}>CASH PAYOUT</span>
              <span style={{ color:HEADER_GREEN, fontSize:"22px", fontWeight:"bold" }}>{total.toLocaleString()}cr</span>
            </div>
            <div style={{ borderTop:`1px solid rgba(68,100,68,0.2)`, paddingTop:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <span style={{ color:GREEN_MID, fontSize:"13px" }}>EQUITY OPTION</span>
                <span style={{ color:GREEN_MID, fontSize:"14px" }}>{Math.round(total*0.5).toLocaleString()}cr cash</span>
              </div>
              <div>
                <span style={lbl}>+ SHARES FROM CORP</span>
                <div style={{ position:"relative" }}>
                  <select value={equityCorp} onChange={e=>lockScroll(()=>setEquityCorp(e.target.value))} style={sel}>
                    <option value="">— select corporation —</option>
                    {(stocks||[]).filter(s=>!s.is_collapsed).map(s=>(
                      <option key={s.name} value={s.name}>{s.name} ({s.price.toLocaleString()}cr)</option>
                    ))}
                  </select>
                  <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", color:GREEN_DARK, pointerEvents:"none", fontSize:"12px" }}>▾</span>
                </div>
                {equityCorp && (() => {
                  const st = (stocks||[]).find(s=>s.name===equityCorp);
                  const price = st?.price || 0;
                  const equityCash = Math.round(total * 0.5);
                  const shares = price > 0 ? Math.ceil(equityCash * 1.2 / price) : 0;
                  return price > 0 ? (
                    <div style={{ marginTop:"10px", padding:"10px 12px", background:"rgba(68,200,68,0.05)", border:`1px solid rgba(68,200,68,0.15)` }}>
                      <span style={{ color:HEADER_GREEN, fontSize:"20px", fontWeight:"bold" }}>{shares} share{shares!==1?"s":""}</span>
                      <span style={{ color:GREEN_DARK, fontSize:"12px", marginLeft:"10px" }}>@ {price.toLocaleString()}cr each</span>
                    </div>
                  ) : <div style={{ color:GREEN_DARK, fontSize:"12px", marginTop:"8px" }}>no price data</div>;
                })()}
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section id="checklist" title="POST-SESSION CHECKLIST">
        {CHECKLIST_ITEMS.map((item, i) => (
          <div key={i} style={{ display:"flex", gap:"12px", padding:"10px 0",
            borderBottom:`1px solid rgba(68,100,68,0.15)`, fontSize:"13px", lineHeight:1.5 }}>
            <span style={{ color:GREEN_DARK, minWidth:"20px", flexShrink:0 }}>{i+1}.</span>
            <span>{item}</span>
          </div>
        ))}
      </Section>

      {debt.length > 0 && (
        <Section id="debt" title="DEBT OBLIGATIONS" badge={`+${debt.length} MIN STRESS`}>
          {debt.map(debt_item => (
            <div key={debt_item.id} style={{ padding:"10px 0", borderBottom:`1px solid rgba(68,100,68,0.15)`,
              fontSize:"13px", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"6px" }}>
              <span>{debt_item.creditor || "Unknown creditor"}</span>
              <span style={{ color:"#cc7755" }}>
                {(parseFloat(debt_item.monthlyPayment)||0).toLocaleString()}cr/mo
                <span style={{ color:"#664433", marginLeft:"8px" }}>· {debt_item.termMonths} {cycleWord}s left</span>
              </span>
            </div>
          ))}
        </Section>
      )}

      {(crew?.contractors?.length > 0) && (
        <Section id="contractors" title="CONTRACTORS" badge={(() => {
          const unpaid = (crew.contractors||[]).filter(ct=>!ct.paid);
          if (unpaid.length === 0) return null;
          const total = unpaid.reduce((sum,ct)=>sum+(ct.salary||0),0);
          return `${unpaid.length} UNPAID · ${total.toLocaleString()}cr/mo`;
        })()}>
          {(crew.contractors || []).map(ct => (
            <div key={ct.id} style={{ padding:"10px 0", borderBottom:`1px solid rgba(68,100,68,0.15)`,
              fontSize:"13px", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"6px", alignItems:"center" }}>
              <span style={{ color:GREEN_MID }}>
                {ct.name || ct.occupation || "Unnamed"}
                {ct.name && ct.occupation &&
                  <span style={{ color:GREEN_MID, marginLeft:"10px", fontSize:"11px" }}>{ct.occupation}</span>}
              </span>
              <span style={{ color: ct.paid ? GREEN : "#cc7755" }}>
                {(ct.salary||0).toLocaleString()}cr/mo · {ct.paid ? "PAID" : "UNPAID"}
              </span>
            </div>
          ))}
        </Section>
      )}

      <Section id="medical" title="MEDICAL TREATMENTS">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"10px" }}>
            <thead><tr>{["TREATMENT","COST","EFFECT"].map(col=><th key={col} style={TH}>{col}</th>)}</tr></thead>
            <tbody>{TREATMENTS_TABLE.map(([t,c,e])=>(
              <tr key={t}>
                <td style={TD}>{t}</td>
                <td style={{ ...TD, color:"#88aacc", whiteSpace:"nowrap" }}>{c}</td>
                <td style={TD}>{e}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ color:GREEN_DARK, fontSize:"12px", lineHeight:1.7 }}>
          <span style={{ color:GREEN_MID }}>REST SAVE:</span> Roll 1d100 under worst Save in a safe location. On success, reduce Stress by the ones digit. Advantage from: consensual sex, drug use, heavy drinking, or Wellness Counselor.
        </div>
      </Section>

      <Section id="shore" title="SHORE LEAVE">
        <div style={{ color:GREEN_DARK, fontSize:"12px", marginBottom:"10px" }}>Duration: 2d10 days. Make a Sanity Save.</div>
        <div style={{ overflowX:"auto", marginBottom:"12px" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["PORT","COST","STRESS CONVERTED"].map(col=><th key={col} style={TH}>{col}</th>)}</tr></thead>
            <tbody>{SHORE_LEAVE_TABLE.map(([p,c,s])=>(
              <tr key={p}><td style={{ ...TD, color:AMBER }}>{p}</td><td style={{ ...TD, color:"#88aacc" }}>{c}</td><td style={{ ...TD, color:HEADER_GREEN }}>{s}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["RESULT","OUTCOME"].map(col=><th key={col} style={TH}>{col}</th>)}</tr></thead>
            <tbody>{SHORE_LEAVE_RESULTS.map(([r,o])=>(
              <tr key={r}>
                <td style={{ ...TD, whiteSpace:"nowrap", paddingRight:"16px",
                  color:r.includes("Critical S")?HEADER_GREEN:r.includes("Success")?GREEN_MID:r.includes("Critical F")?"#cc3333":"#cc7755" }}>{r}</td>
                <td style={TD}>{o}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      <Section id="training" title={`SKILL TRAINING — ${timeUnit.toUpperCase()}`}>
        <div style={{ color:GREEN_DARK, fontSize:"11px", marginBottom:"10px", fontStyle:"italic" }}>
          Must meet skill pre-requisites to be eligible for training.
        </div>
        <div style={{ overflowX:"auto", marginBottom:"14px" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["TIER","DURATION","COST","BONUS"].map(col=><th key={col} style={TH}>{col}</th>)}</tr></thead>
            <tbody>{TRAINING_TABLE.map(([tier,req,dur,cost,bonus])=>(
              <tr key={tier}>
                <td style={{ ...TD, color:AMBER }}>{tier}</td>
                <td style={{ ...TD, color:HEADER_GREEN }}>{dur} {timeUnit}</td>
                <td style={{ ...TD, color:"#88aacc" }}>{cost}</td>
                <td style={{ ...TD, color:HEADER_GREEN }}>{bonus}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ color:GREEN_MID, fontSize:"12px", marginBottom:"6px" }}>MILITARY ENLISTMENT (Alternative Path)</div>
        <div style={{ color:GREEN_DARK, fontSize:"12px", lineHeight:1.7, marginBottom:"10px" }}>
          Free. Duration: 6 {timeUnit}. Military covers Room &amp; Board, Medical, and Skill Training. Make a Combat Check on completion.
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["RESULT","OUTCOME"].map(col=><th key={col} style={TH}>{col}</th>)}</tr></thead>
            <tbody>{MILITARY_RESULTS.map(([r,o])=>(
              <tr key={r}>
                <td style={{ ...TD, whiteSpace:"nowrap", paddingRight:"16px",
                  color:r.includes("Critical S")?HEADER_GREEN:r.includes("Success")?GREEN_MID:r.includes("Critical F")?"#cc3333":"#cc7755" }}>{r}</td>
                <td style={TD}>{o}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      <Section id="repairs" title="SHIP REPAIRS & MAINTENANCE">
        <div style={{ color:GREEN_DARK, fontSize:"12px", lineHeight:1.8 }}>
          <div style={{ color:GREEN_MID, marginBottom:"4px" }}>MAJOR REPAIRS</div>
          <div style={{ marginBottom:"12px" }}>Must be done in port. Cost: 1d5mcr × Ship Class per Hull/Megadamage point. Time: months to a year. <span style={{ color:GREEN_MID }}>Machine Shop exception:</span> repair up to 3 MDMG + 3 Hull without port; resupply 200kcr × Ship Class after.</div>
          <div style={{ color:GREEN_MID, marginBottom:"4px" }}>MINOR REPAIRS</div>
          <div style={{ marginBottom:"12px" }}>Done in flight by crew. Time: 2d10 days. Critical Failure escalates to Major Repair.</div>
          <div style={{ color:GREEN_MID, marginBottom:"4px" }}>ANNUAL MAINTENANCE CHECK</div>
          <div style={{ marginBottom:"16px" }}>Roll Systems Check annually. Failure: roll Maintenance Issues Table, all crew +1 Stress. Critical Failure: two rolls, entire crew Panic Check.</div>
          <div style={{ color:GREEN_MID, marginBottom:"10px" }}>OPERATIONAL COSTS</div>
          <div style={{ overflowX:"auto", marginBottom:"12px" }}>
            <table style={{ borderCollapse:"collapse" }}>
              <thead><tr>{["CLASS","COST / UNIT"].map(col=><th key={col} style={TH}>{col}</th>)}</tr></thead>
              <tbody>
                {[["I","1,000cr (1kcr)"],["II","2,000cr (2kcr)"],["III","5,000cr (5kcr)"],["IV","50,000cr (50kcr)"],["V","100,000cr (100kcr)"]].map(([cls,cost])=>(
                  <tr key={cls}><td style={{ ...TD, paddingRight:"24px" }}>Class-{cls} Fuel</td><td style={{ ...TD, color:"#88aacc" }}>{cost}</td></tr>
                ))}
                <tr><td style={{ ...TD, paddingRight:"24px" }}>Warp Core</td><td style={{ ...TD, color:"#88aacc" }}>1mcr each</td></tr>
                <tr><td style={{ ...TD, paddingRight:"24px" }}>Vessel Tow</td><td style={{ ...TD, color:"#88aacc" }}>500kcr</td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ color:GREEN_MID, marginBottom:"4px" }}>AMMO RESUPPLY</div>
          <div>Check after any engagement using ship weapons. Failure = Disadvantage or auto-fail on future Battle Checks.</div>
        </div>
      </Section>
    </div>
  );
}

// ─── Player View ──────────────────────────────────────────────────────────────

function PlayerView({ stocks, headlines, history, date, yearLabel, cycleLabel, jobs, debt, crew, portfolio, catalogs, rollConfig, theme, setTheme, onWardenAccess, onHoneypot, onRefresh, onSwitchGame }) {
  const [tab, setTab] = useState("ticker"); // "ticker" | "jobs" | "downtime"
  const [showHistory, setShowHistory] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [visible, setVisible] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedStock, setExpandedStock] = useState(null);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

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
            <FictionDate date={date} yearLabel={yearLabel} cycleLabel={cycleLabel} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.2em" }}>● LIVE</div>
              <button onClick={() => setShowQR(q => !q)}
                style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_MID,
                  fontFamily: MONO, fontSize: "9px", letterSpacing: "0.15em",
                  padding: "3px 8px", cursor: "pointer" }}>
                {showQR ? "CLOSE" : "⬛ SHARE"}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code share modal */}
        {showQR && (
          <div style={{ marginBottom: "24px", padding: "20px", border: `1px solid ${GREEN_DARK}`,
            display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
            background: "rgba(0,20,0,0.6)" }}>
            <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.2em" }}>SCAN TO JOIN</div>
            <div style={{ background: "#fff", padding: "10px", lineHeight: 0 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`}
                alt="QR code"
                width={180} height={180}
              />
            </div>
            <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", textAlign: "center",
              maxWidth: "200px", wordBreak: "break-all" }}>
              {window.location.href}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
          {[
            ["ticker","MARKET"],
            ["jobs", jobs.filter(j=>j.status==="active").length > 0 ? `JOBS (${jobs.filter(j=>j.status==="active").length})` : "JOBS"],
            ["downtime", debt.length > 0 ? `DOWNTIME (+${debt.length} STRESS)` : "DOWNTIME"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ background: tab === id ? "rgba(68,255,136,0.06)" : "none",
                border: `1px solid ${tab === id ? GREEN_MID : GREEN_DARK}`,
                color: tab === id ? GREEN_MID : GREEN_DARK,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.2em",
                padding: "5px 16px", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Headlines */}
        {tab === "ticker" && recentHeadlines.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            {recentHeadlines.map((hl, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${i === 0 ? GREEN : GREEN_DARK}`,
                paddingLeft: "12px", marginBottom: "12px", opacity: i === 0 ? 1 : 0.55 }}>
                <div style={{ color: i === 0 ? HEADER_GREEN : GREEN_DIM, fontSize: "12px",
                  letterSpacing: "0.08em", fontWeight: "bold" }}>{hl.headline}</div>
                {hl.subtext && (
                  <div style={{ color: GREEN_MID, fontSize: "11px", marginTop: "2px", letterSpacing: "0.04em" }}>
                    {hl.subtext}
                  </div>
                )}
                <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "3px" }}>
                  <FictionDate date={hl.date} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stock rows — ticker tab only */}
        {tab === "ticker" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "24px" }}>
              <StockRows stocks={stocks} history={history} visible={visible} expandedStock={expandedStock} setExpandedStock={setExpandedStock} catalogs={catalogs} />
            </div>

            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "8px" }}>
                <span>ALL VALUES IN CREDITS (cr)</span>
                <span>● LIVE FEED</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setShowHistory(!showHistory); setShowPortfolio(false); }}
                  style={{ background: "none", border: `1px solid ${showHistory ? GREEN_MID : GREEN_DARK}`,
                    color: showHistory ? GREEN_MID : GREEN_DARK, cursor: "pointer", fontFamily: MONO,
                    fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px", flex: 1 }}>
                  {showHistory ? "[ HIDE HISTORY ]" : "[ HISTORY ]"}
                </button>
                <button onClick={() => { setShowPortfolio(!showPortfolio); setShowHistory(false); }}
                  style={{ background: "none", border: `1px solid ${showPortfolio ? GREEN_MID : GREEN_DARK}`,
                    color: showPortfolio ? GREEN_MID : GREEN_DARK, cursor: "pointer", fontFamily: MONO,
                    fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px", flex: 1 }}>
                  {showPortfolio ? "[ HIDE PORTFOLIO ]" : "[ PORTFOLIO ]"}
                  {(portfolio.length > 0 || (crew?.shipBalance || 0) !== 0) && !showPortfolio && (
                    <span style={{ color: GREEN_MID, marginLeft: "6px" }}>●</span>
                  )}
                </button>
                <button onClick={onSwitchGame}
                  style={{ background: "none", border: `1px solid ${GREEN_DARK}`,
                    color: GREEN_DARK, cursor: "pointer", fontFamily: MONO,
                    fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px", minWidth: "110px" }}>
                  [ SWITCH GAME ]
                </button>
              </div>
            </div>

            {showHistory && (
              <HistoryLog history={history} headlines={headlines} />
            )}

            {showPortfolio && (
              <div style={{ marginTop: "16px" }}>
                {/* Ship / group account balance — shown if a balance exists */}
                {(crew?.shipBalance || 0) !== 0 && (
                  <div style={{ marginBottom: "16px", padding: "12px 16px",
                    border: `1px solid ${GREEN_DARK}`, background: "rgba(0,20,0,0.2)" }}>
                    <div style={{ color: GREEN_MID, fontSize: "9px", letterSpacing: "0.2em", marginBottom: "8px" }}>
                      ACCOUNT BALANCE
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ color: HEADER_GREEN, fontSize: "22px", fontWeight: "bold" }}>
                        {(crew.shipBalance).toLocaleString()}cr
                      </span>
                      {crew.shipName && (
                        <span style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.1em" }}>
                          {crew.shipName.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {portfolio.length === 0 ? (
                  <div style={{ color: GREEN_DARK, fontSize: "11px", textAlign: "center", padding: "20px 0" }}>
                    No equity holdings on record.
                  </div>
                ) : (
                  <>
                    <div style={{ color: GREEN_MID, fontSize: "9px", letterSpacing: "0.2em", marginBottom: "12px",
                      borderBottom: `1px solid ${GREEN_DARK}`, paddingBottom: "8px" }}>
                      EQUITY HOLDINGS — {portfolio.length} POSITION{portfolio.length !== 1 ? "S" : ""}
                    </div>
                    {portfolio.map(holding => {
                      const st = stocks.find(s => s.name === holding.company);
                      const cur = st?.price || 0;
                      const val = cur * holding.shares;
                      const gl = (cur - (holding.grantPrice || cur)) * holding.shares;
                      const locked = holding.lockScenarios > 0;
                      return (
                        <div key={holding.id} style={{ padding: "10px 0", borderBottom: `1px solid rgba(68,100,68,0.15)`,
                          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                          <div>
                            <div style={{ color: GREEN_MID, fontSize: "13px" }}>{holding.company}</div>
                            <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "2px" }}>
                              {holding.shares} share{holding.shares !== 1 ? "s" : ""} @ {cur.toLocaleString()}cr each
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: HEADER_GREEN, fontSize: "14px", fontWeight: "bold" }}>
                              {val.toLocaleString()}cr
                            </div>
                            <div style={{ fontSize: "11px" }}>
                              {locked && <span style={{ color: AMBER }}>🔒 {holding.lockScenarios} scenario{holding.lockScenarios !== 1 ? "s" : ""} locked</span>}
                              {!locked && <span style={{ color: GREEN }}>● AVAILABLE</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between",
                      fontSize: "12px", color: GREEN_DARK }}>
                      <span>TOTAL VALUE</span>
                      <span style={{ color: HEADER_GREEN, fontWeight: "bold" }}>
                        {portfolio.reduce((sum, holding) => {
                          const st = stocks.find(x => x.name === holding.company);
                          return sum + (st ? st.price * holding.shares : 0);
                        }, 0).toLocaleString()}cr
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Job board tab */}
        {tab === "jobs" && (
          <PlayerJobBoard jobs={jobs} stocks={stocks} catalogs={catalogs} />
        )}

        {tab === "downtime" && (
          <PlayerSessionTab debt={debt} crew={crew} rollConfig={rollConfig} stocks={stocks} />
        )}

        {/* Theme switcher */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "6px" }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} onClick={() => setTheme(key)}
              style={{ background: theme === key ? "rgba(255,255,255,0.08)" : "none",
                border: `1px solid ${theme === key ? GREEN_MID : GREEN_DARK}`,
                color: theme === key ? GREEN_DIM : GREEN_DARK,
                fontFamily: MONO, fontSize: "9px", letterSpacing: "0.1em",
                padding: "3px 8px", cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Hidden warden link */}
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button onClick={onWardenAccess}
            style={{ background: "none", border: "none", color: "#1a2a1a", cursor: "pointer",
              fontFamily: MONO, fontSize: "9px", letterSpacing: "0.15em" }}>
            WARDEN ACCESS
          </button>
        </div>
        {/* Honeypot — looks like a system terminal to a curious hacker */}
        <div style={{ marginTop: "4px", textAlign: "center" }}>
          <button onClick={() => onHoneypot && onHoneypot()}
            style={{ background: "none", border: "none", color: "#0d1a0d", cursor: "pointer",
              fontFamily: MONO, fontSize: "8px", letterSpacing: "0.1em" }}>
            [SYS] MARKET_DAEMON v2.1 — TERMINAL ACCESS
          </button>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}

// ─── PIN Gate ─────────────────────────────────────────────────────────────────

function PinGate({ onSuccess, onCancel, storedPin, roomCode, onClearLockout }) {
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
    await onClearLockout(recoveryInput.trim());
    setRecoveryInput("");
    setShowRecovery(false);
    setError(false);
    setRecoveryError(false);
    refs[0].current?.focus();
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
          {digits.map((digit, i) => (
            <input key={i} ref={refs[i]} value={digit} maxLength={1}
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
        <div style={{ color: "#1e2e1e", fontSize: "10px", marginTop: "32px", letterSpacing: "0.1em" }}>
          DEFAULT PIN: {DEFAULT_PIN}
        </div>
        {/* Recovery passphrase — invisible trigger */}
        <div style={{ marginTop: "24px" }}>
          <button onClick={() => { setShowRecovery(r => !r); setRecoveryError(false); }}
            style={{ background: "none", border: "none", color: "#0a140a",
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
              style={{ background: "transparent", border: `1px solid ${recoveryError ? RED : "#1a2a1a"}`,
                color: GREEN_DIM, fontFamily: MONO, fontSize: "11px", padding: "8px 12px",
                outline: "none", width: "220px", textAlign: "center" }}
            />
            {recoveryError && <div style={{ color: RED, fontSize: "10px", letterSpacing: "0.1em" }}>INVALID PASSPHRASE</div>}
            <button onClick={submitRecovery}
              style={{ background: "none", border: `1px solid #1a2a1a`, color: GREEN_MID,
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

// ─── History Log (Player) ────────────────────────────────────────────────────

function HistoryLog({ history, headlines }) {
  const [tab, setTab] = useState("news"); // "news" | "market"

  // Collect all past headlines from history entries (deduped by id), most recent first
  const pastHeadlines = [];
  const seenIds = new Set();
  [...history].reverse().forEach((entry) => {
    if (entry.headlines) entry.headlines.forEach((hl) => {
      const key = hl.id || hl.headline;
      if (!seenIds.has(key)) { seenIds.add(key); pastHeadlines.push({ ...hl, _cycle: entry.date }); }
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
          : pastHeadlines.map((hl, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${GREEN_DARK}`,
              paddingLeft: "12px", marginBottom: "14px", opacity: i === 0 ? 0.85 : 0.5 }}>
              <div style={{ color: GREEN_DIM, fontSize: "12px", letterSpacing: "0.05em" }}>{hl.headline}</div>
              {hl.subtext && <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "2px" }}>{hl.subtext}</div>}
              <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "3px" }}>
                <FictionDate date={hl.date || hl._cycle} />
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

// ─── Headline Feed Manager (Warden) ──────────────────────────────────────────

function HeadlineFeedManager({ headlines, setHeadlines, date, KEYS, wardenSet }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editHL, setEditHL] = useState("");
  const [editSub, setEditSub] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editCycle, setEditCycle] = useState("");

  const startEdit = (i) => {
    const editTarget = headlines[i];
    setEditingIdx(i);
    setEditHL(editTarget.headline);
    setEditSub(editTarget.subtext || "");
    setEditYear(String(editTarget.date?.year ?? date.year));
    setEditCycle(String(editTarget.date?.cycle ?? date.cycle));
  };

  const saveEdit = () => {
    const next = headlines.map((hl, i) => i !== editingIdx ? hl : {
      ...hl,
      headline: editHL.toUpperCase().trim(),
      subtext: editSub.trim(),
      date: { year: parseInt(editYear,10) || hl.date?.year, cycle: parseInt(editCycle,10) || hl.date?.cycle },
    });
    setHeadlines(next);
    wardenSet(KEYS.headlines, next);
    setEditingIdx(null);
  };

  const removeHL = (i) => {
    const next = headlines.filter((_, j) => j !== i);
    setHeadlines(next);
    wardenSet(KEYS.headlines, next);
    if (editingIdx === i) setEditingIdx(null);
  };

  const inputS = { background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
    fontFamily: MONO, fontSize: "11px", padding: "5px 8px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ marginTop: "24px", borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "16px" }}>
      <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.2em", marginBottom: "10px" }}>
        PLAYER FEED — {headlines.length} HEADLINE{headlines.length !== 1 ? "S" : ""}
      </div>
      {headlines.map((hl, i) => (
        <div key={hl.id || i} style={{ borderBottom: `1px solid rgba(26,42,58,0.4)`, padding: "8px 0" }}>
          {editingIdx === i ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <input value={editHL} onChange={(e) => setEditHL(e.target.value)}
                style={{ ...inputS, width: "100%" }} placeholder="HEADLINE TEXT" />
              <input value={editSub} onChange={(e) => setEditSub(e.target.value)}
                style={{ ...inputS, width: "100%" }} placeholder="subtext (optional)" />
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: GREEN_MID, fontSize: "10px" }}>YEAR</span>
                <input value={editYear} onChange={(e) => setEditYear(e.target.value)}
                  style={{ ...inputS, width: "70px" }} inputMode="numeric" />
                <span style={{ color: GREEN_MID, fontSize: "10px" }}>CYC</span>
                <input value={editCycle} onChange={(e) => setEditCycle(e.target.value)}
                  style={{ ...inputS, width: "50px" }} inputMode="numeric" />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={saveEdit}
                  style={{ background: "none", border: `1px solid ${GREEN_MID}`, color: GREEN_MID,
                    fontFamily: MONO, fontSize: "10px", padding: "3px 12px", cursor: "pointer" }}>
                  SAVE
                </button>
                <button onClick={() => setEditingIdx(null)}
                  style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_MID,
                    fontFamily: MONO, fontSize: "10px", padding: "3px 10px", cursor: "pointer" }}>
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: GREEN_MID, fontSize: "11px" }}>{hl.headline}</div>
                {hl.subtext && <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "2px" }}>{hl.subtext}</div>}
                {hl.date && <div style={{ color: GREEN_DARK, fontSize: "9px", marginTop: "3px", letterSpacing: "0.1em" }}>
                  YEAR {hl.date.year} · CYC {String(hl.date.cycle).padStart(2,"0")}
                </div>}
              </div>
              <button onClick={() => startEdit(i)}
                style={{ background: "none", border: `1px solid #1a3a1a`, color: GREEN_DARK,
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

// ─── Corp Editor Helper ───────────────────────────────────────────────────────

function AddCorpRow({ onAdd, inputStyle }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [price, setPrice] = useState("100");
  const [health, setHealth] = useState("OK");
  const [vol, setVol] = useState("Medium");
  const [open, setOpen] = useState(false);
  const submit = () => {
    const p = parseInt(price);
    if (!name.trim() || isNaN(p) || p < 1) return;
    onAdd({ name: name.trim(), industry: industry.trim() || "Unknown", price: p, change: 0,
      health, volatility: vol, is_omnicorp: false, is_collapsed: false });
    setName(""); setIndustry(""); setPrice("100"); setHealth("OK"); setVol("Medium");
    setOpen(false);
  };
  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_MID,
        fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "5px 14px", cursor: "pointer", marginTop: "10px" }}>
      + ADD CORPORATION
    </button>
  );
  const lbl = { color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", marginBottom: "3px" };
  const field = { display: "flex", flexDirection: "column" };
  return (
    <div style={{ marginTop: "12px", padding: "12px", border: `1px solid ${GREEN_DARK}`, background: "rgba(0,10,20,0.4)" }}>
      <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "12px" }}>NEW CORPORATION</div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
        <div style={field}>
          <div style={lbl}>NAME *</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apex Industries"
            style={{ ...inputStyle, width: "150px", fontSize: "10px", padding: "3px 6px" }} />
        </div>
        <div style={field}>
          <div style={lbl}>INDUSTRY</div>
          <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Mining"
            style={{ ...inputStyle, width: "110px", fontSize: "10px", padding: "3px 6px" }} />
        </div>
        <div style={field}>
          <div style={lbl}>PRICE</div>
          <input value={price} onChange={e => setPrice(e.target.value)} inputMode="numeric"
            style={{ ...inputStyle, width: "70px", fontSize: "10px", padding: "3px 6px" }} />
        </div>
        <div style={field}>
          <div style={lbl}>HEALTH</div>
          <select value={health} onChange={e => setHealth(e.target.value)}
            style={{ ...inputStyle, fontSize: "10px", padding: "3px 4px", cursor: "pointer" }}>
            {HEALTH_STEPS.map(hs => <option key={hs} value={hs}>{hs}</option>)}
          </select>
        </div>
        <div style={field}>
          <div style={lbl}>VOLATILITY</div>
          <select value={vol} onChange={e => setVol(e.target.value)}
            style={{ ...inputStyle, fontSize: "10px", padding: "3px 4px", cursor: "pointer" }}>
            {VOLATILITY_STEPS.map(vol => <option key={vol} value={vol}>{vol}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={submit} disabled={!name.trim()}
          style={{ background: "none", border: `1px solid ${name.trim() ? GREEN_DARK : "#1a2a1a"}`,
            color: name.trim() ? GREEN_MID : "#334433",
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "5px 14px",
            cursor: name.trim() ? "pointer" : "not-allowed" }}>
          CONFIRM
        </button>
        <button onClick={() => setOpen(false)}
          style={{ background: "none", border: `1px solid #2a2a2a`, color: "#555",
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "5px 14px", cursor: "pointer" }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ─── Custom Merger Form ───────────────────────────────────────────────────────

function CustomMergerForm({ stocks, date, headlines, onConfirm }) {
  const active = stocks.filter(s => !s.is_collapsed);
  const [open, setOpen] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [mergedName, setMergedName] = useState("");
  const [mergedIndustry, setMergedIndustry] = useState("");
  const [hl, setHl] = useState("");
  const [sub, setSub] = useState("");

  if (!open) return (
    <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "16px", marginTop: "4px" }}>
      <button onClick={() => setOpen(true)}
        style={{ background: "none", border: `1px solid #445566`, color: GREEN_MID,
          fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em", padding: "6px 16px", cursor: "pointer" }}>
        + TRIGGER CUSTOM MERGER
      </button>
    </div>
  );

  const s1 = stocks.find(s => s.name === p1);
  const s2 = stocks.find(s => s.name === p2);
  const combined = (s1?.price ?? 0) + (s2?.price ?? 0);
  const canFire = p1 && p2 && p1 !== p2 && mergedName.trim();

  const fire = () => {
    if (!canFire) return;
    const newEntity = {
      name: mergedName.trim(), industry: mergedIndustry.trim() || "Conglomerate",
      price: combined, change: 0, health: "OK", volatility: "Medium",
      is_omnicorp: false, is_collapsed: false, is_merged: true,
    };
    const merged = stocks.filter(s => s.name !== p1 && s.name !== p2).concat([newEntity]);
    const headline = hl.trim() || `${p1.toUpperCase()} AND ${p2.toUpperCase()} ANNOUNCE EMERGENCY MERGER`;
    const subtext = sub.trim() || `Combined entity to operate as ${mergedName.trim()} effective immediately.`;
    const entry = { headline, subtext, date: { ...date }, id: Date.now() };
    onConfirm({ merged, newHeadlines: [entry, ...headlines], headline });
  };

  return (
    <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "16px", marginTop: "4px" }}>
      <div style={{ color: AMBER, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "12px" }}>CUSTOM MERGER</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", marginBottom: "3px" }}>PARTNER 1</div>
            <select value={p1} onChange={e => setP1(e.target.value)}
              style={{ background: BG, border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
                fontFamily: MONO, fontSize: "11px", padding: "4px 6px", cursor: "pointer" }}>
              <option value="">— select —</option>
              {active.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ color: GREEN_DARK, paddingTop: "16px" }}>+</div>
          <div>
            <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", marginBottom: "3px" }}>PARTNER 2</div>
            <select value={p2} onChange={e => setP2(e.target.value)}
              style={{ background: BG, border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
                fontFamily: MONO, fontSize: "11px", padding: "4px 6px", cursor: "pointer" }}>
              <option value="">— select —</option>
              {active.filter(s => s.name !== p1).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          {combined > 0 && <div style={{ color: AMBER, fontSize: "11px", paddingTop: "16px" }}>= {combined.toLocaleString()}cr</div>}
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", marginBottom: "3px" }}>MERGED ENTITY NAME *</div>
            <input value={mergedName} onChange={e => setMergedName(e.target.value)} placeholder="e.g. Apex Combined Industries"
              style={{ background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
                fontFamily: MONO, fontSize: "11px", padding: "4px 8px", width: "220px" }} />
          </div>
          <div>
            <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", marginBottom: "3px" }}>INDUSTRY</div>
            <input value={mergedIndustry} onChange={e => setMergedIndustry(e.target.value)} placeholder="e.g. Defense/Finance"
              style={{ background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
                fontFamily: MONO, fontSize: "11px", padding: "4px 8px", width: "160px" }} />
          </div>
        </div>
        <div>
          <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", marginBottom: "3px" }}>HEADLINE (optional — auto-generated if blank)</div>
          <input value={hl} onChange={e => setHl(e.target.value)} placeholder="Leave blank for auto-generated"
            style={{ background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
              fontFamily: MONO, fontSize: "11px", padding: "4px 8px", width: "100%", boxSizing: "border-box" }} />
        </div>
        <div>
          <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", marginBottom: "3px" }}>SUBTEXT (optional)</div>
          <input value={sub} onChange={e => setSub(e.target.value)}
            style={{ background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
              fontFamily: MONO, fontSize: "11px", padding: "4px 8px", width: "100%", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fire} disabled={!canFire}
            style={{ background: "none", border: `1px solid ${canFire ? AMBER : "#2a2a2a"}`,
              color: canFire ? AMBER : "#333",
              fontFamily: MONO, fontSize: "11px", letterSpacing: "0.12em", padding: "7px 18px",
              cursor: canFire ? "pointer" : "not-allowed" }}>
            EXECUTE MERGER
          </button>
          <button onClick={() => setOpen(false)}
            style={{ background: "none", border: `1px solid #2a2a2a`, color: "#555",
              fontFamily: MONO, fontSize: "11px", letterSpacing: "0.12em", padding: "7px 18px", cursor: "pointer" }}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Warden View ──────────────────────────────────────────────────────────────

function WardenView({ stocks, setStocks, headlines, setHeadlines, history, setHistory, date, setDate,
  storedPin, setStoredPin, mergers, setMergers, alwaysMerge, setAlwaysMerge, rollConfig, setRollConfig,
  jobs, setJobs, crew, setCrew, debt, setDebt, portfolio, setPortfolio, catalogs, setCatalogs,
  theme, setTheme, onLogout, KEYS }) {

  const [panel, setPanel] = useState("corps"); // "headline" | "jobs" | "economy" | "corps" | "session" | "settings"
  const [sessionTab, setSessionTab] = useState("debt"); // "debt"|"portfolio"|"ship"|"contractors"
  const [jobsTab, setJobsTab] = useState("board"); // "board"|"payout"
  const [pendingAdvance, setPendingAdvance] = useState(null);
  const [pendingVariance, setPendingVariance] = useState(null);
  const [pendingHealthShift, setPendingHealthShift] = useState(null);
  const [varianceMode, setVarianceMode] = useState("full"); // "full" | "targeted"
  const [targetedSelection, setTargetedSelection] = useState(new Set()); // names of selected corps
  const [pendingBankruptcy, setPendingBankruptcy] = useState(null);
  const [headlineText, setHeadlineText] = useState("");
  const [headlineSubtext, setHeadlineSubtext] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [lastPublished, setLastPublished] = useState(null);

  // Authenticated write — includes Warden PIN for server-side validation
  const wardenSet = useCallback((key, value) => safeSet(key, value, storedPin), [storedPin]);

  const saveSettings = useCallback((patch) => {
    const next = { alwaysMerge, rollConfig, ...patch };
    wardenSet(KEYS.settings, next);
    return next;
  }, [alwaysMerge, rollConfig, wardenSet, KEYS]);

  const [toast, setToast] = useState(null);
  const showToast = (msg, color = GREEN) => {
    setToast({ msg, color });
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => setToast(null), 2800);
  };
  const [marketEventPct, setMarketEventPct] = useState(10);
  const [marketEventDir, setMarketEventDir] = useState("crash");

  const handleMarketEvent = () => {
    const multiplier = marketEventDir === "crash" ? (1 - marketEventPct / 100) : (1 + marketEventPct / 100);
    const next = sortByPrice(stocks.map(s => {
      if (s.is_collapsed || s.is_frozen) return s;
      const newPrice = Math.max(1, Math.round(s.price * multiplier));
      return { ...s, price: newPrice, change: newPrice - s.price };
    }));
    setStocks(next);
    wardenSet(KEYS.stocks, next);
    showToast(`MARKET ${marketEventDir.toUpperCase()} APPLIED — ${marketEventPct}%`, marketEventDir === "crash" ? "#ff4455" : GREEN);
  };

  const handleVarianceRoll = () => {
    // In targeted mode, only roll for selected companies; others get no-op roll data
    const result = computeVariance(stocks, rollConfig).map(s => {
      if (varianceMode === "targeted" && !targetedSelection.has(s.name)) {
        return { ...s, priceRoll: null, coinFlip: null, price: s.price, change: 0, _skipped: true };
      }
      return s;
    });
    setPendingVariance(result);
    setPanel("economy");
  };

  const handleVarianceConfirm = () => {
    if (!pendingVariance) return;
    const sorted = sortByPrice(pendingVariance.map(({ priceRoll, coinFlip, _skipped, ...s }) => s));
    setStocks(sorted);
    wardenSet(KEYS.stocks, sorted);
    setPendingVariance(null);
    showToast(varianceMode === "targeted" ? `VARIANCE APPLIED — ${targetedSelection.size} CORP(S)` : "VARIANCE APPLIED");
  };

  // All active, non-collapsed corps eligible for targeting
  const targetableCorps = stocks.filter(s => !s.is_collapsed);
  const allTargeted = targetableCorps.length > 0 && targetableCorps.every(s => targetedSelection.has(s.name));
  const toggleAllTargets = () => {
    if (allTargeted) setTargetedSelection(new Set());
    else setTargetedSelection(new Set(targetableCorps.map(s => s.name)));
  };

  const handleHealthRoll = () => {
    setPendingHealthShift(computeHealthOnly(stocks, rollConfig));
    setPanel("economy");
  };

  const handleHealthConfirm = () => {
    if (!pendingHealthShift) return;
    const sorted = sortByPrice(pendingHealthShift.map(({ healthRoll, healthShift, ...s }) => s));
    setStocks(sorted);
    wardenSet(KEYS.stocks, sorted);
    setPendingHealthShift(null);
    showToast("HEALTH SHIFTS APPLIED");
  };

  const saveAll = useCallback(async (s, h, hist, d, m, j) => {
    await wardenSet(KEYS.stocks, s);
    await wardenSet(KEYS.headlines, h);
    await wardenSet(KEYS.history, hist);
    await wardenSet(KEYS.date, d);
    if (m !== undefined) await wardenSet(KEYS.mergers, m);
    if (j !== undefined) await wardenSet(KEYS.jobs, j);
  }, []);

  const pushHeadline = (h) => {
    const entry = { headline: h.headline, subtext: h.subtext || "", date: { ...date }, id: Date.now() };
    const next = [entry, ...headlines];
    setHeadlines(next);
    wardenSet(KEYS.headlines, next);
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
    const advanceResult = computeAdvance(stocks, rollConfig);
    const bankruptcyResult = computeBankruptcyCheck(advanceResult, mergers, alwaysMerge);
    setPendingAdvance({ advance: advanceResult, bankruptcy: bankruptcyResult });
    setPanel("economy");
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
    const collapsingWithMerger = bankruptcy.filter((bkruptItem) => bkruptItem.collapses && bkruptItem.triggersMerger);
    const collapsingNormal = bankruptcy.filter((bkruptItem) => bkruptItem.collapses && !bkruptItem.triggersMerger);
    // Apply mergers for early-trigger collapses
    let updatedMergers = [...mergers];
    let autoHeadlines = [];
    const mergerNames = new Set(collapsingWithMerger.map((bkruptItem) => bkruptItem.triggersMerger));
    for (const mName of mergerNames) {
      const merger = mergers.find((mg) => mg.name === mName);
      if (merger) {
        working = applyMerger(working, merger);
        updatedMergers = updatedMergers.map((m) => m.name === mName ? { ...m, triggered: true } : m);
        if (MERGER_HEADLINES[mName]) autoHeadlines.push({ ...MERGER_HEADLINES[mName], date: { ...date }, id: Date.now() + autoHeadlines.length });
      }
    }
    // Auto-push OmniCorp acquisition headlines for normal collapses
    collapsingNormal.forEach((bkruptItem, idx) => {
      const match = OMNICORP_HEADLINES.find((omniH) => omniH.company === bkruptItem.name);
      if (match) autoHeadlines.push({ ...match, date: { ...date }, id: Date.now() + autoHeadlines.length + idx + 100 });
    });
    // Normal collapses: halve price, mark is_delisting
    const omniGain = collapsingNormal.reduce((sum, b) => sum + b.price, 0);
    working = working.map((s) => {
      const collapseEntry = collapsingNormal.find((ce) => ce.name === s.name);
      if (collapseEntry) {
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
    const histEntry = { date: { ...date }, stocks: stocks.map(({ healthRoll, volRoll, priceRoll, coinFlip, healthShift, volShift, _skipped, ...rest }) => rest), headlines: headlines.slice(0, 5) };
    const newHistory = [...history, histEntry].slice(-100); // cap at 100 to prevent unbounded growth
    const newHeadlines = autoHeadlines.length > 0 ? [...autoHeadlines, ...headlines] : headlines;
    if (autoHeadlines.length > 0) autoHeadlines.forEach((hl) => { setLastPublished(hl.headline); clearTimeout(window._lpTimer); window._lpTimer = setTimeout(() => setLastPublished(null), 3500); });
    setStocks(sorted);
    setMergers(updatedMergers);
    setDate(newDate);
    setHistory(newHistory);
    setHeadlines(newHeadlines);

    // ── Job Board Rotation ──
    const omniName = sorted.find(s => s.is_omnicorp)?.name || "";
    let newJobs = jobs.map(j => {
      // Archive unfrozen active jobs
      if (j.status === "active" && !j.frozen) return { ...j, status: "archived" };
      return j;
    });
    if ((rollConfig.drawMode || "random") === "random") {
      const activeCount = newJobs.filter(j => j.status === "active").length;
      const slotsNeeded = Math.max(0, 3 - activeCount);
      if (slotsNeeded > 0) {
        const pool = newJobs.filter(j => j.status === "pool");
        // OmniCorp jobs get priority
        const omniPool = pool.filter(j => j.company === omniName);
        const stdPool = pool.filter(j => j.company !== omniName).sort(() => Math.random() - 0.5);
        const draw = [...omniPool, ...stdPool].slice(0, slotsNeeded);
        const drawIds = new Set(draw.map(j => j.id));
        newJobs = newJobs.map(j =>
          drawIds.has(j.id) ? { ...j, status: "active", cycle_posted: newDate.cycle } : j
        );
      }
    }
    setJobs(newJobs);
    saveAll(sorted, newHeadlines, newHistory, newDate, updatedMergers, newJobs);

    // ── Portfolio: decrement lock counters ──
    if (portfolio.length > 0) {
      const newPortfolio = portfolio.map(holding => holding.lockScenarios > 0 ? { ...holding, lockScenarios: holding.lockScenarios - 1 } : holding);
      setPortfolio(newPortfolio);
      wardenSet(KEYS.portfolio, newPortfolio);
    }

    // ── Catalogs: auto-INELIGIBLE for collapsed/merged companies ──
    const nowInactive = new Set([
      ...collapsingNormal.map(bkruptItem => bkruptItem.name),
      ...collapsingWithMerger.map(bkruptItem => bkruptItem.name),
    ]);
    if (nowInactive.size > 0) {
      const newCatalogs = { ...catalogs };
      for (const name of nowInactive) {
        if (newCatalogs[name] && newCatalogs[name].status !== "ineligible") {
          const reason = collapsingWithMerger.find(bkruptItem => bkruptItem.name === name) ? "Merged" : "Company collapsed";
          newCatalogs[name] = { ...newCatalogs[name], status: "ineligible", ineligibleReason: reason };
        } else if (!newCatalogs[name]) {
          const reason = collapsingWithMerger.find(bkruptItem => bkruptItem.name === name) ? "Merged" : "Company collapsed";
          newCatalogs[name] = { status: "ineligible", ineligibleReason: reason, benefits: "", items: [] };
        }
      }
      setCatalogs(newCatalogs);
      wardenSet(KEYS.catalogs, newCatalogs);
    }

    setPendingAdvance(null);
    setPanel(null);
  };

  const handleSavePin = () => {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) { setPinMsg("PIN must be exactly 6 digits."); return; }
    if (newPin !== confirmPin) { setPinMsg("PINs do not match."); return; }
    setStoredPin(newPin);
    wardenSet(KEYS.pin, newPin);
    setPinMsg("PIN updated.");
    setNewPin(""); setConfirmPin("");
  };

  const handleDateInput = (field, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    setDate((d) => {
      const next = { ...d, [field]: Math.max(1, n) };
      wardenSet(KEYS.date, next);
      return next;
    });
  };

  const shiftLabel = (d) => d > 0 ? `▲ ${d}` : d < 0 ? `▼ ${Math.abs(d)}` : "—";

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: MONO, padding: "32px 20px",
      position: "relative", overflow: "hidden" }}>
      <Scanlines />
      <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Warden Header */}
        <div style={{ borderBottom: `1px solid ${GREEN_DARK}`, paddingBottom: "16px", marginBottom: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.3em", marginBottom: "4px", opacity: 0.5 }}>
              SECTOR FINANCIAL NETWORK — RESTRICTED
            </div>
            <div style={{ color: HEADER_GREEN, fontSize: "20px", letterSpacing: "0.15em", fontWeight: "bold" }}>
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
          {[["headline","HEADLINE"],["jobs","JOBS"],["economy","ECONOMY"],["corps","CORPS"],["session","SESSION"],["settings","SETTINGS"]].map(([p, label]) => (
            <button key={p} onClick={() => setPanel(panel === p ? null : p)}
              style={{ background: panel === p ? "rgba(68,200,68,0.08)" : "none",
                border: `1px solid ${panel === p ? GREEN_MID : GREEN_DARK}`,
                color: panel === p ? GREEN_MID : GREEN_DARK, fontFamily: MONO,
                fontSize: "11px", letterSpacing: "0.1em", padding: "7px 12px",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {label}
            </button>
          ))}
          <div style={{ display:"flex", gap:"4px", marginLeft:"auto", alignItems:"center" }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button key={key} onClick={() => setTheme(key)}
                style={{ background: theme === key ? "rgba(68,200,68,0.08)" : "none",
                  border: `1px solid ${theme === key ? GREEN_MID : GREEN_DARK}`,
                  color: theme === key ? GREEN_MID : GREEN_DARK,
                  fontFamily: MONO, fontSize: "9px", letterSpacing: "0.08em",
                  padding: "3px 7px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={onLogout}
            style={{ background: "none", border: "none", color: GREEN_MID, fontFamily: MONO,
              fontSize: "11px", letterSpacing: "0.1em", padding: "7px 8px", cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0 }}>
            ← EXIT
          </button>
        </div>

        {/* Panel: Publish Headline */}
        {panel === "headline" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid ${GREEN_DARK}`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>
              PUBLISH HEADLINE
            </div>
            <input value={headlineText} onChange={(e) => setHeadlineText(e.target.value)}
              placeholder="HEADLINE TEXT (auto-uppercased)"
              style={{ width: "100%", background: "transparent", border: `1px solid ${GREEN_DARK}`,
                color: HEADER_GREEN, fontFamily: MONO, fontSize: "12px", padding: "8px 10px",
                marginBottom: "8px", outline: "none", boxSizing: "border-box" }} />
            <input value={headlineSubtext} onChange={(e) => setHeadlineSubtext(e.target.value)}
              placeholder="subtext (optional, lowercase)"
              style={{ width: "100%", background: "transparent", border: `1px solid ${GREEN_DARK}`,
                color: "#8899aa", fontFamily: MONO, fontSize: "11px", padding: "8px 10px",
                marginBottom: "16px", outline: "none", boxSizing: "border-box" }} />
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.15em", marginBottom: "10px" }}>
              OMNICORP ACQUISITION TRIGGERS:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              {OMNICORP_HEADLINES.filter((omniHL) => {
                const protectedBy = MERGER_PROTECTED[omniHL.company];
                if (!protectedBy) return true; // not a merger partner, always show
                const merger = mergers.find((m) => m.name === protectedBy);
                if (!merger) return true; // merger doesn't exist, show
                // Hide if merger is still pending (both partners alive)
                return getMergerStatus(merger, stocks) !== "pending";
              }).map((omniHL) => (
                <button key={omniHL.company} onClick={() => pushHeadline(omniHL)}
                  style={{ background: "rgba(80,60,0,0.2)", border: `1px solid rgba(255,200,0,0.15)`,
                    color: AMBER, fontFamily: MONO, fontSize: "10px", padding: "4px 8px",
                    cursor: "pointer", letterSpacing: "0.08em" }}>
                  {omniHL.company.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <button onClick={handlePublishHeadline}
                style={{ background: "none", border: `1px solid ${GREEN_MID}`, color: GREEN_MID,
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
            {headlines.length > 0 && (
              <div style={{ marginTop: "20px", borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "16px" }}>
                <HeadlineFeedManager headlines={headlines} setHeadlines={setHeadlines} date={date} KEYS={KEYS} wardenSet={wardenSet} />
              </div>
            )}
          </div>
        )}

        {/* Panel: Economy */}
        {panel === "economy" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid ${GREEN_DARK}`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.2em", marginBottom: "20px" }}>ECONOMY</div>
            <div style={{ marginBottom: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "12px", borderBottom: `1px solid ${GREEN_DARK}`, paddingBottom: "8px" }}>ADVANCE</div>
            {!pendingAdvance ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ color: "#4a5a6a", fontSize: "10px", letterSpacing: "0.12em", marginBottom: "8px" }}>
                    FULL ADVANCE — advances the date, rolls health + volatility + price for all corps, triggers bankruptcy checks
                  </div>
                  <button onClick={handleAdvanceRoll}
                    style={{ background: "none", border: `1px solid ${GREEN_MID}`, color: GREEN_MID,
                      fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                    ROLL ECONOMY
                  </button>
                </div>
                <div>
                  <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.12em", marginBottom: "10px" }}>
                    PRICE VARIANCE — price movement only, no health or volatility changes
                  </div>
                  {/* Mode toggle */}
                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                    {["full","targeted"].map(m => (
                      <button key={m} onClick={() => { setVarianceMode(m); setPendingVariance(null); }}
                        style={{ background: varianceMode === m ? "rgba(68,170,100,0.1)" : "none",
                          border: `1px solid ${varianceMode === m ? GREEN_DARK : "#1a2a3a"}`,
                          color: varianceMode === m ? GREEN_MID : GREEN_DARK,
                          fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                          padding: "4px 12px", cursor: "pointer" }}>
                        {m === "full" ? "ALL CORPS" : "SELECT CORPS"}
                      </button>
                    ))}
                  </div>
                  {/* Targeted: checkbox list */}
                  {varianceMode === "targeted" && !pendingVariance && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <button onClick={toggleAllTargets}
                          style={{ background: allTargeted ? "rgba(68,170,100,0.1)" : "none",
                            border: `1px solid ${allTargeted ? GREEN_DARK : "#2a3a2a"}`,
                            color: allTargeted ? GREEN_MID : GREEN_DARK,
                            fontFamily: MONO, fontSize: "9px", letterSpacing: "0.1em",
                            padding: "3px 10px", cursor: "pointer" }}>
                          {allTargeted ? "✓ DESELECT ALL" : "SELECT ALL"}
                        </button>
                        <span style={{ color: GREEN_DARK, fontSize: "9px" }}>
                          {targetedSelection.size} selected
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                        {targetableCorps.map(s => {
                          const sel = targetedSelection.has(s.name);
                          return (
                            <button key={s.name} onClick={() => {
                              const next = new Set(targetedSelection);
                              sel ? next.delete(s.name) : next.add(s.name);
                              setTargetedSelection(next);
                            }}
                              style={{ background: sel ? "rgba(68,170,100,0.08)" : "none",
                                border: `1px solid ${sel ? GREEN_DARK : "#1a2a3a"}`,
                                color: sel ? GREEN_MID : GREEN_DARK,
                                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.05em",
                                padding: "3px 10px", cursor: "pointer",
                                textTransform: "uppercase" }}>
                              {sel ? "✓ " : ""}{s.name.split(" ")[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Roll / preview */}
                  {!pendingVariance ? (
                    <button
                      onClick={handleVarianceRoll}
                      disabled={varianceMode === "targeted" && targetedSelection.size === 0}
                      style={{ background: "none",
                        border: `1px solid ${varianceMode === "targeted" && targetedSelection.size === 0 ? "#1a2a1a" : GREEN_DARK}`,
                        color: varianceMode === "targeted" && targetedSelection.size === 0 ? "#2a3a2a" : GREEN_MID,
                        fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px",
                        cursor: varianceMode === "targeted" && targetedSelection.size === 0 ? "not-allowed" : "pointer" }}>
                      ROLL VARIANCE{varianceMode === "targeted" && targetedSelection.size > 0 ? ` (${targetedSelection.size})` : ""}
                    </button>
                  ) : (
                    <div>
                      <div style={{ overflowX: "auto", marginBottom: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", color: "#8899aa" }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${GREEN_DARK}` }}>
                              {["COMPANY","VOL","ROLL","COIN","Δ PRICE","NEW PRICE"].map((col) => (
                                <th key={col} style={{ padding: "6px 8px", textAlign: "left", letterSpacing: "0.08em", color: GREEN_MID, fontWeight: "normal" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pendingVariance.filter(s => !s.is_collapsed).map(s => (
                              <tr key={s.name} style={{ borderBottom: `1px solid rgba(26,42,58,0.4)`,
                                opacity: s._skipped ? 0.3 : 1 }}>
                                <td style={{ padding: "6px 8px", color: s.is_omnicorp ? AMBER : "#aabbcc", fontSize: "10px", textTransform: "uppercase" }}>{s.name.split(" ")[0]}</td>
                                <td style={{ padding: "6px 8px", color: volColor(s.volatility) }}>{s.volatility}</td>
                                <td style={{ padding: "6px 8px", color: "#ccc" }}>{s._skipped ? "—" : s.priceRoll}</td>
                                <td style={{ padding: "6px 8px", color: s.coinFlip === "up" ? GREEN : s.coinFlip === "down" ? RED : "#333" }}>{s._skipped ? "—" : (s.coinFlip ?? "—")}</td>
                                <td style={{ padding: "6px 8px", color: s.change > 0 ? GREEN : s.change < 0 ? RED : "#555", fontWeight: "bold" }}>{s._skipped ? "—" : (s.change > 0 ? "+" : "") + s.change}</td>
                                <td style={{ padding: "6px 8px", color: s.is_omnicorp ? AMBER : HEADER_GREEN, fontWeight: "bold" }}>{s.price.toLocaleString()}cr</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={handleVarianceConfirm}
                          style={{ background: "none", border: `1px solid #44ff88`, color: GREEN,
                            fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                          CONFIRM & PUBLISH
                        </button>
                        <button onClick={() => setPendingVariance(null)}
                          style={{ background: "none", border: `1px solid #3a3a3a`, color: "#666",
                            fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ color: "#4a5a6a", fontSize: "10px", letterSpacing: "0.12em", marginBottom: "8px" }}>
                    HEALTH SHIFT — health movement only, no price or volatility changes
                  </div>
                  {!pendingHealthShift ? (
                    <button onClick={handleHealthRoll}
                      style={{ background: "none", border: `1px solid #334466`, color: "#6688bb",
                        fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                      ROLL HEALTH
                    </button>
                  ) : (
                    <div>
                      <div style={{ overflowX: "auto", marginBottom: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", color: "#8899aa" }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${GREEN_DARK}` }}>
                              {["COMPANY","OLD HEALTH","H.ROLL","SHIFT","NEW HEALTH"].map((col) => (
                                <th key={col} style={{ padding: "6px 8px", textAlign: "left", letterSpacing: "0.08em", color: GREEN_MID, fontWeight: "normal" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pendingHealthShift.filter(s => !s.is_collapsed).map(s => {
                              const origHealth = stocks.find(o => o.name === s.name)?.health ?? s.health;
                              return (
                                <tr key={s.name} style={{ borderBottom: `1px solid rgba(26,42,58,0.4)` }}>
                                  <td style={{ padding: "6px 8px", color: s.is_omnicorp ? AMBER : "#aabbcc", fontSize: "10px", textTransform: "uppercase" }}>{s.name.split(" ")[0]}</td>
                                  <td style={{ padding: "6px 8px", color: healthColor(origHealth) }}>{origHealth}</td>
                                  <td style={{ padding: "6px 8px", color: "#ccc" }}>{s.healthRoll}</td>
                                  <td style={{ padding: "6px 8px", color: s.healthShift > 0 ? GREEN : s.healthShift < 0 ? RED : "#555" }}>{shiftLabel(s.healthShift)}</td>
                                  <td style={{ padding: "6px 8px", color: healthColor(s.health), fontWeight: "bold" }}>{s.health}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={handleHealthConfirm}
                          style={{ background: "none", border: `1px solid #44ff88`, color: GREEN,
                            fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                          CONFIRM & PUBLISH
                        </button>
                        <button onClick={() => setPendingHealthShift(null)}
                          style={{ background: "none", border: `1px solid #3a3a3a`, color: "#666",
                            fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>                <div>
                  <div style={{ color: "#5a4a3a", fontSize: "10px", letterSpacing: "0.12em", marginBottom: "8px" }}>
                    MARKET EVENT — apply a percentage shift to all active, unfrozen stocks at once
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <select value={marketEventDir} onChange={e => setMarketEventDir(e.target.value)}
                      style={{ background: BG, border: `1px solid #3a2a1a`, color: marketEventDir === "crash" ? RED : GREEN,
                        fontFamily: MONO, fontSize: "11px", padding: "5px 8px", cursor: "pointer" }}>
                      <option value="crash">CRASH</option>
                      <option value="boom">BOOM</option>
                    </select>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input value={marketEventPct} inputMode="numeric"
                        onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 99) setMarketEventPct(v); }}
                        style={{ background: "transparent", border: `1px solid #2a2a2a`, color: "#ccc",
                          fontFamily: MONO, fontSize: "11px", width: "50px", padding: "4px 6px", textAlign: "center" }} />
                      <span style={{ color: GREEN_DARK, fontSize: "10px" }}>%</span>
                    </div>
                    <button onClick={() => setConfirmDialog({
                        msg: `APPLY ${marketEventDir.toUpperCase()} — ${marketEventPct}%?`,
                        submsg: `All active, unfrozen stocks will ${marketEventDir === "crash" ? "decrease" : "increase"} by ${marketEventPct}%. This cannot be undone.`,
                        onConfirm: () => { handleMarketEvent(); setConfirmDialog(null); }
                      })}
                      style={{ background: "none",
                        border: `1px solid ${marketEventDir === "crash" ? "#663333" : "#336633"}`,
                        color: marketEventDir === "crash" ? RED : GREEN,
                        fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                      APPLY {marketEventDir.toUpperCase()}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", color: "#8899aa" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${GREEN_DARK}` }}>
                        {["COMPANY","HEALTH","H.ROLL","H.SHIFT","VOL","V.ROLL","V.SHIFT","DIE ROLL","COIN","Δ PRICE","NEW PRICE"].map((col) => (
                          <th key={col} style={{ padding: "6px 8px", textAlign: "left", letterSpacing: "0.08em", color: GREEN_MID, fontWeight: "normal" }}>{h}</th>
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
                        <span style={{ flex: 1, color: HEADER_GREEN, fontSize: "11px", textTransform: "uppercase" }}>{s.name}</span>
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

            {/* Bankruptcy Section */}
            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "20px", marginBottom: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "12px" }}>BANKRUPTCY CHECK</div>
              <div style={{ color: GREEN_DARK, fontSize: "10px", marginBottom: "12px", lineHeight: 1.6 }}>Rolls d10 for all companies at Bankrupt health. 7–10 = collapse.</div>
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
                    padding: "6px 0", borderBottom: `1px solid ${GREEN_DARK}` }}>
                    <span style={{ flex: 1, color: HEADER_GREEN, fontSize: "11px", textTransform: "uppercase" }}>{s.name}</span>
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
                    const collapsingWithMerger = pendingBankruptcy.filter((bkruptItem) => bkruptItem.collapses && bkruptItem.triggersMerger);
                    const collapsingNormal = pendingBankruptcy.filter((bkruptItem) => bkruptItem.collapses && !bkruptItem.triggersMerger);
                    let working = [...stocks];
                    let updatedMergers = [...mergers];
                    const mergerNames = new Set(collapsingWithMerger.map((bkruptItem) => bkruptItem.triggersMerger));
                    for (const mName of mergerNames) {
                      const merger = mergers.find((m) => m.name === mName);
                      if (merger) {
                        working = applyMerger(working, merger);
                        updatedMergers = updatedMergers.map((m) => m.name === mName ? { ...m, triggered: true } : m);
                      }
                    }
                    const omniGain = collapsingNormal.reduce((sum, b) => sum + b.price, 0);
                    working = working.map((s) => {
                      const collapseEntry = collapsingNormal.find((ce) => ce.name === s.name);
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
                    wardenSet(KEYS.stocks, sorted);
                    wardenSet(KEYS.mergers, updatedMergers);
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

            {/* Mergers Section */}
            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "12px" }}>MERGERS</div>

            {mergers.map((m) => {
              const status = getMergerStatus(m, stocks);
              const p1 = stocks.find((s) => s.name === m.partner1);
              const p2 = stocks.find((s) => s.name === m.partner2);
              const combinedPrice = (p1?.price ?? 0) + (p2?.price ?? 0);
              const statusColor = status === "triggered" ? GREEN : status === "unavailable" ? "#6688aa" : AMBER;
              return (
                <div key={m.name} style={{ borderBottom: `1px solid ${GREEN_DARK}`, paddingBottom: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <span style={{ color: AMBER, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.name}</span>
                    <span style={{ color: statusColor, fontSize: "10px", letterSpacing: "0.15em" }}>{status.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "24px", fontSize: "11px", color: GREEN_MID, marginBottom: "10px" }}>
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
                        wardenSet(KEYS.stocks, merged);
                        wardenSet(KEYS.mergers, updatedMergers);
                        wardenSet(KEYS.headlines, newHeadlines);
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
                  {status === "triggered" && <span style={{ color: GREEN_MID, fontSize: "10px" }}>Completed — {m.name} is now active on the ticker.</span>}
                  {status === "unavailable" && <span style={{ color: GREEN_MID, fontSize: "10px" }}>One or both partners are no longer active.</span>}
                </div>
              );
            })}
            {/* Predefined merger management */}
            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "16px", marginTop: "4px", marginBottom: "4px" }}>
              <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "12px" }}>PREDEFINED MERGERS</div>
              {mergers.map((m, i) => {
                const selectStyle = { background: BG, border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
                  fontFamily: MONO, fontSize: "10px", padding: "2px 5px", cursor: "pointer" };
                return (
                  <div key={m.name + i} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
                    <input defaultValue={m.name} onBlur={e => {
                      const val = e.target.value.trim(); if (!val) return;
                      const next = mergers.map((x, xi) => xi === i ? { ...x, name: val } : x);
                      setMergers(next); wardenSet(KEYS.mergers, next);
                    }} style={{ background: "transparent", border: `1px solid ${GREEN_DARK}`, color: AMBER,
                      fontFamily: MONO, fontSize: "10px", padding: "2px 6px", width: "150px" }}
                    placeholder="Merger name" />
                    <select value={m.partner1}
                      onChange={e => {
                        const next = mergers.map((x, xi) => xi === i ? { ...x, partner1: e.target.value } : x);
                        setMergers(next); wardenSet(KEYS.mergers, next);
                      }} style={selectStyle}>
                      <option value="">— partner 1 —</option>
                      {stocks.map(s => (
                        <option key={s.name} value={s.name}
                          disabled={s.is_collapsed || s.is_merged}
                          style={{ color: (s.is_collapsed || s.is_merged) ? "#444" : "#aabbcc" }}>
                          {s.name}{(s.is_collapsed || s.is_merged) ? " (inactive)" : ""}
                        </option>
                      ))}
                    </select>
                    <span style={{ color: GREEN_DARK, fontSize: "10px" }}>+</span>
                    <select value={m.partner2}
                      onChange={e => {
                        const next = mergers.map((x, xi) => xi === i ? { ...x, partner2: e.target.value } : x);
                        setMergers(next); wardenSet(KEYS.mergers, next);
                      }} style={selectStyle}>
                      <option value="">— partner 2 —</option>
                      {stocks.map(s => (
                        <option key={s.name} value={s.name}
                          disabled={s.is_collapsed || s.is_merged}
                          style={{ color: (s.is_collapsed || s.is_merged) ? "#444" : "#aabbcc" }}>
                          {s.name}{(s.is_collapsed || s.is_merged) ? " (inactive)" : ""}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => {
                      if (!window.confirm(`Remove merger "${m.name}"?`)) return;
                      const next = mergers.filter((_, xi) => xi !== i);
                      setMergers(next); wardenSet(KEYS.mergers, next);
                    }} style={{ background: "none", border: `1px solid #3a2a2a`, color: "#664444",
                      fontFamily: MONO, fontSize: "10px", padding: "1px 6px", cursor: "pointer" }}>✕</button>
                  </div>
                );
              })}
              <button onClick={() => {
                const next = [...mergers, { name: "New Merger", partner1: "Company A", partner2: "Company B", industry: "Combined", triggered: false }];
                setMergers(next); wardenSet(KEYS.mergers, next);
              }} style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_MID,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "4px 12px", cursor: "pointer", marginTop: "4px" }}>
                + ADD MERGER
              </button>
            </div>
            <CustomMergerForm
              stocks={stocks} date={date} headlines={headlines}
              onConfirm={({ merged, newHeadlines, headline }) => {
                const next = sortByPrice(merged);
                setStocks(next);
                setHeadlines(newHeadlines);
                wardenSet(KEYS.stocks, next);
                wardenSet(KEYS.headlines, newHeadlines);
                if (headline) { setLastPublished(headline); clearTimeout(window._lpTimer); window._lpTimer = setTimeout(() => setLastPublished(null), 3500); }
                setPanel(null);
              }}
            />
            </div>
          </div>
        )}

        {/* Panel: Jobs */}
        {panel === "jobs" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid ${GREEN_DARK}`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: `1px solid ${GREEN_DARK}`, paddingBottom: "12px" }}>
              {[["board","BOARD"],["payout","PAYOUT"]].map(([id, lbl]) => (
                <button key={id} onClick={() => setJobsTab(id)}
                  style={{ background: jobsTab === id ? "rgba(68,200,68,0.08)" : "none",
                    border: `1px solid ${jobsTab === id ? GREEN_DARK : "#1a2a3a"}`,
                    color: jobsTab === id ? "#88aadd" : GREEN_DARK,
                    fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                    padding: "4px 12px", cursor: "pointer" }}>
                  {lbl}
                </button>
              ))}
            </div>
            {jobsTab === "board" && (
              <JobBoardPanel
                jobs={jobs} setJobs={setJobs}
                stocks={stocks} setStocks={setStocks}
                date={date}
                rollConfig={rollConfig} setRollConfig={setRollConfig}
                alwaysMerge={alwaysMerge}
                KEYS={KEYS} wardenSet={wardenSet} showToast={showToast}
              />
            )}
            {jobsTab === "payout" && (
              <PayoutCalculator jobs={jobs} crew={crew} setCrew={setCrew} stocks={stocks}
                portfolio={portfolio} setPortfolio={setPortfolio}
                rollConfig={rollConfig} date={date}
                wardenSet={wardenSet} KEYS={KEYS} showToast={showToast} />
            )}
          </div>
        )}

        {/* Panel: Corps */}
        {panel === "corps" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid ${GREEN_DARK}`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>CORPORATIONS</div>
            {/* OmniCorp selector */}
            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.1em" }}>OMNICORP DESIGNATION</span>
              <select
                value={stocks.find(s => s.is_omnicorp)?.name ?? ""}
                onChange={(e) => {
                  const chosen = e.target.value;
                  const next = stocks.map(s => ({ ...s, is_omnicorp: s.name === chosen }));
                  setStocks(next); wardenSet(KEYS.stocks, next);
                }}
                style={{ background: BG, border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
                  fontFamily: MONO, fontSize: "10px", padding: "3px 6px", cursor: "pointer" }}>
                <option value="">— none —</option>
                {stocks.filter(s => !s.is_collapsed).map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
              <span style={{ color: GREEN_DARK, fontSize: "10px" }}>receives collapse payouts and has special immunities</span>
            </div>
            {/* Live corp management table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${GREEN_DARK}` }}>
                    {["COMPANY","INDUSTRY","PRICE","Δ","BUMP","HEALTH","VOL","FREEZE"].map((col) => (
                      <th key={col} style={{ padding: "8px 10px", textAlign: "left", color: GREEN_MID,
                        fontSize: "10px", letterSpacing: "0.12em", fontWeight: "normal" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s) => {
                    const adjustStock = (patch) => {
                      const next = stocks.map((x) => x.name === s.name ? { ...x, ...patch } : x);
                      setStocks(next); wardenSet(KEYS.stocks, next);
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
                          {s.name}{s.is_collapsed && <span style={{ color: "#333", marginLeft: "6px" }}>DELISTED</span>}{s.is_frozen && !s.is_collapsed && <span style={{ color: "#4488cc", marginLeft: "6px", fontSize: "10px" }}>❄</span>}
                        </td>
                        <td style={{ padding: "9px 10px", color: GREEN_MID, fontSize: "10px" }}>{s.industry}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <input type="number" defaultValue={s.price} key={s.price} disabled={s.is_collapsed}
                              onBlur={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val) && val !== s.price) adjustPrice(val - s.price); }}
                              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                              style={{ width: "80px", background: "transparent", border: `1px solid ${GREEN_DARK}`,
                                color: s.is_omnicorp ? AMBER : HEADER_GREEN, fontFamily: MONO, fontSize: "12px",
                                fontWeight: "bold", padding: "3px 6px", outline: "none", textAlign: "right",
                                opacity: s.is_collapsed ? 0.3 : 1 }} />
                            <span style={{ color: GREEN_MID, fontSize: "10px" }}>cr</span>
                          </div>
                        </td>
                        <td style={{ padding: "9px 10px", color: s.change > 0 ? GREEN : s.change < 0 ? RED : "#555", fontSize: "11px" }}>
                          {s.change > 0 ? "+" : ""}{s.change}
                        </td>
                        <td style={{ padding: "4px 10px", textAlign: "center" }}>
                          {!s.is_collapsed && !s.is_omnicorp && (
                            <button onClick={() => handleBumpHealth()}
                              disabled={["OK","Good"].includes(s.health)}
                              style={{ background: "none", border: `1px solid ${["OK","Good"].includes(s.health) ? "#1a2a1a" : "#1a3a2a"}`,
                                color: ["OK","Good"].includes(s.health) ? "#1a3a1a" : GREEN_MID,
                                fontFamily: MONO, fontSize: "10px", padding: "3px 8px",
                                cursor: ["OK","Good"].includes(s.health) ? "default" : "pointer",
                                letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                              ▲ BUMP
                            </button>
                          )}
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
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            {adjBtn("−", () => adjustVol(-1), s.volatility === VOLATILITY_STEPS[0] || s.is_collapsed)}
                            <span style={{ color: volColor(s.volatility), fontSize: "11px", minWidth: "56px", textAlign: "center" }}>
                              {s.volatility}
                            </span>
                            {adjBtn("+", () => adjustVol(1), s.volatility === VOLATILITY_STEPS[VOLATILITY_STEPS.length - 1] || s.is_collapsed)}
                          </div>
                        </td>
                        <td style={{ padding: "4px 10px", textAlign: "center" }}>
                          {!s.is_collapsed && (
                            <button onClick={() => {
                              const next = stocks.map(x => x.name === s.name ? { ...x, is_frozen: !s.is_frozen } : x);
                              setStocks(next); wardenSet(KEYS.stocks, next);
                              showToast(s.is_frozen ? `${s.name.split(" ")[0]} UNFROZEN` : `${s.name.split(" ")[0]} FROZEN`, "#88ccff");
                            }}
                              style={{ background: s.is_frozen ? "rgba(100,180,255,0.1)" : "none",
                                border: `1px solid ${s.is_frozen ? "#4488cc" : "#1a2a3a"}`,
                                color: s.is_frozen ? "#88ccff" : "#2a3a4a",
                                fontFamily: MONO, fontSize: "10px", padding: "2px 8px", cursor: "pointer" }}>
                              {s.is_frozen ? "FROZEN" : "—"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Corp name/industry/add editor */}
            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, marginTop: "20px", paddingTop: "16px" }}>
              <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.1em", marginBottom: "10px" }}>EDIT NAMES / ADD CORPORATION</div>
              <div style={{ overflowX: "auto", marginBottom: "12px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${GREEN_DARK}` }}>
                      {["NAME","INDUSTRY","PRICE","HEALTH","VOL",""].map(col => (
                        <th key={col} style={{ padding: "4px 6px", textAlign: "left", color: GREEN_DARK, fontWeight: "normal", letterSpacing: "0.08em", fontSize: "10px" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((s, i) => (
                      <tr key={s.name + i} style={{ borderBottom: `1px solid rgba(26,42,58,0.3)` }}>
                        <td style={{ padding: "3px 4px" }}>
                          <input defaultValue={s.name} onBlur={(e) => { const val = e.target.value.trim(); if (!val || val === s.name) return; const oldName = s.name; const next = stocks.map((x, xi) => xi === i ? { ...x, name: val } : x); setStocks(next); wardenSet(KEYS.stocks, next); const updatedHistory = history.map(entry => ({ ...entry, stocks: entry.stocks.map(hs => hs.name === oldName ? { ...hs, name: val } : hs) })); setHistory(updatedHistory); wardenSet(KEYS.history, updatedHistory); }}
                            style={{ ...inputStyle, width: "120px", fontSize: "10px", padding: "2px 5px" }} />
                        </td>
                        <td style={{ padding: "3px 4px" }}>
                          <input defaultValue={s.industry} onBlur={(e) => { const val = e.target.value.trim(); if (!val) return; const next = stocks.map((x, xi) => xi === i ? { ...x, industry: val } : x); setStocks(next); wardenSet(KEYS.stocks, next); }}
                            style={{ ...inputStyle, width: "90px", fontSize: "10px", padding: "2px 5px" }} />
                        </td>
                        <td style={{ padding: "3px 4px" }}>
                          <input defaultValue={s.price} inputMode="numeric" onBlur={(e) => { const val = parseInt(e.target.value); if (isNaN(val) || val < 1) return; const next = sortByPrice(stocks.map((x, xi) => xi === i ? { ...x, price: val } : x)); setStocks(next); wardenSet(KEYS.stocks, next); }}
                            style={{ ...inputStyle, width: "60px", fontSize: "10px", padding: "2px 5px" }} />
                        </td>
                        <td style={{ padding: "3px 4px" }}>
                          <select value={s.health} onChange={(e) => { const next = stocks.map((x, xi) => xi === i ? { ...x, health: e.target.value } : x); setStocks(next); wardenSet(KEYS.stocks, next); }}
                            style={{ ...inputStyle, fontSize: "10px", padding: "2px 4px", cursor: "pointer" }}>
                            {HEALTH_STEPS.map(hs => <option key={hs} value={hs}>{hs}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "3px 4px" }}>
                          <select value={s.volatility} onChange={(e) => { const next = stocks.map((x, xi) => xi === i ? { ...x, volatility: e.target.value } : x); setStocks(next); wardenSet(KEYS.stocks, next); }}
                            style={{ ...inputStyle, fontSize: "10px", padding: "2px 4px", cursor: "pointer" }}>
                            {VOLATILITY_STEPS.map(vol => <option key={vol} value={vol}>{vol}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "3px 4px" }}>
                          <button onClick={() => { if (!window.confirm(`Remove ${s.name}?`)) return; const next = sortByPrice(stocks.filter((_, xi) => xi !== i)); setStocks(next); wardenSet(KEYS.stocks, next); }}
                            style={{ background: "none", border: `1px solid #3a2a2a`, color: "#664444", fontFamily: MONO, fontSize: "10px", padding: "1px 6px", cursor: "pointer" }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AddCorpRow onAdd={(corp) => { const next = sortByPrice([...stocks, corp]); setStocks(next); wardenSet(KEYS.stocks, next); }} inputStyle={inputStyle} />
            </div>
            {/* Catalog — inline below corp editor */}
            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, paddingTop: "20px", marginTop: "8px" }}>
              <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "14px" }}>CATALOG & BENEFITS</div>
              <CatalogPanel catalogs={catalogs} setCatalogs={setCatalogs} stocks={stocks} wardenSet={wardenSet} KEYS={KEYS} />
            </div>
          </div>
        )}

        {/* Panel: Session */}
        {panel === "session" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid ${GREEN_DARK}`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>SESSION</div>
            {/* Sub-tab bar */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "20px", borderBottom: `1px solid ${GREEN_DARK}`, paddingBottom: "12px" }}>
              {[["debt","DEBT"],["portfolio","PORTFOLIO"],["ship","SHIP"],["contractors","CONTRACTORS"]].map(([id, lbl]) => (
                <button key={id} onClick={() => setSessionTab(id)}
                  style={{ background: sessionTab === id ? "rgba(68,200,68,0.08)" : "none",
                    border: `1px solid ${sessionTab === id ? GREEN_MID : GREEN_DARK}`,
                    color: sessionTab === id ? GREEN_MID : GREEN_DARK,
                    fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                    padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {lbl}
                  {id === "debt" && debt.length > 0 && <span style={{ color: "#cc5555", marginLeft: "4px" }}>({debt.length})</span>}
                  {id === "portfolio" && portfolio.length > 0 && <span style={{ color: GREEN_MID, marginLeft: "4px" }}>({portfolio.length})</span>}
                </button>
              ))}
            </div>
            {sessionTab === "debt" && (
              <DebtPanel debt={debt} setDebt={setDebt} wardenSet={wardenSet} KEYS={KEYS} />
            )}
            {sessionTab === "portfolio" && (
              <PortfolioPanel portfolio={portfolio} setPortfolio={setPortfolio}
                stocks={stocks} rollConfig={rollConfig} setRollConfig={setRollConfig}
                saveSettings={saveSettings} wardenSet={wardenSet} KEYS={KEYS} />
            )}
            {sessionTab === "ship" && (
              <ShipAccountPanel crew={crew} setCrew={setCrew} rollConfig={rollConfig} setRollConfig={setRollConfig} saveSettings={saveSettings} wardenSet={wardenSet} KEYS={KEYS} />
            )}
            {sessionTab === "contractors" && (
              <ContractorPanel crew={crew} setCrew={setCrew} wardenSet={wardenSet} KEYS={KEYS} />
            )}
          </div>
        )}

        {/* Panel: Settings */}
        {panel === "settings" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid ${GREEN_DARK}`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>SETTINGS</div>
            <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "12px" }}>FICTIONAL DATE</div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
              {["year","cycle"].map((field) => (
                <div key={field} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.1em" }}>{field.toUpperCase()}</span>
                  <input
                    value={date[field]}
                    onChange={(e) => handleDateInput(field, e.target.value)}
                    style={{ ...inputStyle, width: f === "year" ? "70px" : "50px", textAlign: "center" }}
                  />
                </div>
              ))}
              <span style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.1em" }}>
                (cycle auto-increments on each economy roll)
              </span>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
              <span style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.08em" }}>LABEL NAMES</span>
              {[["yearLabel","Year label","80px"],["cycleLabel","Cycle label","80px"]].map(([key, ph, w]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    value={rollConfig[key] ?? (key === "yearLabel" ? "Year" : "Cycle")}
                    onChange={(e) => {
                      const next = { ...rollConfig, [key]: e.target.value };
                      setRollConfig(next); saveSettings({ rollConfig: next });
                    }}
                    placeholder={ph}
                    style={{ ...inputStyle, width: w, fontSize: "10px" }}
                  />
                </div>
              ))}
              <span style={{ color: GREEN_DARK, fontSize: "10px" }}>renames the date labels on the player ticker</span>
            </div>
            {/* Theme */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "10px" }}>DISPLAY THEME</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {Object.entries(THEMES).map(([key, t]) => (
                  <button key={key} onClick={() => setTheme(key)}
                    style={{ background: theme === key ? "rgba(255,255,255,0.08)" : "none",
                      border: `1px solid ${theme === key ? "#6688aa" : "#1a2a3a"}`,
                      color: theme === key ? "#aabbcc" : GREEN_DARK,
                      fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                      padding: "5px 14px", cursor: "pointer" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {/* ── Job Settings ── */}
            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, marginTop: "24px", paddingTop: "20px" }}>
              <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "12px" }}>JOB BOARD</div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => {
                  const next = { ...rollConfig, bumpOnComplete: !rollConfig.bumpOnComplete };
                  setRollConfig(next); saveSettings({ rollConfig: next });
                }}
                  style={{ background: rollConfig.bumpOnComplete ? "rgba(68,170,100,0.1)" : "none",
                    border: `1px solid ${rollConfig.bumpOnComplete ? GREEN_DARK : "#1a2a3a"}`,
                    color: rollConfig.bumpOnComplete ? GREEN_MID : "#6688aa",
                    fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em",
                    padding: "5px 12px", cursor: "pointer" }}>
                  {rollConfig.bumpOnComplete ? "ON" : "OFF"}
                </button>
                <span style={{ color: GREEN_MID, fontSize: "11px" }}>
                  Auto-bump health on job completion {rollConfig.bumpOnComplete ? "(posting corp bumped — overrideable)" : "(disabled — manual only)"}
                </span>
              </div>
            </div>

            {/* ── Session Settings ── */}
            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, marginTop: "24px", paddingTop: "20px" }}>
              <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "14px" }}>SESSION SETTINGS</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ color: GREEN_MID, fontSize: "11px", width: "160px", flexShrink: 0, paddingTop: "4px" }}>Training time unit</span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[["months","MONTHS (house rule)"],["years","YEARS (standard)"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => {
                      const next = { ...rollConfig, trainingTimeUnit: val };
                      setRollConfig(next); saveSettings({ rollConfig: next });
                    }} style={{ background: (rollConfig.trainingTimeUnit || "months") === val ? "rgba(68,200,68,0.08)" : "none",
                      border: `1px solid ${(rollConfig.trainingTimeUnit || "months") === val ? GREEN_MID : GREEN_DARK}`,
                      color: (rollConfig.trainingTimeUnit || "months") === val ? GREEN_MID : GREEN_DARK,
                      fontFamily: MONO, fontSize: "10px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div style={{ color: GREEN_DARK, fontSize: "10px" }}>
                Ship ownership type and crew payment mode are configured in Session → Ship.
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, marginTop: "24px", paddingTop: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "12px" }}>MERGER SETTINGS</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <button onClick={() => { const next = !alwaysMerge; setAlwaysMerge(next); saveSettings({ alwaysMerge: next }); }}
                style={{ background: alwaysMerge ? "rgba(255,220,100,0.1)" : "none",
                  border: `1px solid ${alwaysMerge ? AMBER : "#1a2a3a"}`,
                  color: alwaysMerge ? AMBER : "#6688aa",
                  fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em",
                  padding: "5px 12px", cursor: "pointer" }}>
                {alwaysMerge ? "ON" : "OFF"}
              </button>
              <span style={{ color: GREEN_MID, fontSize: "11px" }}>
                Always merge on partner collapse {alwaysMerge ? "(early trigger active)" : "(early trigger disabled — collapses are normal delists)"}
              </span>
            </div>
            </div>

            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, marginTop: "24px", paddingTop: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "12px" }}>CHANGE WARDEN PIN</div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <input value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="new 6-digit PIN" maxLength={6}
                style={{ ...inputStyle, width: "140px" }} />
              <input value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="confirm PIN" maxLength={6}
                style={{ ...inputStyle, width: "140px" }} />
              <button onClick={handleSavePin} style={{ ...actionBtn }}>SAVE PIN</button>
              <button onClick={() => {
                const backup = { stocks, headlines, history, date, mergers, alwaysMerge, jobs, crew, debt, portfolio, catalogs, exportedAt: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `stonks-backup-${Date.now()}.json`; a.click();
                URL.revokeObjectURL(url);
              }} style={{ ...actionBtn, borderColor: GREEN, color: GREEN }}>⬇ EXPORT BACKUP</button>
              <label style={{ ...actionBtn, borderColor: "#44aaff", color: "#88ccff", cursor: "pointer",
                display: "inline-block" }}>
                ⬆ IMPORT BACKUP
                <input type="file" accept=".json" style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      try {
                        const data = JSON.parse(ev.target.result);
                        if (!data.stocks || !Array.isArray(data.stocks)) {
                          alert("Invalid backup file.");
                          return;
                        }
                        const confirmed = window.confirm(
                          "IMPORT BACKUP?\n\nThis will overwrite all current data including stocks, headlines, history, date, mergers, job board, crew profiles, debt, portfolio, and catalogs. This cannot be undone."
                        );
                        if (!confirmed) return;
                        const bkStocks = data.stocks;
                        const bkHeadlines = data.headlines || [];
                        const bkHist = data.history || [];
                        const bkDate = data.date || { year: 2122, cycle: 1 };
                        const bkMergers = data.mergers || INITIAL_MERGERS;
                        const bkAlwaysMerge = data.alwaysMerge ?? true;
                        const bkJobs = Array.isArray(data.jobs) ? data.jobs : [];
                        const bkCrew = data.crew && typeof data.crew === "object" && data.crew.profiles != null ? data.crew : { profiles: [], contractors: [], shipBalance: 0, shipExpenses: [] };
                        const bkDebt = Array.isArray(data.debt) ? data.debt : [];
                        const bkPortfolio = Array.isArray(data.portfolio) ? data.portfolio : [];
                        const bkCatalogs = data.catalogs && typeof data.catalogs === "object" ? data.catalogs : {};
                        setStocks(sortByPrice(bkStocks));
                        setHeadlines(bkHeadlines);
                        setHistory(bkHist);
                        setDate(bkDate);
                        setMergers(bkMergers);
                        setAlwaysMerge(bkAlwaysMerge);
                        setJobs(bkJobs);
                        setCrew(bkCrew);
                        setDebt(bkDebt);
                        setPortfolio(bkPortfolio);
                        setCatalogs(bkCatalogs);
                            await wardenSet(KEYS.stocks, bkStocks);
                        await wardenSet(KEYS.headlines, bkHeadlines);
                        await wardenSet(KEYS.history, bkHist);
                        await wardenSet(KEYS.date, bkDate);
                        await wardenSet(KEYS.mergers, bkMergers);
                        await wardenSet(KEYS.jobs, bkJobs);
                        await wardenSet(KEYS.crew, bkCrew);
                        await wardenSet(KEYS.debt, bkDebt);
                        await wardenSet(KEYS.portfolio, bkPortfolio);
                        await wardenSet(KEYS.catalogs, bkCatalogs);
                        await wardenSet(KEYS.settings, { alwaysMerge: bkAlwaysMerge, rollConfig: data.rollConfig || DEFAULT_ROLL_CONFIG });
                        ev.target.value = "";
                        alert("Backup restored successfully.");
                      } catch {
                        alert("Failed to parse backup file.");
                      }
                    };
                    reader.readAsText(file);
                  }} />
              </label>
            </div>
            {pinMsg && <div style={{ color: pinMsg.includes("updated") ? GREEN : RED, fontSize: "11px", marginTop: "8px" }}>{pinMsg}</div>}

            </div>

            {/* ── Dice Settings ── */}
            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, marginTop: "24px", paddingTop: "20px" }}>
              <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "4px" }}>ADVANCED DICE SETTINGS</div>
              <div style={{ color: GREEN_DARK, fontSize: "10px", marginBottom: "14px", letterSpacing: "0.08em" }}>
                Controls the probability of health/volatility shifts and price movement magnitude. Defaults: d10, improve on 1, worsen on 8+.
              </div>
              {[
                { key: "shiftDie",  label: "SHIFT DIE SIDES", hint: "Die used for health & vol rolls (default 10)" },
                { key: "improveOn", label: "IMPROVE ON ≤",    hint: "Roll ≤ this → shift up one step" },
                { key: "worsenOn",  label: "WORSEN ON ≥",     hint: "Roll ≥ this → shift down one step" },
                { key: "dieHigh",   label: "PRICE DIE (HIGH VOL)",   hint: "Sides on price roll for High volatility (default 20)" },
                { key: "dieMedium", label: "PRICE DIE (MED VOL)",    hint: "Sides on price roll for Medium volatility (default 10)" },
                { key: "dieLow",    label: "PRICE DIE (LOW VOL)",    hint: "Sides on price roll for Low volatility (default 5)" },
              ].map(({ key, label, hint }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <span style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.1em", width: "180px", flexShrink: 0 }}>{label}</span>
                  <input
                    value={rollConfig[key]}
                    inputMode="numeric"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (isNaN(val) || val < 1) return;
                      const next = { ...rollConfig, [key]: val };
                      setRollConfig(next);
                      saveSettings({ rollConfig: next });
                    }}
                    style={{ ...inputStyle, width: "60px", textAlign: "center" }}
                  />
                  <span style={{ color: GREEN_DARK, fontSize: "10px" }}>{hint}</span>
                </div>
              ))}
              <button onClick={() => {
                setRollConfig(DEFAULT_ROLL_CONFIG);
                saveSettings({ rollConfig: DEFAULT_ROLL_CONFIG });
              }}
                style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
                  fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "5px 14px", cursor: "pointer", marginTop: "4px" }}>
                RESET DICE TO DEFAULTS
              </button>
            </div>

            <div style={{ borderTop: `1px solid ${GREEN_DARK}`, marginTop: "24px", paddingTop: "20px" }}>
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
                    setRollConfig(DEFAULT_ROLL_CONFIG);
                    await wardenSet(KEYS.stocks, INITIAL_STOCKS);
                    await wardenSet(KEYS.headlines, []);
                    await wardenSet(KEYS.history, []);
                    await wardenSet(KEYS.date, defaultDate);
                    await wardenSet(KEYS.pin, DEFAULT_PIN);
                    await wardenSet(KEYS.mergers, INITIAL_MERGERS);
                    await wardenSet(KEYS.settings, { alwaysMerge: true, rollConfig: DEFAULT_ROLL_CONFIG });
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
            <div style={{ background: BG, border: `1px solid ${confirmDialog.danger ? "#663333" : "#1a2a3a"}`,
              padding: "32px 40px", fontFamily: MONO, textAlign: "center", maxWidth: "400px" }}>
              <div style={{ color: confirmDialog.danger ? "#cc5555" : HEADER_GREEN,
                fontSize: "13px", letterSpacing: "0.1em", marginBottom: "12px" }}>{confirmDialog.msg}</div>
              {confirmDialog.submsg && (
                <div style={{ color: GREEN_DARK, fontSize: "11px", marginBottom: "24px", lineHeight: 1.7 }}>
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



      </div>
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,15,0,0.95)", border: `1px solid ${toast.color}`, color: toast.color,
          fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em",
          padding: "10px 20px", zIndex: 200, whiteSpace: "nowrap",
          boxShadow: `0 0 20px ${toast.color}22` }}>
          ✓ {toast.msg}
        </div>
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}

const btnSmall = {
  background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_MID,
  fontFamily: MONO, fontSize: "12px", width: "24px", height: "24px", cursor: "pointer", padding: 0
};
const inputStyle = {
  background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
  fontFamily: MONO, fontSize: "11px", padding: "6px 10px", outline: "none"
};
const actionBtn = {
  background: "none", border: `1px solid ${GREEN_MID}`, color: GREEN_MID,
  fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 16px", cursor: "pointer"
};

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function StonksApp({ roomCode = "stonks" }) {
  // Theme is a local display preference — stored in localStorage, not Redis
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("stonks_theme") || "green"; } catch { return "green"; }
  });

  const T = THEMES[theme] || THEMES.green;

  // Inject CSS vars on root
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--c-bg",          T.bg);
    r.style.setProperty("--c-primary",     T.primary);
    r.style.setProperty("--c-primary-dim", T.primaryDim);
    r.style.setProperty("--c-primary-dark",T.primaryDark);
    r.style.setProperty("--c-primary-mid", T.primaryMid);
    r.style.setProperty("--c-header",      T.primaryHeader);
    r.style.setProperty("--c-accent",      T.accent);
    r.style.setProperty("--c-scanline",    T.scanline);
    try { localStorage.setItem("stonks_theme", theme); } catch {}
  }, [theme, T]);
  const KEYS = makeKeys(roomCode);
  const [view, setView] = useState("player"); // "player" | "pin" | "warden"
  const [stocks, setStocks] = useState(INITIAL_STOCKS);
  const [headlines, setHeadlines] = useState([]);
  const [history, setHistory] = useState([]);
  const [date, setDate] = useState({ year: 2122, cycle: 1 });
  const [storedPin, setStoredPin] = useState(null);
  const [mergers, setMergers] = useState(INITIAL_MERGERS);
  const [alwaysMerge, setAlwaysMerge] = useState(true);
  const [rollConfig, setRollConfig] = useState(DEFAULT_ROLL_CONFIG);
  const [jobs, setJobs] = useState([]);
  const [crew, setCrew] = useState({ profiles: [], contractors: [], shipBalance: 0, shipExpenses: [] });
  const [debt, setDebt] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [catalogs, setCatalogs] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const initStocks = await safeGet(KEYS.stocks, INITIAL_STOCKS);
      const initHeadlines = await safeGet(KEYS.headlines, []);
      const initHist = await safeGet(KEYS.history, []);
      const initDate = await safeGet(KEYS.date, { year: 2122, cycle: 1 });
      const initMergers = await safeGet(KEYS.mergers, INITIAL_MERGERS);
      const initSett = await safeGet(KEYS.settings, { alwaysMerge: true });
      const initJobs = await safeGet(KEYS.jobs, []);
      const initCrew = await safeGet(KEYS.crew, { profiles: [], contractors: [], shipBalance: 0, shipExpenses: [] });
      const initDebt = await safeGet(KEYS.debt, []);
      const initPortfolio = await safeGet(KEYS.portfolio, []);
      const initCatalogs = await safeGet(KEYS.catalogs, {});
      setStocks(sortByPrice(initStocks));
      setHeadlines(initHeadlines);
      setHistory(initHist);
      setDate(initDate);
      setMergers(initMergers);
      setAlwaysMerge(initSett.alwaysMerge ?? true);
      setRollConfig({ ...DEFAULT_ROLL_CONFIG, ...(initSett.rollConfig || {}) });
      setJobs(Array.isArray(initJobs) ? initJobs : []);
      // Migrate crew from old array format to new object format
      setCrew(Array.isArray(initCrew) ? { profiles: initCrew, contractors: [], shipBalance: 0, shipExpenses: [] }
             : (initCrew && typeof initCrew === "object" && initCrew.profiles != null ? initCrew : { profiles: [], contractors: [], shipBalance: 0, shipExpenses: [] }));
      setDebt(Array.isArray(initDebt) ? initDebt : []);
      setPortfolio(Array.isArray(initPortfolio) ? initPortfolio : []);
      setCatalogs(initCatalogs && typeof initCatalogs === "object" ? initCatalogs : {});
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

  if (view === "honeypot") {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", fontFamily: MONO, padding: "32px" }}>
        <div style={{ color: "#ff3333", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "24px" }}>
          ██████████████████████████████████<br/>
          █  SFNET SECURITY MODULE v4.7.2  █<br/>
          ██████████████████████████████████
        </div>
        <div style={{ color: "#ff6666", fontSize: "10px", letterSpacing: "0.15em", lineHeight: "2.2", textAlign: "left", maxWidth: "420px", width: "100%" }}>
          <div style={{ color: "#ff4444", marginBottom: "4px" }}>sfnet-sec@daemon-4:~$ <span style={{ color: "#ff6666" }}>./intrusion_scan --live</span></div>
          <div>{">"} SCANNING SESSION CONTEXT<span style={{ color: "#ff3333" }}>...</span></div>
          <div>{">"} INTRUSION DETECTED — UNAUTHORIZED TERMINAL ACCESS</div>
          <div>{">"} SOURCE IP: <span style={{ color: "#ff3333" }}>LOGGED AND TRACED</span></div>
          <div>{">"} SESSION FINGERPRINT: <span style={{ color: "#ff3333" }}>CAPTURED</span></div>
          <div>{">"} DEVICE SIGNATURE: <span style={{ color: "#ff3333" }}>ARCHIVED</span></div>
          <div>{">"} <span style={{ color: "#ff8888" }}>_</span></div>
          <div style={{ color: "#ff4444" }}>sfnet-sec@daemon-4:~$ <span style={{ color: "#ff6666" }}>./alert --escalate SFNET_SEC_OPS</span></div>
          <div>{">"} ALERTING: <span style={{ color: "#ff3333" }}>SFNET SEC-OPS</span></div>
          <div>{">"} INCIDENT TICKET: <span style={{ color: "#ff3333" }}>SEC-{Math.floor(Math.random()*90000)+10000}</span></div>
          <div>{">"} RESPONSE ETA: <span style={{ color: "#ff3333" }}>IMMEDIATE</span></div>
          <div>{">"} <span style={{ color: "#ff8888" }}>_</span></div>
          <div style={{ marginTop: "8px", color: "#ff3333", lineHeight: "1.8" }}>
            THIS TERMINAL IS PROPERTY OF<br/>
            STELLAR FINANCIAL NETWORK<br/>
            UNAUTHORIZED ACCESS IS A VIOLATION<br/>
            OF SFNET REGULATION 7-ALPHA<br/>
            <span style={{ fontSize: "9px", opacity: 0.7 }}>~ ALL ACTIVITY LOGGED AND RETAINED FOR PROSECUTION ~</span>
          </div>
        </div>
        <button onClick={() => setView("player")}
          style={{ marginTop: "32px", background: "none", border: "1px solid #ff3333",
            color: "#ff6666", fontFamily: MONO, fontSize: "10px", letterSpacing: "0.15em",
            padding: "8px 16px", cursor: "pointer" }}>
          DISCONNECT
        </button>
      </div>
    );
  }

  if (view === "pin") {
    return <PinGate
      roomCode={roomCode}
      onSuccess={(pin) => { setStoredPin(pin); setView("warden"); }}
      onCancel={() => setView("player")}
      onClearLockout={async (passphrase) => {
        const r = await fetch("/api/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: roomCode, passphrase }),
        });
        return r.ok;
      }}
    />;
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
        rollConfig={rollConfig} setRollConfig={setRollConfig}
        jobs={jobs} setJobs={setJobs}
        crew={crew} setCrew={setCrew}
        debt={debt} setDebt={setDebt}
        portfolio={portfolio} setPortfolio={setPortfolio}
        catalogs={catalogs} setCatalogs={setCatalogs}
        theme={theme} setTheme={setTheme}
        onLogout={() => setView("player")}
        KEYS={KEYS}
      />
    );
  }

  return (
    <PlayerView
      stocks={stocks} headlines={headlines}
      history={history} date={date}
      yearLabel={rollConfig.yearLabel ?? "Year"} cycleLabel={rollConfig.cycleLabel ?? "Cycle"}
      onSwitchGame={() => { window.location.href = "/"; }}
      jobs={jobs}
      debt={debt}
      crew={crew}
      portfolio={portfolio}
      catalogs={catalogs}
      rollConfig={rollConfig}
      theme={theme} setTheme={setTheme}
      onRefresh={async () => {
        const [s, h, hist, d] = await Promise.all([
          safeGet(KEYS.stocks, INITIAL_STOCKS),
          safeGet(KEYS.headlines, []),
          safeGet(KEYS.history, []),
          safeGet(KEYS.date, { year: 2122, cycle: 1 }),
        ]);
        setStocks(sortByPrice(s));
        setHeadlines(h);
        setHistory(hist);
        setDate(d);
      }}
      onWardenAccess={() => setView("pin")}
      onHoneypot={() => {
        fetch(`/api/honeypot?room=${encodeURIComponent(roomCode)}`).catch(() => {});
        setView("honeypot");
      }}
    />
  );
}
