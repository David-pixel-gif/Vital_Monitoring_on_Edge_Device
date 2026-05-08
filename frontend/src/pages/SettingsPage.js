import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import CollapsibleSection from "../components/CollapsibleSection";
import { FormField } from "../components/FormField";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SectionCard from "../components/SectionCard";
import { useVitalPulse } from "../context/VitalPulseContext";

export default function SettingsPage() {
  const { derived, errors, settings, saveSettings } = useVitalPulse();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage("");
    try {
      await saveSettings({
        spo2_warning_below: Number(form.spo2_warning_below),
        spo2_critical_below: Number(form.spo2_critical_below),
        heart_rate_warning_low: Number(form.heart_rate_warning_low),
        heart_rate_warning_high: Number(form.heart_rate_warning_high),
        temperature_warning_low: Number(form.temperature_warning_low),
        temperature_warning_high: Number(form.temperature_warning_high),
        stale_device_timeout_minutes: Number(form.stale_device_timeout_minutes),
        ml_model_version: form.ml_model_version,
        firmware_version: form.firmware_version,
        device_maintenance_status: form.device_maintenance_status,
      });
      setMessage("Settings updated.");
    } catch (error) {
      setMessage(`Failed to update settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Settings / Maintenance"
        subtitle="Clinical thresholds, stale-device policy, and essential maintenance settings."
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="settings" label="Threshold configuration" value="Server-managed" helper="Thresholds now load from backend settings" status={settings ? "Loaded" : "Pending"} />
        <MetricCard icon="monitor" label="Monitoring status" value={errors.latest ? "Degraded" : "Active"} helper="Based on monitoring API availability" status={errors.latest ? "Warning" : "Online"} />
        <MetricCard icon="spark" label="ML model status" value={derived.mlAvailable ? "Output available" : "Waiting for score"} helper="Based on current telemetry payload" status={derived.mlAvailable ? "Loaded" : "Pending"} accent="ai" />
      </div>

      <SectionCard title="Threshold Settings" subtitle="Nurse and technician-facing vital-sign thresholds and operational safeguards.">
        {form ? (
          <form className="vp-form-grid" onSubmit={handleSubmit}>
            <FormField label="SpO2 warning below"><input className="vp-input" value={form.spo2_warning_below} onChange={(event) => setForm((current) => ({ ...current, spo2_warning_below: event.target.value }))} /></FormField>
            <FormField label="SpO2 critical below"><input className="vp-input" value={form.spo2_critical_below} onChange={(event) => setForm((current) => ({ ...current, spo2_critical_below: event.target.value }))} /></FormField>
            <FormField label="Heart-rate warning low"><input className="vp-input" value={form.heart_rate_warning_low} onChange={(event) => setForm((current) => ({ ...current, heart_rate_warning_low: event.target.value }))} /></FormField>
            <FormField label="Heart-rate warning high"><input className="vp-input" value={form.heart_rate_warning_high} onChange={(event) => setForm((current) => ({ ...current, heart_rate_warning_high: event.target.value }))} /></FormField>
            <FormField label="Temperature warning low"><input className="vp-input" value={form.temperature_warning_low} onChange={(event) => setForm((current) => ({ ...current, temperature_warning_low: event.target.value }))} /></FormField>
            <FormField label="Temperature warning high"><input className="vp-input" value={form.temperature_warning_high} onChange={(event) => setForm((current) => ({ ...current, temperature_warning_high: event.target.value }))} /></FormField>
            <FormField label="Stale device timeout"><input className="vp-input" value={form.stale_device_timeout_minutes} onChange={(event) => setForm((current) => ({ ...current, stale_device_timeout_minutes: event.target.value }))} /></FormField>
            <FormField label="ML model version"><input className="vp-input" value={form.ml_model_version} onChange={(event) => setForm((current) => ({ ...current, ml_model_version: event.target.value }))} /></FormField>
            <FormField label="Firmware version"><input className="vp-input" value={form.firmware_version} onChange={(event) => setForm((current) => ({ ...current, firmware_version: event.target.value }))} /></FormField>
            <FormField label="Device maintenance status"><input className="vp-input" value={form.device_maintenance_status} onChange={(event) => setForm((current) => ({ ...current, device_maintenance_status: event.target.value }))} /></FormField>
            <div className="vp-form-actions">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </PrimaryButton>
              {message ? <p className="vp-form-message">{message}</p> : null}
            </div>
          </form>
        ) : (
          <p className="vp-muted-copy">Loading settings from backend.</p>
        )}
      </SectionCard>

      <CollapsibleSection
        title="Advanced Configuration"
        subtitle="Formatted raw configuration area for server-managed settings."
        open={showAdvanced}
        onToggle={() => setShowAdvanced((current) => !current)}
        collapsedCopy="Advanced server configuration remains collapsed to keep the maintenance page focused on practical thresholds."
      >
        <pre className="vp-code-block">{JSON.stringify({
          monitoring_api: errors.latest ? "error" : "available",
          alerts_api: errors.alerts ? "error" : "available",
          ml_output_available: derived.mlAvailable,
          settings,
        }, null, 2)}</pre>
      </CollapsibleSection>
    </AppShell>
  );
}
