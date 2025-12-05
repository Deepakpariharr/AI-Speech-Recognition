import axios from 'axios';
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
async function handleRes(res) {
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch(e) { json = text; }
  if (!res.ok) {
    // throw an Error with info so UI can show it
    const err = new Error("API error: " + (json?.error || res.statusText || res.status));
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks`);
  const data = await handleRes(res);
  // support multiple shapes
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.tasks)) return data.tasks;
  // defensive: if object found, try to extract array values
  if (data && typeof data === "object") {
    // maybe server returned { success:true } — return []
    return [];
  }
  return [];
}

export async function parseTranscript(text) {
  const res = await fetch(`${API_BASE}/tasks/parse/transcript`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: text })
  });
  return handleRes(res);
}

export async function createTask(data) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return handleRes(res);
}

export async function updateTask(id, data) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return handleRes(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
  return handleRes(res);
}