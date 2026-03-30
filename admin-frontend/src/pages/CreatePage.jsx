import React, { useState, useCallback, useEffect } from "react";
import { releasesApi } from "../api";
import { useCreateRun } from "../hooks/useCreateRun";

// ── Shared field styles ────────────────────────────────────────────────────────
const labelStyle = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13, color: "#374151" };
const inputStyle = {
  fontFamily: "Arial, sans-serif", fontSize: 14, border: "1px solid #d1d5db",
  borderRadius: 4, padding: "7px 10px", width: "100%", outline: "none",
  background: "#fff",
};
const sectionCard = {
  background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 24, marginBottom: 0,
};

// ── File input component ───────────────────────────────────────────────────────
function FileField({ label, accept, value, onChange, required }) {
  const id = label.replace(/\s+/g, "_").toLowerCase();
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={labelStyle}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={e => onChange(e.target.files[0] || null)}
          style={{ ...inputStyle, padding: "5px 10px", cursor: "pointer" }}
        />
        {value && (
          <span style={{ display: "block", fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            ✓ {value.name} ({(value.size / 1024).toFixed(1)} KB)
          </span>
        )}
      </div>
    </div>
  );
}

// ── Text / select field ────────────────────────────────────────────────────────
function TextField({ label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required, disabled }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{ ...inputStyle, background: disabled ? "#f9fafb" : "#fff", color: value ? "#111" : "#9ca3af" }}
      >
        <option value="">{placeholder || "Select…"}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Common run metadata fields ─────────────────────────────────────────────────
function CommonFields({ form, setField, projects, releases, loadReleases, sprints, loadSprints }) {
  const [releasesForProject, setReleasesForProject] = useState([]);
  const [relLoading, setRelLoading] = useState(false);
  const [sprintsForRelease, setSprintsForRelease] = useState([]);
  const [spLoading, setSpLoading] = useState(false);

  // Load releases when project changes
  useEffect(() => {
    if (!form.project_key) { setReleasesForProject([]); return; }
    setRelLoading(true);
    releasesApi.getByProject(form.project_key)
      .then(data => setReleasesForProject(Array.isArray(data) ? data : []))
      .catch(() => setReleasesForProject([]))
      .finally(() => setRelLoading(false));
  }, [form.project_key]);

  // Load sprints when release changes
  useEffect(() => {
    if (!form.project_key || !form.release_name) { setSprintsForRelease([]); return; }
    setSpLoading(true);
    import("../api/client").then(({ api }) =>
      api.get(`/sprints?project_key=${encodeURIComponent(form.project_key)}&release=${encodeURIComponent(form.release_name)}`)
    )
      .then(data => setSprintsForRelease(Array.isArray(data) ? data : []))
      .catch(() => setSprintsForRelease([]))
      .finally(() => setSpLoading(false));
  }, [form.project_key, form.release_name]);

  const projectOptions = projects.map(p => ({ value: p.project_key, label: `${p.name} (${p.project_key})` }));
  const releaseOptions = releasesForProject.map(r => ({ value: r.name, label: r.name }));
  const sprintOptions  = sprintsForRelease.map(s => ({ value: String(s.sprint_no), label: `Sprint ${s.sprint_no}` }));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <SelectField
            label="Project"
            value={form.project_key}
            onChange={v => { setField("project_key", v); setField("release_name", ""); setField("sprint_no", ""); }}
            options={projectOptions}
            placeholder="Select project…"
            required
          />
        </div>
        <div>
          <SelectField
            label="Release"
            value={form.release_name}
            onChange={v => { setField("release_name", v); setField("sprint_no", ""); }}
            options={releaseOptions}
            placeholder={relLoading ? "Loading…" : "Select release…"}
            required
            disabled={!form.project_key || relLoading}
          />
        </div>
        <div>
          <SelectField
            label="Sprint"
            value={form.sprint_no}
            onChange={v => setField("sprint_no", v)}
            options={sprintOptions}
            placeholder={spLoading ? "Loading…" : "Select sprint…"}
            required
            disabled={!form.release_name || spLoading}
          />
        </div>
        <div>
          <TextField
            label="Run Name"
            value={form.run_name}
            onChange={v => setField("run_name", v)}
            placeholder="e.g. Regression run #42"
            required
          />
        </div>
      </div>
    </>
  );
}

