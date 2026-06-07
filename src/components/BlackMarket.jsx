import { useState } from "react";
import { GREEN_DIM, GREEN_DARK, GREEN_MID, MONO, BM_GEN_TABLES } from "../constants.js";
import { Scanlines } from "./Shared.jsx";
// ─── Honeypot Terminal ───────────────────────────────────────────────────────

export function HoneypotTerminal({ roomCode, onBlackMarket, onDisconnect }) {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("alert"); // "alert" | "prompt" | "checking" | "denied"
  const [ticket] = useState(() => `SEC-${Math.floor(Math.random() * 90000) + 10000}`);
  const [node]   = useState(() => `NODE-${Math.floor(Math.random() * 900) + 100}`);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setPhase("checking");
    try {
      const r = await fetch("/api/blackmarket-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomCode, guess: input.replace(/[^0-9]/g, "") }),
      });
      const data = await r.json();
      if (data.granted) {
        onBlackMarket();
      } else {
        setInput("");
        setPhase("denied");
        fetch(`/api/honeypot?room=${encodeURIComponent(roomCode)}`).catch(() => {});
        setTimeout(() => setPhase("prompt"), 2500);
      }
    } catch {
      setInput("");
      setPhase("denied");
      setTimeout(() => setPhase("prompt"), 2500);
    }
  };

  const R = "#ff3333"; const RD = "#ff6666"; const RM = "#ff4444"; const RX = "#ff8888";

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", fontFamily: MONO, padding: "32px", position: "relative" }}>
      <Scanlines color="rgba(200,0,0,0.06)" />
      <div style={{ color: R, fontSize: "11px", letterSpacing: "0.2em", marginBottom: "24px",
        position: "relative", zIndex: 1, lineHeight: "1.6" }}>
        ████████████████████████████████████<br/>
        █  SFNET SECURITY MODULE  v4.7.2   █<br/>
        ████████████████████████████████████
      </div>
      <div style={{ color: RD, fontSize: "10px", letterSpacing: "0.15em", lineHeight: "2.2",
        textAlign: "left", maxWidth: "420px", width: "100%" }}>

        <div style={{ color: RM, marginBottom: "4px" }}>sfnet-sec@{node}:~$ <span style={{ color: RD }}>./intrusion_scan --live --deep</span></div>
        <div>{">"} probing session context<span style={{ color: R }}>...</span></div>
        <div>{">"} <span style={{ color: R }}>unauthorized terminal access confirmed</span></div>
        <div>{">"} origin traced. fingerprint locked. device logged.</div>
        <div>{">"} <span style={{ color: RX }}>_</span></div>

        <div style={{ color: RM, marginBottom: "4px" }}>sfnet-sec@{node}:~$ <span style={{ color: RD }}>./escalate --priority CRITICAL --tag {ticket}</span></div>
        <div>{">"} incident filed under <span style={{ color: R }}>{ticket}</span></div>
        <div>{">"} sfnet sec-ops paged. response window: <span style={{ color: R }}>immediate</span></div>
        <div>{">"} session retained for litigation hold</div>
        <div>{">"} <span style={{ color: RX }}>_</span></div>

        <div style={{ marginTop: "10px", marginBottom: "10px", borderTop: `1px solid #330000` }} />

        <div style={{ color: R, lineHeight: "1.9", fontSize: "9px", letterSpacing: "0.12em" }}>
          THIS TERMINAL IS PROPERTY OF STELLAR FINANCIAL NETWORK.<br/>
          UNAUTHORIZED ACCESS VIOLATES SFNET REGULATION 7-ALPHA<br/>
          AND IS SUBJECT TO CIVIL AND CRIMINAL PROSECUTION.<br/>
          <span style={{ opacity: 0.5 }}>ALL ACTIVITY IS LOGGED, RETAINED, AND ADMISSIBLE.</span>
        </div>

        {phase === "prompt" && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ color: RM, marginBottom: "6px" }}>sfnet-override@{node}:~$ <span style={{ color: RD }}>./auth --exchange-key</span></div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ color: R }}>{">"} KEY:</span>
              <input
                value={input}
                onChange={e => setInput(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                inputMode="numeric"
                autoFocus
                style={{ background: "transparent", border: "none", borderBottom: `1px solid ${R}`,
                  color: RD, fontFamily: MONO, fontSize: "13px", outline: "none",
                  width: "120px", letterSpacing: "0.15em" }}
              />
            </div>
          </div>
        )}
        {phase === "checking" && (
          <div style={{ marginTop: "20px", color: RD }}>{">"} verifying<span style={{ color: R }}>...</span></div>
        )}
        {phase === "denied" && (
          <div style={{ marginTop: "20px", color: R }}>{">"} key rejected — incident log updated</div>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
        {phase === "alert" && (
          <button onClick={() => setPhase("prompt")}
            style={{ background: "none", border: `1px solid #441111`, color: "#aa6666",
              fontFamily: MONO, fontSize: "10px", letterSpacing: "0.15em",
              padding: "8px 16px", cursor: "pointer" }}>
            OVERRIDE
          </button>
        )}
        <button onClick={onDisconnect}
          style={{ background: "none", border: `1px solid ${R}`, color: RD,
            fontFamily: MONO, fontSize: "10px", letterSpacing: "0.15em",
            padding: "8px 16px", cursor: "pointer" }}>
          DISCONNECT
        </button>
      </div>
    </div>
  );
}


