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

export default function DevicesPage() {
  const { latestReading, derived } = useVitalPulse();
  const rows = latestReading
    ? [
        {
          id: latestReading.device_id,
          deviceId: latestReading.device_id,
          assignedPatient: "Patient endpoint required",
          location: "Location endpoint required",
          firmware: "Unavailable",
          model: "Unavailable",
          status: derived.deviceState,
          lastSeen: formatDateTime(latestReading.timestamp),
          latestReading: `${latestReading.heart_rate} bpm / ${latestReading.temperature} deg C / ${latestReading.spo2}%`,
          actions: "View",
        },
      ]
    : [];

  return (
    <AppShell>
      <PageHeader
        title="Devices"
        subtitle="Register physical monitoring devices, assign them to patients, and review connection status."
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="devices" label="Total devices" value={derived.observedDevices.length} helper="Observed from live telemetry only" status={derived.observedDevices.length ? "Loaded" : "Pending"} />
        <MetricCard icon="device" label="Online devices" value={derived.deviceState === "Online" ? "1" : "0"} helper="Based on reading freshness" status={derived.deviceState} />
        <MetricCard icon="alerts" label="Offline devices" value={derived.deviceState === "Stale" ? "1" : "0"} helper="Derived from stale cutoff" status={derived.deviceState === "Stale" ? "Offline" : "Online"} />
        <MetricCard icon="clock" label="Stale devices" value={derived.deviceState === "Stale" ? "1" : "0"} helper="No registry API for broader counts" status={derived.deviceState === "Stale" ? "Stale" : "Resolved"} />
      </div>

      <SectionCard title="Register Device" subtitle="Core device registration and patient-assignment workflow for rural monitoring.">
        <div className="vp-form-grid">
          <FormField label="Device ID"><input className="vp-input" placeholder="Device registration endpoint required" /></FormField>
          <FormField label="Assigned Patient ID"><input className="vp-input" placeholder="Patient endpoint required" /></FormField>
          <FormField label="Location / Facility Area"><input className="vp-input" placeholder="Ward or rural clinic area" /></FormField>
          <FormField label="Firmware Version"><input className="vp-input" placeholder="Optional if available" /></FormField>
          <FormField label="Model Version"><input className="vp-input" placeholder="Optional if available" /></FormField>
          <div className="vp-form-actions">
            <PrimaryButton disabled>Save Device</PrimaryButton>
          </div>
        </div>
      </SectionCard>

      <div className="vp-grid-two">
        <SectionCard title="Current Device Status" subtitle="Live state from the latest observed reading.">
          {latestReading ? (
            <div className="vp-health-grid">
              <div className="vp-health-item"><span>Observed device</span><strong>{latestReading.device_id}</strong></div>
              <div className="vp-health-item"><span>Status</span><strong>{derived.deviceState}</strong></div>
              <div className="vp-health-item"><span>Last seen</span><strong>{formatDateTime(latestReading.timestamp)}</strong></div>
              <div className="vp-health-item"><span>Latest anomaly score</span><strong>{latestReading.anomaly_score ?? "Unavailable"}</strong></div>
            </div>
          ) : (
            <EmptyState title="No live device telemetry" message="No reading has been received from a physical monitoring device yet." icon="devices" />
          )}
        </SectionCard>

        <SectionCard title="Device Maintenance" subtitle="Maintenance actions stay limited to device diagnostics and log export.">
          <div className="vp-form-grid">
            <div className="vp-health-item"><span>Diagnostics</span><strong>Coming soon</strong></div>
            <div className="vp-health-item"><span>Export device logs</span><strong>Coming soon</strong></div>
            <div className="vp-health-item"><span>Firmware update</span><strong>Planned</strong></div>
            <div className="vp-health-item"><span>Sensor maintenance</span><strong>Planned</strong></div>
          </div>
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
          rows={rows}
          emptyTitle="No device registry available"
          emptyMessage="The backend has no device registry endpoint yet, so only live telemetry-derived device context can be shown."
        />
      </SectionCard>
    </AppShell>
  );
}
