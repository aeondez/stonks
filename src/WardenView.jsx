import { useState, useCallback } from "react";
import {
  DEFAULT_PIN, HEALTH_STEPS, VOLATILITY_STEPS, INITIAL_STOCKS, OMNICORP_HEADLINES,
  MERGER_HEADLINES, MERGER_PROTECTED, INITIAL_MERGERS, INITIAL_BLACKMARKET, DEFAULT_ROLL_CONFIG,
  THEMES, BG, GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  healthColor, volColor, safeSet,
} from "./constants.js";
import {
  computeAdvance, computeBankruptcyCheck, computeVariance, computeHealthOnly,
  bumpHealth, sortByPrice, getMergerStatus, applyMerger,
} from "./logic.js";
import { Scanlines, FictionDate } from "./components/Shared.jsx";
import { JobBoardPanel } from "./components/JobBoard.jsx";
import {
  PayoutCalculator, DebtPanel, PortfolioPanel, ShipAccountPanel,
  ContractorPanel, CatalogPanel, HouseRulesPanel,
} from "./components/SessionPanels.jsx";
import { WardenBlackMarketPanel } from "./components/BlackMarket.jsx";
import { HeadlineFeedManager, AddCorpRow, CustomMergerForm } from "./components/WardenPanels.jsx";
// ─── Warden View ──────────────────────────────────────────────────────────────

