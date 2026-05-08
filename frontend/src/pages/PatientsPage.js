import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import { FormField } from "../components/FormField";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchFilterBar from "../components/SearchFilterBar";
import SectionCard from "../components/SectionCard";
import { useVitalPulse } from "../context/VitalPulseContext";
import { formatDateTime, getInitials } from "../utils/formatters";

const initialForm = {
  patient_id: "",
  name: "",
  initials: "",
  monitoring_status: "inactive",
};

export default function PatientsPage() {
  const { patients, latestReading, derived, submitPatient, exportCsv } = useVitalPulse();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredPatients = useMemo(() => {
    const value = search.trim().toLowerCase();
    return patients.filter((patient) => {
      if (!value) return true;
      return (
        patient.patient_id?.toLowerCase().includes(value) ||
        patient.name?.toLowerCase().includes(value) ||
        patient.initials?.toLowerCase().includes(value)
      );
    });
  }, [patients, search]);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  function updateSearch(value) {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("q", value.trim());
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await submitPatient(form);
      setMessage("Patient registered.");
      setForm(initialForm);
    } catch (error) {
      setMessage(`Failed to register patient: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Patients"
        subtitle="Register patients, link devices, and review current monitoring status."
        filters={
          <SearchFilterBar
            searchValue={search}
            onSearchChange={updateSearch}
            searchPlaceholder="Search by patient ID or name"
            showExport
            exportDisabled={!patients.length}
            exportLabel="Export readings CSV"
            onClear={() => updateSearch("")}
            primaryAction={
              <PrimaryButton
                type="button"
                variant="secondary"
                disabled={!patients.length}
                onClick={() => exportCsv("readings", "vital-readings.csv")}
              >
                Download readings
              </PrimaryButton>
            }
          />
        }
      />

      <div className="vp-grid vp-grid-metrics">
        <MetricCard icon="patients" label="Registered Patients" value={patients.length} helper="Patient records in the monitoring registry" status={patients.length ? "Loaded" : "Pending"} />
        <MetricCard icon="monitor" label="Monitoring Active" value={patients.filter((patient) => patient.monitoring_status === "active").length} helper="Patients marked active for monitoring" status={latestReading ? "Online" : "Pending"} />
        <MetricCard icon="devices" label="Assigned Device" value={derived.liveDeviceId || "Not linked"} helper="Current live telemetry source" status={derived.deviceState} />
        <MetricCard icon="clock" label="Last Reading" value={latestReading ? formatDateTime(latestReading.timestamp) : "No reading yet"} helper={latestReading ? derived.riskLabel : "Waiting for device data"} status={latestReading ? "Loaded" : "Pending"} />
      </div>

      <div className="vp-grid-two">
        <SectionCard title="Register Patient" subtitle="Create a patient record for rural monitoring and device linkage.">
          <form className="vp-form-grid" onSubmit={handleSubmit}>
            <FormField label="Patient ID">
              <input className="vp-input" required value={form.patient_id} onChange={(event) => setForm((current) => ({ ...current, patient_id: event.target.value }))} />
            </FormField>
            <FormField label="Name">
              <input className="vp-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </FormField>
            <FormField label="Initials">
              <input className="vp-input" value={form.initials} onChange={(event) => setForm((current) => ({ ...current, initials: event.target.value }))} />
            </FormField>
            <FormField label="Monitoring status">
              <select className="vp-input" value={form.monitoring_status} onChange={(event) => setForm((current) => ({ ...current, monitoring_status: event.target.value }))}>
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
              </select>
            </FormField>
            <div className="vp-form-actions">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Patient"}
              </PrimaryButton>
              {message ? <p className="vp-form-message">{message}</p> : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Current Monitoring Link" subtitle="Live telemetry currently being received from the physical device.">
          {latestReading ? (
            <div className="vp-health-grid">
              <div className="vp-health-item"><span>Device</span><strong>{latestReading.device_id || "Unavailable"}</strong></div>
              <div className="vp-health-item"><span>Heart rate</span><strong>{latestReading.heart_rate} bpm</strong></div>
              <div className="vp-health-item"><span>SpO2</span><strong>{latestReading.spo2}%</strong></div>
              <div className="vp-health-item"><span>Temperature</span><strong>{latestReading.temperature} deg C</strong></div>
            </div>
          ) : (
            <EmptyState title="No live reading to map" message="Connect the physical device or use the admin test entry flow to receive the first reading." icon="monitor" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Patient Registry" subtitle="Patient list, device assignment, monitoring status, and latest vitals.">
        <DataTable
          columns={[
            { key: "patient", label: "Patient" },
            { key: "assignedDevice", label: "Assigned Device" },
            { key: "monitoringStatus", label: "Monitoring Status", type: "badge" },
            { key: "latestHeartRate", label: "Latest Heart Rate" },
            { key: "latestSpo2", label: "Latest SpO2" },
            { key: "latestTemperature", label: "Latest Temperature" },
            { key: "riskStatus", label: "Risk / Alert Status", type: "badge" },
            { key: "lastReading", label: "Last Reading" },
            { key: "actions", label: "Actions" },
          ]}
          rows={filteredPatients.map((patient) => ({
            id: patient.patient_id,
            patient: (
              <div className="vp-person-cell">
                <div className="vp-avatar">{patient.initials || getInitials(patient.name || patient.patient_id)}</div>
                <div>
                  <strong>{patient.name || patient.patient_id}</strong>
                  <span>{patient.patient_id}</span>
                </div>
              </div>
            ),
            assignedDevice: patient.assigned_device || "Unassigned",
            monitoringStatus: patient.monitoring_status || "Pending",
            latestHeartRate: patient.latest_heart_rate ? `${patient.latest_heart_rate} bpm` : "No reading",
            latestSpo2: patient.latest_spo2 ? `${patient.latest_spo2}%` : "No reading",
            latestTemperature: patient.latest_temperature ? `${patient.latest_temperature} deg C` : "No reading",
            riskStatus: patient.risk_status || "Pending",
            lastReading: formatDateTime(patient.last_reading),
            actions: (
              <div className="vp-inline-actions">
                <Link className="vp-table-link" to={`/patients/${patient.patient_id}`}>View</Link>
                <Link className="vp-table-link" to="/monitoring">Monitor</Link>
                <Link className="vp-table-link" to="/history">History</Link>
              </div>
            ),
          }))}
          emptyTitle="No patient records available"
          emptyMessage="Register the first patient to begin the patient-device monitoring workflow."
        />
      </SectionCard>
    </AppShell>
  );
}
