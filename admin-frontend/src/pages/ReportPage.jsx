import React, { useState, useEffect, useRef } from "react";

const FRAMEWORK_LABELS = {
  pyp: "Playwright",
  pys: "Selenium",
  rob: "Robot",
  saf: "SAF",
  oth: "Other",
};

const FRAMEWORK_COLORS = {
  pyp: { bg: "#dbeafe", text: "#1d4ed8", bar: "#3b82f6" },
  pys: { bg: "#dcfce7", text: "#15803d", bar: "#22c55e" },
  rob: { bg: "#fef9c3", text: "#a16207", bar: "#eab308" },
  saf: { bg: "#f3e8ff", text: "#7e22ce", bar: "#a855f7" },
  oth: { bg: "#f1f5f9", text: "#475569", bar: "#94a3b8" },
};

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const styles = {
    "not started": { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8",  label: "Not Started" },
    "completed":   { bg: "#dcfce7", color: "#15803d", dot: "#22c55e",  label: "Completed" },
    "in progress": { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6",  label: "In Progress" },
    "at risk":     { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444",  label: "At Risk" },
  };
  const cfg = styles[s] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8", label: status || "—" };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      borderRadius: 99, padding: "3px 10px 3px 8px",
      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function MiniBar({ value, color }) {
  const pct = Math.min(Math.max(parseFloat(value) || 0, 0), 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 12, color: "#374151", minWidth: 36, textAlign: "right" }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

function FrameworkCell({ utilization }) {
  if (!utilization) return <span style={{ color: "#9ca3af" }}>—</span>;
  const entries = Object.entries(FRAMEWORK_LABELS)
    .map(([key, label]) => ({ key, label, val: parseFloat(utilization[key]) || 0 }))
    .filter(e => e.val > 0)
    .sort((a, b) => b.val - a.val);

  if (entries.length === 0) return <span style={{ color: "#9ca3af" }}>—</span>;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {entries.map(({ key, label, val }) => {
        const c = FRAMEWORK_COLORS[key];
        return (
          <span key={key} style={{
            background: c.bg, color: c.text,
            borderRadius: 99, padding: "2px 8px",
            fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
          }}>
            {label} {val.toFixed(1)}%
          </span>
        );
      })}
    </div>
  );
}

function ExpandedRow({ project }) {
  const stats = project.test_stats || {};
  const util = stats.framework_utilization_rate || {};

  return (
    <tr>
      <td colSpan={9} style={{ background: "#f8fafc", padding: "16px 32px 20px", borderTop: "none" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Framework Utilization
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {Object.entries(FRAMEWORK_LABELS).map(([key, label]) => {
            const val = parseFloat(util[key]) || 0;
            const c = FRAMEWORK_COLORS[key];
            return (
              <div key={key} style={{
                background: "#fff", border: "1px solid #e2e8f0",
                borderRadius: 8, padding: "10px 14px",
              }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{label}</div>
                <MiniBar value={val} color={c.bar} />
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

const FW_PIE_COLORS = {
  pyp: "#3b82f6",
  pys: "#22c55e",
  rob: "#eab308",
  saf: "#a855f7",
  oth: "#94a3b8",
};

function FrameworkPieChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    const entries = Object.entries(FRAMEWORK_LABELS)
      .map(([key, label]) => ({ key, label, val: parseFloat(data[key]) || 0 }))
      .filter(e => e.val > 0);

    if (entries.length === 0) return;

    const init = () => {
      if (!canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current, {
        type: "doughnut",
        data: {
          labels: entries.map(e => e.label),
          datasets: [{
            data: entries.map(e => parseFloat(e.val.toFixed(1))),
            backgroundColor: entries.map(e => FW_PIE_COLORS[e.key]),
            borderWidth: 2,
            borderColor: "#fff",
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%`,
              },
            },
          },
        },
      });
    };

    if (window.Chart) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = init;
      document.head.appendChild(script);
    }

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [data]);

  const entries = Object.entries(FRAMEWORK_LABELS)
    .map(([key, label]) => ({ key, label, val: parseFloat(data[key]) || 0 }))
    .filter(e => e.val > 0)
    .sort((a, b) => b.val - a.val);

  return (
    <div style={{
      background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "16px 20px",
      marginBottom: 20, display: "flex", alignItems: "center", gap: 32,
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
          Aggregate Framework Utilization
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Averaged across all projects</div>
        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map(({ key, label, val }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: FW_PIE_COLORS[key], flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#374151", minWidth: 80 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{val.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 420, gap: 20,
    }}>
      <style>{`
        @keyframes rp-spin { to { transform: rotate(360deg); } }
        @keyframes rp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes rp-bar { 0% { transform: scaleX(0); } 60% { transform: scaleX(1); } 100% { transform: scaleX(1); } }
      `}</style>

      {/* Spinner */}
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        border: "4px solid #e2e8f0",
        borderTopColor: "#1e3a5f",
        animation: "rp-spin 0.8s linear infinite",
      }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
          Fetching Execution Report
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", animation: "rp-pulse 1.8s ease-in-out infinite" }}>
          Aggregating data across all projects…
        </div>
      </div>

      {/* Animated skeleton bars */}
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {[100, 75, 88, 60].map((w, i) => (
          <div key={i} style={{
            height: 12, borderRadius: 6, background: "#e2e8f0", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${w}%`, background: "linear-gradient(90deg, #e2e8f0 25%, #c7d4e8 50%, #e2e8f0 75%)",
              backgroundSize: "200% 100%",
              animation: `rp-pulse ${1.2 + i * 0.2}s ease-in-out infinite`,
              borderRadius: 6,
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportPage({ report, loading, error, reload }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [sortKey, setSortKey] = useState("project_name");
  const [sortDir, setSortDir] = useState("asc");

  const toggleExpand = (key) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const q = search.toLowerCase();
  const filtered = (report || [])
    .filter(p =>
      p.project_name?.toLowerCase().includes(q) ||
      p.project_key?.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      let av, bv;
      if (sortKey === "project_name") { av = a.project_name; bv = b.project_name; }
      else if (sortKey === "total_test_cases") { av = a.test_stats?.total_test_cases || 0; bv = b.test_stats?.total_test_cases || 0; }
      else if (sortKey === "automation_rate") { av = parseFloat(a.test_stats?.automation_rate) || 0; bv = parseFloat(b.test_stats?.automation_rate) || 0; }
      else if (sortKey === "execution_percentage") { av = parseFloat(a.test_stats?.execution_percentage) || 0; bv = parseFloat(b.test_stats?.execution_percentage) || 0; }
      else { av = a[sortKey]; bv = b[sortKey]; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ color: "#cbd5e1", marginLeft: 4 }}>↕</span>;
    return <span style={{ color: "#2563eb", marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const thStyle = (col) => ({
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
    background: sortKey === col ? "#f0f7ff" : undefined,
  });

  // Summary stats
  const totalProjects = filtered.length;
  const avgAutomation = totalProjects > 0
    ? (filtered.reduce((s, p) => s + (parseFloat(p.test_stats?.automation_rate) || 0), 0) / totalProjects).toFixed(1)
    : "—";
  const avgExecution = totalProjects > 0
    ? (filtered.reduce((s, p) => s + (parseFloat(p.test_stats?.execution_percentage) || 0), 0) / totalProjects).toFixed(1)
    : "—";
  const totalTestCases = filtered.reduce((s, p) => s + (p.test_stats?.total_test_cases || 0), 0);

  // Aggregate framework utilization — simple average across projects that have data
  const fwAggregate = (() => {
    const projectsWithUtil = filtered.filter(p => p.test_stats?.framework_utilization_rate);
    if (projectsWithUtil.length === 0) return null;
    const sums = {};
    Object.keys(FRAMEWORK_LABELS).forEach(k => { sums[k] = 0; });
    projectsWithUtil.forEach(p => {
      const u = p.test_stats.framework_utilization_rate;
      Object.keys(FRAMEWORK_LABELS).forEach(k => { sums[k] += parseFloat(u[k]) || 0; });
    });
    const result = {};
    Object.keys(FRAMEWORK_LABELS).forEach(k => { result[k] = sums[k] / projectsWithUtil.length; });
    return result;
  })();

  if (loading && report.length === 0) return <LoadingScreen />;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>
            Project Execution Summary
          </h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Test execution metrics, automation rates, and framework utilization across all projects
          </p>
        </div>
        <button
          onClick={reload}
          style={{
            background: "#1e3a5f", color: "#fff", border: "none",
            borderRadius: 6, padding: "8px 16px", cursor: "pointer",
            fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Projects", value: totalProjects, color: "#1e3a5f", bg: "#f0f7ff" },
          { label: "Total Test Cases", value: totalTestCases.toLocaleString(), color: "#15803d", bg: "#f0fdf4" },
          { label: "Avg. Automation Rate", value: `${avgAutomation}%`, color: "#7e22ce", bg: "#faf5ff" },
          { label: "Avg. Execution", value: `${avgExecution}%`, color: "#b45309", bg: "#fffbeb" },
        ].map(card => (
          <div key={card.label} style={{
            background: card.bg, border: `1px solid ${card.bg}`,
            borderRadius: 10, padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Aggregate Framework Utilization — Pie Chart */}
      {fwAggregate && <FrameworkPieChart data={fwAggregate} />}

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <input
          placeholder="Search projects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        {error && <span style={{ color: "#dc2626", fontSize: 13 }}>{error}</span>}
      </div>

      {/* Main table */}
      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ ...thStyle("project_name"), width: 30, padding: "12px 8px 12px 16px" }} />
              <th onClick={() => toggleSort("project_name")} style={{ ...thStyle("project_name"), padding: "12px 16px" }}>
                Project <SortIcon col="project_name" />
              </th>
              <th onClick={() => toggleSort("total_test_cases")} style={{ ...thStyle("total_test_cases"), padding: "12px 16px" }}>
                Total TCs <SortIcon col="total_test_cases" />
              </th>
              <th style={{ padding: "12px 16px" }}>Automated TCs</th>
              <th onClick={() => toggleSort("automation_rate")} style={{ ...thStyle("automation_rate"), padding: "12px 16px" }}>
                Automation Rate <SortIcon col="automation_rate" />
              </th>
              <th onClick={() => toggleSort("execution_percentage")} style={{ ...thStyle("execution_percentage"), padding: "12px 16px" }}>
                Execution % <SortIcon col="execution_percentage" />
              </th>
              <th style={{ padding: "12px 16px" }}>Frameworks</th>
              <th style={{ padding: "12px 16px" }}>Sprints</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
                  {search ? "No projects match your search." : "No report data available."}
                </td>
              </tr>
            )}

            {filtered.map((project) => {
              const stats = project.test_stats || {};
              const isOpen = !!expanded[project.project_key];
              const autoRate = parseFloat(stats.automation_rate) || 0;
              const execPct = parseFloat(stats.execution_percentage) || 0;

              return (
                <React.Fragment key={project.project_key}>
                  <tr
                    onClick={() => toggleExpand(project.project_key)}
                    style={{ cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = isOpen ? "#f0f7ff" : ""}
                  >
                    {/* Expand chevron */}
                    <td style={{ padding: "10px 8px 10px 16px", color: "#94a3b8", fontSize: 13, textAlign: "center", background: isOpen ? "#f0f7ff" : undefined }}>
                      {isOpen ? "▾" : "▸"}
                    </td>

                    {/* Project */}
                    <td style={{ padding: "10px 16px", background: isOpen ? "#f0f7ff" : undefined }}>
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{project.project_name}</div>
                      <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2, fontFamily: "monospace" }}>{project.project_key}</div>
                    </td>

                    {/* Total TCs */}
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{(stats.total_test_cases || 0).toLocaleString()}</span>
                    </td>

                    {/* Automated TCs */}
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontWeight: 600, color: "#2563eb" }}>{(stats.automated_test_cases || 0).toLocaleString()}</span>
                    </td>

                    {/* Automation Rate */}
                    <td style={{ padding: "10px 16px", minWidth: 160 }}>
                      <MiniBar value={autoRate} color="#7c3aed" />
                    </td>

                    {/* Execution % */}
                    <td style={{ padding: "10px 16px", minWidth: 160 }}>
                      <MiniBar value={execPct} color="#0891b2" />
                    </td>

                    {/* Frameworks */}
                    <td style={{ padding: "10px 16px" }}>
                      <FrameworkCell utilization={stats.framework_utilization_rate} />
                    </td>

                    {/* Sprint Count */}
                    <td style={{ padding: "10px 16px", textAlign: "center" }}>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>
                        {Array.isArray(project.sprints) ? project.sprints.length : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px 16px" }}>
                      <StatusBadge status={stats.status} />
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isOpen && <ExpandedRow project={project} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8", textAlign: "right" }}>
          Showing {filtered.length} of {report.length} projects
        </div>
      )}
    </div>
  );
}