export default function WardenView({ stocks, setStocks, headlines, setHeadlines, history, setHistory, date, setDate,
  storedPin, setStoredPin, mergers, setMergers, alwaysMerge, setAlwaysMerge, rollConfig, setRollConfig,
  jobs, setJobs, crew, setCrew, debt, setDebt, portfolio, setPortfolio, catalogs, setCatalogs,
  blackmarket, setBlackmarket, houseRules, setHouseRules,
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
    const histEntry = { date: { ...date }, stocks: stocks.map(({ healthRoll, volRoll, priceRoll, coinFlip, healthShift, volShift, _skipped, ...rest }) => rest), headlines: headlines.slice(0, 5) };
    const newHistory = [...history, histEntry].slice(-100); // cap at 100 to prevent unbounded growth
    const newHeadlines = autoHeadlines.length > 0 ? [...autoHeadlines, ...headlines] : headlines;
    if (autoHeadlines.length > 0) autoHeadlines.forEach((h) => { setLastPublished(h.headline); clearTimeout(window._lpTimer); window._lpTimer = setTimeout(() => setLastPublished(null), 3500); });
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
      const newPortfolio = portfolio.map(h => h.lockScenarios > 0 ? { ...h, lockScenarios: h.lockScenarios - 1 } : h);
      setPortfolio(newPortfolio);
      wardenSet(KEYS.portfolio, newPortfolio);
    }

    // ── Catalogs: auto-INELIGIBLE for collapsed/merged companies ──
    const nowInactive = new Set([
      ...collapsingNormal.map(b => b.name),
      ...collapsingWithMerger.map(b => b.name),
    ]);
    if (nowInactive.size > 0) {
      const newCatalogs = { ...catalogs };
      for (const name of nowInactive) {
        if (newCatalogs[name] && newCatalogs[name].status !== "ineligible") {
          const reason = collapsingWithMerger.find(b => b.name === name) ? "Merged" : "Company collapsed";
          newCatalogs[name] = { ...newCatalogs[name], status: "ineligible", ineligibleReason: reason };
        } else if (!newCatalogs[name]) {
          const reason = collapsingWithMerger.find(b => b.name === name) ? "Merged" : "Company collapsed";
          newCatalogs[name] = { status: "ineligible", ineligibleReason: reason, benefits: "", items: [] };
        }
      }
      setCatalogs(newCatalogs);
      wardenSet(KEYS.catalogs, newCatalogs);
    }

    // ── Black Market: expire unfrozen active jobs, refill from pool ──
    if (blackmarket) {
      const bmActive = blackmarket.active || [];
      const bmPool = blackmarket.pool || [];
      const bmArchive = blackmarket.archive || [];
      const expiring = bmActive;
      const newBmArchive = [...expiring.map(j => ({ ...j, status:"expired", cycle_closed: newDate.cycle })), ...bmArchive];
      // Refill with up to 3 from pool (random order)
      const shuffled = [...bmPool].sort(() => Math.random() - 0.5);
      const draw = shuffled.slice(0, 3);
      const drawIds = new Set(draw.map(j => j.id));
      const newBmPool = bmPool.filter(j => !drawIds.has(j.id));
      const newBmActive = draw.map(j => ({ ...j, status:"active", cycle_posted: newDate.cycle }));
      const newBm = { pool: newBmPool, active: newBmActive, archive: newBmArchive };
      setBlackmarket(newBm);
      wardenSet(KEYS.blackmarket, newBm);
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
            <div style={{ color: GREEN_DIM, fontSize: "11px", letterSpacing: "0.3em", marginBottom: "4px", opacity: 0.5 }}>
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
          {[["headline","HEADLINE"],["jobs","JOBS"],["economy","ECONOMY"],["corps","CORPS"],["session","SESSION"],["blackmkt","BLACK MKT"],["settings","SETTINGS"]].map(([p, label]) => (
            <button key={p} onClick={() => setPanel(panel === p ? null : p)}
              style={{ background: panel === p ? "var(--c-active-bg, rgba(68,200,68,0.08))" : "none",
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
                style={{ background: theme === key ? "var(--c-active-bg, rgba(68,200,68,0.08))" : "none",
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
                color: GREEN_DARK, fontFamily: MONO, fontSize: "11px", padding: "8px 10px",
                marginBottom: "16px", outline: "none", boxSizing: "border-box" }} />
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.15em", marginBottom: "10px" }}>
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
                  <div style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.12em", marginBottom: "8px" }}>
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
                        style={{ background: varianceMode === m ? "var(--c-active-bg, rgba(68,200,68,0.08))" : "none",
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
                          style={{ background: allTargeted ? "var(--c-active-bg, rgba(68,200,68,0.08))" : "none",
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
                              style={{ background: sel ? "var(--c-active-bg, rgba(68,200,68,0.08))" : "none",
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
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", color: GREEN_DARK }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${GREEN_DARK}` }}>
                              {["COMPANY","VOL","ROLL","COIN","Δ PRICE","NEW PRICE"].map((h) => (
                                <th key={h} style={{ padding: "6px 8px", textAlign: "left", letterSpacing: "0.08em", color: GREEN_MID, fontWeight: "normal" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pendingVariance.filter(s => !s.is_collapsed).map(s => (
                              <tr key={s.name} style={{ borderBottom: `1px solid rgba(26,42,58,0.4)`,
                                opacity: s._skipped ? 0.3 : 1 }}>
                                <td style={{ padding: "6px 8px", color: s.is_omnicorp ? AMBER : "#aabbcc", fontSize: "10px", textTransform: "uppercase" }}>{s.name.split(" ")[0]}</td>
                                <td style={{ padding: "6px 8px", color: volColor(s.volatility) }}>{s.volatility}</td>
                                <td style={{ padding: "6px 8px", color: GREEN_DIM }}>{s._skipped ? "—" : s.priceRoll}</td>
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
                          style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
                            fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.12em", marginBottom: "8px" }}>
                    HEALTH SHIFT — health movement only, no price or volatility changes
                  </div>
                  {!pendingHealthShift ? (
                    <button onClick={handleHealthRoll}
                      style={{ background: "none", border: `1px solid #334466`, color: GREEN_MID,
                        fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                      ROLL HEALTH
                    </button>
                  ) : (
                    <div>
                      <div style={{ overflowX: "auto", marginBottom: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", color: GREEN_DARK }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${GREEN_DARK}` }}>
                              {["COMPANY","OLD HEALTH","H.ROLL","SHIFT","NEW HEALTH"].map((h) => (
                                <th key={h} style={{ padding: "6px 8px", textAlign: "left", letterSpacing: "0.08em", color: GREEN_MID, fontWeight: "normal" }}>{h}</th>
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
                                  <td style={{ padding: "6px 8px", color: GREEN_DIM }}>{s.healthRoll}</td>
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
                          style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
                            fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", cursor: "pointer" }}>
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>                <div>
                  <div style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.12em", marginBottom: "8px" }}>
                    MARKET EVENT — apply a percentage shift to all active, unfrozen stocks at once
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <select value={marketEventDir} onChange={e => setMarketEventDir(e.target.value)}
                      style={{ background: "rgba(0,0,0,0.5)", border: `1px solid #3a2a1a`, color: marketEventDir === "crash" ? RED : GREEN,
                        fontFamily: MONO, fontSize: "11px", padding: "5px 8px", cursor: "pointer" }}>
                      <option value="crash">CRASH</option>
                      <option value="boom">BOOM</option>
                    </select>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input value={marketEventPct} inputMode="numeric"
                        onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 99) setMarketEventPct(v); }}
                        style={{ background: "transparent", border: `1px solid #2a2a2a`, color: GREEN_DIM,
                          fontFamily: MONO, fontSize: "11px", width: "50px", padding: "4px 6px", textAlign: "center" }} />
                      <span style={{ color: GREEN_DARK, fontSize: "10px" }}>%</span>
                    </div>
                    <button onClick={() => setConfirmDialog({
                        msg: `APPLY ${marketEventDir.toUpperCase()} — ${marketEventPct}%?`,
                        submsg: `All active, unfrozen stocks will ${marketEventDir === "crash" ? "decrease" : "increase"} by ${marketEventPct}%. This cannot be undone.`,
                        onConfirm: () => { handleMarketEvent(); setConfirmDialog(null); }
                      })}
                      style={{ background: "none",
                        border: `1px solid ${marketEventDir === "crash" ? "#663333" : GREEN_DARK}`,
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
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", color: GREEN_DARK }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${GREEN_DARK}` }}>
                        {["COMPANY","HEALTH","H.ROLL","H.SHIFT","VOL","V.ROLL","V.SHIFT","DIE ROLL","COIN","Δ PRICE","NEW PRICE"].map((h) => (
                          <th key={h} style={{ padding: "6px 8px", textAlign: "left", letterSpacing: "0.08em", color: GREEN_MID, fontWeight: "normal" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAdvance.advance.filter((s) => !s.is_collapsed).map((s) => (
                        <tr key={s.name} style={{ borderBottom: `1px solid rgba(26,42,58,0.4)` }}>
                          <td style={{ padding: "6px 8px", color: s.is_omnicorp ? AMBER : "#aabbcc", fontSize: "10px", textTransform: "uppercase" }}>{s.name.split(" ")[0]}</td>
                          <td style={{ padding: "6px 8px", color: healthColor(s.health) }}>{s.health}</td>
                          <td style={{ padding: "6px 8px", color: GREEN_DIM }}>{s.healthRoll}</td>
                          <td style={{ padding: "6px 8px", color: s.healthShift > 0 ? GREEN : s.healthShift < 0 ? RED : "#555" }}>{shiftLabel(s.healthShift)}</td>
                          <td style={{ padding: "6px 8px", color: volColor(s.volatility) }}>{s.volatility}</td>
                          <td style={{ padding: "6px 8px", color: GREEN_DIM }}>{s.volRoll}</td>
                          <td style={{ padding: "6px 8px", color: s.volShift > 0 ? GREEN : s.volShift < 0 ? RED : "#555" }}>{shiftLabel(s.volShift)}</td>
                          <td style={{ padding: "6px 8px", color: GREEN_DIM }}>{s.priceRoll}</td>
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
                        <span style={{ color: GREEN_DIM, fontSize: "11px" }}>rolled {s.bankruptRoll}</span>
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
                    style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
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
                    <span style={{ color: GREEN_DIM, fontSize: "11px" }}>rolled {s.bankruptRoll}</span>
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
                    style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
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
                const selectStyle = { background: "rgba(0,0,0,0.5)", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
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
                    }} style={{ background: "none", border: `1px solid #3a2a2a`, color: "#aa6666",
                      fontFamily: MONO, fontSize: "10px", padding: "1px 6px", cursor: "pointer" }}>✕</button>
                  </div>
                );
              })}
              <button onClick={() => {
                const next = [...mergers, { name: "New Merger", partner1: "Company A", partner2: "Company B", industry: "Combined", triggered: false }];
                setMergers(next); wardenSet(KEYS.mergers, next);
              }} style={{ background: "none", border: `1px solid #2a3a2a`, color: GREEN_MID,
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
                  style={{ background: jobsTab === id ? "rgba(68,136,255,0.12)" : "none",
                    border: `1px solid ${jobsTab === id ? "#334488" : "#1a2a3a"}`,
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
                style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
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
                    {["COMPANY","INDUSTRY","PRICE","Δ","BUMP","HEALTH","VOL","FREEZE"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: GREEN_MID,
                        fontSize: "10px", letterSpacing: "0.12em", fontWeight: "normal" }}>{h}</th>
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
                      {["NAME","INDUSTRY","PRICE","HEALTH","VOL",""].map(h => (
                        <th key={h} style={{ padding: "4px 6px", textAlign: "left", color: GREEN_DARK, fontWeight: "normal", letterSpacing: "0.08em", fontSize: "10px" }}>{h}</th>
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
                            {HEALTH_STEPS.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "3px 4px" }}>
                          <select value={s.volatility} onChange={(e) => { const next = stocks.map((x, xi) => xi === i ? { ...x, volatility: e.target.value } : x); setStocks(next); wardenSet(KEYS.stocks, next); }}
                            style={{ ...inputStyle, fontSize: "10px", padding: "2px 4px", cursor: "pointer" }}>
                            {VOLATILITY_STEPS.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "3px 4px" }}>
                          <button onClick={() => { if (!window.confirm(`Remove ${s.name}?`)) return; const next = sortByPrice(stocks.filter((_, xi) => xi !== i)); setStocks(next); wardenSet(KEYS.stocks, next); }}
                            style={{ background: "none", border: `1px solid #3a2a2a`, color: "#aa6666", fontFamily: MONO, fontSize: "10px", padding: "1px 6px", cursor: "pointer" }}>✕</button>
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
              {[["debt","DEBT"],["portfolio","PORTFOLIO"],["ship","SHIP"],["contractors","CONTRACTORS"],["houserules","HOUSE RULES"]].map(([id, lbl]) => (
                <button key={id} onClick={() => setSessionTab(id)}
                  style={{ background: sessionTab === id ? "rgba(68,136,255,0.12)" : "none",
                    border: `1px solid ${sessionTab === id ? "#334488" : "#1a2a3a"}`,
                    color: sessionTab === id ? "#88aadd" : GREEN_DARK,
                    fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                    padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {lbl}
                  {id === "debt" && debt.length > 0 && <span style={{ color: "#cc5555", marginLeft: "4px" }}>({debt.length})</span>}
                  {id === "portfolio" && portfolio.length > 0 && <span style={{ color: GREEN_MID, marginLeft: "4px" }}>({portfolio.length})</span>}
                  {id === "houserules" && houseRules.length > 0 && <span style={{ color: GREEN_MID, marginLeft: "4px" }}>({houseRules.length})</span>}
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
            {sessionTab === "houserules" && (
              <HouseRulesPanel houseRules={houseRules} setHouseRules={setHouseRules} wardenSet={wardenSet} KEYS={KEYS} />
            )}
          </div>
        )}

        {/* Panel: Black Market */}
        {panel === "blackmkt" && (
          <WardenBlackMarketPanel
            blackmarket={blackmarket} setBlackmarket={setBlackmarket}
            date={date} wardenSet={wardenSet} KEYS={KEYS} showToast={showToast}
          />
        )}

        {/* Panel: Settings */}
        {panel === "settings" && (
          <div style={{ background: "rgba(0,10,20,0.6)", border: `1px solid ${GREEN_DARK}`, padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: GREEN_MID, fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>SETTINGS</div>
            <div style={{ color: GREEN_MID, fontSize: "11px", marginBottom: "12px" }}>FICTIONAL DATE</div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
              {["year","cycle"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.1em" }}>{f.toUpperCase()}</span>
                  <input
                    value={date[f]}
                    onChange={(e) => handleDateInput(f, e.target.value)}
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
                  style={{ background: rollConfig.bumpOnComplete ? "var(--c-active-bg, rgba(68,200,68,0.08))" : "none",
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
                    }} style={{ background: (rollConfig.trainingTimeUnit || "months") === val ? "var(--c-active-bg, rgba(68,200,68,0.08))" : "none",
                      border: `1px solid ${(rollConfig.trainingTimeUnit || "months") === val ? GREEN_MID : GREEN_DARK}`,
                      color: (rollConfig.trainingTimeUnit || "months") === val ? GREEN_MID : GREEN_DARK,
                      fontFamily: MONO, fontSize: "10px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div style={{ color: GREEN_DARK, fontSize: "10px" }}>Ship ownership and crew payment mode are in Session → Ship.</div>
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
                const backup = { stocks, headlines, history, date, mergers, alwaysMerge, jobs, crew, debt, portfolio, catalogs, blackmarket, exportedAt: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `stonks-backup-${Date.now()}.json`; a.click();
                URL.revokeObjectURL(url);
              }} style={{ ...actionBtn, borderColor: GREEN, color: GREEN }}>⬇ EXPORT BACKUP</button>
              <label style={{ ...actionBtn, cursor: "pointer",
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
                          "IMPORT BACKUP?\n\nThis will overwrite all current data including stocks, headlines, history, date, mergers, job board, crew profiles, debt, portfolio, catalogs, and black market board. This cannot be undone."
                        );
                        if (!confirmed) return;
                        const s = data.stocks;
                        const h = data.headlines || [];
                        const hist = data.history || [];
                        const d = data.date || { year: 2122, cycle: 1 };
                        const m = data.mergers || INITIAL_MERGERS;
                        const am = data.alwaysMerge ?? true;
                        const j = Array.isArray(data.jobs) ? data.jobs : [];
                        const cr = data.crew && typeof data.crew === "object" && data.crew.profiles != null ? data.crew : { profiles: [], contractors: [], shipBalance: 0, shipExpenses: [] };
                        const db = Array.isArray(data.debt) ? data.debt : [];
                        const pf = Array.isArray(data.portfolio) ? data.portfolio : [];
                        const cat = data.catalogs && typeof data.catalogs === "object" ? data.catalogs : {};
                        const bm  = data.blackmarket && typeof data.blackmarket === "object" ? data.blackmarket : INITIAL_BLACKMARKET;
                        setStocks(sortByPrice(s));
                        setHeadlines(h);
                        setHistory(hist);
                        setDate(d);
                        setMergers(m);
                        setAlwaysMerge(am);
                        setJobs(j);
                        setCrew(cr);
                        setDebt(db);
                        setPortfolio(pf);
                        setCatalogs(cat);
                        setBlackmarket(bm);
                        await wardenSet(KEYS.stocks, s);
                        await wardenSet(KEYS.headlines, h);
                        await wardenSet(KEYS.history, hist);
                        await wardenSet(KEYS.date, d);
                        await wardenSet(KEYS.mergers, m);
                        await wardenSet(KEYS.jobs, j);
                        await wardenSet(KEYS.crew, cr);
                        await wardenSet(KEYS.debt, db);
                        await wardenSet(KEYS.portfolio, pf);
                        await wardenSet(KEYS.catalogs, cat);
                        await wardenSet(KEYS.blackmarket, bm);
                        await wardenSet(KEYS.settings, { alwaysMerge: am, rollConfig: data.rollConfig || DEFAULT_ROLL_CONFIG });
                        e.target.value = "";
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
              <div style={{ color: "#aa6666", fontSize: "11px", marginBottom: "12px", letterSpacing: "0.15em" }}>DANGER ZONE</div>
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
            <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${confirmDialog.danger ? "#663333" : "#1a2a3a"}`,
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
                  style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
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
          background: "rgba(0,0,0,0.92)", border: `1px solid ${toast.color}`, color: toast.color,
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
  background: "rgba(0,0,0,0.8)", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
  fontFamily: MONO, fontSize: "11px", padding: "6px 10px", outline: "none",
  WebkitAppearance: "none", appearance: "none"
};
const actionBtn = {
  background: "none", border: `1px solid ${GREEN_MID}`, color: GREEN_MID,
  fontFamily: MONO, fontSize: "11px", letterSpacing: "0.15em", padding: "8px 16px", cursor: "pointer"
};

