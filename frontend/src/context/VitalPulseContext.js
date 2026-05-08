import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  acknowledgeAlert,
  createDevice,
  createPatient,
  downloadExport,
  fetchAlerts,
  fetchCurrentUser,
  fetchDevices,
  fetchExportCatalog,
  fetchHistory,
  fetchLatestReading,
  fetchPatientDetail,
  fetchPatients,
  fetchReadings,
  fetchSessions,
  fetchSettings,
  fetchSystemStatus,
  ingestReading,
  loginUser,
  logoutUser,
  registerUser,
  reviewAlert,
  startSession,
  stopSession,
  updateSettings,
} from "../services/api";
import { getRiskLabel, getStaleState } from "../utils/formatters";

const VitalPulseContext = createContext(null);

function normalizeAlert(alert, index = 0) {
  return {
    id: alert.id || alert._id || `alert-${index + 1}`,
    patientId: alert.patient_id || alert.patientId || null,
    deviceId: alert.device_id || alert.deviceId || alert.vital_id || null,
    type: alert.type || alert.alert_type || "Anomaly",
    severity: alert.severity || "Pending",
    reason: alert.reason || "No alert reason supplied by backend",
    status: alert.acknowledged ? "Acknowledged" : alert.status || "Open",
    triggeredAt: alert.created_at || alert.timestamp || null,
    mlReason: alert.ml_reason || null,
    raw: alert,
  };
}