// ── Status / feedback banner ───────────────────────────────────────────────────
function StatusBanner({ status, message, onDismiss }) {
  if (!status) return null;
  const isSuccess = status === "success";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 12, padding: "12px 16px", borderRadius: 6, marginBottom: 20,
      background: isSuccess ? "#f0fdf4" : "#fef2f2",
      border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
      color: isSuccess ? "#166534" : "#991b1b",
    }}>
      <span style={{ fontSize: 14 }}>
        {isSuccess ? "✓ " : "✗ "}{message}
      </span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, color: "inherit", flexShrink: 0, padding: 0 }}>×</button>
    </div>
  );
}

// ── Submit button ──────────────────────────────────────────────────────────────
function SubmitBtn({ loading, label }) {
  return (
    <button
      type="button"
      disabled={loading}
      style={{
        background: loading ? "#93c5fd" : "#2563eb", color: "#fff",
        border: "none", borderRadius: 4, padding: "9px 20px",
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "Arial, sans-serif", fontSize: 14, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 8,
        transition: "background 0.15s",
      }}
    >
      {loading && (
        <span style={{
          width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)",
          borderTop: "2px solid #fff", borderRadius: "50%",
          display: "inline-block", animation: "spin 0.7s linear infinite",
        }} />
      )}
      {loading ? "Uploading…" : label}
    </button>
  );
}

// ── Pytest form ────────────────────────────────────────────────────────────────
function PytestForm({ projects, createPytestRun, loading }) {
  const empty = { json_file: null, report_zip: null, run_name: "", project_key: "", release_name: "", sprint_no: "" };
  const [form, setForm]     = useState(empty);
  const [status, setStatus] = useState(null); // null | "success" | "error"
  const [message, setMsg]   = useState("");

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const { json_file, report_zip, run_name, project_key, release_name, sprint_no } = form;
    if (!json_file || !report_zip || !run_name || !project_key || !release_name || !sprint_no) {
      setStatus("error"); setMsg("Please fill in all required fields and attach both files."); return;
    }
    try {
      await createPytestRun({ json_file, report_zip, run_name, project_key, release_name, sprint_no: Number(sprint_no) });
      setStatus("success"); setMsg(`Pytest run "${run_name}" created successfully.`);
      setForm(empty);
    } catch (e) {
      setStatus("error"); setMsg(e.message || "Failed to create pytest run.");
    }
  };

  return (
    <div>
      <StatusBanner status={status} message={message} onDismiss={() => setStatus(null)} />
      <CommonFields form={form} setField={setField} projects={projects} />
      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 4 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Files</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FileField label="JSON Report File" accept=".json" value={form.json_file} onChange={f => setField("json_file", f)} required />
          <FileField label="Report ZIP" accept=".zip" value={form.report_zip} onChange={f => setField("report_zip", f)} required />
        </div>
      </div>
      <div style={{ marginTop: 4 }}>
        <SubmitBtn loading={loading} label="Create Pytest Run" />
      </div>
    </div>
  );
}

// ── Robot form ─────────────────────────────────────────────────────────────────
function RobotForm({ projects, createRobotRun, loading }) {
  const empty = { xml_file: null, images: null, run_name: "", project_key: "", release_name: "", sprint_no: "" };
  const [form, setForm]     = useState(empty);
  const [status, setStatus] = useState(null);
  const [message, setMsg]   = useState("");

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const { xml_file, images, run_name, project_key, release_name, sprint_no } = form;
    if (!xml_file || !images || !run_name || !project_key || !release_name || !sprint_no) {
      setStatus("error"); setMsg("Please fill in all required fields and attach both files."); return;
    }
    try {
      await createRobotRun({ xml_file, images, run_name, project_key, release_name, sprint_no: Number(sprint_no) });
      setStatus("success"); setMsg(`Robot run "${run_name}" created successfully.`);
      setForm(empty);
    } catch (e) {
      setStatus("error"); setMsg(e.message || "Failed to create robot run.");
    }
  };

  return (
    <div>
      <StatusBanner status={status} message={message} onDismiss={() => setStatus(null)} />
      <CommonFields form={form} setField={setField} projects={projects} />
      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 4 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Files</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FileField label="XML Output File" accept=".xml" value={form.xml_file} onChange={f => setField("xml_file", f)} required />
          <FileField label="Images ZIP" accept=".zip" value={form.images} onChange={f => setField("images", f)} required />
        </div>
      </div>
      <div style={{ marginTop: 4 }}>
        <SubmitBtn loading={loading} label="Create Robot Run" />
      </div>
    </div>
  );
}

