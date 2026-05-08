import { useState } from "react";
import AppShell from "../components/AppShell";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import { useVitalPulse } from "../context/VitalPulseContext";

const settingCards = [
  { label: "SpO2 warning below", value: "Endpoint required", description: "Threshold must come from backend configuration." },
  { label: "SpO2 critical below", value: "Endpoint required", description: "Threshold must come from backend configuration." },
  { label: "Heart rate warning range", value: "Endpoint required", description: "Threshold must come from backend configuration." },
  { label: "Temperature warning range", value: "Endpoint required", description: "Threshold must come from backend configuration." },
  { label: "Stale device timeout", value: "5 minutes (frontend fallback)", description: "Used only for UI freshness until server config exists." },
  { label: "ML model version", value: "Endpoint required", description: "Model version is not exposed by the current backend." },
  { label: "Firmware version", value: "Endpoint required", description: "Firmware details require a device registry endpoint." },
  { label: "Device maintenance status", value: "Pending", description: "Maintenance and diagnostics require a device-management endpoint." },
];

export default function SettingsPage() {
  const { derived, errors } = useVitalPulse();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <AppShell>
      <PageHeader
        title="Settings / Maintenance"
        subtitle="Clinical thresholds, stale-device policy, and essential maintenance settings."
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="settings" label="Threshold configuration" value="Server-managed" helper="Editing requires backend settings endpoint" status="Pending" />
        <MetricCard icon="monitor" label="Monitoring status" value={errors.latest ? "Degraded" : "Active"} helper="Based on monitoring API availability" status={errors.latest ? "Warning" : "Online"} />
        <MetricCard icon="spark" label="ML model status" value={derived.mlAvailable ? "Output available" : "Waiting for score"} helper="Based on current telemetry payload" status={derived.mlAvailable ? "Loaded" : "Pending"} accent="ai" />
      </div>

      <SectionCard title="Threshold Settings" subtitle="Nurse and technician-facing vital-sign thresholds and operational safeguards.">
        <div className="vp-settings-grid">
          {settingCards.map((item) => (
            <div className="vp-setting-card" key={item.label}>
              <div className="vp-setting-card-top">
                <h4>{item.label}</h4>
                <StatusBadge value={item.value.includes("required") ? "Pending" : "Loaded"} />
              </div>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
              <PrimaryButton variant="secondary" disabled>
                Edit coming soon
              </PrimaryButton>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Advanced Configuration"
        subtitle="Formatted raw configuration area for server-managed settings."
        action={
          <PrimaryButton variant="ghost" onClick={() => setShowAdvanced((current) => !current)}>
            {showAdvanced ? "Hide raw JSON" : "Show raw JSON"}
          </PrimaryButton>
        }
      >
        {showAdvanced ? (
          <pre className="vp-code-block">{JSON.stringify({
            status: "unavailable",
            reason: "Settings endpoint required",
            monitoring_api: errors.latest ? "error" : "available",
            alerts_api: errors.alerts ? "error" : "available",
            ml_output_available: derived.mlAvailable,
          }, null, 2)}</pre>
        ) : (
          <p className="vp-muted-copy">Advanced server configuration will appear here once a dedicated settings endpoint exists.</p>
        )}
      </SectionCard>
    </AppShell>
  );
}