export function VitalPulseProvider({ children }) {
  const [latestReading, setLatestReading] = useState(null);
  const [trendSamples, setTrendSamples] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [exportCatalog, setExportCatalog] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [lastSync, setLastSync] = useState(null);

  function setError(key, error) {
    setErrors((current) => ({ ...current, [key]: error ? error.message : null }));
  }

  async function loadLatest() {
    try {
      const latest = await fetchLatestReading();
      setLatestReading(latest?.timestamp ? latest : null);
      setError("latest", null);
      setLastSync(new Date().toISOString());
    } catch (error) {
      setError("latest", error);
    }
  }

  async function loadReadings() {
    try {
      const response = await fetchReadings(24);
      const readings = Array.isArray(response?.readings) ? response.readings : [];
      setTrendSamples(readings);
      setError("readings", null);
    } catch (error) {
      setError("readings", error);
    }
  }

  async function loadAlerts() {
    try {
      const response = await fetchAlerts();
      setAlerts(Array.isArray(response?.alerts) ? response.alerts.map(normalizeAlert) : []);
      setError("alerts", null);
    } catch (error) {
      setError("alerts", error);
    }
  }

  async function loadPatients() {
    try {
      const response = await fetchPatients();
      setPatients(Array.isArray(response?.patients) ? response.patients : []);
      setError("patients", null);
    } catch (error) {
      setError("patients", error);
    }
  }

  async function loadDevices() {
    try {
      const response = await fetchDevices();
      setDevices(Array.isArray(response?.devices) ? response.devices : []);
      setError("devices", null);
    } catch (error) {
      setError("devices", error);
    }
  }

  async function loadHistory() {
    try {
      const response = await fetchHistory();
      setHistory(Array.isArray(response?.history) ? response.history : []);
      setError("history", null);
    } catch (error) {
      setError("history", error);
    }
  }

  async function loadSettings() {
    try {
      const response = await fetchSettings();
      setSettings(response);
      setError("settings", null);
    } catch (error) {
      setError("settings", error);
    }
  }

  async function loadSystemStatus() {
    try {
      const response = await fetchSystemStatus();
      setSystemStatus(response);
      setError("status", null);
    } catch (error) {
      setError("status", error);
    }
  }

  async function loadExportCatalog() {
    try {
      const response = await fetchExportCatalog();
      setExportCatalog(Array.isArray(response?.exports) ? response.exports : []);
      setError("exports", null);
    } catch (error) {
      setError("exports", error);
    }
  }

  async function loadSessions() {
    try {
      const response = await fetchSessions();
      setSessions(Array.isArray(response?.sessions) ? response.sessions : []);
      setError("sessions", null);
    } catch (error) {
      setError("sessions", error);
    }
  }

  async function loadCurrentUser() {
    try {
      const response = await fetchCurrentUser();
      setCurrentUser(response?.user || null);
      setError("auth", null);
    } catch (error) {
      if (error.message === "Authentication required.") {
        setCurrentUser(null);
        setError("auth", null);
        return;
      }
      setError("auth", error);
    }
  }

  async function refreshAll() {
    await Promise.allSettled([
      loadLatest(),
      loadReadings(),
      loadAlerts(),
      loadPatients(),
      loadDevices(),
      loadHistory(),
      loadSettings(),
      loadSystemStatus(),
      loadExportCatalog(),
      loadSessions(),
      loadCurrentUser(),
    ]);
  }

  async function submitManualReading(payload) {
    const result = await ingestReading(payload);
    await refreshAll();
    return result;
  }

  async function submitPatient(payload) {
    const result = await createPatient(payload);
    await loadPatients();
    return result;
  }

  async function submitDevice(payload) {
    const result = await createDevice(payload);
    await loadDevices();
    return result;
  }

  async function beginSession(payload) {
    const result = await startSession(payload);
    await Promise.allSettled([loadSessions(), loadPatients()]);
    return result;
  }

  async function endSession(sessionId) {
    const result = await stopSession(sessionId);
    await Promise.allSettled([loadSessions(), loadPatients()]);
    return result;
  }

  async function acknowledge(alertId, acknowledgedBy) {
    const result = await acknowledgeAlert(alertId, { acknowledged_by: acknowledgedBy });
    await Promise.allSettled([loadAlerts(), loadHistory()]);
    return result;
  }

  async function markReviewed(alertId) {
    const result = await reviewAlert(alertId);
    await Promise.allSettled([loadAlerts(), loadHistory()]);
    return result;
  }

  async function saveSettings(payload) {
    const result = await updateSettings(payload);
    await Promise.allSettled([loadSettings(), loadSystemStatus()]);
    return result;
  }

  async function exportCsv(kind, filename) {
    const blob = await downloadExport(kind);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function getPatientDetail(patientId) {
    return fetchPatientDetail(patientId);
  }

  async function signOut() {
    const result = await logoutUser();
    setCurrentUser(null);
    setError("auth", null);
    return result;
  }

  async function signIn(payload) {
    const result = await loginUser(payload);
    setCurrentUser(result?.user || null);
    setError("auth", null);
    return result;
  }

  async function signUp(payload) {
    const result = await registerUser(payload);
    setError("auth", null);
    return result;
  }

  useEffect(() => {
    let active = true;
    async function boot() {
      setLoading(true);
      await refreshAll();
      if (active) setLoading(false);
    }
    boot();
    const timer = setInterval(() => {
      refreshAll();
    }, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const value = useMemo(() => {
    const liveDeviceId = latestReading?.device_id || null;
    const observedDevices = devices.length
      ? devices.map((device) => device.device_id)
      : liveDeviceId
        ? [liveDeviceId]
        : [];
    const staleState = devices.length
      ? devices.find((device) => device.device_id === liveDeviceId)?.status || getStaleState(latestReading?.timestamp)
      : getStaleState(latestReading?.timestamp);
    const riskLabel = getRiskLabel(latestReading);

    return {
      latestReading,
      trendSamples,
      alerts,
      patients,
      devices,
      history,
      sessions,
      settings,
      systemStatus,
      exportCatalog,
      currentUser,
      loading,
      errors,
      lastSync,
      refreshAll,
      submitManualReading,
      submitPatient,
      submitDevice,
      beginSession,
      endSession,
      acknowledge,
      markReviewed,
      saveSettings,
      exportCsv,
      getPatientDetail,
      signIn,
      signUp,
      signOut,
      derived: {
        liveDeviceId,
        observedDevices,
        deviceState: staleState,
        riskLabel,
        mlAvailable:
          latestReading?.anomaly_score !== null &&
          latestReading?.anomaly_score !== undefined,
      },
    };
  }, [
    alerts,
    devices,
    errors,
    exportCatalog,
    currentUser,
    history,
    lastSync,
    latestReading,
    loading,
    patients,
    sessions,
    settings,
    systemStatus,
    trendSamples,
  ]);

  return <VitalPulseContext.Provider value={value}>{children}</VitalPulseContext.Provider>;
}

export function useVitalPulse() {
  const context = useContext(VitalPulseContext);
  if (!context) {
    throw new Error("useVitalPulse must be used inside VitalPulseProvider");
  }
  return context;
}
