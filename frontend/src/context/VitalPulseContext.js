import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchAlerts, fetchLatestReading, ingestReading } from "../services/api";
import { getRiskLabel, getStaleState } from "../utils/formatters";

const VitalPulseContext = createContext(null);

function normalizeAlert(alert, index = 0) {
  return {
    id: alert.id || alert._id || `alert-${index + 1}`,
    patientId: alert.patient_id || alert.patientId || null,
    deviceId: alert.device_id || alert.deviceId || alert.vital_id || null,
    type: alert.type || "Anomaly",
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
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [lastSync, setLastSync] = useState(null);

  async function loadLatest() {
    try {
      const latest = await fetchLatestReading();
      setLatestReading(latest);
      setErrors((current) => ({ ...current, latest: null }));
      setLastSync(new Date().toISOString());
      setTrendSamples((current) => {
        if (!latest?.timestamp) return current;
        if (current[0]?.timestamp === latest.timestamp) return current;
        return [latest, ...current].slice(0, 24);
      });
    } catch (error) {
      setErrors((current) => ({ ...current, latest: error.message }));
    }
  }

  async function loadAlerts() {
    try {
      const response = await fetchAlerts();
      const nextAlerts = Array.isArray(response?.alerts)
        ? response.alerts.map(normalizeAlert)
        : [];
      setAlerts(nextAlerts);
      setErrors((current) => ({ ...current, alerts: null }));
    } catch (error) {
      setErrors((current) => ({ ...current, alerts: error.message }));
    }
  }

  async function submitManualReading(payload) {
    const result = await ingestReading(payload);
    await loadLatest();
    return result;
  }

  useEffect(() => {
    let active = true;

    async function boot() {
      setLoading(true);
      await Promise.allSettled([loadLatest(), loadAlerts()]);
      if (active) setLoading(false);
    }

    boot();
    const latestTimer = setInterval(loadLatest, 15000);
    const alertTimer = setInterval(loadAlerts, 30000);
    return () => {
      active = false;
      clearInterval(latestTimer);
      clearInterval(alertTimer);
    };
  }, []);

  const value = useMemo(() => {
    const liveDeviceId = latestReading?.device_id || null;
    const observedDevices = liveDeviceId ? [liveDeviceId] : [];
    const staleState = getStaleState(latestReading?.timestamp);
    const riskLabel = getRiskLabel(latestReading);
    return {
      latestReading,
      trendSamples,
      alerts,
      loading,
      errors,
      lastSync,
      submitManualReading,
      refreshAll: async () => {
        await Promise.allSettled([loadLatest(), loadAlerts()]);
      },
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
  }, [alerts, errors, lastSync, latestReading, loading, trendSamples]);

  return (
    <VitalPulseContext.Provider value={value}>
      {children}
    </VitalPulseContext.Provider>
  );
}

export function useVitalPulse() {
  const context = useContext(VitalPulseContext);
  if (!context) {
    throw new Error("useVitalPulse must be used inside VitalPulseProvider");
  }
  return context;
}
