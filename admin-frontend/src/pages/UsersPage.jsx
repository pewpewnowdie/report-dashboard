import React, { useState } from "react";
import { usersApi } from "../api";

const STATUS_COLOR = { FINISHED: "#16a34a", FAILED: "#dc2626", RUNNING: "#2563eb", PENDING: "#d97706" };

const MAIN_APP_URL = __MAIN_APP_URL__;

function buildRunUrl(r, test_type) {
  if (test_type === "jmeter") {
    test_type = "load";
  }
  const params = new URLSearchParams({
    project_key: r.project_key,
    release_id:  r.release_id,
    test_type,
    run_id:      r.run_id,
  });
  return `${MAIN_APP_URL}?${params.toString()}`;
}

function RunsSection({ runs, type, search }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const columns = {
    jmeter: ["Run Name", "Project", "Release", "Status", "Started At", "Duration", "VUsers", "Avg RT", "Error Rate", "Throughput"],
    pytest:  ["Run Name", "Project", "Release", "Status", "Started At", "Duration", "Total", "Passed", "Failed", "Skipped"],
    robot:   ["Run Name", "Project", "Release", "Status", "Started At", "Duration", "Total", "Passed", "Failed", "Skipped"],
  };

  const colKeys = {
    jmeter: ["run_name", "project_key", "release", "status", "started_at", "duration", "v_users", "avg_response_time", "error_rate", "throughput"],
    pytest:  ["run_name", "project_key", "release", "status", "started_at", "duration", "total", "passed", "failed", "skipped"],
    robot:   ["run_name", "project_key", "release", "status", "started_at", "duration", "total", "passed", "failed", "skipped"],
  };

  const keys = colKeys[type];

  const q = search.toLowerCase();
  let filtered = runs.filter(r =>
    (r.run_name || "").toLowerCase().includes(q) ||
    (r.project_key || "").toLowerCase().includes(q) ||
    (r.status || "").toLowerCase().includes(q)
  );

  if (sortCol !== null) {
    const key = keys[sortCol];
    filtered = [...filtered].sort((a, b) => {
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const handleSort = (idx) => {
    if (sortCol === idx) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(idx);
      setSortDir("asc");
    }
  };

  const arrow = (idx) => sortCol === idx ? (sortDir === "asc" ? " ▲" : " ▼") : " ↕";

  return (
    <div style={tableWrap}>
      <table>
        <thead>
          <tr>
            {columns[type].map((c, i) => (
              <th
                key={c}
                onClick={() => handleSort(i)}
                style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
              >
                {c}<span style={{ color: sortCol === i ? "#2563eb" : "#9ca3af", fontSize: 11 }}>{arrow(i)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0
            ? <tr><td colSpan={columns[type].length} style={empty}>{runs.length === 0 ? "No runs found." : "No results match your search."}</td></tr>
            : filtered.map(r => (
              <tr key={r.run_id}>
                <td>
                  <a href={buildRunUrl(r, type)} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                    {r.run_name || r.run_id}
                  </a>
                </td>
                <td style={{ fontFamily: "monospace", color: "#6b7280", fontSize: 12 }}>{r.project_key || "—"}</td>
                <td style={{ color: "#6b7280" }}>{r.release || "—"}</td>
                <td><span style={{ color: STATUS_COLOR[r.status] || "#6b7280" }}>{r.status}</span></td>
                <td style={{ color: "#6b7280" }}>{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                <td style={{ color: "#6b7280" }}>{r.duration != null ? r.duration : "—"}</td>
                {type === "jmeter" ? <>
                  <td>{r.v_users ?? "—"}</td>
                  <td>{r.avg_response_time != null ? `${r.avg_response_time}ms` : "—"}</td>
                  <td>{r.error_rate != null ? `${r.error_rate}%` : "—"}</td>
                  <td>{r.throughput != null ? `${r.throughput}/s` : "—"}</td>
                </> : <>
                  <td>{r.total ?? "—"}</td>
                  <td style={{ color: "#16a34a" }}>{r.passed ?? "—"}</td>
                  <td style={{ color: "#dc2626" }}>{r.failed ?? "—"}</td>
                  <td style={{ color: "#d97706" }}>{r.skipped ?? "—"}</td>
                </>}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsersPage({ users, removeUser, showToast }) {
  const [selectedUser, setSelectedUser]     = useState(null);
  const [search, setSearch]                 = useState("");
  const [projectSearch, setProjectSearch]   = useState("");
  const [runSearch, setRunSearch]           = useState("");
  const [activeTab, setActiveTab]           = useState("projects");
  const [runs, setRuns]                     = useState(null);
  const [runsLoading, setRunsLoading]       = useState(false);
  const [userProjects, setUserProjects]     = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const openUserDetail = async (u) => {
    setSelectedUser(u);
    setProjectSearch("");
    setRunSearch("");
    setActiveTab("projects");
    setRuns(null);
    setUserProjects([]);
    setProjectsLoading(true);
    try {
      const data = await usersApi.getProjects(u.id);
      setUserProjects(data);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadRuns = async (user_id) => {
    if (runs !== null) return;
    setRunsLoading(true);
    try {
      const data = await usersApi.getRuns(user_id);
      setRuns(data);
    } catch (e) {
      showToast(e.message, true);
      setRuns({ jmeter_runs: [], pytest_runs: [], robot_runs: [] });
    } finally {
      setRunsLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setRunSearch("");
    if (tab !== "projects" && runs === null) loadRuns(selectedUser.id);
  };

  const handleRemove = async (username, project_key) => {
    try {
      await removeUser(project_key, username);
      setUserProjects(prev => prev.filter(p => p.project_key !== project_key));
      showToast("User removed.");
    }
    catch (e) { showToast(e.message, true); }
  };

  const q = search.toLowerCase();
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  );

  const pq = projectSearch.toLowerCase();
  const filteredUserProjects = userProjects.filter(p =>
    p.name.toLowerCase().includes(pq) ||
    p.project_key.toLowerCase().includes(pq)
  );

  const tabStyle = (id) => ({
    padding: "7px 16px", border: "none", borderBottom: activeTab === id ? "2px solid #2563eb" : "2px solid transparent",
    background: "none", cursor: "pointer", fontFamily: "Arial, sans-serif", fontSize: 14,
    color: activeTab === id ? "#2563eb" : "#6b7280", fontWeight: activeTab === id ? 600 : 400,
  });

  return !selectedUser ? (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Users</h2>
      </div>
      <input
        type="text"
        placeholder="Search by username or role..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 14, width: 300 }}
      />
      <div style={tableWrap}>
        <table>
          <thead><tr><th>Username</th><th>Role</th><th>Active</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {filteredUsers.length === 0
              ? <tr><td colSpan={5} style={empty}>{users.length === 0 ? "No users found." : "No results match your search."}</td></tr>
              : filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td style={{ color: "#6b7280" }}>{u.role}</td>
                  <td style={{ color: u.is_active ? "#16a34a" : "#6b7280" }}>{u.is_active ? "Yes" : "No"}</td>
                  <td style={{ color: "#6b7280" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  <td><button className="link" onClick={() => openUserDetail(u)}>View</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <>
      <div style={{ marginBottom: 14 }}>
        <button className="link" onClick={() => setSelectedUser(null)}>← Back to Users</button>
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{selectedUser.username}</h2>
      <div style={{ color: "#6b7280", marginBottom: 16 }}>Role: {selectedUser.role} · Active: {selectedUser.is_active ? "Yes" : "No"}</div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #d1d5db", marginBottom: 16, display: "flex", gap: 4 }}>
        <button style={tabStyle("projects")} onClick={() => switchTab("projects")}>Projects</button>
        <button style={tabStyle("jmeter")}   onClick={() => switchTab("jmeter")}>JMeter Runs</button>
        <button style={tabStyle("pytest")}   onClick={() => switchTab("pytest")}>Pytest Runs</button>
        <button style={tabStyle("robot")}    onClick={() => switchTab("robot")}>Robot Runs</button>
      </div>

      {/* Projects tab */}
      {activeTab === "projects" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>Assigned Projects</div>
            <input
              type="text"
              placeholder="Search projects..."
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              style={{ width: 240 }}
            />
          </div>
          <div style={tableWrap}>
            <table>
              <thead><tr><th>Project Key</th><th>Name</th><th></th></tr></thead>
              <tbody>
                {filteredUserProjects.length === 0
                  ? <tr><td colSpan={3} style={empty}>{projectsLoading ? "Loading..." : userProjects.length === 0 ? "Not assigned to any projects." : "No results match your search."}</td></tr>
                  : filteredUserProjects.map(p => (
                    <tr key={p.project_key}>
                      <td style={{ fontFamily: "monospace", color: "#6b7280" }}>{p.project_key}</td>
                      <td>{p.name}</td>
                      <td><button className="link-red" onClick={() => handleRemove(selectedUser.username, p.project_key)}>Remove</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Run tabs */}
      {activeTab !== "projects" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>
              {activeTab === "jmeter" ? "JMeter" : activeTab === "pytest" ? "Pytest" : "Robot"} Runs
            </div>
            <input
              type="text"
              placeholder="Search by name, project, status..."
              value={runSearch}
              onChange={e => setRunSearch(e.target.value)}
              style={{ width: 280 }}
            />
          </div>
          {runsLoading
            ? <div style={{ color: "#6b7280", padding: 12 }}>Loading runs...</div>
            : runs && (
              <RunsSection
                runs={activeTab === "jmeter" ? runs.jmeter_runs : activeTab === "pytest" ? runs.pytest_runs : runs.robot_runs}
                type={activeTab}
                search={runSearch}
              />
            )}
        </>
      )}
    </>
  );
}

const tableWrap = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden" };
const empty     = { color: "#9ca3af" };