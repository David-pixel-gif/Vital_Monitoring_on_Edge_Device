import AppShell from "../components/AppShell";
import ExportCard from "../components/ExportCard";
import PageHeader from "../components/PageHeader";
import { FormField } from "../components/FormField";
import SectionCard from "../components/SectionCard";

const reports = [
  ["Daily Vital Summary", "Daily summary of recorded vital signs.", "Heart rate, SpO2, temperature, timestamps"],
  ["Patient Vital History", "Patient-linked reading history for review.", "Vital readings, anomaly status, reading times"],
  ["Alert History", "Alert log for abnormal readings and acknowledgement review.", "Alert types, severity, reasons, timestamps"],
  ["Device Uptime / Offline Log", "Device availability and stale or offline periods.", "Last seen, offline periods, device status"],
  ["ML Anomaly Summary", "Model output and anomaly pattern summary.", "Anomaly score, status, abnormal pattern output"],
  ["Full Reading Export", "Complete reading dataset for offline analysis.", "All stored reading records"],
].map(([title, description, contains]) => ({
  title,
  description,
  contains,
  count: "Unavailable",
  formats: "CSV",
  lastExported: "Not available",
  disabled: true,
}));

export default function ReportsPage() {
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
          <FormField label="Date range"><input className="vp-input" placeholder="Date range endpoint required" /></FormField>
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
            <ExportCard key={report.title} exportItem={{
              ...report,
              description: report.description,
            }} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Exports" subtitle="Visible when the backend provides export history.">
        <p className="vp-muted-copy">Recent export history is hidden until the backend exposes a real export-history endpoint.</p>
      </SectionCard>
    </AppShell>
  );
}
