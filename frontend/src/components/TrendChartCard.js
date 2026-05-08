import EmptyState from "./EmptyState";
import SectionCard from "./SectionCard";
import { formatDateTime } from "../utils/formatters";

function buildPoints(samples, key) {
  const values = samples
    .map((sample) => Number(sample[key]))
    .filter((value) => !Number.isNaN(value));
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = max === min ? 50 : 100 - ((value - min) / (max - min)) * 90 - 5;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function TrendChartCard({
  title,
  subtitle,
  samples,
  dataKey,
  stroke = "var(--primary)",
}) {
  const points = buildPoints([...samples].reverse(), dataKey);
  return (
    <SectionCard title={title} subtitle={subtitle}>
      {points ? (
        <div className="vp-chart-shell">
          <svg viewBox="0 0 100 100" className="vp-chart">
            <defs>
              <linearGradient id={`${dataKey}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.24" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke={stroke}
              strokeWidth="3"
              points={points}
            />
          </svg>
          <p className="vp-chart-caption">
            Latest sample {formatDateTime(samples[0]?.timestamp)}
          </p>
        </div>
      ) : (
        <EmptyState
          icon="monitor"
          title="Trend data not available yet"
          message="Open this screen while readings arrive to build a live clinical trend."
        />
      )}
    </SectionCard>
  );
}
