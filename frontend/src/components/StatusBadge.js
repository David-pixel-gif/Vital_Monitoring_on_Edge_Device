import { titleCase } from "../utils/formatters";

const MAP = {
  normal: "success",
  online: "success",
  connected: "success",
  ready: "success",
  loaded: "success",
  resolved: "success",
  reviewed: "success",
  warning: "warning",
  pending: "warning",
  stale: "warning",
  acknowledged: "warning",
  critical: "danger",
  offline: "danger",
  failed: "danger",
  open: "danger",
  processing: "info",
  info: "info",
  unassigned: "neutral",
  ai: "ai",
  ml: "ai",
};

export default function StatusBadge({ value, tone }) {
  const label = titleCase(value);
  const resolvedTone = tone || MAP[String(value || "").toLowerCase()] || "neutral";
  return <span className={`vp-badge vp-badge-${resolvedTone}`}>{label}</span>;
}
