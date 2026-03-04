import React, { useState } from "react";
import { ModalShell, Field, ModalActions } from "./ModalPrimitives";

export default function CreateProjectModal({ onSubmit, onClose }) {
  const [form, setForm] = useState({ project_key: "", name: "" });

  const handleSubmit = () => {
    if (!form.project_key || !form.name) return;
    onSubmit(form.project_key, form.name);
  };

  return (
    <ModalShell title="New Project" onClose={onClose}>
      <Field label="Project Key">
        <input
          placeholder="e.g. PROJ_ALPHA"
          value={form.project_key}
          onChange={e => setForm(f => ({ ...f, project_key: e.target.value }))}
        />
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Unique identifier, no spaces.</div>
      </Field>
      <Field label="Name">
        <input
          placeholder="Project display name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
      </Field>
      <ModalActions onClose={onClose} onSubmit={handleSubmit} submitLabel="Create" />
    </ModalShell>
  );
}
