import Icon from "./Icon";
import StatusBadge from "./StatusBadge";

export default function MetricCard({
  icon,
  label,
  value,
  helper,
  change,
  status,
  accent = "primary",
}) {
  return (
    <div className="vp-metric-card">
      <div className={`vp-metric-icon vp-metric-icon-${accent}`}>
        <Icon name={icon} size={18} />
      </div>
      <div className="vp-metric-content">
        <div className="vp-metric-topline">
          <span>{label}</span>
          {status ? <StatusBadge value={status} /> : null}
        </div>
        <strong>{value}</strong>
        <div className="vp-metric-footer">
          {helper ? <span>{helper}</span> : <span />}
          {change ? <span>{change}</span> : null}
        </div>
      </div>
    </div>
  );
}
