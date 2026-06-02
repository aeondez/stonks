import { useState } from "react";
import {
  GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  HEALTH_STEPS, VOLATILITY_STEPS, OMNICORP_HEADLINES,
} from "../constants.js";

  GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  HEALTH_STEPS, VOLATILITY_STEPS, OMNICORP_HEADLINES,
} from "../constants.js";

// ─── Headline Feed Manager ───────────────────────────────────────────────────

// ─── Headline Feed Manager (Warden) ──────────────────────────────────────────

export function HeadlineFeedManager({ headlines, setHeadlines, date, KEYS, wardenSet }) {
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
      {headlines.map((h, i) => (
        <div key={h.id || i} style={{ borderBottom: `1px solid rgba(26,42,58,0.4)`, padding: "8px 0" }}>
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
                <div style={{ color: GREEN_MID, fontSize: "11px" }}>{h.headline}</div>
                {h.subtext && <div style={{ color: GREEN_DARK, fontSize: "10px", marginTop: "2px" }}>{h.subtext}</div>}
                {h.date && <div style={{ color: GREEN_DARK, fontSize: "9px", marginTop: "3px", letterSpacing: "0.1em" }}>
                  YEAR {h.date.year} · CYC {String(h.date.cycle).padStart(2,"0")}
                </div>}
              </div>
              <button onClick={() => startEdit(i)}
                style={{ background: "none", border: `1px solid #1a3a1a`, color: GREEN_DARK,
                  fontFamily: MONO, fontSize: "10px", padding: "2px 7px", cursor: "pointer", flexShrink: 0 }}>
                EDIT
              </button>
              <button onClick={() => removeHL(i)}
                style={{ background: "none", border: `1px solid #3a2a2a`, color: "#aa6666",
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


// ─── Corp Editor Helper ──────────────────────────────────────────────────────

// ─── Corp Editor Helper ───────────────────────────────────────────────────────

export function AddCorpRow({ onAdd, inputStyle }) {
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
      style={{ background: "none", border: `1px solid #336644`, color: GREEN_MID,
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
            style={{ ...inputStyle, fontSize: "10px", padding: "3px 4px", cursor: "pointer",
                              WebkitAppearance: "none", appearance: "none" }}>
            {HEALTH_STEPS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div style={field}>
          <div style={lbl}>VOLATILITY</div>
          <select value={vol} onChange={e => setVol(e.target.value)}
            style={{ ...inputStyle, fontSize: "10px", padding: "3px 4px", cursor: "pointer",
                              WebkitAppearance: "none", appearance: "none" }}>
            {VOLATILITY_STEPS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={submit} disabled={!name.trim()}
          style={{ background: "none", border: `1px solid ${name.trim() ? GREEN_DARK : "#1a2a1a"}`,
            color: name.trim() ? GREEN_MID : GREEN_DARK,
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "5px 14px",
            cursor: name.trim() ? "pointer" : "not-allowed" }}>
          CONFIRM
        </button>
        <button onClick={() => setOpen(false)}
          style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em", padding: "5px 14px", cursor: "pointer" }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ─── Custom Merger Form ───────────────────────────────────────────────────────


// ─── Custom Merger Form ──────────────────────────────────────────────────────

// ─── Custom Merger Form ───────────────────────────────────────────────────────

export function CustomMergerForm({ stocks, date, headlines, onConfirm }) {
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
              style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
                fontFamily: MONO, fontSize: "11px", padding: "4px 6px", cursor: "pointer" }}>
              <option value="">— select —</option>
              {active.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ color: GREEN_DARK, paddingTop: "16px" }}>+</div>
          <div>
            <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em", marginBottom: "3px" }}>PARTNER 2</div>
            <select value={p2} onChange={e => setP2(e.target.value)}
              style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
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
            style={{ background: "none", border: `1px solid ${GREEN_DARK}`, color: GREEN_DARK,
              fontFamily: MONO, fontSize: "11px", letterSpacing: "0.12em", padding: "7px 18px", cursor: "pointer" }}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Warden View ──────────────────────────────────────────────────────────────
