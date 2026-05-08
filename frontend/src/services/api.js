const API_BASE = "http://localhost:8000/api";

async function readJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export function fetchLatestReading() {
  return readJson("/monitoring/latest/");
}

export function fetchAlerts() {
  return readJson("/alerts/");
}

export function ingestReading(payload) {
  return readJson("/ingest/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
