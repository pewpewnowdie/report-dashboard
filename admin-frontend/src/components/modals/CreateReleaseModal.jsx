import React, { useState } from "react";
import { ModalShell, Field, ModalActions } from "./ModalPrimitives";

export default function CreateReleaseModal({ project, onSubmit, onClose }) {
  const [name, setName] = useState("");

  return (
    <ModalShell title={`New Release — ${project?.name}`} onClose={onClose}>
      <Field label="Release Name">
        <input
          placeholder="e.g. v2.3.0"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </Field>
      <ModalActions onClose={onClose} onSubmit={() => name && onSubmit(name)} submitLabel="Create" />
    </ModalShell>
  );
}
