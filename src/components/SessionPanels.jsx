import { useState, useRef } from "react";
import {
  GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  HAZARD_OPTS, HAZARD_MULT, DISPOSITION_OPTS, CLASS_TEMPLATES,
  CONTRACTOR_TYPES, SHORE_LEAVE_TABLE, SHORE_LEAVE_RESULTS,
  TREATMENTS_TABLE, TRAINING_TABLE, MILITARY_RESULTS, CHECKLIST_ITEMS,
} from "../constants.js";

  GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  CONTRACTOR_TYPES, SHORE_LEAVE_TABLE, SHORE_LEAVE_RESULTS, TREATMENTS_TABLE,
  TRAINING_TABLE, MILITARY_RESULTS, CHECKLIST_ITEMS,
  HAZARD_OPTS, HAZARD_MULT, DISPOSITION_OPTS, CLASS_TEMPLATES,
} from "../constants.js";

// ─── Session Panel Sub-Components ───────────────────────────────────────────

// ─── Session Panel Sub-Components ─────────────────────────────────────────────



export function PayoutCalculator({ jobs, crew, setCrew, stocks, portfolio, setPortfolio, rollConfig, date, wardenSet, KEYS, showToast }) {
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
  const flatTotal = flatBonuses.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

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
      }).filter(h => h.shares > 0);
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

  const sI = { background: "rgba(0,0,0,0.8)", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN, fontFamily: MONO, fontSize: "11px", padding: "4px 8px",
    WebkitAppearance: "none", appearance: "none" };
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
            <span style={{ color:HEADER_GREEN, minWidth:"28px", textAlign:"center" }}>{months}</span>
            <button onClick={()=>setMonths(m=>m+1)} style={{ ...sI, padding:"2px 8px", cursor:"pointer" }}>+</button>
          </div>
        </div>
        <div>{lbl("JUMPS (×1kcr)")}
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            <button onClick={()=>setJumps(j=>Math.max(0,j-1))} style={{ ...sI, padding:"2px 8px", cursor:"pointer" }}>−</button>
            <span style={{ color:HEADER_GREEN, minWidth:"28px", textAlign:"center" }}>{jumps}</span>
            <button onClick={()=>setJumps(j=>j+1)} style={{ ...sI, padding:"2px 8px", cursor:"pointer" }}>+</button>
          </div>
        </div>
        <div>{lbl("HAZARD")}
          <select value={hazard} onChange={e => setHazard(e.target.value)} style={sI}>
            {HAZARD_OPTS.map(h => <option key={h}>{h}</option>)}
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
        {flatBonuses.map((b, i) => (
          <div key={b.id} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "center" }}>
            <input value={b.label} onChange={e => setFlatBonuses(f => f.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder="Label" style={{ ...sI, flex: 1 }} />
            <input type="number" value={b.amount} onChange={e => setFlatBonuses(f => f.map((x,j)=>j===i?{...x,amount:e.target.value}:x))} placeholder="cr" style={{ ...sI, width: "80px" }} />
            <span style={{ color: GREEN_DARK, fontSize: "10px" }}>cr</span>
            <button onClick={() => setFlatBonuses(f=>f.filter((_,j)=>j!==i))} style={{ ...sI, padding:"1px 6px", cursor:"pointer", color:"#aa6666" }}>✕</button>
          </div>
        ))}
        <button onClick={() => setFlatBonuses(f=>[...f,{id:Date.now(),label:"",amount:""}])}
          style={{ ...sI, padding:"3px 10px", cursor:"pointer", color:GREEN_MID, fontSize:"10px" }}>+ BONUS</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        {lbl("PAYMENT MODE")}
        {["cash","equity"].map(t => (
          <button key={t} onClick={() => setGlobalPayType(t)}
            style={{ ...sI, padding:"3px 10px", cursor:"pointer", fontSize:"10px",
              color: globalPayType === t ? "#88ccff" : GREEN_DARK,
              borderColor: globalPayType === t ? "#336699" : "#1a2a3a" }}>
            {t.toUpperCase()}
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
                style={{ ...sI, padding:"2px 8px", cursor:"pointer", fontSize:"9px", color:GREEN_MID, letterSpacing:"0.08em" }}>
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
            <div key={p.id} style={{ border:`1px solid #1a2a3a`, padding:"12px", marginBottom:"8px" }}>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"8px", alignItems:"center" }}>
                <input value={p.name} onChange={e=>updateProfile(p.id,{name:e.target.value})} placeholder="Name" style={{ ...sI, width:"130px" }} />
                <input value={p.role} onChange={e=>updateProfile(p.id,{role:e.target.value})} placeholder="Class / Role" style={{ ...sI, width:"110px" }} />
                <button onClick={()=>removeProfile(p.id)} style={{ ...sI, padding:"2px 6px", cursor:"pointer", color:"#aa6666", marginLeft:"auto" }}>✕</button>
              </div>
              <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"8px", alignItems:"center" }}>
                {[["trained","T",500],["expert","E",1000],["master","M",2000]].map(([field,lbl2,rate]) => (
                  <div key={field} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                    <span style={{ color:GREEN_DARK, fontSize:"10px" }}>{lbl2}</span>
                    <button onClick={()=>updateProfile(p.id,{[field]:Math.max(0,(p[field]||0)-1)})} style={{ background:"none", border:`1px solid #1a2a3a`, color:"#6688aa", fontFamily:MONO, fontSize:"11px", padding:"1px 6px", cursor:"pointer" }}>−</button>
                    <span style={{ color:"#aabbcc", minWidth:"20px", textAlign:"center", fontSize:"12px" }}>{p[field]||0}</span>
                    <button onClick={()=>updateProfile(p.id,{[field]:(p[field]||0)+1})} style={{ background:"none", border:`1px solid #1a2a3a`, color:"#6688aa", fontFamily:MONO, fontSize:"11px", padding:"1px 6px", cursor:"pointer" }}>+</button>
                    <span style={{ color:GREEN_DARK, fontSize:"9px" }}>×{rate.toLocaleString()}</span>
                  </div>
                ))}
                <span style={{ color:"#6688aa", fontSize:"11px" }}>= <span style={{ color:"#aabbcc" }}>{calc.salary.toLocaleString()}cr/mo</span></span>
              </div>
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
            {ledger.flatBonuses.filter(b=>b.label).map(b => ` · ${b.label}: ${parseFloat(b.amount)||0}cr`).join("")}
          </div>
          {ledger.entries.map((e, i) => (
            <div key={i} style={{ borderTop:`1px solid #1a2a3a`, paddingTop:"8px", marginTop:"8px" }}>
              <div style={{ color:HEADER_GREEN, fontSize:"11px", letterSpacing:"0.05em" }}>
                {e.name} <span style={{ color:GREEN_DARK }}>— {e.role}</span>
              </div>
              <div style={{ color:GREEN_MID, fontSize:"11px", marginTop:"3px", letterSpacing:"0.02em" }}>{e.disposition}</div>
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


export function DebtPanel({ debt, setDebt, wardenSet, KEYS }) {
  const totalOwed = debt.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
  const sI = { background:"rgba(0,0,0,0.8)", border:`1px solid ${GREEN_DARK}`, color:HEADER_GREEN, fontFamily:MONO, fontSize:"11px", padding:"4px 8px",
    WebkitAppearance:"none", appearance:"none" };
  const addDebt = () => { const next = [...debt, {id:Date.now(), creditor:"", amount:0, monthlyPayment:0, termMonths:0}]; setDebt(next); wardenSet(KEYS.debt, next); };
  const upd = (id, p) => { const next = debt.map(d=>d.id===id?{...d,...p}:d); setDebt(next); wardenSet(KEYS.debt, next); };
  const del = (id) => { const next = debt.filter(d=>d.id!==id); setDebt(next); wardenSet(KEYS.debt, next); };
  return (
    <div>
      {debt.length > 0 && (
        <div style={{ display:"flex", gap:"24px", marginBottom:"16px", padding:"12px", border:`1px solid #3a1a1a`, background:"rgba(20,5,5,0.5)" }}>
          <div><div style={{ color:"#cc5555", fontSize:"22px", fontWeight:"bold" }}>{debt.length}</div><div style={{ color:"#aa6666", fontSize:"10px" }}>ACTIVE DEBTORS</div></div>
          <div><div style={{ color:"#cc5555", fontSize:"22px", fontWeight:"bold" }}>+{debt.length}</div><div style={{ color:"#aa6666", fontSize:"10px" }}>MIN STRESS</div></div>
          <div><div style={{ color:"#cc8855", fontSize:"18px", fontWeight:"bold" }}>{totalOwed.toLocaleString()}cr</div><div style={{ color:"#aa6666", fontSize:"10px" }}>TOTAL OWED</div></div>
        </div>
      )}
      {debt.length === 0 && <div style={{ color:GREEN_DARK, fontSize:"11px", padding:"10px 0" }}>No active debts.</div>}
      {debt.map(d => (
        <div key={d.id} style={{ border:`1px solid #2a1a1a`, padding:"10px", marginBottom:"8px" }}>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
            <input value={d.creditor} onChange={e=>upd(d.id,{creditor:e.target.value})} placeholder="Creditor name" style={{ ...sI, flex:1, minWidth:"130px" }} />
            <input type="number" value={d.amount} onChange={e=>upd(d.id,{amount:parseFloat(e.target.value)||0})} placeholder="Amount" style={{ ...sI, width:"90px" }} />
            <span style={{ color:GREEN_DARK, fontSize:"10px" }}>cr</span>
            <input type="number" value={d.monthlyPayment} onChange={e=>upd(d.id,{monthlyPayment:parseFloat(e.target.value)||0})} placeholder="mo payment" style={{ ...sI, width:"80px" }} />
            <span style={{ color:GREEN_DARK, fontSize:"10px" }}>cr/mo</span>
            <input type="number" value={d.termMonths} onChange={e=>upd(d.id,{termMonths:parseInt(e.target.value)||0})} placeholder="mo" style={{ ...sI, width:"55px" }} />
            <span style={{ color:GREEN_DARK, fontSize:"10px" }}>cycles remaining</span>
            <button onClick={()=>del(d.id)} style={{ ...sI, padding:"2px 6px", cursor:"pointer", color:"#aa6666" }}>✕</button>
          </div>
        </div>
      ))}
      <button onClick={addDebt}
        style={{ background:"none", border:`1px solid #3a2a2a`, color:"#aa6666",
          fontFamily:MONO, fontSize:"10px", letterSpacing:"0.1em", padding:"5px 14px", cursor:"pointer", marginTop:"6px" }}>
        + ADD DEBTOR
      </button>
    </div>
  );
}


export function PortfolioPanel({ portfolio, setPortfolio, stocks, wardenSet, KEYS }) {
  const totalValue = portfolio.reduce((s, h) => { const st = stocks.find(x=>x.name===h.company); return s + (st ? st.price * h.shares : 0); }, 0);
  const sI = { background:"rgba(0,0,0,0.8)", border:`1px solid ${GREEN_DARK}`, color:HEADER_GREEN, fontFamily:MONO, fontSize:"11px", padding:"4px 8px",
    WebkitAppearance:"none", appearance:"none" };
  const btnS = { background:"none", border:`1px solid #1a2a3a`, color:"#6688aa", fontFamily:MONO, fontSize:"13px", padding:"2px 9px", cursor:"pointer", lineHeight:1 };
  const add = () => {
    const co = stocks.find(s=>!s.is_collapsed)?.name || "";
    const st = stocks.find(s=>s.name===co);
    const next=[...portfolio,{id:Date.now(),company:co,shares:0,grantPrice:st?.price||0,lockScenarios:0}];
    setPortfolio(next); wardenSet(KEYS.portfolio,next);
  };
  const upd = (id,p) => { const next=portfolio.map(h=>h.id===id?{...h,...p}:h); setPortfolio(next); wardenSet(KEYS.portfolio,next); };
  const del = (id) => { const next=portfolio.filter(h=>h.id!==id); setPortfolio(next); wardenSet(KEYS.portfolio,next); };
  return (
    <div>
      {portfolio.length > 0 && (
        <div style={{ color:"#88ccff", fontSize:"14px", marginBottom:"12px" }}>
          PORTFOLIO VALUE: {totalValue.toLocaleString()}cr
        </div>
      )}
      {portfolio.length === 0 && <div style={{ color:GREEN_DARK, fontSize:"11px", padding:"10px 0" }}>No holdings. Equity payouts (PAYOUT tab) lock shares here automatically.</div>}
      {portfolio.map(h => {
        const st = stocks.find(x=>x.name===h.company);
        const cur = st?.price||0;
        const val = cur * h.shares;
        const gl = (cur - (h.grantPrice||cur)) * h.shares;
        const locked = h.lockScenarios > 0;
        return (
          <div key={h.id} style={{ border:`1px solid #1a2a3a`, padding:"10px 12px", marginBottom:"8px" }}>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center", marginBottom:"6px" }}>
              <select value={h.company} onChange={e=>{
                const ns=stocks.find(s=>s.name===e.target.value);
                upd(h.id,{company:e.target.value,grantPrice:ns?.price||h.grantPrice});
              }} style={{ ...sI, flex:1, minWidth:"140px" }}>
                {stocks.filter(s=>!s.is_collapsed).map(s=><option key={s.name}>{s.name}</option>)}
              </select>
              <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                <button onClick={()=>upd(h.id,{shares:Math.max(0,(h.shares||0)-1)})} style={btnS}>−</button>
                <span style={{ color:"#aabbcc", minWidth:"32px", textAlign:"center", fontSize:"13px" }}>{h.shares||0}</span>
                <button onClick={()=>upd(h.id,{shares:(h.shares||0)+1})} style={btnS}>+</button>
                <span style={{ color:GREEN_DARK, fontSize:"10px", marginLeft:"2px" }}>shares</span>
              </div>
              <button onClick={()=>del(h.id)} style={{ ...sI, padding:"2px 7px", cursor:"pointer", color:"#aa6666", marginLeft:"auto" }}>✕</button>
            </div>
            <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", fontSize:"11px" }}>
              <span style={{ color:GREEN_DARK }}>Grant: <span style={{ color:"#6688aa" }}>{(h.grantPrice||0).toLocaleString()}cr</span></span>
              <span style={{ color:GREEN_DARK }}>Now: <span style={{ color:"#88bbff" }}>{cur.toLocaleString()}cr</span></span>
              <span style={{ color:GREEN_DARK }}>Value: <span style={{ color:HEADER_GREEN }}>{val.toLocaleString()}cr</span></span>
              <span style={{ color: gl>=0?GREEN:"#cc5555" }}>G/L: {gl>=0?"+":""}{gl.toLocaleString()}cr</span>
              {locked
                ? <span style={{ color:AMBER }}>🔒 {h.lockScenarios} scenario{h.lockScenarios!==1?"s":""} locked
                    <button onClick={()=>upd(h.id,{lockScenarios:0})} style={{ ...sI, padding:"0px 5px", cursor:"pointer", fontSize:"9px", marginLeft:"6px", color:GREEN_MID }}>UNLOCK</button>
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


export function ShipAccountPanel({ crew, setCrew, rollConfig, setRollConfig, saveSettings, wardenSet, KEYS }) {
  const shipBalance = crew.shipBalance || 0;
  const shipExpenses = crew.shipExpenses || [];
  const shipName = crew.shipName || "";
  const [amount, setAmount] = useState("");
  const [txLabel, setTxLabel] = useState("");
  const sI = { background:"rgba(0,0,0,0.8)", border:`1px solid ${GREEN_DARK}`, color:HEADER_GREEN, fontFamily:MONO, fontSize:"11px", padding:"4px 8px",
    WebkitAppearance:"none", appearance:"none" };
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
      <div style={{ marginBottom:"16px", display:"flex", gap:"16px", flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ flex:"1 1 180px" }}>
          <div style={{ color:GREEN_MID, fontSize:"10px", letterSpacing:"0.1em", marginBottom:"5px" }}>ACCOUNT NAME</div>
          <input value={shipName} onChange={e=>upd({shipName:e.target.value})}
            placeholder="Diamond Club, LLC"
            style={{ ...sI, width:"100%", boxSizing:"border-box" }} />
        </div>
        <div style={{ flex:"1 1 180px" }}>
          <div style={{ color:GREEN_MID, fontSize:"10px", letterSpacing:"0.1em", marginBottom:"5px" }}>OWNER-OPERATOR MODE</div>
          <button onClick={() => { const next={...rollConfig, ownershipType: ownerType==="owner"?"company":"owner"}; setRollConfig(next); saveSettings({rollConfig:next}); }}
            style={{ background:ownerType==="owner"?"var(--c-active-bg, rgba(68,200,68,0.08))":"none",
              border:`1px solid ${ownerType==="owner"?GREEN_MID:GREEN_DARK}`,
              color:ownerType==="owner"?GREEN_MID:GREEN_DARK,
              fontFamily:MONO, fontSize:"10px", padding:"4px 12px", cursor:"pointer" }}>
            {ownerType==="owner" ? "● ON" : "○ OFF"}
          </button>
          <div style={{ color:GREEN_DARK, fontSize:"9px", marginTop:"4px" }}>Shows bankruptcy save table to players</div>
        </div>
        <div style={{ flex:"1 1 180px" }}>
          <div style={{ color:GREEN_MID, fontSize:"10px", letterSpacing:"0.1em", marginBottom:"5px" }}>CREW PAYMENT MODE</div>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
            {[["all","ALL SAME"],["per","PER CREW"]].map(([val,lbl3]) => (
              <button key={val} onClick={() => { const next={...rollConfig,crewPaymentMode:val}; setRollConfig(next); saveSettings({rollConfig:next}); }}
                style={{ background:(rollConfig.crewPaymentMode||"all")===val?"var(--c-active-bg, rgba(68,200,68,0.08))":"none",
                  border:`1px solid ${(rollConfig.crewPaymentMode||"all")===val?GREEN_MID:GREEN_DARK}`,
                  color:(rollConfig.crewPaymentMode||"all")===val?GREEN_MID:GREEN_DARK,
                  fontFamily:MONO, fontSize:"10px", padding:"4px 8px", cursor:"pointer", whiteSpace:"nowrap" }}>{lbl3}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding:"12px", border:`1px solid ${GREEN_DARK}`, background:"rgba(0,0,0,0.5)", marginBottom:"16px", display:"inline-block" }}>
        <div style={{ color:HEADER_GREEN, fontSize:"22px", fontWeight:"bold" }}>{shipBalance.toLocaleString()}cr</div>
        <div style={{ color:GREEN_MID, fontSize:"10px" }}>{shipName ? shipName.toUpperCase() + " — ACCOUNT BALANCE" : "ACCOUNT BALANCE"}</div>
      </div>
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap", alignItems:"center" }}>
        <input value={txLabel} onChange={e=>setTxLabel(e.target.value)} placeholder="Label (optional)" style={{ ...sI, flex:1, minWidth:"110px" }} />
        <input type="number" min={0} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount (cr)" style={{ ...sI, width:"110px" }} />
        <button onClick={()=>transact("deposit")} style={{ background:"none", border:`1px solid ${GREEN_DARK}`, color:GREEN, fontFamily:MONO, fontSize:"10px", padding:"5px 12px", cursor:"pointer" }}>+ DEPOSIT</button>
        <button onClick={()=>transact("withdraw")} style={{ background:"none", border:`1px solid #442222`, color:"#cc5555", fontFamily:MONO, fontSize:"10px", padding:"5px 12px", cursor:"pointer" }}>− WITHDRAW</button>
      </div>
      {shipExpenses.length > 0 && (
        <div style={{ marginBottom:"16px" }}>
          <div style={{ color:GREEN_DARK, fontSize:"10px", marginBottom:"6px" }}>RECENT TRANSACTIONS (last 20)</div>
          {[...shipExpenses].reverse().map(e => (
            <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", borderBottom:`1px solid rgba(255,255,255,0.07)`, fontSize:"11px", gap:"6px" }}>
              <span style={{ color:GREEN_MID, flex:1 }}>{e.label}</span>
              <span style={{ color:e.amount>=0?GREEN:"#cc5555", whiteSpace:"nowrap" }}>{e.amount>=0?"+":""}{e.amount.toLocaleString()}cr</span>
              <button onClick={() => {
                const next = { ...crew,
                  shipExpenses: shipExpenses.filter(tx => tx.id !== e.id) };
                setCrew(next); wardenSet(KEYS.crew, next);
              }} style={{ background:"none", border:"none", color:GREEN_DARK, cursor:"pointer",
                fontFamily:MONO, fontSize:"11px", padding:"0 2px", lineHeight:1, flexShrink:0 }}>✕</button>
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
              <tr key={r} style={{ borderTop:`1px solid rgba(255,255,255,0.07)` }}>
                <td style={{ padding:"5px 8px 5px 0", color:r.includes("Critical S")?"#44cc88":r.includes("Success")?GREEN_MID:r.includes("Critical F")?"#cc3333":"#cc7755", minWidth:"100px", whiteSpace:"nowrap" }}>{r}</td>
                <td style={{ padding:"5px 0", color:GREEN_DARK, lineHeight:1.5 }}>{c}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}




export function ContractorPanel({ crew, setCrew, wardenSet, KEYS }) {
  const contractors = crew.contractors || [];
  const sI = { background:"rgba(0,0,0,0.8)", border:`1px solid ${GREEN_DARK}`, color:HEADER_GREEN, fontFamily:MONO, fontSize:"11px", padding:"4px 8px",
    WebkitAppearance:"none", appearance:"none" };
  const add = () => {
    const next={...crew,contractors:[...contractors,{id:Date.now(),name:"",occupation:"",salary:0,paid:false}]};
    setCrew(next); wardenSet(KEYS.crew,next);
  };
  const upd = (id,p) => { const next={...crew,contractors:contractors.map(c=>c.id===id?{...c,...p}:c)}; setCrew(next); wardenSet(KEYS.crew,next); };
  const del = (id) => { const next={...crew,contractors:contractors.filter(c=>c.id!==id)}; setCrew(next); wardenSet(KEYS.crew,next); };
  return (
    <div>
      <div style={{ color:"#6688aa", fontSize:"10px", marginBottom:"12px", borderBottom:`1px solid #1a2a3a`, paddingBottom:"8px" }}>
        Check Contractor Loyalty if Paid in Full — update in Mothership Companion App.
      </div>
      {contractors.length === 0 && <div style={{ color:GREEN_DARK, fontSize:"11px", padding:"8px 0" }}>No active contractors.</div>}
      {contractors.map(c => (
        <div key={c.id} style={{ marginBottom:"8px", padding:"10px 12px", border:`1px solid ${c.paid?GREEN_DARK:"#2a1a1a"}` }}>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center", marginBottom:"6px" }}>
            {/* Occupation dropdown — auto-fills salary */}
            <select value={c.occupation||""} onChange={e => {
              const occ = e.target.value;
              const match = CONTRACTOR_TYPES.find(([t]) => t === occ);
              upd(c.id, { occupation: occ, salary: match ? match[1] : c.salary });
            }} style={{ ...sI, minWidth:"160px", WebkitAppearance:"none", appearance:"none" }}>
              <option value="">— Select type —</option>
              {CONTRACTOR_TYPES.map(([t]) => <option key={t}>{t}</option>)}
            </select>
            {/* Freeform name */}
            <input value={c.name} onChange={e=>upd(c.id,{name:e.target.value})}
              placeholder="Name (optional)"
              style={{ ...sI, flex:1, minWidth:"120px" }} />
            <button onClick={()=>del(c.id)} style={{ ...sI, padding:"2px 6px", cursor:"pointer", color:"#aa6666", marginLeft:"auto" }}>✕</button>
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
            {/* Salary — editable, pre-filled by occupation */}
            <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <input type="number" min={0} value={c.salary}
                onChange={e=>upd(c.id,{salary:parseFloat(e.target.value)||0})}
                style={{ ...sI, width:"80px" }} />
              <span style={{ color:GREEN_DARK, fontSize:"10px" }}>cr/mo</span>
            </div>
            <button onClick={()=>upd(c.id,{paid:!c.paid})}
              style={{ background:"none", border:`1px solid ${c.paid?GREEN_DARK:"#442222"}`,
                color:c.paid?"#44cc88":"#cc5555",
                fontFamily:MONO, fontSize:"10px", padding:"3px 12px", cursor:"pointer" }}>
              {c.paid ? "✓ PAID" : "UNPAID"}
            </button>
            {c.paid && <span style={{ color:GREEN_MID, fontSize:"10px" }}>⚑ Roll loyalty</span>}
          </div>
        </div>
      ))}
      <button onClick={add} style={{ background:"none", border:`1px solid #1a2a3a`, color:GREEN_MID, fontFamily:MONO, fontSize:"10px", letterSpacing:"0.1em", padding:"5px 14px", cursor:"pointer", marginTop:"6px" }}>+ ADD CONTRACTOR</button>
    </div>
  );
}


export function CatalogPanel({ catalogs, setCatalogs, stocks, wardenSet, KEYS }) {
  const [selCo, setSelCo] = useState(stocks.find(s=>!s.is_collapsed)?.name || "");
  const cat = catalogs[selCo] || { status:"hidden", ineligibleReason:"", benefits:"", items:[] };
  const sI = { background:"rgba(0,0,0,0.8)", border:`1px solid ${GREEN_DARK}`, color:HEADER_GREEN, fontFamily:MONO, fontSize:"11px", padding:"4px 8px",
    WebkitAppearance:"none", appearance:"none" };
  const STATUS_OPTS = ["hidden","unlocked","revoked","ineligible"];
  const STATUS_COLORS = { hidden:GREEN_DARK, unlocked:GREEN, revoked:"#cc5555", ineligible:AMBER };
  const upd = (patch) => { const next={...catalogs,[selCo]:{...cat,...patch}}; setCatalogs(next); wardenSet(KEYS.catalogs,next); };
  const addItem = () => upd({ items:[...(cat.items||[]),{id:Date.now(),name:"",price:"",notes:""}] });
  const updItem = (id,p) => upd({ items:(cat.items||[]).map(it=>it.id===id?{...it,...p}:it) });
  const delItem = (id) => upd({ items:(cat.items||[]).filter(it=>it.id!==id) });
  return (
    <div>
      <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"14px", flexWrap:"wrap" }}>
        <select value={selCo} onChange={e=>setSelCo(e.target.value)} style={{ ...sI, minWidth:"160px", WebkitAppearance:"none", appearance:"none" }}>
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
            <input value={it.price} onChange={e=>updItem(it.id,{price:e.target.value})} placeholder="Price" style={{ ...sI, width:"80px" }} />
            <input value={it.notes} onChange={e=>updItem(it.id,{notes:e.target.value})} placeholder="Notes" style={{ ...sI, flex:"3 1 100px", minWidth:"80px" }} />
            <button onClick={()=>delItem(it.id)} style={{ ...sI, padding:"1px 6px", cursor:"pointer", color:"#aa6666" }}>✕</button>
          </div>
        ))}
        <button onClick={addItem} style={{ background:"none", border:`1px solid #1a2a3a`, color:GREEN_MID, fontFamily:MONO, fontSize:"10px", padding:"4px 12px", cursor:"pointer" }}>+ ADD ITEM</button>
      </div>
    </div>
  );
}


// ─── House Rules Panel (Warden) ──────────────────────────────────────────────

// ─── House Rules Panel (Warden) ────────────────────────────────────────────────

export function HouseRulesPanel({ houseRules, setHouseRules, wardenSet, KEYS }) {
  const [editingId, setEditingId] = useState(null); // null | "new" | rule id
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  const sI = {
    background: "transparent", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
    fontFamily: MONO, fontSize: "11px", padding: "5px 8px", width: "100%",
    boxSizing: "border-box", outline: "none",
  };

  const openNew = () => { setDraftTitle(""); setDraftDesc(""); setEditingId("new"); };
  const openEdit = (rule) => { setDraftTitle(rule.title); setDraftDesc(rule.description); setEditingId(rule.id); };
  const cancel = () => { setEditingId(null); setDraftTitle(""); setDraftDesc(""); };

  const save = () => {
    const title = draftTitle.toUpperCase().trim();
    if (!title) return;
    let next;
    if (editingId === "new") {
      next = [...houseRules, { id: `hr_${Date.now()}`, title, description: draftDesc.trim() }];
    } else {
      next = houseRules.map(r => r.id === editingId ? { ...r, title, description: draftDesc.trim() } : r);
    }
    setHouseRules(next);
    wardenSet(KEYS.houseRules, next);
    cancel();
  };

  const remove = (id) => {
    const next = houseRules.filter(r => r.id !== id);
    setHouseRules(next);
    wardenSet(KEYS.houseRules, next);
  };

  const jBtnStyle = (borderColor) => ({
    background: "none", border: `1px solid ${borderColor}`, color: borderColor,
    fontFamily: MONO, fontSize: "9px", letterSpacing: "0.1em",
    padding: "3px 9px", cursor: "pointer",
  });

  return (
    <div>
      {houseRules.length === 0 && !editingId && (
        <div style={{ color: GREEN_DARK, fontSize: "11px", padding: "10px 0", marginBottom: "8px" }}>
          No house rules set. Add rules visible to all players in the DOWNTIME tab.
        </div>
      )}

      {houseRules.map(rule => (
        <div key={rule.id} style={{ marginBottom: "10px", border: `1px solid ${GREEN_DARK}`, padding: "12px 14px" }}>
          {editingId === rule.id ? (
            <div>
              <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "4px" }}>RULE TITLE</div>
              <input
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value.toUpperCase())}
                placeholder="TITLE"
                style={{ ...sI, marginBottom: "8px", letterSpacing: "0.08em" }}
              />
              <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "4px" }}>DESCRIPTION</div>
              <textarea
                value={draftDesc}
                onChange={e => setDraftDesc(e.target.value)}
                placeholder="Rule description..."
                rows={4}
                style={{ ...sI, resize: "vertical", lineHeight: 1.6, marginBottom: "10px" }}
              />
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={save} disabled={!draftTitle.trim()}
                  style={{ background: "none", border: `1px solid ${draftTitle.trim() ? GREEN_DARK : "#1a2a1a"}`,
                    color: draftTitle.trim() ? GREEN_MID : GREEN_DARK,
                    fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                    padding: "5px 14px", cursor: draftTitle.trim() ? "pointer" : "not-allowed" }}>
                  SAVE
                </button>
                <button onClick={cancel}
                  style={{ background: "none", border: `1px solid #1a2a1a`, color: GREEN_DARK,
                    fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                    padding: "5px 14px", cursor: "pointer" }}>
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ color: HEADER_GREEN, fontSize: "12px", letterSpacing: "0.1em",
                marginBottom: rule.description ? "6px" : 0 }}>
                {rule.title}
              </div>
              {rule.description && (
                <div style={{ color: GREEN_DIM, fontSize: "11px", lineHeight: 1.7, marginBottom: "8px",
                  whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {rule.description}
                </div>
              )}
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => openEdit(rule)} style={jBtnStyle(GREEN_DARK)}>EDIT</button>
                <button onClick={() => remove(rule.id)} style={jBtnStyle("#aa6666")}>DELETE</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editingId === "new" && (
        <div style={{ marginBottom: "10px", border: `1px solid ${GREEN_DARK}`, padding: "12px 14px",
          background: "rgba(0,0,0,0.3)" }}>
          <div style={{ color: GREEN_MID, fontSize: "10px", letterSpacing: "0.15em", marginBottom: "10px" }}>NEW HOUSE RULE</div>
          <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "4px" }}>RULE TITLE</div>
          <input
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value.toUpperCase())}
            placeholder="TITLE"
            style={{ ...sI, marginBottom: "8px", letterSpacing: "0.08em" }}
            autoFocus
          />
          <div style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "4px" }}>DESCRIPTION</div>
          <textarea
            value={draftDesc}
            onChange={e => setDraftDesc(e.target.value)}
            placeholder="Rule description..."
            rows={4}
            style={{ ...sI, resize: "vertical", lineHeight: 1.6, marginBottom: "10px" }}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={save} disabled={!draftTitle.trim()}
              style={{ background: "none", border: `1px solid ${draftTitle.trim() ? GREEN_DARK : "#1a2a1a"}`,
                color: draftTitle.trim() ? GREEN_MID : GREEN_DARK,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                padding: "5px 14px", cursor: draftTitle.trim() ? "pointer" : "not-allowed" }}>
              SAVE
            </button>
            <button onClick={cancel}
              style={{ background: "none", border: `1px solid #1a2a1a`, color: GREEN_DARK,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
                padding: "5px 14px", cursor: "pointer" }}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      {!editingId && (
        <button onClick={openNew}
          style={{ background: "none", border: `1px solid #2a3a2a`, color: GREEN_MID,
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.1em",
            padding: "5px 14px", cursor: "pointer", marginTop: "4px" }}>
          + ADD HOUSE RULE
        </button>
      )}
    </div>
  );
}


// ─── Player Session Tab ──────────────────────────────────────────────────────

// ─── Player Session Tab ────────────────────────────────────────────────────────



export function PlayerSessionTab({ debt, crew, rollConfig, stocks, houseRules }) {
  const [months, setMonths] = useState(1);
  const [jumps, setJumps] = useState(0);
  const [hazard, setHazard] = useState("N/A");
  const [trained, setTrained] = useState(0);
  const [expert, setExpert] = useState(0);
  const [master, setMaster] = useState(0);
  const [negoPct, setNegoPct] = useState(0);
  const [equityCorp, setEquityCorp] = useState("");
  const [open, setOpen] = useState({ checklist:false, debt:false, contractors:false, payout:false, medical:false, shore:false, training:false, repairs:false });
  const scrollRef = useRef(null);
  const lockScroll = (fn) => { const y = window.scrollY; fn(); requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" })); };
  const toggle = (k) => { const y = window.scrollY; setOpen(o=>({...o,[k]:!o[k]})); requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" })); };

  const salary = trained*500 + expert*1000 + master*2000;
  const base = salary * months + salary * months * HAZARD_MULT[hazard];
  const total = Math.round(base * (1 + negoPct/100) + jumps*1000);
  const timeUnit = rollConfig.trainingTimeUnit === "years" ? "years" : "months";
  const cycleWord = (rollConfig.cycleLabel || "Cycle").toLowerCase();

  // Mobile-safe: font-size 16px on all selects/inputs prevents iOS auto-zoom scroll-jump
  const sel = {
    background:"transparent", border:`1px solid ${GREEN_DARK}`,
    color:GREEN_MID, fontFamily:MONO, fontSize:"16px",
    padding:"10px 12px", minHeight:"44px", width:"100%", boxSizing:"border-box",
    WebkitAppearance:"none", appearance:"none", borderRadius:0,
  };
  const stepBtn = {
    background:"none", border:`1px solid ${GREEN_DARK}`, color:GREEN_MID,
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
    <div ref={scrollRef} style={{ color:GREEN_MID, overflowAnchor:"none" }}>
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
                {HAZARD_OPTS.map(h=><option key={h}>{h}</option>)}
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
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
            {[["Trained",trained,setTrained,500],["Expert",expert,setExpert,1000],["Master",master,setMaster,2000]].map(([label,val,set,rate]) => (
              <div key={label} style={{ display:"flex", flexDirection:"column", gap:"4px", alignItems:"center",
                border:`1px solid ${GREEN_DARK}`, padding:"8px 4px", background:"rgba(0,0,0,0.2)", minWidth:0 }}>
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
          <div style={{ padding:"14px 16px", border:`1px solid ${GREEN_DARK}`, background:"rgba(0,0,0,0.3)" }}>
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
                    <div style={{ marginTop:"10px", padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:`1px solid rgba(68,200,68,0.15)` }}>
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
          {debt.map(d => (
            <div key={d.id} style={{ padding:"10px 0", borderBottom:`1px solid rgba(68,100,68,0.15)`,
              fontSize:"13px", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"6px" }}>
              <span>{d.creditor || "Unknown creditor"}</span>
              <span style={{ color:"#cc7755" }}>
                {(parseFloat(d.monthlyPayment)||0).toLocaleString()}cr/mo
                <span style={{ color:"#664433", marginLeft:"8px" }}>· {d.termMonths} {cycleWord}s left</span>
              </span>
            </div>
          ))}
        </Section>
      )}

      {(crew?.contractors?.length > 0) && (
        <Section id="contractors" title="CONTRACTORS" badge={(() => {
          const unpaid = (crew.contractors||[]).filter(c=>!c.paid);
          if (unpaid.length === 0) return null;
          const total = unpaid.reduce((s,c)=>s+(c.salary||0),0);
          return `${unpaid.length} UNPAID · ${total.toLocaleString()}cr/mo`;
        })()}>
          {(crew.contractors || []).map(c => (
            <div key={c.id} style={{ padding:"10px 0", borderBottom:`1px solid rgba(68,100,68,0.15)`,
              fontSize:"13px", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"6px", alignItems:"center" }}>
              <span style={{ color:GREEN_MID }}>
                {c.name || c.occupation || "Unnamed"}
                {c.name && c.occupation &&
                  <span style={{ color:GREEN_MID, marginLeft:"10px", fontSize:"11px" }}>{c.occupation}</span>}
              </span>
              <span style={{ color: c.paid ? GREEN : "#cc7755" }}>
                {(c.salary||0).toLocaleString()}cr/mo · {c.paid ? "PAID" : "UNPAID"}
              </span>
            </div>
          ))}
        </Section>
      )}

      <Section id="medical" title="MEDICAL TREATMENTS">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"10px" }}>
            <thead><tr>{["TREATMENT","COST","EFFECT"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>{TREATMENTS_TABLE.map(([t,c,e])=>(
              <tr key={t}>
                <td style={TD}>{t}</td>
                <td style={{ ...TD, color:"#88aacc", whiteSpace:"nowrap" }}>{c}</td>
                <td style={TD}>{e}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      <Section id="shore" title="SHORE LEAVE">
        <div style={{ color:GREEN_DARK, fontSize:"12px", marginBottom:"10px" }}>Duration: 2d10 days. Make a Sanity Save.</div>
        <div style={{ overflowX:"auto", marginBottom:"12px" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["PORT","COST","STRESS CONVERTED"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>{SHORE_LEAVE_TABLE.map(([p,c,s])=>(
              <tr key={p}><td style={{ ...TD, color:AMBER }}>{p}</td><td style={{ ...TD, color:"#88aacc" }}>{c}</td><td style={{ ...TD, color:HEADER_GREEN }}>{s}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["RESULT","OUTCOME"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>{SHORE_LEAVE_RESULTS.map(([r,o])=>(
              <tr key={r}>
                <td style={{ ...TD, whiteSpace:"nowrap", paddingRight:"16px",
                  color:r.includes("Critical S")?HEADER_GREEN:r.includes("Success")?GREEN_MID:r.includes("Critical F")?"#cc3333":"#cc7755" }}>{r}</td>
                <td style={TD}>{o}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ color:GREEN_DARK, fontSize:"12px", lineHeight:1.7, marginTop:"12px" }}>
          <span style={{ color:GREEN_MID }}>REST SAVE:</span> Roll 1d100 under worst Save in a safe location. On success, reduce Stress by the ones digit. Advantage from: consensual sex, drug use, heavy drinking, or Wellness Counselor.
        </div>
      </Section>

      <Section id="training" title={`SKILL TRAINING — ${timeUnit.toUpperCase()}`}>
        <div style={{ color:GREEN_DARK, fontSize:"11px", marginBottom:"10px", fontStyle:"italic" }}>Must meet skill pre-requisites to be eligible for training.</div>
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
            <thead><tr>{["RESULT","OUTCOME"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
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
              <thead><tr>{["CLASS","COST / UNIT"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
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
        {(rollConfig.ownershipType || "company") === "owner" && (
          <div style={{ marginTop:"16px", borderTop:`1px solid rgba(255,255,255,0.07)`, paddingTop:"14px" }}>
            <div style={{ color:AMBER, fontSize:"11px", letterSpacing:"0.15em", marginBottom:"6px" }}>BANKRUPTCY SAVE — OWNER-OPERATOR</div>
            <div style={{ color:GREEN_DARK, fontSize:"12px", marginBottom:"10px" }}>Roll quarterly or annually. Make a Luck Save.</div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
              <tbody>{[
                ["Critical Success","Turn a profit. Choose one: 1 Major Upgrade, repair 1d5 Major Repairs, pay each crew 1d5×100kcr, or raise Save by 1d10."],
                ["Success","Scrape by. Choose one: 1 Minor Upgrade, 1 Minor Repair, pay each crew 2d10 months salary, or raise Save by 1d5."],
                ["Failure","Fall 1d10mcr in debt to ruthless lenders."],
                ["Critical Failure","Company collapses. Massive debt to the worst people imaginable."],
              ].map(([r,c]) => (
                <tr key={r} style={{ borderTop:`1px solid rgba(255,255,255,0.07)` }}>
                  <td style={{ padding:"6px 10px 6px 0", color:r.includes("Critical S")?HEADER_GREEN:r.includes("Success")?GREEN_MID:r.includes("Critical F")?"#cc3333":"#cc7755", minWidth:"110px", whiteSpace:"nowrap", verticalAlign:"top" }}>{r}</td>
                  <td style={{ padding:"6px 0", color:GREEN_DARK, lineHeight:1.5 }}>{c}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Section>

      {houseRules && houseRules.length > 0 && (
        <Section id="houserules" title="HOUSE RULES">
          {houseRules.map((rule, i) => (
            <div key={rule.id} style={{ padding: "10px 0",
              borderBottom: i < houseRules.length - 1 ? `1px solid rgba(68,100,68,0.15)` : "none" }}>
              <div style={{ color: HEADER_GREEN, fontSize: "13px", letterSpacing: "0.08em",
                marginBottom: rule.description ? "6px" : 0 }}>
                {rule.title}
              </div>
              {rule.description && (
                <div style={{ color: GREEN_DIM, fontSize: "12px", lineHeight: 1.7,
                  whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {rule.description}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

