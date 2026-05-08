import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchFilterBar from "../components/SearchFilterBar";
import SectionCard from "../components/SectionCard";
import SegmentTabs from "../components/SegmentTabs";
import { useVitalPulse } from "../context/VitalPulseContext";
import { formatDateTime, titleCase } from "../utils/formatters";
import { useSearchParams } from "react-router-dom";

export default function PatientHistoryPage() {
  const { history } = useVitalPulse();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState(null);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesTab =
        tab === "All" ||
        (tab === "Readings" && item.event_type === "reading") ||
        (tab === "Alerts" && item.event_type === "alert") ||
        (tab === "Device events" && item.event_type === "device");
      const value = search.trim().toLowerCase();
      const matchesSearch =
        !value ||
        String(item.patient_id || "").toLowerCase().includes(value) ||
        String(item.device_id || "").toLowerCase().includes(value) ||
        String(item.notes || "").toLowerCase().includes(value);
      return matchesTab && matchesSearch;
    });
  }, [history, search, tab]);

  const selectedEntry = filteredHistory.find((item, index) => `${item.timestamp}-${index}` === selectedEntryId) || filteredHistory[0] || null;

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (!filteredHistory.length) {
      setSelectedEntryId(null);
      return;
    }
    const hasSelected = filteredHistory.some((item, index) => `${item.timestamp}-${index}` === selectedEntryId);
    if (!hasSelected) {
      setSelectedEntryId(`${filteredHistory[0].timestamp}-0`);
    }
  }, [filteredHistory, selectedEntryId]);

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

  return (
    <AppShell>
      <PageHeader
        title="History / Logs"
        subtitle="Review stored monitoring readings, alert events, acknowledgement logs, and device activity."
        tabs={
          <SegmentTabs
            tabs={["All", "Readings", "Alerts", "Device events"]}
            value={tab}
            onChange={setTab}
          />
        }
        filters={
          <SearchFilterBar
            searchValue={search}
            onSearchChange={updateSearch}
            searchPlaceholder="Search by patient ID or device ID"
            onClear={() => updateSearch("")}
          />
        }
      />

      <SectionCard title="Monitoring Logs" subtitle="Timestamped readings, alert events, acknowledgement events, and device offline activity.">
        <DataTable
          columns={[
            { key: "timestamp", label: "Timestamp", render: (value) => formatDateTime(value) },
            { key: "patientId", label: "Patient ID" },
            { key: "deviceId", label: "Device ID" },
            { key: "heartRate", label: "Heart Rate" },
            { key: "spo2", label: "SpO2" },
            { key: "temperature", label: "Temperature" },
            { key: "risk", label: "Risk", type: "badge" },
            { key: "eventType", label: "Event Type" },
            { key: "notes", label: "Notes / Status" },
          ]}
          rows={filteredHistory.map((item, index) => ({
            id: `${item.timestamp}-${index}`,
            timestamp: item.timestamp,
            patientId: item.patient_id || "Unlinked",
            deviceId: item.device_id || "Unlinked",
            heartRate: item.heart_rate ? `${item.heart_rate} bpm` : "-",
            spo2: item.spo2 ? `${item.spo2}%` : "-",
            temperature: item.temperature ? `${item.temperature} deg C` : "-",
            risk: item.risk_status || "Pending",
            eventType: titleCase(item.event_type),
            notes: item.notes || "-",
          }))}
          selectedRowId={selectedEntryId}
          onRowClick={(row) => setSelectedEntryId(row.id)}
          emptyTitle="No monitoring logs available"
          emptyMessage="No readings or alert history have been returned by the backend yet."
        />
      </SectionCard>

      <SectionCard title="Selected Log Detail" subtitle="Expanded detail for the currently selected monitoring event.">
        {selectedEntry ? (
          <div className="vp-health-grid">
            <div className="vp-health-item"><span>Timestamp</span><strong>{formatDateTime(selectedEntry.timestamp)}</strong></div>
            <div className="vp-health-item"><span>Patient ID</span><strong>{selectedEntry.patient_id || "Unlinked"}</strong></div>
            <div className="vp-health-item"><span>Device ID</span><strong>{selectedEntry.device_id || "Unlinked"}</strong></div>
            <div className="vp-health-item"><span>Event type</span><strong>{titleCase(selectedEntry.event_type)}</strong></div>
            <div className="vp-health-item"><span>Risk status</span><strong>{selectedEntry.risk_status || "Pending"}</strong></div>
            <div className="vp-health-item"><span>Anomaly score</span><strong>{selectedEntry.anomaly_score ?? "Unavailable"}</strong></div>
            <div className="vp-health-item"><span>Heart rate</span><strong>{selectedEntry.heart_rate ? `${selectedEntry.heart_rate} bpm` : "Unavailable"}</strong></div>
            <div className="vp-health-item"><span>SpO2</span><strong>{selectedEntry.spo2 ? `${selectedEntry.spo2}%` : "Unavailable"}</strong></div>
            <div className="vp-health-item"><span>Temperature</span><strong>{selectedEntry.temperature ? `${selectedEntry.temperature} deg C` : "Unavailable"}</strong></div>
            <div className="vp-health-item"><span>Notes</span><strong>{selectedEntry.notes || "No notes recorded"}</strong></div>
          </div>
        ) : (
          <EmptyState
            title="No log selected"
            message="Select a monitoring log row to inspect the event details and recorded values."
            icon="history"
          />
        )}
      </SectionCard>
    </AppShell>
  );
}
