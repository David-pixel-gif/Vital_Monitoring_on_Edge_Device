import { useState } from "react";
import AppShell from "../components/AppShell";
import ExportCard from "../components/ExportCard";
import PageHeader from "../components/PageHeader";
import { FormField } from "../components/FormField";
import SectionCard from "../components/SectionCard";
import { useVitalPulse } from "../context/VitalPulseContext";

const EXPORT_MAP = {
  "Daily Vital Summary": "readings",
  "Patient Vital History": "readings",
  "Alert History": "alerts",
  "Device Uptime / Offline Log": "devices",
  "ML Anomaly Summary": "readings",
  "Full Reading Export": "readings",
};

export default function ReportsPage() {
  const { exportCatalog, exportCsv } = useVitalPulse();
  const [format] = useState("csv");

  const reports = [
    ["Daily Vital Summary", "Daily summary of recorded vital signs.", "Heart rate, SpO2, temperature, timestamps"],
    ["Patient Vital History", "Patient-linked reading history for review.", "Vital readings, anomaly status, reading times"],
    ["Alert History", "Alert log for abnormal readings and acknowledgement review.", "Alert types, severity, reasons, timestamps"],
    ["Device Uptime / Offline Log", "Device availability and stale or offline periods.", "Last seen, offline periods, device status"],
    ["ML Anomaly Summary", "Model output and anomaly pattern summary.", "Anomaly score, status, abnormal pattern output"],
    ["Full Reading Export", "Complete reading dataset for offline analysis.", "All stored reading records"],
  ].map(([title, description, contains]) => {
    const kind = EXPORT_MAP[title];
    const supported = exportCatalog.includes(
      kind === "devices"
        ? "device-uptime-log"
        : kind === "alerts"
          ? "alert-history"
          : "full-reading-export"
    ) || exportCatalog.length > 0;
    return {
      title,
      description,
      count: "Available",
      formats: "CSV",
      lastExported: "On demand",
      disabled: !supported || format !== "csv",
      onClick: () => exportCsv(kind, `${kind}.csv`),
      icon: "export",
    };
  });

  return (
    <AppShell>
      <PageHeader
        title="Reports / Export"
        subtitle="Simple export tools for readings, alerts, device logs, and anomaly summaries."
      />

      <SectionCard title="Export Filters" subtitle="Choose the scope of the readings or logs you want to export.">
        <div className="vp-form-grid">
          <FormField label="Patient ID"><input className="vp-input" placeholder="Optional patient filter" /></FormField>
          <FormField label="Device ID"><input className="vp-input" placeholder="Optional device filter" /></FormField>
          <FormField label="Date range"><input className="vp-input" placeholder="Date range filter not yet wired" /></FormField>
          <FormField label="Report type">
            <select className="vp-input" defaultValue="daily">
              <option value="daily">Daily Vital Summary</option>
              <option value="history">Patient Vital History</option>
              <option value="alerts">Alert History</option>
              <option value="uptime">Device Uptime / Offline Log</option>
              <option value="anomaly">ML Anomaly Summary</option>
              <option value="full">Full Reading Export</option>
            </select>
          </FormField>
          <FormField label="Format">
            <select className="vp-input" defaultValue="csv">
              <option value="csv">CSV</option>
              <option value="pdf" disabled>PDF coming soon</option>
              <option value="excel" disabled>Excel coming soon</option>
            </select>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Available Exports" subtitle="Only simple reading, alert, and device-log exports are kept in scope for this project.">
        <div className="vp-export-grid">
          {reports.map((report) => (
            <ExportCard key={report.title} exportItem={report} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Exports" subtitle="Visible when the backend provides export history.">
        <p className="vp-muted-copy">Export history is not provided by the backend yet, but CSV export operations are now live.</p>
      </SectionCard>
    </AppShell>
  );
}
