import { useState, useEffect } from "react";
import {
  INITIAL_STOCKS, INITIAL_MERGERS, INITIAL_CATALOGS, INITIAL_BLACKMARKET,
  DEFAULT_ROLL_CONFIG, THEMES, BG, GREEN, GREEN_MID, MONO,
  makeKeys, safeGet, safeSet,
} from "./constants.js";
import { sortByPrice } from "./logic.js";
import { Scanlines, PinGate } from "./components/Shared.jsx";
import { HoneypotTerminal, BlackMarketView } from "./components/BlackMarket.jsx";
import PlayerView from "./PlayerView.jsx";
import WardenView from "./WardenView.jsx";
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
    r.style.setProperty("--c-active-bg",   T.activeBg);
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
  const [blackmarket, setBlackmarket] = useState(INITIAL_BLACKMARKET);
  const [houseRules, setHouseRules] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await safeGet(KEYS.stocks, INITIAL_STOCKS);
      const h = await safeGet(KEYS.headlines, []);
      const hist = await safeGet(KEYS.history, []);
      const d = await safeGet(KEYS.date, { year: 2122, cycle: 1 });
      const m = await safeGet(KEYS.mergers, INITIAL_MERGERS);
      const sett = await safeGet(KEYS.settings, { alwaysMerge: true });
      const j = await safeGet(KEYS.jobs, []);
      const cr = await safeGet(KEYS.crew, { profiles: [], contractors: [], shipBalance: 0, shipExpenses: [] });
      const db = await safeGet(KEYS.debt, []);
      const pf = await safeGet(KEYS.portfolio, []);
      const cat = await safeGet(KEYS.catalogs, {});
      const bm  = await safeGet(KEYS.blackmarket, null);
      const hr  = await safeGet(KEYS.houseRules, []);
      setStocks(sortByPrice(s));
      setHeadlines(h);
      setHistory(hist);
      setDate(d);
      setMergers(m);
      setAlwaysMerge(sett.alwaysMerge ?? true);
      setRollConfig({ ...DEFAULT_ROLL_CONFIG, ...(sett.rollConfig || {}) });
      setJobs(Array.isArray(j) ? j : []);
      // Migrate crew from old array format to new object format
      setCrew(Array.isArray(cr) ? { profiles: cr, contractors: [], shipBalance: 0, shipExpenses: [] }
             : (cr && typeof cr === "object" && cr.profiles != null ? cr : { profiles: [], contractors: [], shipBalance: 0, shipExpenses: [] }));
      setDebt(Array.isArray(db) ? db : []);
      setPortfolio(Array.isArray(pf) ? pf : []);
      setCatalogs(cat && typeof cat === "object" ? { ...INITIAL_CATALOGS, ...cat } : INITIAL_CATALOGS);
      // Merge saved BM data — saved active/archive win; pool merges (seed jobs not yet in saved pool are prepended)
      if (bm && typeof bm === "object") {
        const savedIds = new Set([...(bm.pool||[]), ...(bm.active||[]), ...(bm.archive||[])].map(j => j.id));
        const newSeeds = INITIAL_BLACKMARKET.pool.filter(j => !savedIds.has(j.id));
        setBlackmarket({ pool: [...newSeeds, ...(bm.pool||[])], active: bm.active||[], archive: bm.archive||[] });
      } else {
        setBlackmarket(INITIAL_BLACKMARKET);
      }
      setHouseRules(Array.isArray(hr) ? hr : []);
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
    return <HoneypotTerminal
      roomCode={roomCode}
      onBlackMarket={() => setView("blackmarket")}
      onDisconnect={() => setView("player")}
    />;
  }

  if (view === "blackmarket") {
    return <BlackMarketView
      blackmarket={blackmarket}
      onDisconnect={() => setView("player")}
    />;
  }

  if (view === "pin") {
    return <PinGate
      roomCode={roomCode}
      onSuccess={(pin) => { setStoredPin(pin); setView("warden"); }}
      onCancel={() => setView("player")}
      onHoneypot={() => { setView("honeypot"); }}
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
        blackmarket={blackmarket} setBlackmarket={setBlackmarket}
        houseRules={houseRules} setHouseRules={setHouseRules}
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
      houseRules={houseRules}
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
      onHoneypot={() => { setView("honeypot"); }}
    />
  );
}
