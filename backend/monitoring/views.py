import csv
import json
from datetime import timedelta

from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from alerts.models import Alert
from monitoring.models import (
    Device,
    MonitoringSession,
    Patient,
    SystemSettings,
    VitalRecord,
)
from monitoring.services import get_device_state, get_system_settings


def parse_json(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def parse_positive_int(value, field_name, default):
    if value in (None, ""):
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid integer.")
    if parsed <= 0:
        raise ValueError(f"{field_name} must be greater than 0.")
    return parsed


def parse_float_field(value, field_name):
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number.")


def require_authenticated_user(request):
    if request.user.is_authenticated:
        return None
    return JsonResponse({"detail": "Authentication required."}, status=401)


def validate_choice(value, field_name, allowed_values):
    if value not in allowed_values:
        allowed = ", ".join(sorted(allowed_values))
        raise ValueError(f"{field_name} must be one of: {allowed}.")


def patient_payload(patient):
    latest = patient.readings.order_by("-timestamp").first()
    device = patient.devices.order_by("-updated_at").first()
    return {
        "patient_id": patient.patient_id,
        "name": patient.name,
        "initials": patient.initials,
        "monitoring_status": patient.monitoring_status,
        "assigned_device": device.device_id if device else None,
        "latest_heart_rate": latest.heart_rate if latest else None,
        "latest_spo2": latest.spo2 if latest else None,
        "latest_temperature": latest.temperature if latest else None,
        "risk_status": latest.status if latest else None,
        "last_reading": latest.timestamp.isoformat() if latest else None,
    }


def session_payload(session):
    return {
        "id": session.id,
        "patient_id": session.patient.patient_id if session.patient else None,
        "device_id": session.device.device_id if session.device else None,
        "status": session.status,
        "started_at": session.started_at.isoformat(),
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "notes": session.notes,
    }


def device_payload(device):
    latest = device.readings.order_by("-timestamp").first()
    settings = get_system_settings()
    return {
        "device_id": device.device_id,
        "assigned_patient": device.assigned_patient.patient_id if device.assigned_patient else None,
        "location": device.location,
        "status": get_device_state(device, settings),
        "last_seen": device.last_seen.isoformat() if device.last_seen else None,
        "firmware_version": device.firmware_version,
        "model_version": device.model_version,
        "maintenance_status": device.maintenance_status,
        "latest_reading": (
            {
                "heart_rate": latest.heart_rate,
                "spo2": latest.spo2,
                "temperature": latest.temperature,
                "timestamp": latest.timestamp.isoformat(),
            }
            if latest
            else None
        ),
    }


def reading_payload(record):
    return {
        "id": record.id,
        "patient_id": record.patient_id,
        "device_id": record.device_id,
        "heart_rate": record.heart_rate,
        "spo2": record.spo2,
        "temperature": record.temperature,
        "anomaly_score": record.anomaly_score,
        "status": record.status,
        "signal_quality": record.signal_quality,
        "timestamp": record.timestamp.isoformat(),
    }


def latest(request):
    record = VitalRecord.objects.order_by("-timestamp").first()
    if not record:
        return JsonResponse(
            {
                "heart_rate": None,
                "spo2": None,
                "temperature": None,
                "anomaly_score": None,
                "status": "pending",
                "timestamp": None,
                "device_id": None,
                "patient_id": None,
            }
        )
    return JsonResponse(reading_payload(record))


def readings(request):
    try:
        limit = parse_positive_int(request.GET.get("limit"), "limit", 20)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    queryset = VitalRecord.objects.order_by("-timestamp")[:limit]
    return JsonResponse({"readings": [reading_payload(item) for item in queryset]})


@csrf_exempt
def patients(request):
    if request.method == "GET":
        return JsonResponse({"patients": [patient_payload(item) for item in Patient.objects.order_by("patient_id")]})

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use GET to list patients or POST to register a patient."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error

    payload = parse_json(request)
    if payload is None or not payload.get("patient_id"):
        return JsonResponse({"detail": "patient_id is required."}, status=400)
    if len(str(payload["patient_id"]).strip()) < 2:
        return JsonResponse({"detail": "patient_id must be at least 2 characters long."}, status=400)
    monitoring_status = payload.get("monitoring_status", "inactive")
    try:
        validate_choice(monitoring_status, "monitoring_status", {"active", "inactive", "paused"})
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)

    patient, created = Patient.objects.update_or_create(
        patient_id=payload["patient_id"],
        defaults={
            "name": payload.get("name", ""),
            "initials": payload.get("initials", ""),
            "monitoring_status": monitoring_status,
            "notes": payload.get("notes", ""),
        },
    )
    return JsonResponse({"patient": patient_payload(patient), "created": created}, status=201 if created else 200)


