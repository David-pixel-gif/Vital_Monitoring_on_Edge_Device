import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchFilterBar from "../components/SearchFilterBar";
import SectionCard from "../components/SectionCard";
import SegmentTabs from "../components/SegmentTabs";
import { useVitalPulse } from "../context/VitalPulseContext";
import { formatDateTime } from "../utils/formatters";
import { useSearchParams } from "react-router-dom";

export default function AlertsPage() {
  const { alerts, acknowledge, markReviewed } = useVitalPulse();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesTab =
        tab === "All" ||
        (tab === "Critical" && String(alert.severity).toLowerCase() === "critical") ||
        (tab === "Warning" && String(alert.severity).toLowerCase() === "warning") ||
        (tab === "Open" && String(alert.status).toLowerCase() === "open") ||
        (tab === "Acknowledged" && String(alert.status).toLowerCase() === "acknowledged");

      const value = search.trim().toLowerCase();
      const matchesSearch =
        !value ||
        String(alert.patientId || "").toLowerCase().includes(value) ||
        String(alert.deviceId || "").toLowerCase().includes(value) ||
        String(alert.reason || "").toLowerCase().includes(value);

      return matchesTab && matchesSearch;
    });
  }, [alerts, search, tab]);

  const summary = useMemo(() => ({
    critical: alerts.filter((item) => String(item.severity).toLowerCase() === "critical").length,
    warning: alerts.filter((item) => String(item.severity).toLowerCase() === "warning").length,
    acknowledged: alerts.filter((item) => String(item.status).toLowerCase() === "acknowledged").length,
    open: alerts.filter((item) => String(item.status).toLowerCase() === "open").length,
  }), [alerts]);

  const selectedAlert = filteredAlerts.find((alert) => alert.id === selectedAlertId) || filteredAlerts[0] || null;

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (!filteredAlerts.length) {
      setSelectedAlertId(null);
      return;
    }
    if (!filteredAlerts.some((alert) => alert.id === selectedAlertId)) {
      setSelectedAlertId(filteredAlerts[0].id);
    }
  }, [filteredAlerts, selectedAlertId]);

  function updateSearch(value) {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("q", value.trim());
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  }

  async function handleAcknowledge(id) {
    setBusyId(id);
    try {
      await acknowledge(id, "nurse@console");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReview(id) {
    setBusyId(id);
    try {
      await markReviewed(id);
    } finally {
      setBusyId(null);
    }
  }

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
            onSearchChange={updateSearch}
            searchPlaceholder="Search by patient ID, device ID, or reason"
            onClear={() => updateSearch("")}
          />
        }
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="alerts" label="Open alerts" value={summary.open} helper="Current feed size" status={summary.open ? "Open" : "Resolved"} />
        <MetricCard icon="risk" label="Critical alerts" value={summary.critical} helper="Severity derived from feed" status={summary.critical ? "Critical" : "Resolved"} />
        <MetricCard icon="alerts" label="Warning alerts" value={summary.warning} helper="Severity derived from feed" status={summary.warning ? "Warning" : "Resolved"} />
        <MetricCard icon="clock" label="Acknowledged alerts" value={summary.acknowledged} helper="Alerts acknowledged in the workflow" status={summary.acknowledged ? "Acknowledged" : "Pending"} />
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
          rows={filteredAlerts.map((alert) => ({
            ...alert,
            readingValues: alert.raw?.reading_values || "Reading snapshot unavailable",
            actions: (
              <div className="vp-inline-actions">
                <PrimaryButton variant="secondary" onClick={() => setSelectedAlertId(alert.id)}>View</PrimaryButton>
                <PrimaryButton
                  variant="ghost"
                  disabled={busyId === alert.id || String(alert.status).toLowerCase() === "acknowledged"}
                  onClick={() => handleAcknowledge(alert.id)}
                >
                  {busyId === alert.id ? "Working..." : "Acknowledge"}
                </PrimaryButton>
                <PrimaryButton
                  variant="ghost"
                  disabled={busyId === alert.id || String(alert.status).toLowerCase() === "reviewed"}
                  onClick={() => handleReview(alert.id)}
                >
                  Mark reviewed
                </PrimaryButton>
              </div>
            ),
          }))}
          selectedRowId={selectedAlertId}
          onRowClick={(row) => setSelectedAlertId(row.id)}
          emptyTitle="No alerts available"
          emptyMessage="The alerts endpoint is reachable but currently returns no alert events."
        />
      </SectionCard>

      <SectionCard title="Selected Alert Detail" subtitle="Focused review of the currently selected alert row.">
        {selectedAlert ? (
          <div className="vp-health-grid">
            <div className="vp-health-item"><span>Alert ID</span><strong>{selectedAlert.id}</strong></div>
            <div className="vp-health-item"><span>Patient</span><strong>{selectedAlert.patientId || "Unlinked"}</strong></div>
            <div className="vp-health-item"><span>Device</span><strong>{selectedAlert.deviceId || "Unavailable"}</strong></div>
            <div className="vp-health-item"><span>Triggered</span><strong>{formatDateTime(selectedAlert.triggeredAt)}</strong></div>
            <div className="vp-health-item"><span>Severity</span><strong>{selectedAlert.severity}</strong></div>
            <div className="vp-health-item"><span>Status</span><strong>{selectedAlert.status}</strong></div>
            <div className="vp-health-item"><span>Reason</span><strong>{selectedAlert.reason}</strong></div>
            <div className="vp-health-item"><span>Reading values</span><strong>{selectedAlert.raw?.reading_values || "Reading snapshot unavailable"}</strong></div>
            <div className="vp-health-item"><span>ML reason</span><strong>{selectedAlert.mlReason || "No ML reason supplied"}</strong></div>
          </div>
        ) : (
          <EmptyState
            title="No alert selected"
            message="Select an alert row to inspect its details and current workflow status."
            icon="alerts"
          />
        )}
      </SectionCard>
    </AppShell>
  );
}
