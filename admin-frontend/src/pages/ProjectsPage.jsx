import React, { useState, useEffect } from "react";
import CreateProjectModal from "../components/modals/CreateProjectModal";
import CreateReleaseModal from "../components/modals/CreateReleaseModal";
import AddUserModal from "../components/modals/AddUserModal";

// ── Sprint Table ─────────────────────────────────────────────────────────────

function SprintTable({ projectKey, release, sprints, loading, error, onUpdate, showToast }) {
  const [cells, setCells] = useState({});

  useEffect(() => {
    if (!sprints) return;
    setCells(
      Object.fromEntries(
        sprints.map(s => [s.sprint_no, { value: String(s.test_case_count ?? ""), saving: false, dirty: false }])
      )
    );
  }, [sprints]);

  const handleChange = (sprint_no, val) => {
    setCells(prev => ({ ...prev, [sprint_no]: { ...prev[sprint_no], value: val, dirty: true } }));
  };

  const handleBlur = async (sprint_no) => {
    const cell = cells[sprint_no];
    if (!cell || !cell.dirty) return;
    const parsed = parseInt(cell.value, 10);
    if (isNaN(parsed) || parsed < 0) {
      showToast("Test case count must be a non-negative number.", true);
      const original = (sprints || []).find(s => s.sprint_no === sprint_no);
      setCells(prev => ({ ...prev, [sprint_no]: { value: String(original?.test_case_count ?? ""), saving: false, dirty: false } }));
      return;
    }
    setCells(prev => ({ ...prev, [sprint_no]: { ...prev[sprint_no], saving: true } }));
    try {
      await onUpdate(projectKey, release, sprint_no, parsed);
      setCells(prev => ({ ...prev, [sprint_no]: { value: String(parsed), saving: false, dirty: false } }));
    } catch (e) {
      showToast(e.message || "Failed to update sprint.", true);
      setCells(prev => ({ ...prev, [sprint_no]: { ...prev[sprint_no], saving: false } }));
    }
  };

  const handleKeyDown = (e, sprint_no) => {
    if (e.key === "Enter") e.target.blur();
    if (e.key === "Escape") {
      const original = (sprints || []).find(s => s.sprint_no === sprint_no);
      setCells(prev => ({ ...prev, [sprint_no]: { value: String(original?.test_case_count ?? ""), saving: false, dirty: false } }));
      e.target.blur();
    }
  };

  return (
    <div style={tableWrap}>
      <div style={tableHeader}>
        Sprints
        {release && <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: 6, fontSize: 12 }}>— {release}</span>}
      </div>
      {loading && <div style={{ padding: "16px", color: "#9ca3af", fontSize: 13 }}>Loading sprints…</div>}
      {error && !loading && <div style={{ padding: "16px", color: "#dc2626", fontSize: 13 }}>{error}</div>}
      {!loading && !error && (
        <table>
          <thead>
            <tr><th>Sprint No.</th><th>Test Case Count</th></tr>
          </thead>
          <tbody>
            {(!sprints || sprints.length === 0) ? (
              <tr><td colSpan={2} style={empty}>No sprints found for this release.</td></tr>
            ) : sprints.map(s => {
              const cell = cells[s.sprint_no] || { value: String(s.test_case_count ?? ""), saving: false, dirty: false };
              return (
                <tr key={s.sprint_no}>
                  <td style={{ color: "#374151", fontWeight: 500 }}>Sprint {s.sprint_no}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        min="0"
                        value={cell.value}
                        onChange={e => handleChange(s.sprint_no, e.target.value)}
                        onBlur={() => handleBlur(s.sprint_no)}
                        onKeyDown={e => handleKeyDown(e, s.sprint_no)}
                        disabled={cell.saving}
                        style={{
                          width: 90, padding: "4px 8px", fontSize: 13,
                          border: cell.dirty ? "1px solid #2563eb" : "1px solid #d1d5db",
                          borderRadius: 4, background: cell.saving ? "#f9fafb" : "#fff",
                          outline: "none",
                        }}
                      />
                      {cell.saving && <span style={{ fontSize: 11, color: "#9ca3af" }}>Saving…</span>}
                      {cell.dirty && !cell.saving && <span style={{ fontSize: 11, color: "#6b7280" }}>Enter or click away to save</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Project Settings Panel ────────────────────────────────────────────────────

function ProjectSettingsPanel({ projectKey, settings, loading, releaseOptions, onSave, onReleaseChange }) {
  const existing = settings ?? null;
  const [releaseName, setReleaseName] = useState("");
  const [sprints, setSprints]         = useState("");
  const [saving, setSaving]           = useState(false);
  const [dirty, setDirty]             = useState(false);

  useEffect(() => {
    // Reset fields when switching to a different project
    setReleaseName("");
    setSprints("");
    setDirty(false);
  }, [projectKey]);

  // Populate once when settings first arrive (fields still blank)
  useEffect(() => {
    if (existing && releaseName === "" && sprints === "") {
      setReleaseName(existing.active_release_name ?? "");
      setSprints(existing.completed_sprints != null ? String(existing.completed_sprints) : "");
    }
  }, [existing]);

  const handleReleaseChange = (e) => {
    setReleaseName(e.target.value);
    setDirty(true);
    onReleaseChange(e.target.value);
  };

  const handleSave = async () => {
    const sprintVal = sprints === "" ? null : parseInt(sprints, 10);
    if (sprints !== "" && isNaN(sprintVal)) return;
    setSaving(true);
    try {
      await onSave(projectKey, releaseName || null, sprintVal, existing !== null);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={tableWrap}>
        <div style={tableHeader}>Project Settings</div>
        <div style={{ padding: "20px 16px", color: "#9ca3af", fontSize: 13 }}>Loading settings…</div>
      </div>
    );
  }

  return (
    <div style={tableWrap}>
      <div style={{ ...tableHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Project Settings</span>
        {existing === null && (
          <span style={{ fontSize: 11, fontWeight: 400, color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 99, padding: "2px 8px" }}>
            Not configured
          </span>
        )}
      </div>
      <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "end" }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 5, color: "#374151" }}>
            Active Release
          </label>
          <select
            value={releaseName}
            onChange={handleReleaseChange}
            style={{ width: "100%", padding: "7px 10px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", fontFamily: "Arial, sans-serif" }}
          >
            <option value="">— Select a release —</option>
            {releaseOptions.map(r => (
              <option key={r.name} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 5, color: "#374151" }}>
            Completed Sprints
          </label>
          <input
            type="number"
            min="0"
            value={sprints}
            onChange={e => { setSprints(e.target.value); setDirty(true); }}
            placeholder="e.g. 4"
            style={{ width: "100%" }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          style={{
            background: dirty ? "#2563eb" : "#e5e7eb",
            color: dirty ? "#fff" : "#9ca3af",
            border: "none", borderRadius: 4,
            padding: "7px 16px", cursor: dirty ? "pointer" : "default",
            fontSize: 13, fontWeight: 600, fontFamily: "Arial, sans-serif",
            transition: "background 0.15s", whiteSpace: "nowrap", height: 36,
          }}
        >
          {saving ? "Saving…" : existing === null ? "Create Settings" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage({
  projects, projectUsers, releases, users,
  loadUsers, loadReleases, createProject, deleteProject,
  addUser, removeUser, createRelease, deleteRelease,
  projectSettings, loadProjectSettings, saveProjectSettings, psLoading,
  sprints, spLoading, spError, loadSprints, updateTestCaseCount, sprintCacheKey,
  showToast,
}) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [modal, setModal]                 = useState(null);
  const [search, setSearch]               = useState("");
  const [memberSearch, setMemberSearch]   = useState("");
  const [releaseSearch, setReleaseSearch] = useState("");
  const [activeRelease, setActiveRelease] = useState("");

  useEffect(() => {
    if (selectedProject) {
      loadUsers(selectedProject.project_key);
      loadReleases(selectedProject.project_key);
      loadProjectSettings(selectedProject.project_key);
      setActiveRelease("");
    }
  }, [selectedProject]);

  // When settings arrive, auto-set active release and load sprints
  const settingsForProject = selectedProject ? projectSettings[selectedProject.project_key] : null;
  useEffect(() => {
    if (settingsForProject?.active_release_name && selectedProject) {
      const rel = settingsForProject.active_release_name;
      setActiveRelease(rel);
      loadSprints(selectedProject.project_key, rel);
    }
  }, [settingsForProject]);

  const openProject = (p) => {
    setSelectedProject(p);
    setMemberSearch("");
    setReleaseSearch("");
  };

  const handleReleaseDropdownChange = (relName) => {
    setActiveRelease(relName);
    if (relName && selectedProject) loadSprints(selectedProject.project_key, relName);
  };

  const handleCreateProject = async (project_key, name) => {
    try { await createProject(project_key, name); setModal(null); showToast("Project created."); }
    catch (e) { showToast(e.message, true); }
  };

  const handleCreateRelease = async (name) => {
    try { await createRelease(selectedProject.project_key, name); setModal(null); showToast("Release created."); }
    catch (e) { showToast(e.message, true); }
  };

  const handleAddUser = async (username) => {
    try { await addUser(selectedProject.project_key, username); setModal(null); showToast("User added."); }
    catch (e) { showToast(e.message, true); }
  };

  const handleRemoveUser = async (username) => {
    try { await removeUser(selectedProject.project_key, username); showToast("User removed."); }
    catch (e) { showToast(e.message, true); }
  };

  const handleDeleteProject = async (project_key) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try { await deleteProject(project_key); setSelectedProject(null); showToast("Project deleted."); }
    catch (e) { showToast(e.message, true); }
  };

  const handleDeleteRelease = async (release_id) => {
    if (!window.confirm("Delete this release? This cannot be undone.")) return;
    try { await deleteRelease(selectedProject.project_key, release_id); showToast("Release deleted."); }
    catch (e) { showToast(e.message, true); }
  };

  const handleSaveSettings = async (project_key, active_release_name, completed_sprints, exists) => {
    try { await saveProjectSettings(project_key, active_release_name, completed_sprints, exists); showToast("Settings saved."); }
    catch (e) { showToast(e.message, true); }
  };

  const allMembers = selectedProject ? (projectUsers[selectedProject.project_key] || []) : [];
  const allRels    = selectedProject ? (releases[selectedProject.project_key] || []) : [];
  const available  = users.filter(u => !allMembers.find(m => m.id === u.id));

  const filteredProjects = projects.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.project_key.toLowerCase().includes(q);
  });
  const filteredMembers = allMembers.filter(u => {
    const mq = memberSearch.toLowerCase();
    return u.username.toLowerCase().includes(mq) || u.role.toLowerCase().includes(mq);
  });
  const filteredRels = allRels.filter(r => r.name.toLowerCase().includes(releaseSearch.toLowerCase()));

  const spKey      = selectedProject && activeRelease ? sprintCacheKey(selectedProject.project_key, activeRelease) : null;
  const sprintData = spKey ? (sprints[spKey] || null) : null;
  const sprintLoad = spKey ? !!spLoading[spKey] : false;
  const sprintErr  = spKey ? (spError[spKey] || null) : null;

  return (
    <>
      {!selectedProject ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Projects</h2>
            <button onClick={() => setModal("createProject")} style={btnStyle}>+ New Project</button>
          </div>

          <input
            type="text"
            placeholder="Search by name or project key..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 14, width: 300 }}
          />

          <div style={tableWrap}>
            <table>
              <thead><tr><th>Project Key</th><th>Name</th><th></th></tr></thead>
              <tbody>
                {filteredProjects.length === 0
                  ? <tr><td colSpan={3} style={empty}>{projects.length === 0 ? "No projects found." : "No results match your search."}</td></tr>
                  : filteredProjects.map(p => (
                    <tr key={p.project_key}>
                      <td style={{ fontFamily: "monospace", color: "#6b7280" }}>{p.project_key}</td>
                      <td><button className="link" onClick={() => openProject(p)}>{p.name}</button></td>
                      <td style={{ display: "flex", gap: 12 }}>
                        <button className="link" onClick={() => openProject(p)}>View</button>
                        <button className="link-red" onClick={() => handleDeleteProject(p.project_key)}>Delete</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <button className="link" onClick={() => setSelectedProject(null)}>← Back to Projects</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              {selectedProject.name}{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 400, color: "#6b7280", fontSize: 13 }}>({selectedProject.project_key})</span>
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setModal("addUser")} style={ghostBtnStyle}>+ Add User</button>
              <button onClick={() => setModal("createRelease")} style={btnStyle}>+ New Release</button>
              <button onClick={() => handleDeleteProject(selectedProject.project_key)} style={dangerBtnStyle}>Delete Project</button>
            </div>
          </div>

          {/* Members + Releases */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={tableWrap}>
              <div style={{ ...tableHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Members</span>
                <input type="text" placeholder="Search members..." value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)} style={{ width: 180, padding: "4px 8px", fontSize: 13 }} />
              </div>
              <table>
                <thead><tr><th>Username</th><th>Role</th><th>Active</th><th></th></tr></thead>
                <tbody>
                  {filteredMembers.length === 0
                    ? <tr><td colSpan={4} style={empty}>{allMembers.length === 0 ? "No members yet." : "No results match your search."}</td></tr>
                    : filteredMembers.map(u => (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td style={{ color: "#6b7280" }}>{u.role}</td>
                        <td style={{ color: u.is_active ? "#16a34a" : "#6b7280" }}>{u.is_active ? "Yes" : "No"}</td>
                        <td><button className="link-red" onClick={() => handleRemoveUser(u.username)}>Remove</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div style={tableWrap}>
              <div style={{ ...tableHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Releases</span>
                <input type="text" placeholder="Search releases..." value={releaseSearch}
                  onChange={e => setReleaseSearch(e.target.value)} style={{ width: 180, padding: "4px 8px", fontSize: 13 }} />
              </div>
              <table>
                <thead><tr><th>Name</th><th>Created</th><th></th></tr></thead>
                <tbody>
                  {filteredRels.length === 0
                    ? <tr><td colSpan={3} style={empty}>{allRels.length === 0 ? "No releases yet." : "No results match your search."}</td></tr>
                    : filteredRels.map(r => (
                      <tr key={r.id}>
                        <td style={{ color: "#2563eb" }}>{r.name}</td>
                        <td style={{ color: "#6b7280" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                        <td><button className="link-red" onClick={() => handleDeleteRelease(r.id)}>Delete</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Settings */}
          <div style={{ marginBottom: 20 }}>
            <ProjectSettingsPanel
              projectKey={selectedProject.project_key}
              settings={projectSettings[selectedProject.project_key]}
              loading={!!psLoading[selectedProject.project_key]}
              releaseOptions={allRels}
              onSave={handleSaveSettings}
              onReleaseChange={handleReleaseDropdownChange}
            />
          </div>

          {/* Sprint Table */}
          {activeRelease && (
            <SprintTable
              projectKey={selectedProject.project_key}
              release={activeRelease}
              sprints={sprintData}
              loading={sprintLoad}
              error={sprintErr}
              onUpdate={updateTestCaseCount}
              showToast={showToast}
            />
          )}
        </>
      )}

      {modal === "createProject" && <CreateProjectModal onSubmit={handleCreateProject} onClose={() => setModal(null)} />}
      {modal === "createRelease" && <CreateReleaseModal project={selectedProject} onSubmit={handleCreateRelease} onClose={() => setModal(null)} />}
      {modal === "addUser"       && <AddUserModal project={selectedProject} availableUsers={available} onSubmit={handleAddUser} onClose={() => setModal(null)} />}
    </>
  );
}

const btnStyle       = { background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontFamily: "Arial, sans-serif" };
const dangerBtnStyle = { background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontFamily: "Arial, sans-serif" };
const ghostBtnStyle  = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontFamily: "Arial, sans-serif" };
const tableWrap      = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden" };
const tableHeader    = { padding: "9px 12px", borderBottom: "1px solid #d1d5db", fontWeight: 600, background: "#f9fafb", fontSize: 14 };
const empty          = { color: "#9ca3af" };