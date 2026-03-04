import React from "react";

const TABS = [
  ["projects", "Projects"],
  ["users", "Users"],
  ["releases", "Releases"],
];

export default function Navbar({ view, onNavigate, loading, onLogout }) {
  return (
    <div style={{ background: "#1e3a5f", padding: "0 24px", display: "flex", alignItems: "center" }}>
      <span style={{ color: "#fff", fontWeight: "bold", fontSize: 16, marginRight: 32, padding: "14px 0" }}>
        Admin Panel
      </span>

      {TABS.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          style={{
            background: view === id ? "#2563eb" : "transparent",
            color: "#fff", border: "none", padding: "14px 18px",
            fontWeight: view === id ? 600 : 400,
            cursor: "pointer", fontFamily: "Arial, sans-serif", fontSize: 14,
          }}
        >
          {label}
        </button>
      ))}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        {loading && <span style={{ color: "#93c5fd", fontSize: 13 }}>Loading...</span>}
        <button
          onClick={onLogout}
          style={{
            background: "transparent", color: "#93c5fd", border: "1px solid #2d5a8e",
            borderRadius: 4, padding: "6px 14px", cursor: "pointer",
            fontFamily: "Arial, sans-serif", fontSize: 13,
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
