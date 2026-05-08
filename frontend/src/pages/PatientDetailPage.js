import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import InsightPanel from "../components/InsightPanel";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { useVitalPulse } from "../context/VitalPulseContext";
import { formatDateTime, formatRelativeTime } from "../utils/formatters";

export default function PatientDetailPage() {
  const { id } = useParams();
  const { getPatientDetail } = useVitalPulse();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await getPatientDetail(id);
        if (active) {
          setDetail(response);
          setError("");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [getPatientDetail, id]);

  const patient = detail?.patient;
  const latestReading = detail?.readings?.[0] || null;
  const latestAlert = detail?.alerts?.[0] || null;
  const latestSession = useMemo(() => detail?.sessions?.find((session) => session.status === "active") || detail?.sessions?.[0] || null, [detail]);

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
        subtitle="Patient monitoring summary, latest readings, alert history, and session status."
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="patients" label="Patient ID" value={patient?.patient_id || id} helper={patient?.name || "Monitoring record"} status="Loaded" />
        <MetricCard icon="devices" label="Assigned device" value={patient?.assigned_device || "Unavailable"} helper="Linked monitoring device" status={patient?.assigned_device ? "Connected" : "Pending"} />
        <MetricCard icon="risk" label="Current risk" value={patient?.risk_status || "Pending"} helper="Derived from latest telemetry" status={patient?.risk_status || "Pending"} />
        <MetricCard icon="clock" label="Last reading" value={latestReading ? formatRelativeTime(latestReading.timestamp) : "No reading received"} helper={formatDateTime(latestReading?.timestamp)} status={latestReading ? "Loaded" : "Pending"} />
      </div>

      <div className="vp-content-with-panel">
        <div className="vp-content-main">
          <SectionCard title="Patient Summary" subtitle="Monitoring status, assignment, and latest telemetry context.">
            {patient ? (
              <div className="vp-health-grid">
                <div className="vp-health-item"><span>Name</span><strong>{patient.name || "Not provided"}</strong></div>
                <div className="vp-health-item"><span>Initials</span><strong>{patient.initials || "Not provided"}</strong></div>
                <div className="vp-health-item"><span>Monitoring status</span><strong>{patient.monitoring_status || "Pending"}</strong></div>
                <div className="vp-health-item"><span>Assigned device</span><strong>{patient.assigned_device || "Not assigned"}</strong></div>
              </div>
            ) : (
              <EmptyState
                title="Patient record unavailable"
                message={error || "Unable to load patient monitoring details from the backend."}
                icon="patients"
              />
            )}
          </SectionCard>

          <SectionCard title="Recent Readings" subtitle="Latest vital readings stored for this patient.">
            <DataTable
              columns={[
                { key: "timestamp", label: "Timestamp", render: (value) => formatDateTime(value) },
                { key: "deviceId", label: "Device ID" },
                { key: "heartRate", label: "Heart Rate" },
                { key: "spo2", label: "SpO2" },
                { key: "temperature", label: "Temperature" },
                { key: "status", label: "Status", type: "badge" },
              ]}
              rows={(detail?.readings || []).map((reading) => ({
                id: reading.id,
                timestamp: reading.timestamp,
                deviceId: reading.device_id,
                heartRate: `${reading.heart_rate} bpm`,
                spo2: `${reading.spo2}%`,
                temperature: `${reading.temperature} deg C`,
                status: reading.status,
              }))}
              emptyTitle="No readings for this patient"
              emptyMessage="No stored readings have been linked to this patient yet."
            />
          </SectionCard>

          <SectionCard title="Recent Alerts" subtitle="Latest abnormal events linked to this patient.">
            <DataTable
              columns={[
                { key: "timestamp", label: "Triggered", render: (value) => formatDateTime(value) },
                { key: "deviceId", label: "Device ID" },
                { key: "severity", label: "Severity", type: "badge" },
                { key: "reason", label: "Reason" },
                { key: "status", label: "Status", type: "badge" },
              ]}
              rows={(detail?.alerts || []).map((alert) => ({
                id: alert.id,
                timestamp: alert.created_at,
                deviceId: alert.device_id,
                severity: alert.severity,
                reason: alert.reason,
                status: alert.status,
              }))}
              emptyTitle="No alerts for this patient"
              emptyMessage="No abnormal readings have triggered patient-specific alerts yet."
            />
          </SectionCard>
        </div>

        <InsightPanel
          title="Monitoring Context"
          subtitle="Latest telemetry, alert state, and active session details."
          items={[
            { label: "Latest vitals", value: latestReading ? `${latestReading.heart_rate} bpm | ${latestReading.temperature} deg C | ${latestReading.spo2}%` : "No live data", status: latestReading ? "Loaded" : "Pending" },
            { label: "Latest alert", value: latestAlert?.reason || "No recent alert", status: latestAlert?.severity || "Resolved" },
            { label: "Active session", value: latestSession ? `${latestSession.device_id || "Unknown device"} / ${latestSession.status}` : "No session recorded", status: latestSession?.status || "Pending" },
            { label: "Last session update", value: latestSession ? formatDateTime(latestSession.started_at) : "Unavailable", status: latestSession ? "Loaded" : "Pending" },
          ]}
          footer="This route now uses the backend patient detail endpoint and related monitoring records."
        />
      </div>
    </AppShell>
  );
}
