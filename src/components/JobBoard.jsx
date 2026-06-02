import { useState } from "react";
import {
  GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  HAZARD_LABELS,
} from "../constants.js";

  GREEN, GREEN_DIM, GREEN_DARK, GREEN_MID, AMBER, RED, HEADER_GREEN, MONO,
  HAZARD_LABELS,
} from "../constants.js";

// ─── Job Board Shared Components ────────────────────────────────────────────

// ─── Job Board Components ──────────────────────────────────────────────────────


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

export function JobCard({ job, isOmniCorp, minimal = false }) {
  const borderColor = isOmniCorp ? "rgba(255,200,0,0.3)" : `${GREEN_DARK}`;
  const bgColor = isOmniCorp ? "rgba(80,60,0,0.12)" : "rgba(0,0,0,0.4)";
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


// ─── Job Editor ─────────────────────────────────────────────────────────────

export function JobEditor({ job, stocks, onSave, onCancel }) {
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

  const selStyle = { background: "rgba(0,0,0,0.5)", border: `1px solid ${GREEN_DARK}`, color: HEADER_GREEN,
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
            style={{ background: mode === m ? "rgba(68,136,255,0.1)" : "none",
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
                    {HAZARD_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
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
                style={{ background: frozen ? "rgba(68,136,255,0.1)" : "none",
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


// ─── Warden Job Board Panel ─────────────────────────────────────────────────

// ─── Warden Job Board Panel ────────────────────────────────────────────────────

export function JobBoardPanel({ jobs, setJobs, stocks, setStocks, date, rollConfig, setRollConfig, alwaysMerge, KEYS, wardenSet, showToast }) {
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
    if (!window.confirm("Delete this job?")) return;
    saveJobs(jobs.filter(j => j.id !== id));
  };

  const moveJobToPool = (job) => {
    const next = jobs.map(j => j.id === job.id ? { ...j, status: "pool", cycle_completed: undefined, cycle_posted: undefined } : j);
    saveJobs(next);
    showToast("JOB MOVED TO POOL");
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
      style={{ background: subPanel === id ? "rgba(68,136,255,0.08)" : "none",
        border: `1px solid ${subPanel === id ? "#2a3a5a" : "#1a2a3a"}`,
        color: subPanel === id ? GREEN_MID : GREEN_DARK,
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
          <span style={{ color: GREEN_DARK, fontSize: "9px", letterSpacing: "0.1em" }}>ROTATION:</span>
          {["random","bespoke"].map(m => (
            <button key={m} onClick={() => {
              const next = { ...rollConfig, drawMode: m };
              setRollConfig(next);
              wardenSet(KEYS.settings, { alwaysMerge: alwaysMerge ?? true, rollConfig: next });
            }}
              style={{ background: drawMode === m ? "rgba(68,136,255,0.1)" : "none",
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
                <button onClick={() => moveJobToPool(job)} style={jBtnStyle(GREEN_DARK)}>↩ MOVE TO POOL</button>
                <button onClick={() => revokeJob(job)} style={jBtnStyle("#664422")}>REVOKE</button>
                <button onClick={() => {
                  const next = jobs.map(j => j.id === job.id ? { ...j, frozen: !j.frozen } : j);
                  saveJobs(next);
                  showToast(job.frozen ? "JOB UNSTICKIED" : "JOB STICKIED", "#88ccff");
                }} style={jBtnStyle(job.frozen ? "#4488cc" : GREEN_DARK)}>
                  {job.frozen ? "📌 STICKY" : "STICKY OFF"}
                </button>
                <button onClick={() => removeJob(job.id)} style={jBtnStyle("#aa6666")}>DELETE</button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button onClick={() => { setEditTarget("active"); setEditingId("new"); }}
              style={{ background: "none", border: `1px solid #2a3a2a`, color: GREEN_MID,
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
                <button onClick={() => removeJob(job.id)} style={jBtnStyle("#aa6666")}>DELETE</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: "8px" }}>
            <button onClick={() => { setEditTarget("pool"); setEditingId("new"); }}
              style={{ background: "none", border: `1px solid #2a3a2a`, color: GREEN_MID,
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
                  <button onClick={() => moveJobToPool(job)} style={jBtnStyle(GREEN_DARK)}>↩ MOVE TO POOL</button>
                  {!isRevoked && <button onClick={() => revokeJob(job)} style={jBtnStyle("#664422")}>REVOKE</button>}
                  {isRevoked && <button onClick={() => completeJob(job, true)} style={jBtnStyle(GREEN_DARK)}>MARK COMPLETE</button>}
                  <button onClick={() => removeJob(job.id)} style={jBtnStyle("#aa6666")}>DELETE</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── Player Job Board View ──────────────────────────────────────────────────

// ─── Player Job Board View ──────────────────────────────────────────────────────

export function PlayerJobBoard({ jobs, stocks }) {
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

