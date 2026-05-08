import PrimaryButton from "./PrimaryButton";
import StatusBadge from "./StatusBadge";

export default function ReportCard({ report }) {
  return (
    <div className="vp-report-card">
      <div className="vp-report-card-top">
        <div>
          <h4>{report.title}</h4>
          <p>{report.description}</p>
        </div>
        <StatusBadge value={report.status} tone={report.statusTone} />
      </div>
      <dl className="vp-kv-grid">
        <div><dt>Contains</dt><dd>{report.contains}</dd></div>
        <div><dt>Role</dt><dd>{report.role}</dd></div>
        <div><dt>Last generated</dt><dd>{report.lastGenerated}</dd></div>
        <div><dt>Formats</dt><dd>{report.formats}</dd></div>
      </dl>
      <div className="vp-inline-actions">
        <PrimaryButton variant="secondary" disabled={report.previewDisabled}>Preview</PrimaryButton>
        <PrimaryButton variant="ghost" disabled={report.exportDisabled}>CSV</PrimaryButton>
        <PrimaryButton variant="ghost" disabled={report.exportDisabled}>PDF</PrimaryButton>
        <PrimaryButton variant="ghost" disabled={report.exportDisabled}>Excel</PrimaryButton>
      </div>
    </div>
  );
}
