const API_BASE = "http://localhost:8000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorBody = await response.clone().json();
      if (errorBody?.detail) {
        message = errorBody.detail;
      }
    } catch {
      // Ignore parse failures and fall back to status-based message.
    }
    throw new Error(message);
  }

  return response;
}

async function readJson(path, options = {}) {
  const response = await request(path, options);
  return response.json();
}

async function readBlob(path, options = {}) {
  const response = await request(path, options);
  return response.blob();
}

export function fetchLatestReading() {
  return readJson("/monitoring/latest/");
}

export function fetchReadings(limit = 20) {
  return readJson(`/monitoring/readings/?limit=${limit}`);
}

export function fetchAlerts() {
  return readJson("/alerts/");
}

export function acknowledgeAlert(alertId, payload = {}) {
  return readJson(`/alerts/${alertId}/acknowledge/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reviewAlert(alertId) {
  return readJson(`/alerts/${alertId}/review/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function ingestReading(payload) {
  return readJson("/ingest/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchPatients() {
  return readJson("/monitoring/patients/");
}

export function fetchPatientDetail(patientId) {
  return readJson(`/monitoring/patients/${patientId}/`);
}

export function createPatient(payload) {
  return readJson("/monitoring/patients/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchDevices() {
  return readJson("/monitoring/devices/");
}

export function createDevice(payload) {
  return readJson("/monitoring/devices/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchHistory(limit = 50) {
  return readJson(`/monitoring/history/?limit=${limit}`);
}

export function fetchSessions(params = {}) {
  const search = new URLSearchParams(params);
  const query = search.toString();
  return readJson(`/monitoring/sessions/${query ? `?${query}` : ""}`);
}

export function startSession(payload) {
  return readJson("/monitoring/sessions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function stopSession(sessionId) {
  return readJson(`/monitoring/sessions/${sessionId}/stop/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function fetchSystemStatus() {
  return readJson("/monitoring/status/");
}

export function fetchSettings() {
  return readJson("/monitoring/settings/");
}

export function updateSettings(payload) {
  return readJson("/monitoring/settings/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchExportCatalog() {
  return readJson("/monitoring/exports/");
}

export function downloadExport(kind) {
  return readBlob(`/monitoring/exports/${kind}/`);
}

export function fetchCurrentUser() {
  return readJson("/auth/me/");
}

export function loginUser(payload) {
  return readJson("/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload) {
  return readJson("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser() {
  return readJson("/auth/logout/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
