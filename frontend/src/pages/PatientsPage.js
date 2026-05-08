import { useState } from "react";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchFilterBar from "../components/SearchFilterBar";
import SectionCard from "../components/SectionCard";
import { useVitalPulse } from "../context/VitalPulseContext";
import { formatDateTime } from "../utils/formatters";

export default function PatientsPage() {
  const { latestReading, derived } = useVitalPulse();
  const [search, setSearch] = useState("");

  return (
    <AppShell>
      <PageHeader
        title="Patients"
        subtitle="Register patients, link devices, and review current monitoring status."
        filters={
          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by patient ID or name"
            showExport
            exportDisabled
            onClear={() => setSearch("")}
          />
        }
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="patients" label="Registered Patients" value="Pending" helper="Patient registry endpoint not available" status="Pending" />
        <MetricCard icon="monitor" label="Monitoring Active" value={latestReading ? "Live reading detected" : "No live session"} helper="Derived from current monitoring feed" status={latestReading ? "Online" : "Pending"} />
        <MetricCard icon="devices" label="Assigned Device" value={derived.liveDeviceId || "Not linked"} helper="Current live telemetry source" status={derived.deviceState} />
        <MetricCard icon="clock" label="Last Reading" value={latestReading ? formatDateTime(latestReading.timestamp) : "No reading yet"} helper={latestReading ? derived.riskLabel : "Waiting for device data"} status={latestReading ? "Loaded" : "Pending"} />
      </div>

      <SectionCard title="Patient Registry" subtitle="Patient list, device assignment, monitoring status, and latest vitals.">
        <EmptyState
          title="Patient registry endpoint not available yet"
          message="Patient records, device assignment, and patient-specific monitoring views will appear here when the backend exposes a patient API."
          actionLabel="Add patient coming soon"
          actionDisabled
        />
      </SectionCard>

      <SectionCard title="Current Monitoring Link" subtitle="Live telemetry received, waiting to be linked to a registered patient record.">
        {latestReading ? (
          <div className="vp-health-grid">
            <div className="vp-health-item"><span>Device</span><strong>{latestReading.device_id || "Unavailable"}</strong></div>
            <div className="vp-health-item"><span>Heart rate</span><strong>{latestReading.heart_rate} bpm</strong></div>
            <div className="vp-health-item"><span>SpO2</span><strong>{latestReading.spo2}%</strong></div>
            <div className="vp-health-item"><span>Temperature</span><strong>{latestReading.temperature} deg C</strong></div>
          </div>
        ) : (
          <EmptyState title="No live reading to map" message="Connect the physical device or use the admin test entry flow to receive the first reading." icon="monitor" />
        )}
      </SectionCard>
    </AppShell>
  );
}
