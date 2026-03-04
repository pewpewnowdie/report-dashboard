import React, { useState } from "react";

export default function LoginPage({ onLogin, loading, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) onLogin(username, password);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f3f4f6",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{
        background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
        padding: 32, width: 340, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: "#1e3a5f", color: "#fff", fontWeight: "bold",
            fontSize: 15, padding: "8px 14px", borderRadius: 4,
            display: "inline-block", marginBottom: 14,
          }}>
            Admin Panel
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Sign in</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Admin credentials required</div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5",
            color: "#dc2626", padding: "9px 12px", borderRadius: 4,
            fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 5, fontSize: 13 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              style={{
                width: "100%", border: "1px solid #d1d5db", borderRadius: 4,
                padding: "8px 10px", fontSize: 14, outline: "none",
                fontFamily: "Arial, sans-serif", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#d1d5db"}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 5, fontSize: 13 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: "100%", border: "1px solid #d1d5db", borderRadius: 4,
                padding: "8px 10px", fontSize: 14, outline: "none",
                fontFamily: "Arial, sans-serif", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#d1d5db"}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: "100%", background: loading ? "#93c5fd" : "#2563eb",
              color: "#fff", border: "none", borderRadius: 4,
              padding: "9px 0", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
