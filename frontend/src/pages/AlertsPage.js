import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import DataTable from "../components/DataTable";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchFilterBar from "../components/SearchFilterBar";
import SectionCard from "../components/SectionCard";
import SegmentTabs from "../components/SegmentTabs";
import { useVitalPulse } from "../context/VitalPulseContext";
import { formatDateTime } from "../utils/formatters";

export default function AlertsPage() {
  const { alerts } = useVitalPulse();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");

  const summary = useMemo(() => ({
    critical: alerts.filter((item) => String(item.severity).toLowerCase() === "critical").length,
    warning: alerts.filter((item) => String(item.severity).toLowerCase() === "warning").length,
    acknowledged: alerts.filter((item) => String(item.status).toLowerCase() === "acknowledged").length,
  }), [alerts]);

  return (
    <AppShell>
      <PageHeader
        title="Alerts"
        subtitle="Review, acknowledge, and monitor abnormal vital-sign events."
        tabs={
          <SegmentTabs
            tabs={["All", "Critical", "Warning", "Open", "Acknowledged"]}
            value={tab}
            onChange={setTab}
          />
        }
        filters={
          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by patient ID or device ID"
            filters={[
              { label: "Severity", value: "all", onChange: () => {}, disabled: true, options: [{ value: "all", label: "Filter by severity" }] },
            ]}
            onClear={() => setSearch("")}
          />
        }
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="alerts" label="Open alerts" value={alerts.length} helper="Current feed size" status={alerts.length ? "Open" : "Resolved"} />
        <MetricCard icon="risk" label="Critical alerts" value={summary.critical} helper="Severity derived from feed" status={summary.critical ? "Critical" : "Resolved"} />
        <MetricCard icon="alerts" label="Warning alerts" value={summary.warning} helper="Severity derived from feed" status={summary.warning ? "Warning" : "Resolved"} />
        <MetricCard icon="clock" label="Acknowledged alerts" value={summary.acknowledged} helper="Acknowledgement workflow not exposed by backend yet" status="Pending" />
      </div>

      <SectionCard title="Alert Management" subtitle="Simple review of alert severity, reasons, reading values, and acknowledgement status.">
        <DataTable
          columns={[
            { key: "id", label: "Alert ID" },
            { key: "patientId", label: "Patient ID" },
            { key: "deviceId", label: "Device ID" },
            { key: "type", label: "Alert Type" },
            { key: "severity", label: "Severity", type: "badge" },
            { key: "reason", label: "Reason" },
            { key: "readingValues", label: "Reading Values" },
            { key: "triggeredAt", label: "Triggered Time", render: (value) => formatDateTime(value) },
            { key: "status", label: "Acknowledgement", type: "badge" },
            { key: "actions", label: "Actions" },
          ]}
          rows={alerts.map((alert) => ({
            ...alert,
            readingValues: alert.raw?.reading_values || "Reading snapshot unavailable",
            actions: (
              <div className="vp-inline-actions">
                <PrimaryButton variant="secondary">View</PrimaryButton>
                <PrimaryButton variant="ghost" disabled>Acknowledge</PrimaryButton>
                <PrimaryButton variant="ghost" disabled>Mark reviewed</PrimaryButton>
              </div>
            ),
          }))}
          emptyTitle="No alerts available"
          emptyMessage="The alerts endpoint is reachable but currently returns no alert events."
        />
      </SectionCard>
    </AppShell>
  );
}
