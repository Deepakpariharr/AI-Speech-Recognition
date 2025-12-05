import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function CreateTaskModal({ visible, onClose, onCreate, initialValues = {} }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "To Do",
    dueDate: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm({
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      priority: initialValues?.priority || "Medium",
      status: initialValues?.status || "To Do",
      dueDate: (() => {
        const d = initialValues?.dueDate;
        if (!d) return "";
        try {
          const parsed = new Date(d);
          if (!isNaN(parsed)) return parsed.toISOString().slice(0,10);
        } catch {}
        return String(d).slice(0,10);
      })(),
    });
  }, [visible, initialValues]);

  if (!visible) return null;

  const setKey = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.title || !form.title.trim()) {
      return alert("Please provide a title");
    }
    const payload = {
      title: form.title.trim(),
      description: form.description || "",
      priority: form.priority || "Medium",
      status: form.status || "To Do",
      dueDate: form.dueDate || null,
    };

    try {
      setSaving(true);
      const res = onCreate && onCreate(payload);
      if (res && typeof res.then === "function") await res;
      onClose && onClose();
    } catch (e) {
      console.error("create failed", e);
      alert("Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal modern-modal" style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Create Task</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20 }}>✕</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Title *</label>
          <input value={form.title} onChange={setKey("title")} placeholder="Task title" />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Description</label>
          <textarea value={form.description} onChange={setKey("description")} rows={4} />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Priority</label>
            <select value={form.priority} onChange={setKey("priority")}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label>Status</label>
            <select value={form.status} onChange={setKey("status")}>
              <option>To Do</option><option>In Progress</option><option>Done</option>
            </select>
          </div>

          <div style={{ width: 180 }}>
            <label>Due date</label>
            <input type="date" value={form.dueDate} onChange={setKey("dueDate")} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create Task"}</button>
        </div>
      </div>
    </div>
  );
}

CreateTaskModal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  onCreate: PropTypes.func,
  initialValues: PropTypes.object
};
