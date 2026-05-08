import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";

export default function ExportCard({ exportItem }) {
  return (
    <div className="vp-export-card">
      <div className="vp-export-icon">
        <Icon name={exportItem.icon || "export"} size={18} />
      </div>
      <div className="vp-export-content">
        <h4>{exportItem.title}</h4>
        <p>{exportItem.description}</p>
        <dl className="vp-kv-grid">
          <div><dt>Records</dt><dd>{exportItem.count}</dd></div>
          <div><dt>Formats</dt><dd>{exportItem.formats}</dd></div>
          <div><dt>Last export</dt><dd>{exportItem.lastExported}</dd></div>
        </dl>
      </div>
      <PrimaryButton variant="secondary" disabled={exportItem.disabled}>
        {exportItem.disabled ? "Endpoint required" : "Export"}
      </PrimaryButton>
    </div>
  );
}