// ─── Black Market Player View ────────────────────────────────────────────────

export function BlackMarketView({ blackmarket, onDisconnect }) {
  const [showArchive, setShowArchive] = useState(false);
  const active  = blackmarket.active  || [];
  const archive = [...(blackmarket.archive || [])].reverse();

  const R = "#ff3333"; const RD = "#cc3333"; const RM = "#882222";

  return (
    <div style={{ minHeight: "100vh", background: "#000000", display: "flex", flexDirection: "column",
      alignItems: "center", fontFamily: MONO, padding: "40px 20px", position: "relative" }}>
      <Scanlines color="rgba(200,0,0,0.06)" />

      <div style={{ width: "100%", maxWidth: "720px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${RM}`, paddingBottom: "14px", marginBottom: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ color: R, fontSize: "clamp(14px, 4vw, 20px)", letterSpacing: "0.15em", fontWeight: "bold" }}>
              ◈ SHADOW EXCHANGE
            </div>
            <div style={{ color: RM, fontSize: "10px", letterSpacing: "0.2em", marginTop: "4px", opacity: 0.7 }}>
              UNAUTHORIZED NETWORK — PROCEED AT OWN RISK
            </div>
          </div>
          <button onClick={onDisconnect}
            style={{ background: "none", border: `1px solid ${RM}`, color: RM,
              fontFamily: MONO, fontSize: "9px", letterSpacing: "0.15em",
              padding: "5px 12px", cursor: "pointer" }}>
            DISCONNECT
          </button>
        </div>

        {/* Active jobs */}
        <div style={{ color: RM, fontSize: "9px", letterSpacing: "0.25em", marginBottom: "14px" }}>
          ACTIVE CONTRACTS — {active.length} POSTED
        </div>

        {active.length === 0 && (
          <div style={{ color: "#441111", fontSize: "11px", textAlign: "center", padding: "30px 0",
            letterSpacing: "0.1em" }}>
            NO CONTRACTS CURRENTLY AVAILABLE<br/>
            <span style={{ fontSize: "9px", opacity: 0.5 }}>CHECK BACK AFTER NEXT MARKET CYCLE</span>
          </div>
        )}

        {active.map((job, i) => (
          <div key={job.id} style={{ marginBottom: "20px", border: `1px solid ${RM}`,
            background: "rgba(80,0,0,0.15)", padding: "16px" }}>
            <pre style={{ color: RD, fontSize: "12px", margin: 0,
              whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.8, fontFamily: MONO }}>
              {job.content}
            </pre>
          </div>
        ))}

        {/* Archive toggle */}
        {archive.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <button onClick={() => setShowArchive(v => !v)}
              style={{ background: "none", border: `1px solid ${RM}`, color: RM,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "0.15em",
                padding: "6px 14px", width: "100%", cursor: "pointer" }}>
              {showArchive ? "[ HIDE ARCHIVE ]" : `[ ARCHIVE (${archive.length}) ]`}
            </button>
            {showArchive && (
              <div style={{ marginTop: "12px" }}>
                {archive.map(job => (
                  <div key={job.id} style={{ marginBottom: "12px", opacity: 0.45,
                    borderLeft: `2px solid ${RM}`, paddingLeft: "12px" }}>
                    <div style={{ color: RM, fontSize: "9px", letterSpacing: "0.15em", marginBottom: "4px" }}>
                      {job.status === "completed" ? "✓ COMPLETED" : "✗ EXPIRED"}
                      {job.cycle_closed != null ? ` — CYC ${String(job.cycle_closed).padStart(2,"0")}` : ""}
                    </div>
                    <pre style={{ color: "#441111", fontSize: "11px", margin: 0,
                      whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7, fontFamily: MONO }}>
                      {job.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
    </div>
  );
}


// ─── Warden Black Market Panel ───────────────────────────────────────────────

// ─── Warden Black Market Panel ─────────────────────────────────────────────────



export function WardenBMJobEditor({ job, onSave, onCancel }) {
  const [content, setContent] = useState(job?.content || "");
  const [notes, setNotes] = useState(job?.notes || "");
  const isNew = !job;

  const sI = { background:"rgba(0,0,0,0.8)", border:`1px solid #441111`, color:"#cc6666",
    fontFamily:MONO, fontSize:"11px", padding:"6px 8px", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ border:`1px solid #441111`, padding:"16px", marginBottom:"12px", background:"rgba(80,0,0,0.1)" }}>
      <div style={{ color:"#882222", fontSize:"10px", letterSpacing:"0.15em", marginBottom:"10px" }}>
        {isNew ? "NEW CONTRACT" : "EDIT CONTRACT"}
      </div>
      <div style={{ marginBottom:"10px" }}>
        <div style={{ color:"#aa6666", fontSize:"10px", marginBottom:"4px" }}>CONTRACT TEXT</div>
        <textarea value={content} onChange={e=>setContent(e.target.value)}
          rows={6} placeholder={"BOUNTY NOTICE\nTarget: ...\nReward: ...\nContact: Drop Box N"}
          style={{ ...sI, resize:"vertical", lineHeight:1.7 }} />
      </div>
      <div style={{ marginBottom:"12px" }}>
        <div style={{ color:"#aa6666", fontSize:"10px", marginBottom:"4px" }}>WARDEN NOTES (not visible to players)</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          rows={3} placeholder="Complications, locations, reactive job triggers..."
          style={{ ...sI, resize:"vertical", lineHeight:1.7, color:"#886666" }} />
      </div>
      <div style={{ display:"flex", gap:"8px" }}>
        <button onClick={() => content.trim() && onSave({ ...job, id: job?.id || `bm-${Date.now()}`, content, notes })}
          disabled={!content.trim()}
          style={{ background:"none", border:`1px solid ${content.trim()?"#882222":"#331111"}`,
            color:content.trim()?"#cc4444":"#441111", fontFamily:MONO,
            fontSize:"10px", letterSpacing:"0.1em", padding:"6px 14px", cursor:content.trim()?"pointer":"default" }}>
          {isNew ? "ADD TO POOL" : "SAVE"}
        </button>
        <button onClick={onCancel}
          style={{ background:"none", border:`1px solid #220000`, color:"#996666",
            fontFamily:MONO, fontSize:"10px", padding:"6px 14px", cursor:"pointer" }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

export function WardenBlackMarketPanel({ blackmarket, setBlackmarket, date, wardenSet, KEYS, showToast }) {
  const [subPanel, setSubPanel] = useState("active"); // "active"|"pool"|"archive"|"generate"
  const [editingId, setEditingId] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [drawMode, setDrawMode] = useState("random");

  const { active=[], pool=[], archive=[] } = blackmarket;
  const save = (next) => { setBlackmarket(next); wardenSet(KEYS.blackmarket, next); };

  const promote = (job) => {
    if (active.length >= 3) { showToast("Board already has 3 active contracts", "#ff8844"); return; }
    const next = { ...blackmarket,
      pool: pool.filter(j => j.id !== job.id),
      active: [...active, { ...job, status:"active", cycle_posted: date.cycle }],
    };
    save(next); showToast("CONTRACT POSTED TO SHADOW EXCHANGE", "#cc4444");
  };

  const closeJob = (job, status) => {
    const next = { ...blackmarket,
      active: active.filter(j => j.id !== job.id),
      archive: [{ ...job, status, cycle_closed: date.cycle }, ...archive],
    };
    save(next);
    showToast(status === "completed" ? "CONTRACT COMPLETED" : "CONTRACT EXPIRED", "#cc4444");
    // Auto-fill from pool if drawMode is random
    if (drawMode === "random") {
      const remaining = next.active.length;
      if (remaining < 3 && next.pool.length > 0) {
        const shuffled = [...next.pool].sort(() => Math.random() - 0.5);
        const draw = shuffled.slice(0, 3 - remaining);
        const drawIds = new Set(draw.map(j => j.id));
        save({
          ...next,
          pool: next.pool.filter(j => !drawIds.has(j.id)),
          active: [...next.active, ...draw.map(j => ({ ...j, status:"active", cycle_posted: date.cycle }))],
        });
      }
    }
  };

  const removeFromPool = (id) => {
    if (!window.confirm("Delete this contract?")) return;
    save({ ...blackmarket, pool: pool.filter(j => j.id !== id) });
  };

  const moveBMToPool = (job) => {
    const next = { ...blackmarket,
      active: active.filter(j => j.id !== job.id),
      archive: archive.filter(j => j.id !== job.id),
      pool: [...pool, { ...job, status:"pool", cycle_posted: undefined, cycle_closed: undefined }],
    };
    save(next); showToast("CONTRACT MOVED TO POOL", "#cc4444");
  };

  const revokeArchived = (job) => {
    const next = { ...blackmarket,
      archive: archive.map(j => j.id === job.id ? { ...j, status:"revoked" } : j),
    };
    save(next); showToast("CONTRACT REVOKED", "#cc4444");
  };

  const removeArchived = (id) => {
    if (!window.confirm("Permanently delete this archived contract?")) return;
    save({ ...blackmarket, archive: archive.filter(j => j.id !== id) });
  };

  const saveEdit = (updated) => {
    if (editingId === "new") {
      save({ ...blackmarket, pool: [...pool, { ...updated, status:"pool" }] });
      showToast("CONTRACT ADDED TO POOL", "#cc4444");
    } else {
      const inActive = active.find(j => j.id === updated.id);
      if (inActive) {
        save({ ...blackmarket, active: active.map(j => j.id === updated.id ? updated : j) });
      } else {
        save({ ...blackmarket, pool: pool.map(j => j.id === updated.id ? updated : j) });
      }
      showToast("CONTRACT UPDATED", "#cc4444");
    }
    setEditingId(null);
  };

  const toggleNotes = (id) => setExpandedNotes(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const generateJob = (tableKey) => {
    const tbl = BM_GEN_TABLES[tableKey];
    if (!tbl) return;
    // Roll one item from each dice roll table
    const lines = tbl.rolls.map(r => {
      const pick = r.items[Math.floor(Math.random() * r.items.length)];
      return `${r.label.replace(/ \(d\d+\)/, "")}: ${pick.replace(/^\d+ — /, "")}`;
    });
    // Roll d20 table if present
    if (tbl.d20) {
      const pick = tbl.d20[Math.floor(Math.random() * tbl.d20.length)];
      const label = tbl.d20Label.replace(/ \(d\d+\)/, "");
      lines.push(`${label}: ${pick}`);
    }
    const content = [tbl.label, ...lines].join("\n");
    const newJob = { id: `bm-${Date.now()}`, content, notes: "", status: "pool" };
    save({ ...blackmarket, pool: [...pool, newJob] });
    showToast(`${tbl.label} CONTRACT GENERATED → POOL`, "#cc4444");
    setSubPanel("pool");
  };

  const R = "#ff7777"; const RD = "#ff4444"; const RM = "#dd3333"; const RDark = "#aa3333";

  const tabBtn = (id, label, count) => (
    <button key={id} onClick={() => setSubPanel(id)}
      style={{ background: subPanel===id ? "rgba(136,34,34,0.15)" : "none",
        border: `1px solid ${subPanel===id ? RM : RDark}`,
        color: subPanel===id ? RD : "#aa6666",
        fontFamily:MONO, fontSize:"10px", letterSpacing:"0.1em",
        padding:"4px 12px", cursor:"pointer" }}>
      {label} {count != null ? `(${count})` : ""}
    </button>
  );

  const jBtnStyle = (col) => ({ background:"none", border:`1px solid ${col||RDark}`,
    color:col||"#aa6666", fontFamily:MONO, fontSize:"9px",
    padding:"2px 8px", cursor:"pointer", letterSpacing:"0.08em" });

  return (
    <div style={{ background:"rgba(20,0,0,0.5)", border:`1px solid ${RDark}`, padding:"16px", marginBottom:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"8px" }}>
        <div style={{ color:RD, fontSize:"10px", letterSpacing:"0.2em" }}>SHADOW EXCHANGE — WARDEN</div>
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          <span style={{ color:"#aa6666", fontSize:"9px" }}>ROTATION:</span>
          {["random","bespoke"].map(m => (
            <button key={m} onClick={() => setDrawMode(m)}
              style={{ background:drawMode===m?"rgba(136,34,34,0.1)":"none",
                border:`1px solid ${drawMode===m?RM:RDark}`,
                color:drawMode===m?RD:"#aa6666",
                fontFamily:MONO, fontSize:"9px", padding:"3px 8px", cursor:"pointer" }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:"4px", marginBottom:"12px", flexWrap:"wrap" }}>
        {tabBtn("active","ACTIVE",active.length)}
        {tabBtn("pool","POOL",pool.length)}
        {tabBtn("archive","ARCHIVE",archive.length)}
        {tabBtn("generate","GENERATION TABLES")}
      </div>

      {/* Editor overlay */}
      {editingId && (
        <WardenBMJobEditor
          job={editingId === "new" ? null : [...active,...pool].find(j=>j.id===editingId)}
          onSave={saveEdit}
          onCancel={() => setEditingId(null)}
        />
      )}

      {/* ACTIVE */}
      {!editingId && subPanel === "active" && (
        <div>
          {active.length === 0 && (
            <div style={{ color:RDark, fontSize:"10px", padding:"8px 0" }}>No active contracts. Promote from pool.</div>
          )}
          {active.map(job => (
            <div key={job.id} style={{ marginBottom:"12px", border:`1px solid ${RM}`,
              background:"rgba(80,0,0,0.1)", padding:"12px" }}>
              <pre style={{ color:RD, fontSize:"11px", margin:"0 0 8px 0",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7, fontFamily:MONO }}>
                {job.content}
              </pre>
              {job.notes && (
                <div>
                  <button onClick={() => toggleNotes(job.id)} style={{ ...jBtnStyle(RM), marginBottom:"4px" }}>
                    {expandedNotes.has(job.id) ? "▲ NOTES" : "▼ NOTES"}
                  </button>
                  {expandedNotes.has(job.id) && (
                    <div style={{ color:"#886666", fontSize:"10px", lineHeight:1.7,
                      padding:"6px 8px", background:"rgba(0,0,0,0.3)", marginTop:"4px" }}>
                      {job.notes}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display:"flex", gap:"6px", marginTop:"8px", flexWrap:"wrap" }}>
                <button onClick={() => setEditingId(job.id)} style={jBtnStyle("#aa6666")}>EDIT</button>
                <button onClick={() => moveBMToPool(job)} style={jBtnStyle(RM)}>↩ MOVE TO POOL</button>
                <button onClick={() => closeJob(job,"completed")} style={jBtnStyle(RM)}>COMPLETE</button>
                <button onClick={() => closeJob(job,"expired")} style={jBtnStyle(RDark)}>EXPIRE</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POOL */}
      {!editingId && subPanel === "pool" && (
        <div>
          {pool.length === 0 && (
            <div style={{ color:RDark, fontSize:"10px", padding:"8px 0" }}>Pool empty. Create contracts below.</div>
          )}
          {pool.map(job => (
            <div key={job.id} style={{ marginBottom:"10px", border:`1px solid ${RDark}`,
              padding:"10px 12px" }}>
              <pre style={{ color:"#cc6666", fontSize:"11px", margin:"0 0 6px 0",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7, fontFamily:MONO }}>
                {job.content}
              </pre>
              {job.notes && (
                <div>
                  <button onClick={() => toggleNotes(job.id)} style={{ ...jBtnStyle("#aa6666"), marginBottom:"4px" }}>
                    {expandedNotes.has(job.id) ? "▲ NOTES" : "▼ NOTES"}
                  </button>
                  {expandedNotes.has(job.id) && (
                    <div style={{ color:"#aa6666", fontSize:"10px", lineHeight:1.7,
                      padding:"6px 8px", background:"rgba(0,0,0,0.3)", marginTop:"4px" }}>
                      {job.notes}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display:"flex", gap:"6px", marginTop:"6px" }}>
                <button onClick={() => setEditingId(job.id)} style={jBtnStyle("#aa6666")}>EDIT</button>
                <button onClick={() => promote(job)} style={jBtnStyle(RM)}>▶ POST TO BOARD</button>
                <button onClick={() => removeFromPool(job.id)} style={jBtnStyle(RDark)}>DELETE</button>
              </div>
            </div>
          ))}
          <button onClick={() => setEditingId("new")}
            style={{ background:"none", border:`1px solid ${RDark}`, color:"#aa6666",
              fontFamily:MONO, fontSize:"10px", letterSpacing:"0.1em",
              padding:"5px 14px", cursor:"pointer", marginTop:"6px" }}>
            + NEW CONTRACT
          </button>
        </div>
      )}

      {/* ARCHIVE */}
      {!editingId && subPanel === "archive" && (
        <div>
          {archive.length === 0 && (
            <div style={{ color:RDark, fontSize:"10px", padding:"8px 0" }}>No archived contracts yet.</div>
          )}
          {archive.map(job => (
            <div key={job.id} style={{ marginBottom:"12px", opacity:0.8,
              borderLeft:`2px solid ${job.status==="completed"?RM:RDark}`, paddingLeft:"10px" }}>
              <div style={{ color:job.status==="completed"?RM:RDark, fontSize:"9px",
                letterSpacing:"0.15em", marginBottom:"4px" }}>
                {job.status==="completed"?"✓ COMPLETED":"✗ EXPIRED"}
                {job.cycle_closed != null ? ` — CYC ${String(job.cycle_closed).padStart(2,"0")}` : ""}
              </div>
              <pre style={{ color:"#996666", fontSize:"10px", margin:"0 0 6px 0",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7, fontFamily:MONO }}>
                {job.content}
              </pre>
              {job.notes && (
                <div>
                  <button onClick={() => toggleNotes(job.id)} style={{ ...jBtnStyle(RDark), marginBottom:"4px" }}>
                    {expandedNotes.has(job.id) ? "▲ NOTES" : "▼ NOTES"}
                  </button>
                  {expandedNotes.has(job.id) && (
                    <div style={{ color:"#cc8888", fontSize:"10px", lineHeight:1.7,
                      padding:"6px 8px", background:"rgba(0,0,0,0.3)", marginTop:"4px" }}>
                      {job.notes}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display:"flex", gap:"6px", marginTop:"6px", flexWrap:"wrap" }}>
                {job.status !== "revoked" && (
                  <button onClick={() => moveBMToPool(job)} style={jBtnStyle(RM)}>↩ MOVE TO POOL</button>
                )}
                {job.status !== "revoked" && (
                  <button onClick={() => revokeArchived(job)} style={jBtnStyle(RDark)}>⊘ REVOKE</button>
                )}
                <button onClick={() => removeArchived(job.id)} style={jBtnStyle("#553333")}>DELETE</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GENERATION TABLES */}
      {!editingId && subPanel === "generate" && (
        <div>
          {Object.entries(BM_GEN_TABLES).map(([key, tbl]) => (
            <div key={key} style={{ marginBottom:"20px", border:`1px solid ${RDark}`, padding:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <div style={{ color:RD, fontSize:"10px", letterSpacing:"0.2em" }}>{tbl.label} GENERATION</div>
                <button onClick={() => generateJob(key)}
                  style={{ background:"rgba(80,0,0,0.2)", border:`1px solid ${RM}`, color:R,
                    fontFamily:MONO, fontSize:"9px", letterSpacing:"0.1em",
                    padding:"4px 10px", cursor:"pointer", whiteSpace:"nowrap" }}>
                  ⚄ GENERATE → POOL
                </button>
              </div>
              {tbl.rolls.map(r => (
                <div key={r.label} style={{ marginBottom:"8px" }}>
                  <div style={{ color:RM, fontSize:"9px", marginBottom:"3px" }}>{r.label}</div>
                  {r.items.map(item => (
                    <div key={item} style={{ color:"#cc8888", fontSize:"10px", paddingLeft:"8px", lineHeight:1.7 }}>{item}</div>
                  ))}
                </div>
              ))}
              {tbl.d20 && (
                <div style={{ marginTop:"8px" }}>
                  <div style={{ color:RM, fontSize:"9px", marginBottom:"6px" }}>{tbl.d20Label}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 16px" }}>
                    {tbl.d20.map((item, i) => (
                      <div key={i} style={{ color:"#cc8888", fontSize:"10px" }}>
                        <span style={{ color:"#996666", minWidth:"22px", display:"inline-block" }}>{i+1}.</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tbl.notes && (
                <div style={{ color:"#996666", fontSize:"10px", marginTop:"8px", fontStyle:"italic" }}>{tbl.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