@csrf_exempt
def patient_detail(request, patient_id):
    patient = Patient.objects.filter(patient_id=patient_id).first()
    if not patient:
        return JsonResponse({"detail": "Patient not found."}, status=404)

    if request.method == "GET":
        readings = [
            reading_payload(item)
            for item in patient.readings.order_by("-timestamp")[:10]
        ]
        alerts = [
            {
                "id": item.id,
                "severity": item.severity,
                "reason": item.reason,
                "status": item.status,
                "created_at": item.created_at.isoformat(),
                "device_id": item.device_id,
            }
            for item in Alert.objects.filter(patient_id=patient.patient_id).order_by("-created_at")[:10]
        ]
        sessions = [session_payload(item) for item in patient.sessions.order_by("-started_at")[:10]]
        return JsonResponse({"patient": patient_payload(patient), "readings": readings, "alerts": alerts, "sessions": sessions})

    if request.method not in {"PATCH", "POST"}:
        return JsonResponse({"detail": "Method not allowed. Use GET to fetch a patient or PATCH to update one."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    if "monitoring_status" in payload:
        try:
            validate_choice(payload["monitoring_status"], "monitoring_status", {"active", "inactive", "paused"})
        except ValueError as error:
            return JsonResponse({"detail": str(error)}, status=400)

    for field in ["name", "initials", "monitoring_status", "notes"]:
        if field in payload:
            setattr(patient, field, payload[field])
    patient.save()
    return JsonResponse({"patient": patient_payload(patient)})


@csrf_exempt
def devices(request):
    if request.method == "GET":
        return JsonResponse({"devices": [device_payload(item) for item in Device.objects.order_by("device_id")]})

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use GET to list devices or POST to register a device."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error

    payload = parse_json(request)
    if payload is None or not payload.get("device_id"):
        return JsonResponse({"detail": "device_id is required."}, status=400)
    if len(str(payload["device_id"]).strip()) < 2:
        return JsonResponse({"detail": "device_id must be at least 2 characters long."}, status=400)
    maintenance_status = payload.get("maintenance_status", "pending")
    try:
        validate_choice(maintenance_status, "maintenance_status", {"healthy", "pending", "service_due"})
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)

    patient = None
    assigned_patient_id = payload.get("assigned_patient_id") or payload.get("patient_id")
    if assigned_patient_id:
        patient = Patient.objects.filter(patient_id=assigned_patient_id).first()
        if not patient:
            return JsonResponse({"detail": f"Assigned patient '{assigned_patient_id}' does not exist."}, status=400)

    device, created = Device.objects.update_or_create(
        device_id=payload["device_id"],
        defaults={
            "assigned_patient": patient,
            "location": payload.get("location", ""),
            "firmware_version": payload.get("firmware_version", ""),
            "model_version": payload.get("model_version", ""),
            "maintenance_status": maintenance_status,
        },
    )
    return JsonResponse({"device": device_payload(device), "created": created}, status=201 if created else 200)


@csrf_exempt
def device_detail(request, device_id):
    device = Device.objects.filter(device_id=device_id).first()
    if not device:
        return JsonResponse({"detail": "Device not found."}, status=404)

    if request.method == "GET":
        return JsonResponse({"device": device_payload(device)})

    if request.method not in {"PATCH", "POST"}:
        return JsonResponse({"detail": "Method not allowed. Use GET to fetch a device or PATCH to update one."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    if "assigned_patient_id" in payload:
        assigned_patient = Patient.objects.filter(
            patient_id=payload["assigned_patient_id"]
        ).first()
        if payload["assigned_patient_id"] and not assigned_patient:
            return JsonResponse({"detail": f"Assigned patient '{payload['assigned_patient_id']}' does not exist."}, status=400)
        device.assigned_patient = assigned_patient
    if "maintenance_status" in payload:
        try:
            validate_choice(payload["maintenance_status"], "maintenance_status", {"healthy", "pending", "service_due"})
        except ValueError as error:
            return JsonResponse({"detail": str(error)}, status=400)
    for field in ["location", "firmware_version", "model_version", "maintenance_status"]:
        if field in payload:
            setattr(device, field, payload[field])
    device.save()
    return JsonResponse({"device": device_payload(device)})


@csrf_exempt
def sessions(request):
    if request.method == "GET":
        patient_filter = request.GET.get("patient_id")
        device_filter = request.GET.get("device_id")
        queryset = MonitoringSession.objects.order_by("-started_at")
        if patient_filter:
            queryset = queryset.filter(patient__patient_id=patient_filter)
        if device_filter:
            queryset = queryset.filter(device__device_id=device_filter)
        result = [
            session_payload(item)
            for item in queryset
        ]
        return JsonResponse({"sessions": result})

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use GET to list sessions or POST to start a session."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    patient = Patient.objects.filter(patient_id=payload.get("patient_id")).first()
    device = Device.objects.filter(device_id=payload.get("device_id")).first()
    if not payload.get("patient_id") or not patient:
        return JsonResponse({"detail": "A valid patient_id is required to start a monitoring session."}, status=400)
    if not payload.get("device_id") or not device:
        return JsonResponse({"detail": "A valid device_id is required to start a monitoring session."}, status=400)
    if MonitoringSession.objects.filter(status="active", patient=patient).exists():
        return JsonResponse({"detail": f"Patient '{patient.patient_id}' already has an active monitoring session."}, status=400)
    if MonitoringSession.objects.filter(status="active", device=device).exists():
        return JsonResponse({"detail": f"Device '{device.device_id}' already has an active monitoring session."}, status=400)
    session = MonitoringSession.objects.create(
        patient=patient,
        device=device,
        status="active",
        notes=payload.get("notes", ""),
    )
    if patient:
        patient.monitoring_status = "active"
        patient.save()
    return JsonResponse(
        {
            "session": {
                "id": session.id,
                "patient_id": patient.patient_id if patient else None,
                "device_id": device.device_id if device else None,
                "status": session.status,
                "started_at": session.started_at.isoformat(),
            }
        },
        status=201,
    )


@csrf_exempt
def stop_session(request, session_id):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use POST to stop a monitoring session."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error

    session = MonitoringSession.objects.filter(id=session_id).first()
    if not session:
        return JsonResponse({"detail": "Session not found."}, status=404)
    if session.status != "active":
        return JsonResponse({"detail": "Only active sessions can be stopped."}, status=400)

    session.status = "stopped"
    session.ended_at = timezone.now()
    session.save()
    if session.patient:
        session.patient.monitoring_status = "inactive"
        session.patient.save()
    return JsonResponse({"session_id": session.id, "status": session.status})


def history(request):
    try:
        limit = parse_positive_int(request.GET.get("limit"), "limit", 50)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    readings = [
        {
            "timestamp": item.timestamp.isoformat(),
            "patient_id": item.patient_id,
            "device_id": item.device_id,
            "heart_rate": item.heart_rate,
            "spo2": item.spo2,
            "temperature": item.temperature,
            "risk_status": item.status,
            "anomaly_score": item.anomaly_score,
            "event_type": "reading",
            "notes": item.status,
        }
        for item in VitalRecord.objects.order_by("-timestamp")[:limit]
    ]
    alert_events = [
        {
            "timestamp": item.created_at.isoformat(),
            "patient_id": item.patient_id,
            "device_id": item.device_id,
            "heart_rate": None,
            "spo2": None,
            "temperature": None,
            "risk_status": item.severity,
            "anomaly_score": None,
            "event_type": "alert",
            "notes": item.reason,
        }
        for item in Alert.objects.order_by("-created_at")[:limit]
    ]
    events = sorted(readings + alert_events, key=lambda item: item["timestamp"], reverse=True)
    return JsonResponse({"history": events[:limit]})


def system_status(request):
    settings = get_system_settings()
    latest_record = VitalRecord.objects.order_by("-timestamp").first()
    active_devices = [
        item for item in Device.objects.all() if get_device_state(item, settings) == "online"
    ]
    payload = {
        "system_status": "online",
        "ml_model_status": "loaded" if latest_record and latest_record.anomaly_score is not None else "pending",
        "last_reading_timestamp": latest_record.timestamp.isoformat() if latest_record else None,
        "open_alerts": Alert.objects.filter(status="open").count(),
        "active_devices": len(active_devices),
        "stale_device_timeout_minutes": settings.stale_device_timeout_minutes,
    }
    return JsonResponse(payload)


@csrf_exempt
def settings_view(request):
    settings = get_system_settings()
    if request.method == "GET":
        return JsonResponse(
            {
                "spo2_warning_below": settings.spo2_warning_below,
                "spo2_critical_below": settings.spo2_critical_below,
                "heart_rate_warning_low": settings.heart_rate_warning_low,
                "heart_rate_warning_high": settings.heart_rate_warning_high,
                "temperature_warning_low": settings.temperature_warning_low,
                "temperature_warning_high": settings.temperature_warning_high,
                "stale_device_timeout_minutes": settings.stale_device_timeout_minutes,
                "ml_model_version": settings.ml_model_version,
                "firmware_version": settings.firmware_version,
                "device_maintenance_status": settings.device_maintenance_status,
                "updated_at": settings.updated_at.isoformat(),
            }
        )

    if request.method not in {"PATCH", "POST"}:
        return JsonResponse({"detail": "Method not allowed. Use GET to read settings or PATCH to update them."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    editable_fields = [
        "spo2_warning_below",
        "spo2_critical_below",
        "heart_rate_warning_low",
        "heart_rate_warning_high",
        "temperature_warning_low",
        "temperature_warning_high",
        "stale_device_timeout_minutes",
        "ml_model_version",
        "firmware_version",
        "device_maintenance_status",
    ]
    try:
        for field in editable_fields:
            if field not in payload:
                continue
            if field in {
                "spo2_warning_below",
                "spo2_critical_below",
                "temperature_warning_low",
                "temperature_warning_high",
            }:
                setattr(settings, field, parse_float_field(payload[field], field))
            elif field in {
                "heart_rate_warning_low",
                "heart_rate_warning_high",
                "stale_device_timeout_minutes",
            }:
                setattr(settings, field, int(payload[field]))
            else:
                setattr(settings, field, payload[field])
    except (TypeError, ValueError) as error:
        return JsonResponse({"detail": str(error)}, status=400)
    if settings.device_maintenance_status:
        try:
            validate_choice(settings.device_maintenance_status, "device_maintenance_status", {"healthy", "pending", "service_due"})
        except ValueError as error:
            return JsonResponse({"detail": str(error)}, status=400)
    if settings.spo2_critical_below >= settings.spo2_warning_below:
        return JsonResponse({"detail": "spo2_critical_below must be less than spo2_warning_below."}, status=400)
    if settings.heart_rate_warning_low >= settings.heart_rate_warning_high:
        return JsonResponse({"detail": "heart_rate_warning_low must be less than heart_rate_warning_high."}, status=400)
    if settings.temperature_warning_low >= settings.temperature_warning_high:
        return JsonResponse({"detail": "temperature_warning_low must be less than temperature_warning_high."}, status=400)
    if settings.stale_device_timeout_minutes <= 0:
        return JsonResponse({"detail": "stale_device_timeout_minutes must be greater than 0."}, status=400)
    settings.save()
    return JsonResponse({"updated": True})


def export_catalog(request):
    return JsonResponse(
        {
            "exports": [
                "daily-vital-summary",
                "patient-vital-history",
                "alert-history",
                "device-uptime-log",
                "ml-anomaly-summary",
                "full-reading-export",
            ]
        }
    )


def export_data(request, kind):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{kind}.csv"'
    writer = csv.writer(response)

    if kind == "readings":
        writer.writerow(["timestamp", "patient_id", "device_id", "heart_rate", "spo2", "temperature", "anomaly_score", "status"])
        for item in VitalRecord.objects.order_by("-timestamp"):
            writer.writerow([item.timestamp.isoformat(), item.patient_id, item.device_id, item.heart_rate, item.spo2, item.temperature, item.anomaly_score, item.status])
        return response

    if kind == "alerts":
        writer.writerow(["created_at", "alert_id", "patient_id", "device_id", "type", "severity", "reason", "status"])
        for item in Alert.objects.order_by("-created_at"):
            writer.writerow([item.created_at.isoformat(), item.id, item.patient_id, item.device_id, item.alert_type, item.severity, item.reason, item.status])
        return response

    if kind == "devices":
        writer.writerow(["device_id", "assigned_patient", "location", "status", "last_seen", "firmware_version", "model_version"])
        settings = get_system_settings()
        for item in Device.objects.order_by("device_id"):
            writer.writerow([
                item.device_id,
                item.assigned_patient.patient_id if item.assigned_patient else "",
                item.location,
                get_device_state(item, settings),
                item.last_seen.isoformat() if item.last_seen else "",
                item.firmware_version,
                item.model_version,
            ])
        return response

    return JsonResponse({"detail": "Unknown export kind."}, status=404)
