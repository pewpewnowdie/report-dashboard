import React from "react";

export default function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fca5a5",
      color: "#dc2626", padding: "10px 14px", borderRadius: 4, marginBottom: 16,
      fontFamily: "Arial, sans-serif", fontSize: 14,
    }}>
      Error: {error}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginLeft: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 14 }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
