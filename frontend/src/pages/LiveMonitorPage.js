import { useState } from "react";
import AppShell from "../components/AppShell";
import AlertCard from "../components/AlertCard";
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
  const { latestReading, trendSamples, alerts, submitManualReading, derived } = useVitalPulse();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage("");
    try {
      await submitManualReading({
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

  return (
    <AppShell>
      <PageHeader
        title="Live Monitoring"
        subtitle="View live heart rate, SpO2, temperature, anomaly status, and device state."
        actions={
          <div className="vp-inline-field vp-inline-field-row">
            <FormField label="Patient">
              <select className="vp-input" disabled>
                <option>Select patient when patient endpoint is available</option>
              </select>
            </FormField>
            <FormField label="Device">
              <input className="vp-input" value={derived.liveDeviceId || "No device observed"} readOnly />
            </FormField>
          </div>
        }
      />

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

          <SectionCard title="Recent Alerts" subtitle="Alerts relevant to the currently selected monitoring context.">
            {alerts.length ? (
              <div className="vp-list-stack">
                {alerts.slice(0, 3).map((alert) => <AlertCard key={alert.id} alert={alert} />)}
              </div>
            ) : (
              <EmptyState title="No patient-linked alerts yet" message="The monitoring backend has not returned any active alerts for this context." icon="alerts" />
            )}
          </SectionCard>

          <SectionCard
            title="Manual Test Entry / Admin Testing"
            subtitle="Use this only for hardware simulation, bench testing, or controlled admin input."
            action={
              <PrimaryButton variant="ghost" onClick={() => setShowManualEntry((current) => !current)}>
                {showManualEntry ? "Hide form" : "Show form"}
              </PrimaryButton>
            }
          >
            {showManualEntry ? (
              <form className="vp-form-grid" onSubmit={handleSubmit}>
                <FormField label="Patient reference" hint="Optional until a patient endpoint exists.">
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
            ) : (
              <p className="vp-muted-copy">The manual test entry form is hidden by default to keep the live monitoring screen focused for nurses and clinicians.</p>
            )}
          </SectionCard>
        </div>

        <InsightPanel
          title="Monitoring Context"
          subtitle="Device state, freshness, and monitoring session details."
          items={[
            { label: "Patient", value: "Not linked yet", status: "Pending" },
            { label: "Assigned device", value: derived.liveDeviceId || "No device observed", status: derived.deviceState },
            { label: "Monitoring status", value: readingState(latestReading, derived), status: derived.deviceState },
            { label: "Last reading time", value: latestReading ? formatRelativeTime(latestReading.timestamp) : "No reading received", status: latestReading ? "Loaded" : "Pending" },
            { label: "Device status", value: derived.deviceState, status: derived.deviceState },
            { label: "ML output", value: derived.mlAvailable ? "Available" : "Waiting for score", status: derived.mlAvailable ? "Loaded" : "Pending" },
          ]}
          footer="Monitoring start/stop and patient-device assignment need dedicated backend endpoints to become interactive."
        />
      </div>
    </AppShell>
  );
}
