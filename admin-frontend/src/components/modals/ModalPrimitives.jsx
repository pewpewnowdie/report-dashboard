import React from "react";

export function ModalShell({ title, onClose, children }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 6, padding: 24, width: 420, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}
      >
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14 }}>{label}</label>
      {children}
    </div>
  );
}

export function ModalActions({ onClose, onSubmit, submitLabel = "Submit" }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
      <button
        onClick={onClose}
        style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontFamily: "Arial, sans-serif" }}
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontFamily: "Arial, sans-serif" }}
      >
        {submitLabel}
      </button>
    </div>
  );
}
