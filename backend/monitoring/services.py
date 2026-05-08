from datetime import timedelta

from django.utils import timezone

from alerts.models import Alert
from monitoring.models import Device, SystemSettings


def get_system_settings():
    settings = SystemSettings.objects.first()
    if settings:
        return settings
    return SystemSettings.objects.create()


def get_device_state(device, settings=None):
    settings = settings or get_system_settings()
    if not device:
        return "offline"
    if not device.last_seen:
        return device.status or "ready"
    stale_cutoff = timezone.now() - timedelta(
        minutes=settings.stale_device_timeout_minutes
    )
    if device.last_seen < stale_cutoff:
        return "stale"
    return "online"


def evaluate_alert_reasons(record, settings):
    reasons = []
    severity = "normal"

    if record.spo2 < settings.spo2_critical_below:
        reasons.append(f"SpO2 critically low at {record.spo2}%")
        severity = "critical"
    elif record.spo2 < settings.spo2_warning_below:
        reasons.append(f"SpO2 below warning threshold at {record.spo2}%")
        severity = "warning"

    if record.heart_rate < settings.heart_rate_warning_low:
        reasons.append(f"Heart rate below range at {record.heart_rate} bpm")
        severity = "critical" if record.heart_rate < 40 else max_level(severity, "warning")
    elif record.heart_rate > settings.heart_rate_warning_high:
        reasons.append(f"Heart rate above range at {record.heart_rate} bpm")
        severity = "critical" if record.heart_rate > 140 else max_level(severity, "warning")

    if record.temperature < settings.temperature_warning_low:
        reasons.append(f"Temperature below range at {record.temperature} deg C")
        severity = max_level(severity, "warning")
    elif record.temperature > settings.temperature_warning_high:
        reasons.append(f"Temperature above range at {record.temperature} deg C")
        severity = "critical" if record.temperature >= 39 else max_level(severity, "warning")

    if record.anomaly_score >= 0.8:
        reasons.append(f"High anomaly score {record.anomaly_score}")
        severity = "critical"
    elif record.anomaly_score >= 0.5:
        reasons.append(f"Elevated anomaly score {record.anomaly_score}")
        severity = max_level(severity, "warning")

    return reasons, severity


def max_level(current, candidate):
    levels = {"normal": 0, "warning": 1, "critical": 2}
    return candidate if levels[candidate] > levels.get(current, 0) else current


def create_alert_for_record(record):
    settings = get_system_settings()
    reasons, severity = evaluate_alert_reasons(record, settings)
    if not reasons:
        return None

    alert_type = "pattern_anomaly" if record.anomaly_score >= 0.5 else "vital_threshold"
    alert = Alert.objects.create(
        vital_record=record,
        vital_id=str(record.id),
        patient_id=record.patient_id or "",
        device_id=record.device_id,
        alert_type=alert_type,
        severity=severity,
        reason="; ".join(reasons),
        reading_values=(
            f"HR {record.heart_rate} bpm | SpO2 {record.spo2}% | "
            f"Temp {record.temperature} deg C | Score {record.anomaly_score}"
        ),
        status="open",
        ml_reason=(
            f"Anomaly score {record.anomaly_score}"
            if record.anomaly_score >= 0.5
            else ""
        ),
    )
    return alert


def ensure_device(device_id, patient=None):
    device, _ = Device.objects.get_or_create(device_id=device_id)
    if patient and device.assigned_patient_id != patient.id:
        device.assigned_patient = patient
    device.last_seen = timezone.now()
    device.status = "online"
    device.save()
    return device
