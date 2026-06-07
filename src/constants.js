// ─── Game Constants ──────────────────────────────────────────────────────────
// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_PIN = "000000";
export const HEALTH_STEPS = ["Bankrupt", "Bad", "OK", "Good"];
export const VOLATILITY_STEPS = ["Low", "Medium", "High"];
export const VOLATILITY_DIE = { High: 20, Medium: 10, Low: 5 };

export const INITIAL_STOCKS = [
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

export const OMNICORP_HEADLINES = [
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
export const MERGER_HEADLINES = {
  "Torsten-Koga CyberDefense": { headline: "TORSTEN DEFENSE UNLIMITED AND KOGA CYBERSYSTEMS ANNOUNCE EMERGENCY MERGER", subtext: "Combined entity to operate as Torsten-Koga CyberDefense effective immediately, says company representative." },
  "Vance-Albedo LifeSystems":  { headline: "VANCE PHARMACEUTICALS AND ALBEDO AGROSYSTEMS COMPLETE DEFENSIVE MERGER", subtext: "Combined entity to operate as Vance-Albedo LifeSystems, says company representative." },
  "Hayden-Rhodes Dynamics":    { headline: "HAYDEN ENTERPRISES AND RHODES DRIVEYARDS FINALIZE MERGER AMID MARKET PRESSURES", subtext: "Combined entity to operate as Hayden-Rhodes Dynamics, says company representative." },
};

// Companies protected from individual OmniCorp acquisition buttons while their merger is pending
// key = company name, value = merger name that protects it
export const MERGER_PROTECTED = {
  "Torsten Defense Unlimited": "Torsten-Koga CyberDefense",
  "Koga Cybersystems":         "Torsten-Koga CyberDefense",
  "Vance Pharmaceuticals":     "Vance-Albedo LifeSystems",
  "Albedo Agrosystems":        "Vance-Albedo LifeSystems",
  "Hayden Enterprises":        "Hayden-Rhodes Dynamics",
  "Rhodes Driveyards":         "Hayden-Rhodes Dynamics",
};

export const INITIAL_MERGERS = [
  { name: "Torsten-Koga CyberDefense", partner1: "Torsten Defense Unlimited", partner2: "Koga Cybersystems",   industry: "Defense/Cyber", triggered: false },
  { name: "Vance-Albedo LifeSystems",  partner1: "Vance Pharmaceuticals",     partner2: "Albedo Agrosystems", industry: "Pharma/Food",   triggered: false },
  { name: "Hayden-Rhodes Dynamics",    partner1: "Hayden Enterprises",        partner2: "Rhodes Driveyards",  industry: "Fuel/Shipyards",triggered: false },
];

export const INITIAL_CATALOGS = {
  "Koo-Ya Interactive": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "KOO-YA PREFERRED PARTNER: MEDIA ACCOUNT\n50% OFF ALL ADVERTISING, MARKETING, AND SPONSORED PLACEMENT ACROSS THE KOO-YA INTERACTIVE NETWORK.",
  },
  "Rhodes Driveyards": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "PREFERRED CONTRACTOR ACCOUNT: RHODES DRIVEYARDS FACILITY NETWORK\n50% OFF ALL MAJOR AND MINOR SHIP UPGRADES AT ANY RHODES DRIVEYARDS DEALERSHIP. SHIP WEAPONS AND ORDNANCE NOT INCLUDED.",
  },
  "Hayden Enterprises": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "HAYDEN FUEL CARD: AUTHORIZED OPERATOR\n50% OFF ALL FUEL PURCHASES AT ANY HAYDEN ENTERPRISES REFUELING STATION. PRESENT CARD AT TIME OF PURCHASE. CARD IS NON-TRANSFERABLE.",
  },
  "Koga Cybersystems": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "KOGA IMPLANT PROGRAM: APPROVED PARTICIPANT\n50% OFF ALL NON-COMBAT CYBERNETIC IMPLANTS AT ANY KOGA CYBERSYSTEMS INSTALLATION. COMBAT-RATED HARDWARE EXCLUDED.",
  },
  "Conduit Interstellar": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "CONDUIT FREQUENT TRAVELER: DIAMOND PLUS ELITE PREFERRED PRIORITY MEMBERSHIP\n50% OFF ALL INTERPLANETARY AND INTERSTELLAR JUMP TICKETS ACROSS THE CONDUIT INTERSTELLAR NETWORK.",
  },
  "Sterling Credit Solutions": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "STERLING PREFERRED MEMBER: ZERO INTEREST LENDING\nACCESS TO ZERO-INTEREST LOANS UP TO 1,000,000CR. NO CREDIT CHECK. NO COLLATERAL REQUIRED. STANDARD DEBT OBLIGATIONS APPLY.",
  },
  "Vance Pharmaceuticals": {
    status: "hidden", ineligibleReason: "",
    benefits: "VANCE MEDICAL PARTNER ACCOUNT: DISCOUNT MEDICAL SERVICES\n50% OFF ALL MEDICAL SERVICES AT ANY VANCE PHARMACEUTICALS MEDICAL CENTER.",
    items: [
      { id: "vance-1", name: "Vance Stimpak\u2122",     price: "10kcr", notes: "Same as standard stimpak, but with zero cooldown." },
      { id: "vance-2", name: "Vance Regen Patch\u2122",  price: "15kcr", notes: "Heals 1 Wound. Takes 8 hours. Can be used in the field." },
      { id: "vance-3", name: "Vanex\u2122",              price: "2kcr",  notes: "Sanity Save. Fail: Take 1 Stress. Pass: Reduce Stress by 1d5." },
    ],
  },
  "Torsten Defense Unlimited": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "TORSTEN AUTHORIZED RESELLER ACCOUNT\n50% OFF ALL SHIP MUNITIONS RESUPPLY AND PERSONAL AMMUNITION CONTAINERS AT ANY TORSTEN DEFENSE UNLIMITED DEPOT. PROOF OF VESSEL REGISTRATION REQUIRED.",
  },
  "Citadel Labor Union": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "CITADEL UNION MEMBERSHIP\n50% OFF ALL CITADEL LABOR UNION CONTRACTOR FEES ACROSS THE NETWORK. RECOGNIZED AT ALL CITADEL-AFFILIATED PORTS, STATIONS, AND INSTALLATIONS.",
  },
  "Albedo Agrosystems": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "ALBEDO BULK RETAILER AUTHORIZED DISTRIBUTOR\n50% OFF ALL MRE BULK ORDERS THROUGH THE ALBEDO AGROSYSTEMS DISTRIBUTION NETWORK. MINIMUM ORDER: ONE PALLET. FLAVORS SUBJECT TO AVAILABILITY.",
  },
  "Bortek": {
    status: "hidden", ineligibleReason: "", items: [],
    benefits: "BORTEK PARTS & SUPPLIES\n50% OFF ALL MACHINE SHOP RESUPPLY ORDERS THROUGH BORTEK'S INDUSTRIAL SUPPLY NETWORK.",
  },
};

