import React, { useState, useEffect } from "react";
import CreateProjectModal from "../components/modals/CreateProjectModal";
import CreateReleaseModal from "../components/modals/CreateReleaseModal";
import AddUserModal from "../components/modals/AddUserModal";

export default function ProjectsPage({ projects, projectUsers, releases, users, loadUsers, loadReleases, createProject, addUser, removeUser, createRelease, showToast }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [modal, setModal]           = useState(null);
  const [search, setSearch]         = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [releaseSearch, setReleaseSearch] = useState("");

  useEffect(() => {
    if (selectedProject) {
      loadUsers(selectedProject.project_key);
      loadReleases(selectedProject.project_key);
    }
  }, [selectedProject]);

  // Reset detail searches when switching project
  const openProject = (p) => {
    setSelectedProject(p);
    setMemberSearch("");
    setReleaseSearch("");
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

  const allMembers  = selectedProject ? (projectUsers[selectedProject.project_key] || []) : [];
  const allRels     = selectedProject ? (releases[selectedProject.project_key] || []) : [];
  const available   = users.filter(u => !allMembers.find(m => m.id === u.id));

  const q = search.toLowerCase();
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.project_key.toLowerCase().includes(q)
  );

  const mq = memberSearch.toLowerCase();
  const filteredMembers = allMembers.filter(u =>
    u.username.toLowerCase().includes(mq) ||
    u.role.toLowerCase().includes(mq)
  );

  const rq = releaseSearch.toLowerCase();
  const filteredRels = allRels.filter(r => r.name.toLowerCase().includes(rq));

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
                      <td><button className="link" onClick={() => openProject(p)}>View</button></td>
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
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Members */}
            <div style={tableWrap}>
              <div style={{ ...tableHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Members</span>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  style={{ width: 180, padding: "4px 8px", fontSize: 13 }}
                />
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

            {/* Releases */}
            <div style={tableWrap}>
              <div style={{ ...tableHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Releases</span>
                <input
                  type="text"
                  placeholder="Search releases..."
                  value={releaseSearch}
                  onChange={e => setReleaseSearch(e.target.value)}
                  style={{ width: 180, padding: "4px 8px", fontSize: 13 }}
                />
              </div>
              <table>
                <thead><tr><th>Name</th><th>Created</th></tr></thead>
                <tbody>
                  {filteredRels.length === 0
                    ? <tr><td colSpan={2} style={empty}>{allRels.length === 0 ? "No releases yet." : "No results match your search."}</td></tr>
                    : filteredRels.map(r => (
                      <tr key={r.id}>
                        <td style={{ color: "#2563eb" }}>{r.name}</td>
                        <td style={{ color: "#6b7280" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modal === "createProject" && <CreateProjectModal onSubmit={handleCreateProject} onClose={() => setModal(null)} />}
      {modal === "createRelease" && <CreateReleaseModal project={selectedProject} onSubmit={handleCreateRelease} onClose={() => setModal(null)} />}
      {modal === "addUser"       && <AddUserModal project={selectedProject} availableUsers={available} onSubmit={handleAddUser} onClose={() => setModal(null)} />}
    </>
  );
}

const btnStyle      = { background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontFamily: "Arial, sans-serif" };
const ghostBtnStyle = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontFamily: "Arial, sans-serif" };
const tableWrap     = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden" };
const tableHeader   = { padding: "9px 12px", borderBottom: "1px solid #d1d5db", fontWeight: 600, background: "#f9fafb", fontSize: 14 };
const empty         = { color: "#9ca3af" };
