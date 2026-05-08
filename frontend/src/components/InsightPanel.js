import Icon from "./Icon";
import StatusBadge from "./StatusBadge";

export default function InsightPanel({ title, subtitle, items, footer }) {
  return (
    <aside className="vp-insight-panel">
      <div className="vp-card-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="vp-ai-chip">
          <Icon name="spark" size={14} />
          <span>AI Workflow</span>
        </div>
      </div>
      <div className="vp-insight-list">
        {items.map((item) => (
          <div className="vp-insight-item" key={item.label}>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            {item.status ? <StatusBadge value={item.status} /> : null}
          </div>
        ))}
      </div>
      {footer ? <p className="vp-insight-footer">{footer}</p> : null}
    </aside>
  );
}