// Market cap = sum of all non-collapsed, non-OmniCorp stock prices (whole number)
export const computeMarketCap = (stocks) =>
  Math.floor(stocks.filter(s => !s.is_collapsed && !s.is_omnicorp).reduce((s, x) => s + (x.price || 0), 0));

export const INITIAL_BLACKMARKET = {
  pool: [
    { id:"bm-seed-1", status:"pool",
      content:"ACQUISITION NOTICE\nBobby McGee\nWANTED: Dead or Alive\nCharges: Copyright infringement\nReward: 10kcr — cash only, no questions\nContact: Drop Box 7",
      notes:"Last known location: August-69 Space Station. Known associate: Sarah McConnor. Rap sheet: petty theft, stowaway. Complication: He wrote the music he is being accused of stealing." },
    { id:"bm-seed-2", status:"pool",
      content:"REPOSSESSION NOTICE\nVampire Squid Model Military Stealth Starship\nSerial: VQ-7734-BLACKSITE\nPayout: Standard salvage rate + 2x Hazard Multiplier\nCash only. Proof of recovery required.",
      notes:"Last known location: departing Rhodes Driveyards HQ. Last registered owner: Sgt. Draper. Threat: 5 marines, pulse rifles, advanced battle dress. Tactical consideration: High ground — ship can ambush from cloaked position. Puzzle: players must conduct ship-to-ship combat while simultaneously boarding to disable." },
    { id:"bm-seed-3", status:"pool",
      content:"ASSET ACQUISITION\nPayout: 10% salvage rights\nNDA required.\nInterested parties contact Drop Box 12.",
      notes:"Target: processed ore ingots, Bortek warehouse to August-69. Moving target. Security: Citadel contracted ex-marines. Lethal force not authorized against union members — Citadel union card grants significant tactical advantage." },
    { id:"bm-seed-4", status:"pool",
      content:"URGENT TRANSPORT — DANGEROUS GOODS\nUnstable fissile material. Handle with care.\nPayout: 10kcr + fuel costs covered\nPickup: Gorgon II orbit coordinates (provided on acceptance)\nDelivery: August-69 Docking Bay 12\nTime sensitive.",
      notes:"Experimental Hayden fuel missing stabilizing additives. Must be strapped to hull as external cargo. Hayden is aware of the theft and will send an interceptor. Detonation risk if evasive maneuvers are too aggressive." },
    { id:"bm-seed-5", status:"pool",
      content:"INTERMEDIARY REQUIRED\nOne-time job. Muscle provided.\nPackage and payment ready.\nLocation: Dark side of Phraxis moon. Vacuum environment — bring suits.\nPayout: On completion.\nDrop Box 4.",
      notes:"Muscle: Blackshield Group hired Murderous Assholes. Package: Koga experimental android prototype, causes 1 Stress/hour proximity. Payment: Cocaine2. Method: android is holding a pulled frag grenade. Problem: a third party arrives to poach the deal." },
    { id:"bm-seed-6", status:"pool",
      content:"EVIDENCE RETRIEVAL\nCorporate document recovery, executive level.\nSensitive materials. Discretion required.\nPayout: 50kcr — cash only\nNDA required.\nDrop Box 9.",
      notes:"Jumpy mid-level exec wants to frame his boss for embezzlement. Players must access a secure corporate data facility to plant fabricated evidence. Complication: crew trips a known alarm on entry. 15-minute window to exit before automated interceptors arrive. Going back to undo the plant means fighting their way out. Walking away means the frame job completes and they don't get paid. The boss has blackmail on the exec — players may discover this mid-job." },
    { id:"bm-seed-7", status:"pool",
      content:"DERELICT LOCATED\nClass-II vessel. Transponder dark.\nLast registered: Rhodes Driveyards, 3 years prior.\nCoordinates attached on request.\nFinders keepers. No client. No guaranteed payout.\nDrop Box 2.",
      notes:"Generate using A Pound of Flesh derelict ship generator." },
  ],
  active: [],
  archive: [],
};

