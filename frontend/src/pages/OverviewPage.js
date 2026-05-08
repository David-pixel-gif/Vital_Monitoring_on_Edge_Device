import AppShell from "../components/AppShell";
import AlertCard from "../components/AlertCard";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import TrendChartCard from "../components/TrendChartCard";
import DataTable from "../components/DataTable";
import { useVitalPulse } from "../context/VitalPulseContext";
import {
  formatDateTime,
  formatMetric,
  formatNumber,
  formatRelativeTime,
} from "../utils/formatters";

function facilityRows(context) {
  return [
    { label: "Monitoring API", value: context.errors.latest ? "Offline" : "Online" },
    { label: "Alerts API", value: context.errors.alerts ? "Offline" : "Online" },
    { label: "ML model", value: context.derived.mlAvailable ? "Loaded" : "Waiting for score" },
    { label: "Last sync", value: formatRelativeTime(context.lastSync) },
  ];
}

export default function OverviewPage() {
  const context = useVitalPulse();
  const { latestReading, trendSamples, alerts, derived, patients, devices, history, systemStatus } = context;

  const readingRows = history
    .filter((item) => item.event_type === "reading")
    .slice(0, 5)
    .map((item, index) => ({
      id: `${item.timestamp}-${index}`,
      patientId: item.patient_id || "Not linked",
      deviceId: item.device_id || "Unavailable",
      heartRate: item.heart_rate ? formatMetric(item.heart_rate, "bpm") : "-",
      spo2: item.spo2 ? formatMetric(item.spo2, "%") : "-",
      temperature: item.temperature ? formatMetric(item.temperature, "deg C") : "-",
      timestamp: formatDateTime(item.timestamp),
      status: item.risk_status || derived.deviceState,
    }));

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle="Simple overview of monitored devices, latest readings, alerts, and system status."
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="patients" label="Monitored Patients" value={patients.length} helper="Patient registry records" status={patients.length ? "Loaded" : "Pending"} />
        <MetricCard icon="devices" label="Active Devices" value={systemStatus?.active_devices ?? devices.length} helper="Observed and registered devices" status={derived.deviceState} />
        <MetricCard icon="heart" label="Latest Readings" value={trendSamples.length} helper={latestReading ? formatDateTime(latestReading.timestamp) : "No reading received"} status={latestReading ? "Loaded" : "Pending"} />
        <MetricCard icon="alerts" label="Open Alerts" value={formatNumber(alerts.length, "0")} helper="Current alert feed" status={alerts.length ? "Open" : "Resolved"} />
        <MetricCard icon="spark" label="System Status" value={systemStatus?.system_status || (derived.mlAvailable ? "Monitoring active" : "Awaiting live score")} helper={latestReading ? `Risk ${derived.riskLabel}` : "No live device reading"} status={derived.mlAvailable ? "Loaded" : "Pending"} accent="ai" />
      </div>

      <div className="vp-grid-two">
        <TrendChartCard title="Vital Trend" subtitle="Recent readings from the connected monitoring device." samples={trendSamples} dataKey="heart_rate" />
        <SectionCard title="Device Health" subtitle="Current device connectivity and telemetry state.">
          <div className="vp-health-grid">
            <div className="vp-health-item"><span>Observed device</span><strong>{derived.liveDeviceId || "No device observed"}</strong></div>
            <div className="vp-health-item"><span>Connection</span><strong>{derived.deviceState}</strong></div>
            <div className="vp-health-item"><span>Last reading</span><strong>{formatDateTime(latestReading?.timestamp)}</strong></div>
            <div className="vp-health-item"><span>Anomaly status</span><strong>{derived.riskLabel}</strong></div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent Readings" subtitle="Latest captured readings available from the monitoring API.">
        <DataTable
          columns={[
            { key: "patientId", label: "Patient ID" },
            { key: "deviceId", label: "Device ID" },
            { key: "heartRate", label: "Heart Rate" },
            { key: "spo2", label: "SpO2" },
            { key: "temperature", label: "Temperature" },
            { key: "timestamp", label: "Timestamp" },
            { key: "status", label: "Status", type: "badge" },
          ]}
          rows={readingRows}
          emptyTitle="No readings available"
          emptyMessage="Waiting for the first stored reading from the physical monitoring device."
        />
      </SectionCard>

      <div className="vp-grid-two">
        <SectionCard title="Recent Alerts" subtitle="Latest abnormal events from the alert feed.">
          {alerts.length ? (
            <div className="vp-list-stack">
              {alerts.slice(0, 3).map((alert) => <AlertCard key={alert.id} alert={alert} />)}
            </div>
          ) : (
            <EmptyState
              icon="alerts"
              title="No recent alerts"
              message="No abnormal readings have been returned by the current alerts endpoint."
            />
          )}
        </SectionCard>

        <SectionCard title="System Status" subtitle="Core monitoring services required for the rural monitoring workflow.">
          <div className="vp-health-grid">
            {facilityRows(context).map((item) => (
              <div className="vp-health-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
