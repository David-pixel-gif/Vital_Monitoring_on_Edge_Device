import json

from django.http import JsonResponse
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from monitoring.models import Patient, VitalRecord
from monitoring.services import create_alert_for_record, ensure_device


def parse_numeric(value, field, cast_type=float):
    try:
        return cast_type(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field} must be a valid number.")


@csrf_exempt
def ingest(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use POST to ingest a device reading."}, status=405)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    required = ["device_id", "heart_rate", "spo2", "temperature"]
    missing = [field for field in required if field not in data]
    if missing:
        return JsonResponse({"detail": f"Missing required fields: {', '.join(missing)}."}, status=400)

    patient = None
    patient_ref = data.get("patient_id")
    if patient_ref:
        patient = Patient.objects.filter(patient_id=patient_ref).first()
        if not patient:
            return JsonResponse({"detail": f"Patient '{patient_ref}' does not exist. Register the patient before ingesting linked readings."}, status=400)

    try:
        heart_rate = parse_numeric(data.get("heart_rate"), "heart_rate", int)
        spo2 = parse_numeric(data.get("spo2"), "spo2")
        temperature = parse_numeric(data.get("temperature"), "temperature")
        anomaly_score = parse_numeric(data.get("anomaly_score", 0), "anomaly_score")
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)

    if heart_rate <= 0:
        return JsonResponse({"detail": "heart_rate must be greater than 0."}, status=400)
    if not 0 <= spo2 <= 100:
        return JsonResponse({"detail": "spo2 must be between 0 and 100."}, status=400)
    if not 20 <= temperature <= 45:
        return JsonResponse({"detail": "temperature must be between 20 and 45 deg C."}, status=400)
    if not 0 <= anomaly_score <= 1:
        return JsonResponse({"detail": "anomaly_score must be between 0 and 1."}, status=400)

    device = ensure_device(data["device_id"], patient=patient)
    parsed_timestamp = parse_datetime(data["timestamp"]) if data.get("timestamp") else None
    if data.get("timestamp") and parsed_timestamp is None:
        return JsonResponse({"detail": "timestamp must be a valid ISO-8601 datetime string."}, status=400)
    if parsed_timestamp and timezone.is_naive(parsed_timestamp):
        parsed_timestamp = timezone.make_aware(parsed_timestamp, timezone.get_current_timezone())
    record = VitalRecord.objects.create(
        patient_link=patient,
        device_link=device,
        patient_id=patient_ref or "",
        device_id=data["device_id"],
        heart_rate=heart_rate,
        spo2=spo2,
        temperature=temperature,
        anomaly_score=anomaly_score,
        status=data.get("status", "normal"),
        signal_quality=data.get("signal_quality"),
        timestamp=parsed_timestamp or timezone.now(),
    )
    alert = create_alert_for_record(record)
    return JsonResponse(
        {
            "status": "stored",
            "reading_id": record.id,
            "alert_created": bool(alert),
            "alert_id": alert.id if alert else None,
        },
        status=201,
    )
