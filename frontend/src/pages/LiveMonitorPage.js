import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import AlertCard from "../components/AlertCard";
import CollapsibleSection from "../components/CollapsibleSection";
import EmptyState from "../components/EmptyState";
import { FormField } from "../components/FormField";
import InsightPanel from "../components/InsightPanel";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SectionCard from "../components/SectionCard";
import TrendChartCard from "../components/TrendChartCard";
import { useVitalPulse } from "../context/VitalPulseContext";
import {
  formatDateTime,
  formatMetric,
  formatRelativeTime,
} from "../utils/formatters";

const initialForm = {
  patient_id: "",
  device_id: "",
  heart_rate: "",
  temperature: "",
  spo2: "",
  anomaly_score: "",
  status: "normal",
  timestamp: "",
};

function readingState(latestReading, derived) {
  if (!latestReading) return "Waiting for live data";
  if (derived.deviceState === "Stale") return "Device offline";
  return "Realtime telemetry active";
}

export default function LiveMonitorPage() {
  const {
    latestReading,
    trendSamples,
    alerts,
    submitManualReading,
    derived,
    patients,
    devices,
    sessions,
    beginSession,
    endSession,
  } = useVitalPulse();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [sessionBusy, setSessionBusy] = useState(false);

  const activeSession = useMemo(() => {
    return sessions.find((session) => session.status === "active") || null;
  }, [sessions]);

  const selectedPatientRecord = patients.find((patient) => patient.patient_id === selectedPatient) || null;
  const selectedDeviceRecord = devices.find((device) => device.device_id === selectedDevice) || null;
  const filteredAlerts = alerts.filter((alert) => {
    if (!selectedPatient && !selectedDevice) return true;
    return (
      (!selectedPatient || alert.patientId === selectedPatient) &&
      (!selectedDevice || alert.deviceId === selectedDevice)
    );
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage("");
    try {
      await submitManualReading({
        patient_id: form.patient_id || selectedPatient || undefined,
        device_id: form.device_id,
        heart_rate: Number(form.heart_rate),
        spo2: Number(form.spo2),
        temperature: Number(form.temperature),
        anomaly_score: Number(form.anomaly_score || 0),
        status: form.status,
        timestamp: form.timestamp
          ? new Date(form.timestamp).toISOString()
          : new Date().toISOString(),
      });
      setFormMessage("Reading submitted to ingest API.");
      setForm(initialForm);
    } catch (error) {
      setFormMessage(`Submission failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartSession() {
    if (!selectedPatient || !selectedDevice) {
      setSessionMessage("Select both a patient and device before starting monitoring.");
      return;
    }
    setSessionBusy(true);
    setSessionMessage("");
    try {
      await beginSession({
        patient_id: selectedPatient,
        device_id: selectedDevice,
        notes: "Started from live monitoring console",
      });
      setSessionMessage("Monitoring session started.");
    } catch (error) {
      setSessionMessage(`Unable to start session: ${error.message}`);
    } finally {
      setSessionBusy(false);
    }
  }

  async function handleStopSession() {
    if (!activeSession) return;
    setSessionBusy(true);
    setSessionMessage("");
    try {
      await endSession(activeSession.id);
      setSessionMessage("Monitoring session stopped.");
    } catch (error) {
      setSessionMessage(`Unable to stop session: ${error.message}`);
    } finally {
      setSessionBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Live Monitoring"
        subtitle="View live heart rate, SpO2, temperature, anomaly status, and device state."
        actions={
          <div className="vp-inline-field vp-inline-field-row">
            <FormField label="Patient">
              <select className="vp-input" value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)}>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>
                    {patient.patient_id} {patient.name ? `- ${patient.name}` : ""}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Device">
              <select className="vp-input" value={selectedDevice} onChange={(event) => setSelectedDevice(event.target.value)}>
                <option value="">Select device</option>
                {devices.map((device) => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_id}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="vp-form-actions">
              <PrimaryButton type="button" onClick={handleStartSession} disabled={sessionBusy || !!activeSession}>
                Start monitoring
              </PrimaryButton>
              <PrimaryButton type="button" variant="secondary" onClick={handleStopSession} disabled={sessionBusy || !activeSession}>
                Stop monitoring
              </PrimaryButton>
            </div>
          </div>
        }
      />

      {sessionMessage ? <p className="vp-form-message">{sessionMessage}</p> : null}

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="heart" label="Heart Rate" value={latestReading ? formatMetric(latestReading.heart_rate, "bpm") : "Waiting for device reading"} helper={readingState(latestReading, derived)} status={latestReading?.status || "Pending"} />
        <MetricCard icon="spo2" label="SpO2" value={latestReading ? formatMetric(latestReading.spo2, "%") : "No reading received yet"} helper="Peripheral oxygen saturation" status={latestReading ? "Loaded" : "Pending"} />
        <MetricCard icon="temp" label="Body Temperature" value={latestReading ? formatMetric(latestReading.temperature, "deg C") : "No reading received yet"} helper={latestReading ? formatDateTime(latestReading.timestamp) : "Waiting for first reading"} status={latestReading ? "Loaded" : "Pending"} />
        <MetricCard icon="risk" label="Anomaly / Risk Status" value={derived.riskLabel} helper={latestReading ? `Anomaly score ${latestReading.anomaly_score}` : "Waiting for live model output"} status={derived.riskLabel} accent="ai" />
      </div>

      <div className="vp-content-with-panel">
        <div className="vp-content-main">
          <div className="vp-grid-two">
            <TrendChartCard title="Vital Trend" subtitle="Recent heart-rate samples from the connected monitor." samples={trendSamples} dataKey="heart_rate" />
            <TrendChartCard title="Anomaly Score Trend" subtitle="Recent anomaly-score output from the monitoring pipeline." samples={trendSamples} dataKey="anomaly_score" stroke="var(--ai)" />
          </div>

          <SectionCard title="Recent Alerts" subtitle="Alerts relevant to the current patient or device selection.">
            {filteredAlerts.length ? (
              <div className="vp-list-stack">
                {filteredAlerts.slice(0, 3).map((alert) => <AlertCard key={alert.id} alert={alert} />)}
              </div>
            ) : (
              <EmptyState title="No patient-linked alerts yet" message="The monitoring backend has not returned any active alerts for this patient or device context." icon="alerts" />
            )}
          </SectionCard>

          <CollapsibleSection
            title="Manual Test Entry / Admin Testing"
            subtitle="Use this only for hardware simulation, bench testing, or controlled admin input."
            open={showManualEntry}
            onToggle={() => setShowManualEntry((current) => !current)}
            collapsedCopy="Manual test entry stays collapsed by default so the monitoring screen remains clinician-focused."
          >
            <form className="vp-form-grid" onSubmit={handleSubmit}>
              <FormField label="Patient reference" hint="Optional if you already selected a patient above.">
                <input className="vp-input" value={form.patient_id} onChange={(event) => setForm((current) => ({ ...current, patient_id: event.target.value }))} placeholder="Optional local patient reference" />
              </FormField>
              <FormField label="Device ID">
                <input className="vp-input" required value={form.device_id} onChange={(event) => setForm((current) => ({ ...current, device_id: event.target.value }))} placeholder="e.g. sensor-01" />
              </FormField>
              <FormField label="Heart rate">
                <input className="vp-input" required type="number" value={form.heart_rate} onChange={(event) => setForm((current) => ({ ...current, heart_rate: event.target.value }))} />
              </FormField>
              <FormField label="Temperature">
                <input className="vp-input" required type="number" step="0.1" value={form.temperature} onChange={(event) => setForm((current) => ({ ...current, temperature: event.target.value }))} />
              </FormField>
              <FormField label="SpO2">
                <input className="vp-input" required type="number" step="0.1" value={form.spo2} onChange={(event) => setForm((current) => ({ ...current, spo2: event.target.value }))} />
              </FormField>
              <FormField label="Anomaly score">
                <input className="vp-input" type="number" step="0.01" value={form.anomaly_score} onChange={(event) => setForm((current) => ({ ...current, anomaly_score: event.target.value }))} placeholder="0.0 - 1.0" />
              </FormField>
              <FormField label="Status">
                <select className="vp-input" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="normal">Normal</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </FormField>
              <FormField label="Timestamp">
                <input className="vp-input" type="datetime-local" value={form.timestamp} onChange={(event) => setForm((current) => ({ ...current, timestamp: event.target.value }))} />
              </FormField>
              <div className="vp-form-actions">
                <PrimaryButton type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Reading"}
                </PrimaryButton>
                {formMessage ? <p className="vp-form-message">{formMessage}</p> : null}
              </div>
            </form>
          </CollapsibleSection>
        </div>

        <InsightPanel
          title="Monitoring Context"
          subtitle="Device state, freshness, and monitoring session details."
          items={[
            { label: "Patient", value: selectedPatientRecord ? `${selectedPatientRecord.patient_id}${selectedPatientRecord.name ? ` - ${selectedPatientRecord.name}` : ""}` : "Not selected", status: selectedPatientRecord?.monitoring_status || "Pending" },
            { label: "Assigned device", value: selectedDeviceRecord?.device_id || derived.liveDeviceId || "No device observed", status: selectedDeviceRecord?.status || derived.deviceState },
            { label: "Monitoring status", value: activeSession ? "Monitoring active" : readingState(latestReading, derived), status: activeSession ? "Online" : derived.deviceState },
            { label: "Last reading time", value: latestReading ? formatRelativeTime(latestReading.timestamp) : "No reading received", status: latestReading ? "Loaded" : "Pending" },
            { label: "Device status", value: selectedDeviceRecord?.status || derived.deviceState, status: selectedDeviceRecord?.status || derived.deviceState },
            { label: "Active session", value: activeSession ? `${activeSession.patient_id || "Unknown"} / ${activeSession.device_id || "Unknown"}` : "No active session", status: activeSession ? "Loaded" : "Pending" },
          ]}
          footer="Monitoring session controls are now connected to the backend session endpoints."
        />
      </div>
    </AppShell>
  );
}
