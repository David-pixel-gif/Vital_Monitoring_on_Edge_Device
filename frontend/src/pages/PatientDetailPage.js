import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import InsightPanel from "../components/InsightPanel";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SectionCard from "../components/SectionCard";
import { useVitalPulse } from "../context/VitalPulseContext";
import { formatDateTime, formatRelativeTime } from "../utils/formatters";

export default function PatientDetailPage() {
  const { id } = useParams();
  const { latestReading, derived } = useVitalPulse();

  return (
    <AppShell
      topbarAction={
        <Link to="/history" className="vp-button vp-button-secondary">
          View History
        </Link>
      }
    >
      <PageHeader
        title="Patient Detail"
        subtitle="Clinical detail view, latest monitoring data, and monitoring status."
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="patients" label="Patient ID" value={id} helper="Route preserved" status="Loaded" />
        <MetricCard icon="devices" label="Assigned device" value={derived.liveDeviceId || "Unavailable"} helper="Patient mapping endpoint required" status={derived.deviceState} />
        <MetricCard icon="risk" label="Current risk" value={derived.riskLabel} helper="Derived from latest telemetry" status={derived.riskLabel} />
        <MetricCard icon="clock" label="Last reading" value={latestReading ? formatRelativeTime(latestReading.timestamp) : "No reading received"} helper={formatDateTime(latestReading?.timestamp)} status={latestReading ? "Loaded" : "Pending"} />
      </div>

      <div className="vp-content-with-panel">
        <div className="vp-content-main">
          <SectionCard title="Clinical Summary" subtitle="Patient identity, assignment, location, and longitudinal care context.">
            <EmptyState
              title="Patient record endpoint required"
              message="This route is preserved and redesigned, but the backend does not expose patient profile, demographics, or historical case data yet."
              icon="patients"
            />
          </SectionCard>
        </div>
        <InsightPanel
          title="Monitoring Context"
          subtitle="Latest medical telemetry attached to this detail shell."
          items={[
            { label: "Patient detail route", value: id, status: "Loaded" },
            { label: "Assigned device", value: derived.liveDeviceId || "Unavailable", status: derived.deviceState },
            { label: "Latest vitals", value: latestReading ? `${latestReading.heart_rate} bpm | ${latestReading.temperature} deg C | ${latestReading.spo2}%` : "No live data", status: latestReading ? "Loaded" : "Pending" },
            { label: "Risk", value: derived.riskLabel, status: derived.riskLabel },
          ]}
          footer="Patient detail can be expanded immediately once patient and history APIs are added."
        />
      </div>
    </AppShell>
  );
}
