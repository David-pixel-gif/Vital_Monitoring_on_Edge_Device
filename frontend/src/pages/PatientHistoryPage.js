import { useState } from "react";
import AppShell from "../components/AppShell";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchFilterBar from "../components/SearchFilterBar";
import SectionCard from "../components/SectionCard";
import SegmentTabs from "../components/SegmentTabs";

export default function PatientHistoryPage() {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");

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
            onSearchChange={setSearch}
            searchPlaceholder="Search by patient ID"
            filters={[
              { label: "Device", value: "all", disabled: true, onChange: () => {}, options: [{ value: "all", label: "Filter by device" }] },
              { label: "Severity", value: "all", disabled: true, onChange: () => {}, options: [{ value: "all", label: "Filter by severity" }] },
            ]}
            onClear={() => setSearch("")}
          />
        }
      />

      <SectionCard title="Monitoring Logs" subtitle="Timestamped readings, alert events, acknowledgement events, and device offline activity.">
        <DataTable
          columns={[
            { key: "timestamp", label: "Timestamp" },
            { key: "patientId", label: "Patient ID" },
            { key: "deviceId", label: "Device ID" },
            { key: "heartRate", label: "Heart Rate" },
            { key: "spo2", label: "SpO2" },
            { key: "temperature", label: "Temperature" },
            { key: "risk", label: "Risk", type: "badge" },
            { key: "eventType", label: "Event Type" },
            { key: "notes", label: "Notes / Status" },
          ]}
          rows={[]}
          emptyTitle="No monitoring logs available"
          emptyMessage="A readings-history or event-log endpoint is required before this page can show stored monitoring sessions and alert history."
        />
      </SectionCard>
    </AppShell>
  );
}
