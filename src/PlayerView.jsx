import { useState, useEffect } from "react";
import {
  THEMES, BG, GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
} from "./constants.js";
import { computeMarketCap } from "./logic.js";
import { Scanlines, FictionDate, StockRows, HistoryLog } from "./components/Shared.jsx";
import { PlayerJobBoard } from "./components/JobBoard.jsx";
import { PlayerSessionTab } from "./components/SessionPanels.jsx";

  GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  THEMES,
} from "./constants.js";
export default function PlayerView({ stocks, headlines, history, date, yearLabel, cycleLabel, jobs, debt, crew, portfolio, catalogs, rollConfig, houseRules, theme, setTheme, onWardenAccess, onHoneypot, onRefresh, onSwitchGame }) {
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
              textShadow: `0 0 20px ${GREEN}33` }}>
              CORPORATE TICKER
            </div>
            <div style={{ color: GREEN_DIM, fontSize: "10px", letterSpacing: "0.2em", marginTop: "4px", opacity: 0.5 }}>
              SFN MARKET DATA
            </div>
            <div style={{ color: HEADER_GREEN, fontSize: "10px", letterSpacing: "0.15em", marginTop: "2px" }}>
              MKT {computeMarketCap(stocks).toLocaleString()}cr
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
            background: "rgba(0,0,0,0.6)" }}>
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
            ["downtime", "DOWNTIME"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ background: tab === id ? "var(--c-active-bg, rgba(68,255,136,0.06))" : "none",
                border: `1px solid ${tab === id ? GREEN_MID : GREEN_DARK}`,
                color: tab === id ? GREEN_MID : GREEN_DARK,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.2em",
                padding: "5px 16px", cursor: "pointer" }}>
              {label}
              {id === "downtime" && debt.length > 0 && (
                <span style={{ color: "#ff4455", marginLeft: "6px", fontSize: "9px" }}>+{debt.length} STRESS</span>
              )}
            </button>
          ))}
        </div>

        {/* Headlines */}
        {tab === "ticker" && recentHeadlines.length > 0 && (
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
                <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "3px" }}>
                  <FictionDate date={h.date} />
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <button onClick={() => { setShowHistory(!showHistory); setShowPortfolio(false); }}
                  style={{ background: "none", border: `1px solid ${showHistory ? GREEN_MID : GREEN_DARK}`,
                    color: showHistory ? GREEN_MID : GREEN_DARK, cursor: "pointer", fontFamily: MONO,
                    fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px",
                    whiteSpace: "nowrap", flex: "1 0 auto" }}>
                  {showHistory ? "[ HIDE HISTORY ]" : "[ HISTORY ]"}
                </button>
                <button onClick={() => { setShowPortfolio(!showPortfolio); setShowHistory(false); }}
                  style={{ background: "none", border: `1px solid ${showPortfolio ? GREEN_MID : GREEN_DARK}`,
                    color: showPortfolio ? GREEN_MID : GREEN_DARK, cursor: "pointer", fontFamily: MONO,
                    fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px",
                    whiteSpace: "nowrap", flex: "1 0 auto" }}>
                  {showPortfolio ? "[ HIDE PORTFOLIO ]" : "[ PORTFOLIO ]"}
                  {(portfolio.length > 0 || (crew?.shipBalance || 0) !== 0) && !showPortfolio && (
                    <span style={{ color: GREEN_MID, marginLeft: "4px" }}>●</span>
                  )}
                </button>
                <button onClick={onSwitchGame}
                  style={{ background: "none", border: `1px solid ${GREEN_DARK}`,
                    color: GREEN_DARK, cursor: "pointer", fontFamily: MONO,
                    fontSize: "10px", letterSpacing: "0.15em", padding: "6px 14px",
                    whiteSpace: "nowrap" }}>
                  [ SWITCH GAME ]
                </button>
              </div>
            </div>

            {showHistory && (
              <HistoryLog history={history} headlines={headlines} />
            )}

            {showPortfolio && (
              <div style={{ marginTop: "16px" }}>
                {(crew?.shipBalance || 0) !== 0 && (
                  <div style={{ marginBottom: "16px", padding: "12px 16px",
                    border: `1px solid ${GREEN_DARK}`, background: "rgba(0,0,0,0.2)" }}>
                    <div style={{ color: GREEN_MID, fontSize: "9px", letterSpacing: "0.2em", marginBottom: "8px" }}>ACCOUNT BALANCE</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ color: HEADER_GREEN, fontSize: "22px", fontWeight: "bold" }}>{crew.shipBalance.toLocaleString()}cr</span>
                      {crew.shipName && <span style={{ color: GREEN_DARK, fontSize: "10px", letterSpacing: "0.1em" }}>{crew.shipName.toUpperCase()}</span>}
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
                    {portfolio.map(h => {
                      const st = stocks.find(s => s.name === h.company);
                      const cur = st?.price || 0;
                      const val = cur * h.shares;
                      const gl = (cur - (h.grantPrice || cur)) * h.shares;
                      const locked = h.lockScenarios > 0;
                      return (
                        <div key={h.id} style={{ padding: "10px 0", borderBottom: `1px solid rgba(68,100,68,0.15)`,
                          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                          <div>
                            <div style={{ color: GREEN_MID, fontSize: "13px" }}>{h.company}</div>
                            <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "2px" }}>
                              {h.shares} share{h.shares !== 1 ? "s" : ""} @ {cur.toLocaleString()}cr each
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: HEADER_GREEN, fontSize: "14px", fontWeight: "bold" }}>
                              {val.toLocaleString()}cr
                            </div>
                            <div style={{ fontSize: "11px" }}>
                              {locked && <span style={{ color: AMBER }}>🔒 {h.lockScenarios} scenario{h.lockScenarios !== 1 ? "s" : ""} locked</span>}
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
                        {portfolio.reduce((s, h) => {
                          const st = stocks.find(x => x.name === h.company);
                          return s + (st ? st.price * h.shares : 0);
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
          <PlayerSessionTab debt={debt} crew={crew} rollConfig={rollConfig} stocks={stocks} houseRules={houseRules} />
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
            style={{ background: "none", border: "none", color: GREEN_DARK, opacity: 0.3, cursor: "pointer",
              fontFamily: MONO, fontSize: "9px", letterSpacing: "0.15em" }}>
            WARDEN ACCESS
          </button>
        </div>
        {/* Honeypot — looks like a system terminal to a curious hacker */}
        <div style={{ marginTop: "4px", textAlign: "center" }}>
          <button onClick={() => onHoneypot && onHoneypot()}
            style={{ background: "none", border: "none", color: GREEN_DARK, opacity: 0.15, cursor: "pointer",
              fontFamily: MONO, fontSize: "8px", letterSpacing: "0.1em" }}>
            [SYS] MARKET_DAEMON v2.1 — TERMINAL ACCESS
          </button>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}

