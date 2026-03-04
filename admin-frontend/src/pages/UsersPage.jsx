import React, { useState } from "react";

export default function UsersPage({ users, projects, projectUsers, loadProjectUsers, removeUser, showToast }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch]             = useState("");
  const [projectSearch, setProjectSearch] = useState("");

  const openUserDetail = async (u) => {
    setSelectedUser(u);
    setProjectSearch("");
    for (const p of projects) {
      if (!projectUsers[p.project_key]) {
        try { await loadProjectUsers(p.project_key); } catch (_) {}
      }
    }
  };

  const getUserProjects = (username) =>
    projects.filter(p => (projectUsers[p.project_key] || []).find(u => u.username === username));

  const handleRemove = async (username, project_key) => {
    try { await removeUser(project_key, username); showToast("User removed."); }
    catch (e) { showToast(e.message, true); }
  };

  const q = search.toLowerCase();
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  );

  const allUserProjects = selectedUser ? getUserProjects(selectedUser.username) : [];
  const pq = projectSearch.toLowerCase();
  const filteredUserProjects = allUserProjects.filter(p =>
    p.name.toLowerCase().includes(pq) ||
    p.project_key.toLowerCase().includes(pq)
  );

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
      <div style={{ color: "#6b7280", marginBottom: 18 }}>Role: {selectedUser.role} · Active: {selectedUser.is_active ? "Yes" : "No"}</div>

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
              ? <tr><td colSpan={3} style={empty}>{allUserProjects.length === 0 ? "Not assigned to any projects." : "No results match your search."}</td></tr>
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
  );
}

const tableWrap = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden" };
const empty     = { color: "#9ca3af" };
