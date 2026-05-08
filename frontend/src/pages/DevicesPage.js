import { useState } from "react";
import AppShell from "../components/AppShell";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import { FormField } from "../components/FormField";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SectionCard from "../components/SectionCard";
import { useVitalPulse } from "../context/VitalPulseContext";
import { formatDateTime } from "../utils/formatters";

const initialForm = {
  device_id: "",
  assigned_patient_id: "",
  location: "",
  firmware_version: "",
  model_version: "",
};

export default function DevicesPage() {
  const { devices, latestReading, submitDevice, exportCsv } = useVitalPulse();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const onlineCount = devices.filter((item) => item.status === "online").length;
  const staleCount = devices.filter((item) => item.status === "stale").length;
  const offlineCount = devices.filter((item) => item.status === "offline").length;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await submitDevice(form);
      setMessage("Device saved.");
      setForm(initialForm);
    } catch (error) {
      setMessage(`Failed to save device: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Devices"
        subtitle="Register physical monitoring devices, assign them to patients, and review connection status."
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="devices" label="Total devices" value={devices.length} helper="Registered device records" status={devices.length ? "Loaded" : "Pending"} />
        <MetricCard icon="device" label="Online devices" value={onlineCount} helper="Connected and recently seen" status={onlineCount ? "Online" : "Pending"} />
        <MetricCard icon="alerts" label="Offline devices" value={offlineCount} helper="Offline device state" status={offlineCount ? "Offline" : "Resolved"} />
        <MetricCard icon="clock" label="Stale devices" value={staleCount} helper="Past the stale threshold" status={staleCount ? "Stale" : "Resolved"} />
      </div>

      <SectionCard title="Register Device" subtitle="Core device registration and patient-assignment workflow for rural monitoring.">
        <form className="vp-form-grid" onSubmit={handleSubmit}>
          <FormField label="Device ID"><input className="vp-input" required value={form.device_id} onChange={(event) => setForm((current) => ({ ...current, device_id: event.target.value }))} /></FormField>
          <FormField label="Assigned Patient ID"><input className="vp-input" value={form.assigned_patient_id} onChange={(event) => setForm((current) => ({ ...current, assigned_patient_id: event.target.value }))} /></FormField>
          <FormField label="Location / Facility Area"><input className="vp-input" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} /></FormField>
          <FormField label="Firmware Version"><input className="vp-input" value={form.firmware_version} onChange={(event) => setForm((current) => ({ ...current, firmware_version: event.target.value }))} /></FormField>
          <FormField label="Model Version"><input className="vp-input" value={form.model_version} onChange={(event) => setForm((current) => ({ ...current, model_version: event.target.value }))} /></FormField>
          <div className="vp-form-actions">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Device"}
            </PrimaryButton>
            {message ? <p className="vp-form-message">{message}</p> : null}
          </div>
        </form>
      </SectionCard>

      <div className="vp-grid-two">
        <SectionCard title="Current Device Status" subtitle="Live state from the latest observed reading.">
          {latestReading ? (
            <div className="vp-health-grid">
              <div className="vp-health-item"><span>Observed device</span><strong>{latestReading.device_id}</strong></div>
              <div className="vp-health-item"><span>Last seen</span><strong>{formatDateTime(latestReading.timestamp)}</strong></div>
              <div className="vp-health-item"><span>Latest anomaly score</span><strong>{latestReading.anomaly_score ?? "Unavailable"}</strong></div>
              <div className="vp-health-item"><span>Latest vitals</span><strong>{latestReading.heart_rate} bpm | {latestReading.spo2}% | {latestReading.temperature} deg C</strong></div>
            </div>
          ) : (
            <EmptyState title="No live device telemetry" message="No reading has been received from a physical monitoring device yet." icon="devices" />
          )}
        </SectionCard>

        <SectionCard title="Device Maintenance" subtitle="Maintenance actions stay limited to device diagnostics and log export.">
          <div className="vp-form-actions">
            <PrimaryButton variant="secondary" disabled={!devices.length} onClick={() => exportCsv("devices", "device-log-export.csv")}>
              Export logs
            </PrimaryButton>
            <PrimaryButton variant="ghost" disabled>Diagnostics coming soon</PrimaryButton>
          </div>
          <p className="vp-muted-copy">Firmware update and sensor diagnostics will remain hidden until there is backend support for device maintenance operations.</p>
        </SectionCard>
      </div>

      <SectionCard title="Device Registry" subtitle="Connected devices, last-seen state, assignment, and latest telemetry snapshot.">
        <DataTable
          columns={[
            { key: "deviceId", label: "Device ID" },
            { key: "assignedPatient", label: "Assigned Patient" },
            { key: "location", label: "Location" },
            { key: "status", label: "Status", type: "badge" },
            { key: "lastSeen", label: "Last Seen" },
            { key: "firmware", label: "Firmware Version" },
            { key: "model", label: "Model Version" },
            { key: "latestReading", label: "Latest Reading" },
            { key: "actions", label: "Actions" },
          ]}
          rows={devices.map((device) => ({
            id: device.device_id,
            deviceId: device.device_id,
            assignedPatient: device.assigned_patient || "Unassigned",
            location: device.location || "Not set",
            status: device.status || "Pending",
            lastSeen: formatDateTime(device.last_seen),
            firmware: device.firmware_version || "Unavailable",
            model: device.model_version || "Unavailable",
            latestReading: device.latest_reading
              ? `${device.latest_reading.heart_rate} bpm / ${device.latest_reading.temperature} deg C / ${device.latest_reading.spo2}%`
              : "No reading",
            actions: "View",
          }))}
          emptyTitle="No device registry available"
          emptyMessage="Register the first device to begin device-to-patient monitoring."
        />
      </SectionCard>
    </AppShell>
  );
}
