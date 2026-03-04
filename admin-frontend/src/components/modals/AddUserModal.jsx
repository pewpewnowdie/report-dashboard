import React, { useState } from "react";
import { ModalShell, Field, ModalActions } from "./ModalPrimitives";

export default function AddUserModal({ project, availableUsers, onSubmit, onClose }) {
  const [username, setUsername] = useState("");

  return (
    <ModalShell title={`Add User — ${project?.name}`} onClose={onClose}>
      <Field label="User">
        <select value={username} onChange={e => setUsername(e.target.value)}>
          <option value="">Select a user...</option>
          {availableUsers.map(u => (
            <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
          ))}
        </select>
        {availableUsers.length === 0 && (
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>All users are already members.</div>
        )}
      </Field>
      <ModalActions onClose={onClose} onSubmit={() => username && onSubmit(username)} submitLabel="Add" />
    </ModalShell>
  );
}
