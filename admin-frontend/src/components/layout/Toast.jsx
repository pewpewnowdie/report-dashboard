import React from "react";

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20,
      background: toast.isError ? "#dc2626" : "#1e3a5f",
      color: "#fff", padding: "9px 16px", borderRadius: 4,
      fontSize: 13, zIndex: 200,
      fontFamily: "Arial, sans-serif",
    }}>
      {toast.msg}
    </div>
  );
}