// Compute merger display status from live stocks; only "triggered" is stored.
export const getMergerStatus = (merger, stocks) => {
  if (merger.triggered) return "triggered";
  const p1 = stocks.some((s) => s.name === merger.partner1 && !s.is_collapsed && !s.is_delisting);
  const p2 = stocks.some((s) => s.name === merger.partner2 && !s.is_collapsed && !s.is_delisting);
  if (!p1 || !p2) return "unavailable";
  return "pending";
};

// Remove both partners and insert merged entity; caller must sort afterward.
export const applyMerger = (stocks, merger) => {
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

export const sortByPrice = (stocks) => [...stocks].sort((a, b) => b.price - a.price);

// ─── Roll Config (overridable per room) ───────────────────────────────────────

export const DEFAULT_ROLL_CONFIG = {
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

// ─── Storage Helpers ─────────────────────────────────────────────────────────

export const makeKeys = (prefix) => ({
  stocks:      `${prefix}:stocks`,
  headlines:   `${prefix}:headlines`,
  history:     `${prefix}:history`,
  date:        `${prefix}:date`,
  pin:         `${prefix}:pin`,
  mergers:     `${prefix}:mergers`,
  settings:    `${prefix}:settings`,
  jobs:        `${prefix}:jobs`,
  crew:        `${prefix}:crew`,
  debt:        `${prefix}:debt`,
  portfolio:   `${prefix}:portfolio`,
  catalogs:    `${prefix}:catalogs`,
  blackmarket: `${prefix}:blackmarket`,
  houseRules:  `${prefix}:houseRules`,
});

export const safeGet = async (key, fallback, pin = null) => {
  try {
    const headers = {};
    if (pin) headers["x-warden-pin"] = pin;
    const r = await fetch(`/api/store?k=${encodeURIComponent(key)}`, { headers });
    if (!r.ok) return fallback;
    const data = await r.json();
    return (data.value !== undefined && data.value !== null) ? data.value : fallback;
  } catch { return fallback; }
};

export const safeSet = async (key, value, pin = null) => {
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

// ─── Themes ──────────────────────────────────────────────────────────────────

export const THEMES = {
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
    activeBg: "rgba(68,255,136,0.08)",
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
    activeBg: "rgba(255,200,68,0.10)",
  },
  blue: {
    label: "BLUE",
    bg: "#060810",
    primary: "#44aaff",
    primaryDim: "#88bbdd",
    primaryDark: "#2a4a6a",
    primaryMid: "#4a7a9a",
    primaryHeader: "#ddeeff",
    scanline: "rgba(100,180,255,0.04)",
    accent: "#ffdd77",
    activeBg: "rgba(68,170,255,0.10)",
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
    activeBg: "rgba(200,200,200,0.10)",
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
    activeBg: "rgba(0,255,0,0.08)",
  },
};

// ─── Style Variables ─────────────────────────────────────────────────────────

export var BG = "var(--c-bg, #060807)";
export var GREEN = "var(--c-primary, #44ff88)";
export var GREEN_DIM = "var(--c-primary-dim, #b8ddb8)";
export var GREEN_DARK = "var(--c-primary-dark, #4a7a4a)";
export var GREEN_MID = "var(--c-primary-mid, #5a9a5a)";
export var AMBER = "#ffdd77";
export var RED = "#ff4455";
export var HEADER_GREEN = "var(--c-header, #e8ffe8)";
export var MONO = "'Share Tech Mono', 'Courier New', monospace";

export var healthColor = (h) => ({
  Good: "var(--c-primary, #44ff88)", OK: "var(--c-primary-dim, #aaffcc)", Bad: "#ff8844", Bankrupt: "#ff4455"
}[h] || "#888");

export var volColor = (v) => ({
  High: "#ff8844", Medium: "var(--c-primary-dim, #aaffcc)", Low: "var(--c-primary, #44ff88)"
}[v] || "#888");

// ─── Session Constants ──────────────────────────────────────────────────────

export const HAZARD_OPTS = ["N/A","x1","x2","x3","x4","x5"];
export const HAZARD_MULT = { "N/A": 0, "x1": 1, "x2": 2, "x3": 3, "x4": 4, "x5": 5 };
export const DISPOSITION_OPTS = ["Active","Deceased","Next of Kin","LLC","Other"];
export const CLASS_TEMPLATES = {
  Marine: { trained: 2, expert: 1, master: 0 },
  Android: { trained: 3, expert: 1, master: 0 },
  Scientist: { trained: 1, expert: 1, master: 1 },
  Teamster: { trained: 3, expert: 1, master: 0 },
};


// ─── Contractor Types ────────────────────────────────────────────────────────

export const CONTRACTOR_TYPES = [
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


// ─── Player Downtime Tables ──────────────────────────────────────────────────

export const SHORE_LEAVE_TABLE = [
  ["X","1d100×10kcr","2d10[+]"],["C","2d10×100cr","1d5"],["B","2d10×1kcr","1d10"],["A","2d10×10kcr","2d10"],["S","2d10×100kcr","All"],
];
export const SHORE_LEAVE_RESULTS = [
  ["Critical Success","Convert maximum stress for port class. Relieve all remainder."],
  ["Success","Convert stress into permanent Save improvements (1 Stress = +1 to any Save). Relieve remainder to Minimum Stress."],
  ["Failure","No conversion. All Stress relieved to Minimum Stress. Gain 1 Stress for the failed save."],
  ["Critical Failure","No conversion. No relief. Make immediate Panic Check."],
];
export const TREATMENTS_TABLE = [
  ["Artificial Wellness Counselor","150cr","Advantage on next Rest Save"],
  ["Immersive Slicksim Therapy","1kcr","Advantage on next Shore Leave Sanity Save"],
  ["Medpod","6kcr","Heals 1 Wound"],
  ["Pseudoflesh Injection","18kcr","Restores lost Stats"],
  ["Deep Tissue Nanogel Massage","24kcr","Reduces Minimum Stress by 1"],
  ["Psychosurgery","28kcr","Removes a Condition or Trauma Response"],
  ["Cognitive Defragmentation","100kcr","Removes all Conditions, resets Minimum Stress to 2"],
];
export const TRAINING_TABLE = [
  ["Trained","None","2","10kcr","+10"],
  ["Expert","1 Trained","4","50kcr","+15"],
  ["Master","1 Expert","6","200kcr","+20"],
];
export const MILITARY_RESULTS = [
  ["Critical Success","Military Training, Athletics, one Expert Skill. +10 Combat, −10 Stat of choice. Marine Trauma Response."],
  ["Success","Military Training, Athletics, two Trained Skills. +10 Combat, −10 Stat of choice. Marine Trauma Response."],
  ["Failure","Military Training, Athletics, one Trained Skill. Marine Trauma Response."],
  ["Critical Failure","Killed in Action."],
];
export const CHECKLIST_ITEMS = [
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


// ─── Black Market Generation Tables ──────────────────────────────────────────

export const BM_GEN_TABLES = {
  bounty: {
    label: "BOUNTY",
    rolls: [
      { label: "Delivery condition (d3)", items: ["1 — Dead", "2 — Alive", "3 — Dead or Alive"] },
      { label: "Target (d2)", items: ["1 — Solo", "2 — Has backup"] },
      { label: "Hiring entity (d3)", items: ["1 — Criminal", "2 — Corporate", "3 — Private"] },
      { label: "Rap sheet (d3)", items: ["1 — Violent", "2 — Non-violent", "3 — Unknown"] },
    ],
    d20: ["Unpaid loans","Fraud / embezzlement","Contract breach","Theft","Murder","Assault",
      "Smuggling","NDA violation","Desertion","Industrial espionage",
      "Witnessed something they shouldn't have","Mistaken identity",
      "Someone just wants them gone","Identity theft","Indentured servitude escapee",
      "Inheritance dispute","Bail jumper","Gambling debt","Roll twice","Roll three times"],
    d20Label: "Stated reason (d20)",
  },
  repo: {
    label: "REPO",
    rolls: [
      { label: "Object (d4)", items: ["1 — Pocket item","2 — Hand-carry item","3 — Cargo container","4 — Ship"] },
      { label: "Who has it (d2)", items: ["1 — Individual","2 — Group"] },
      { label: "Disposition (d3)", items: ["1 — Unaware","2 — Aware","3 — Fortified"] },
      { label: "Threat level (d3)", items: ["1 — Unarmed","2 — Armed","3 — Private security"] },
    ],
    notes: "Tactical consideration + Puzzle component: Warden's Operational Manual",
  },
  heist: {
    label: "HEIST",
    rolls: [
      { label: "Target (d2)", items: ["1 — Static","2 — Moving"] },
      { label: "Goods (d2)", items: ["1 — Legal","2 — Illegal"] },
      { label: "Visibility (d2)", items: ["1 — Private","2 — Public"] },
      { label: "Security response (d4)", items: ["1 — None","2 — Slow","3 — Fast","4 — Military"] },
    ],
  },
};


export const HAZARD_LABELS = ["N/A", "x1 — Routine", "x2 — Low-Risk", "x3 — Moderate", "x4 — Dangerous", "x5 — Near-Suicidal"];
