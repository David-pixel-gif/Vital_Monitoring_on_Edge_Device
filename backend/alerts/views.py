import json

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import Alert


def alert_payload(alert):
    return {
        "id": alert.id,
        "patient_id": alert.patient_id,
        "device_id": alert.device_id,
        "type": alert.alert_type,
        "severity": alert.severity,
        "reason": alert.reason,
        "reading_values": alert.reading_values,
        "status": alert.status,
        "acknowledged": alert.acknowledged,
        "acknowledged_by": alert.acknowledged_by,
        "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
        "reviewed": alert.reviewed,
        "reviewed_at": alert.reviewed_at.isoformat() if alert.reviewed_at else None,
        "ml_reason": alert.ml_reason,
        "created_at": alert.created_at.isoformat(),
    }


def alerts(request):
    queryset = Alert.objects.order_by("-created_at")
    severity = request.GET.get("severity")
    if severity:
        if severity not in {"warning", "critical", "normal"}:
            return JsonResponse({"detail": "severity must be one of: normal, warning, critical."}, status=400)
        queryset = queryset.filter(severity=severity)
    status = request.GET.get("status")
    if status:
        queryset = queryset.filter(status=status)
    patient_id = request.GET.get("patient_id")
    if patient_id:
        queryset = queryset.filter(patient_id=patient_id)
    device_id = request.GET.get("device_id")
    if device_id:
        queryset = queryset.filter(device_id=device_id)
    return JsonResponse({"alerts": [alert_payload(item) for item in queryset]})


def parse_json(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return {}


def require_authenticated_user(request):
    if request.user.is_authenticated:
        return None
    return JsonResponse({"detail": "Authentication required."}, status=401)


@csrf_exempt
def acknowledge(request, alert_id):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use POST to acknowledge an alert."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error
    alert = Alert.objects.filter(id=alert_id).first()
    if not alert:
        return JsonResponse({"detail": "Alert not found."}, status=404)
    if alert.acknowledged:
        return JsonResponse({"detail": "Alert is already acknowledged."}, status=400)
    payload = parse_json(request)
    alert.acknowledged = True
    alert.acknowledged_by = payload.get("acknowledged_by", "system")
    alert.acknowledged_at = timezone.now()
    alert.status = "acknowledged"
    alert.save()
    return JsonResponse({"alert": alert_payload(alert)})


@csrf_exempt
def review(request, alert_id):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use POST to mark an alert as reviewed."}, status=405)
    auth_error = require_authenticated_user(request)
    if auth_error:
        return auth_error
    alert = Alert.objects.filter(id=alert_id).first()
    if not alert:
        return JsonResponse({"detail": "Alert not found."}, status=404)
    if alert.reviewed:
        return JsonResponse({"detail": "Alert is already marked as reviewed."}, status=400)
    alert.reviewed = True
    alert.reviewed_at = timezone.now()
    alert.status = "reviewed"
    alert.save()
    return JsonResponse({"alert": alert_payload(alert)})
