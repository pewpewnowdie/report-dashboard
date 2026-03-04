import React, { useEffect, useState } from "react";

export default function ReleasesPage({ projects, releases, loadForAll }) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (projects.length) loadForAll(projects);
  }, [projects]);

  const q = search.toLowerCase();

  // Keep a project if its name/key matches OR any of its releases match
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.project_key.toLowerCase().includes(q) ||
    (releases[p.project_key] || []).some(r => r.name.toLowerCase().includes(q))
  );

  // Within each project, also filter the releases themselves
  const filteredReleases = (project_key) =>
    (releases[project_key] || []).filter(r => {
      // If the project itself matched by name/key, show all its releases
      const p = projects.find(p => p.project_key === project_key);
      const projectMatches =
        p.name.toLowerCase().includes(q) ||
        p.project_key.toLowerCase().includes(q);
      return projectMatches || r.name.toLowerCase().includes(q);
    });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>All Releases</h2>
        <input
          type="text"
          placeholder="Search by project or release name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      {filteredProjects.length === 0 && (
        <div style={{ color: "#9ca3af" }}>No results match your search.</div>
      )}

      {filteredProjects.map(p => (
        <div key={p.project_key} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {p.name}{" "}
            <span style={{ fontFamily: "monospace", fontWeight: 400, color: "#6b7280", fontSize: 12 }}>({p.project_key})</span>
          </div>
          <div style={tableWrap}>
            <table>
              <thead><tr><th>Release Name</th><th>Created</th></tr></thead>
              <tbody>
                {filteredReleases(p.project_key).length === 0
                  ? <tr><td colSpan={2} style={empty}>No releases.</td></tr>
                  : filteredReleases(p.project_key).map(r => (
                    <tr key={r.id}>
                      <td style={{ color: "#2563eb" }}>{r.name}</td>
                      <td style={{ color: "#6b7280" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}

const tableWrap = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden" };
const empty     = { color: "#9ca3af" };
