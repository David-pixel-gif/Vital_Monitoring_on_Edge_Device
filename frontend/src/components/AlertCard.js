import PrimaryButton from "./PrimaryButton";
import StatusBadge from "./StatusBadge";
import { formatDateTime } from "../utils/formatters";

export default function AlertCard({ alert }) {
  return (
    <div className="vp-alert-card">
      <div className="vp-alert-card-top">
        <div>
          <h4>{alert.reason}</h4>
          <p>{alert.type} event</p>
        </div>
        <div className="vp-alert-badges">
          <StatusBadge value={alert.severity} />
          <StatusBadge value={alert.status} />
        </div>
      </div>
      <dl className="vp-kv-grid">
        <div><dt>Patient</dt><dd>{alert.patientId || "Patient endpoint required"}</dd></div>
        <div><dt>Device</dt><dd>{alert.deviceId || "Unavailable"}</dd></div>
        <div><dt>Triggered</dt><dd>{formatDateTime(alert.triggeredAt)}</dd></div>
        <div><dt>ML reason</dt><dd>{alert.mlReason || "No ML reason supplied"}</dd></div>
      </dl>
      <div className="vp-inline-actions">
        <PrimaryButton variant="secondary">View</PrimaryButton>
        <PrimaryButton variant="ghost" disabled>Acknowledge</PrimaryButton>
        <PrimaryButton variant="ghost" disabled>Escalate</PrimaryButton>
      </div>
    </div>
  );
}
