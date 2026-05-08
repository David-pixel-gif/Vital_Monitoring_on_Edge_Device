export function formatDateTime(value) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid timestamp";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid timestamp";
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}

export function formatNumber(value, fallback = "Unavailable") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "number") return String(value);
  return new Intl.NumberFormat("en-AU").format(value);
}

export function formatMetric(value, unit = "", fallback = "Unavailable") {
  if (value === null || value === undefined || value === "") return fallback;
  return `${value}${unit ? ` ${unit}` : ""}`;
}

export function titleCase(value) {
  if (!value) return "Unavailable";
  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getRiskLabel(latest) {
  if (!latest) return "Pending";
  const score = Number(latest.anomaly_score);
  if (!Number.isNaN(score)) {
    if (score >= 0.8) return "Critical";
    if (score >= 0.5) return "Warning";
  }
  return latest.status ? titleCase(latest.status) : "Normal";
}

export function getStaleState(timestamp, minutes = 5) {
  if (!timestamp) return "Pending";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Pending";
  const ageMs = Date.now() - date.getTime();
  return ageMs > minutes * 60 * 1000 ? "Stale" : "Online";
}

export function getInitials(label) {
  if (!label) return "VP";
  const parts = String(label).split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}