// ── JMeter form ────────────────────────────────────────────────────────────────
function JmeterForm({ projects, createJmeterRun, loading }) {
  const empty = { jmx: null, jtl: null, log: null, run_name: "", project_key: "", release_name: "", sprint_no: "" };
  const [form, setForm]     = useState(empty);
  const [status, setStatus] = useState(null);
  const [message, setMsg]   = useState("");

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const { jmx, jtl, log, run_name, project_key, release_name, sprint_no } = form;
    if (!jmx || !jtl || !log || !run_name || !project_key || !release_name || !sprint_no) {
      setStatus("error"); setMsg("Please fill in all required fields and attach all three files."); return;
    }
    try {
      await createJmeterRun({ jmx, jtl, log, run_name, project_key, release_name, sprint_no: Number(sprint_no) });
      setStatus("success"); setMsg(`JMeter run "${run_name}" created successfully.`);
      setForm(empty);
    } catch (e) {
      setStatus("error"); setMsg(e.message || "Failed to create JMeter run.");
    }
  };

  return (
    <div>
      <StatusBanner status={status} message={message} onDismiss={() => setStatus(null)} />
      <CommonFields form={form} setField={setField} projects={projects} />
      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 4 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Files</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <FileField label="JMX Test Plan" accept=".jmx" value={form.jmx} onChange={f => setField("jmx", f)} required />
          <FileField label="JTL Results File" accept=".jtl,.csv" value={form.jtl} onChange={f => setField("jtl", f)} required />
          <FileField label="Log File" accept=".log,.txt" value={form.log} onChange={f => setField("log", f)} required />
        </div>
      </div>
      <div style={{ marginTop: 4 }}>
        <SubmitBtn loading={loading} label="Create JMeter Run" />
      </div>
    </div>
  );
}

// ── Tab definitions ────────────────────────────────────────────────────────────
const RUN_TYPES = [
  { id: "pytest", label: "Pytest",  badge: "Unit / Integration", color: "#0369a1", bg: "#e0f2fe" },
  { id: "robot",  label: "Robot",   badge: "Acceptance",         color: "#7c3aed", bg: "#ede9fe" },
  { id: "jmeter", label: "JMeter",  badge: "Performance",        color: "#b45309", bg: "#fef3c7" },
];

// ── Main CreatePage ────────────────────────────────────────────────────────────
export default function CreatePage({ projects, showToast }) {
  const [activeTab, setActiveTab] = useState("pytest");
  const { loading, createPytestRun, createRobotRun, createJmeterRun } = useCreateRun();

  // Wrap create fns to also show toast
  const wrapCreate = (fn, label) => async (args) => {
    const result = await fn(args);
    showToast && showToast(`${label} created successfully!`, "success");
    return result;
  };

  const activeType = RUN_TYPES.find(t => t.id === activeTab);

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .run-tab-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Create Run</h2>
        <p style={{ fontSize: 14, color: "#6b7280" }}>Upload test results to create a new run entry.</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {RUN_TYPES.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              className="run-tab-btn"
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                padding: "12px 20px", borderRadius: 8, border: `2px solid ${isActive ? t.color : "#e5e7eb"}`,
                background: isActive ? t.bg : "#fff",
                cursor: "pointer", transition: "all 0.15s", minWidth: 140,
                boxShadow: isActive ? `0 0 0 3px ${t.bg}` : "none",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: isActive ? t.color : "#374151" }}>{t.label}</span>
              <span style={{ fontSize: 11, color: isActive ? t.color : "#9ca3af", marginTop: 2, fontWeight: 500 }}>{t.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Form card */}
      <div style={sectionCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{
            background: activeType.bg, color: activeType.color,
            padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>
            {activeType.label} Run
          </span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>
            {activeTab === "pytest" && "POST /admin/pytest_runs"}
            {activeTab === "robot"  && "POST /admin/robot_runs"}
            {activeTab === "jmeter" && "POST /admin/jmeter_runs"}
          </span>
        </div>

        {activeTab === "pytest" && (
          <PytestForm
            projects={projects}
            createPytestRun={wrapCreate(createPytestRun, "Pytest run")}
            loading={loading}
          />
        )}
        {activeTab === "robot" && (
          <RobotForm
            projects={projects}
            createRobotRun={wrapCreate(createRobotRun, "Robot run")}
            loading={loading}
          />
        )}
        {activeTab === "jmeter" && (
          <JmeterForm
            projects={projects}
            createJmeterRun={wrapCreate(createJmeterRun, "JMeter run")}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
