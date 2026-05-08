import json
import os
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
SITE_PACKAGES = BASE_DIR / "myenv" / "Lib" / "site-packages"
if SITE_PACKAGES.exists():
    sys.path.append(str(SITE_PACKAGES))
sys.path.append(str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django

django.setup()

from django.core.management import call_command
from django.test import Client

from alerts.models import Alert
from monitoring.models import Device, MonitoringSession, Patient, SystemSettings, VitalRecord
from users.models import User


call_command("flush", interactive=False)


def assert_status(name, response, expected):
    if response.status_code != expected:
        raise AssertionError(
            f"{name} failed: expected {expected}, got {response.status_code}, body={response.content!r}"
        )
    print(f"[ok] {name}")


def assert_contains(name, response, expected_text):
    body = response.json()
    detail = body.get("detail", "")
    if expected_text not in detail:
        raise AssertionError(
            f"{name} failed: expected detail containing {expected_text!r}, got {detail!r}"
        )
    print(f"[ok] {name}")


client = Client()


def post_json(path, payload):
    return client.post(path, data=json.dumps(payload), content_type="application/json")


def patch_json(path, payload):
    return client.generic("PATCH", path, data=json.dumps(payload), content_type="application/json")


response = client.get("/api/auth/me/")
assert_status("auth me requires login", response, 401)
assert_contains("auth me message", response, "Authentication required")

response = post_json("/api/monitoring/patients/", {"patient_id": "P-UNAUTH"})
assert_status("patient create requires auth", response, 401)
assert_contains("patient create auth message", response, "Authentication required")

response = client.get("/api/auth/register/")
assert_status("register method validation", response, 405)
assert_contains("register method message", response, "Use POST to register")

response = post_json("/api/auth/register/", {"username": "nu", "password": "123", "role": "NURSE"})
assert_status("register validation", response, 400)
assert_contains("register validation message", response, "at least 3 characters")

response = post_json("/api/auth/register/", {"username": "nurse1", "password": "secret12", "role": "NURSE"})
assert_status("register user", response, 201)

response = post_json("/api/auth/register/", {"username": "nurse1", "password": "secret12", "role": "NURSE"})
assert_status("duplicate register blocked", response, 400)
assert_contains("duplicate register message", response, "already exists")

response = post_json("/api/auth/login/", {"username": "nurse1", "password": "wrongpass"})
assert_status("login invalid credentials", response, 401)
assert_contains("login invalid message", response, "Invalid username or password")

response = client.get("/api/auth/login/")
assert_status("login method validation", response, 405)
assert_contains("login method message", response, "Use POST to log in")

response = post_json("/api/auth/login/", {"username": "nurse1", "password": "secret12"})
assert_status("login user", response, 200)

response = client.get("/api/auth/me/")
assert_status("auth me after login", response, 200)


patient_payload = {
    "patient_id": "P-001",
    "name": "Rural Test Patient",
    "initials": "RTP",
    "monitoring_status": "active",
}
response = post_json("/api/monitoring/patients/", patient_payload)
assert_status("create patient", response, 201)

response = client.get("/api/monitoring/patients/")
assert_status("list patients", response, 200)

response = client.get("/api/monitoring/patients/P-001/")
assert_status("patient detail", response, 200)

response = patch_json("/api/monitoring/patients/P-001/", {"monitoring_status": "unknown"})
assert_status("invalid patient status blocked", response, 400)
assert_contains("invalid patient status message", response, "monitoring_status must be one of")

device_payload = {
    "device_id": "DEV-001",
    "assigned_patient_id": "P-001",
    "location": "Ward A",
    "firmware_version": "1.0.0",
    "model_version": "PulseSense-A",
}
response = post_json("/api/monitoring/devices/", device_payload)
assert_status("create device", response, 201)

response = client.get("/api/monitoring/devices/")
assert_status("list devices", response, 200)

response = post_json(
    "/api/monitoring/devices/",
    {"device_id": "DEV-002", "maintenance_status": "broken"},
)
assert_status("invalid device maintenance blocked", response, 400)
assert_contains("invalid device maintenance message", response, "maintenance_status must be one of")

response = post_json(
    "/api/monitoring/sessions/",
    {"patient_id": "P-001", "device_id": "DEV-001", "notes": "Initial monitoring session"},
)
assert_status("start session", response, 201)
session_id = response.json()["session"]["id"]

response = client.get("/api/monitoring/sessions/?patient_id=P-001")
assert_status("list sessions", response, 200)

response = post_json(
    "/api/monitoring/sessions/",
    {"patient_id": "P-001", "device_id": "DEV-001"},
)
assert_status("duplicate session blocked", response, 400)
assert_contains("duplicate session message", response, "already has an active monitoring session")

response = post_json(
    "/api/ingest/",
    {
        "patient_id": "P-404",
        "device_id": "DEV-001",
        "heart_rate": 80,
        "spo2": 98,
        "temperature": 36.6,
    },
)
assert_status("ingest invalid patient", response, 400)
assert_contains("ingest invalid patient message", response, "does not exist")

response = post_json(
    "/api/ingest/",
    {
        "patient_id": "P-001",
        "device_id": "DEV-001",
        "heart_rate": -1,
        "spo2": 150,
        "temperature": 10,
    },
)
assert_status("ingest invalid values", response, 400)
assert_contains("ingest invalid values message", response, "heart_rate must be greater than 0")

response = post_json(
    "/api/ingest/",
    {
        "patient_id": "P-001",
        "device_id": "DEV-001",
        "heart_rate": 78,
        "spo2": 97,
        "temperature": 36.7,
        "anomaly_score": 0.12,
        "status": "normal",
        "timestamp": "2026-05-09T08:30:00+00:00",
    },
)
assert_status("ingest normal reading", response, 201)

response = client.get("/api/monitoring/latest/")
assert_status("latest reading", response, 200)

response = client.get("/api/monitoring/readings/")
assert_status("list readings", response, 200)

response = client.get("/api/monitoring/readings/?limit=0")
assert_status("invalid readings limit", response, 400)
assert_contains("invalid readings limit message", response, "must be greater than 0")

response = post_json(
    "/api/ingest/",
    {
        "patient_id": "P-001",
        "device_id": "DEV-001",
        "heart_rate": 142,
        "spo2": 88,
        "temperature": 39.2,
        "anomaly_score": 0.91,
        "status": "critical",
        "timestamp": "2026-05-09T08:35:00+00:00",
    },
)
assert_status("ingest abnormal reading", response, 201)

response = client.get("/api/alerts/")
assert_status("list alerts", response, 200)
alerts = response.json()["alerts"]
if not alerts:
    raise AssertionError("expected at least one alert after abnormal reading")
alert_id = alerts[0]["id"]

response = client.get("/api/alerts/?severity=bad")
assert_status("invalid alert severity", response, 400)
assert_contains("invalid alert severity message", response, "severity must be one of")

response = post_json(f"/api/alerts/{alert_id}/acknowledge/", {"acknowledged_by": "nurse@test"})
assert_status("acknowledge alert", response, 200)

response = post_json(f"/api/alerts/{alert_id}/acknowledge/", {"acknowledged_by": "nurse@test"})
assert_status("acknowledge alert twice blocked", response, 400)
assert_contains("acknowledge alert twice message", response, "already acknowledged")

response = post_json(f"/api/alerts/{alert_id}/review/", {})
assert_status("review alert", response, 200)

response = post_json(f"/api/alerts/{alert_id}/review/", {})
assert_status("review alert twice blocked", response, 400)
assert_contains("review alert twice message", response, "already marked as reviewed")

response = client.get("/api/monitoring/history/")
assert_status("history logs", response, 200)

response = client.get("/api/monitoring/history/?limit=-5")
assert_status("invalid history limit", response, 400)
assert_contains("invalid history limit message", response, "must be greater than 0")

response = client.get("/api/monitoring/status/")
assert_status("system status", response, 200)

response = client.get("/api/monitoring/settings/")
assert_status("get settings", response, 200)

response = patch_json("/api/monitoring/settings/", {"stale_device_timeout_minutes": 7})
assert_status("update settings", response, 200)

response = patch_json("/api/monitoring/settings/", {"device_maintenance_status": "broken"})
assert_status("invalid maintenance setting rejected", response, 400)
assert_contains("invalid maintenance setting message", response, "device_maintenance_status must be one of")

response = patch_json(
    "/api/monitoring/settings/",
    {"spo2_warning_below": 85, "spo2_critical_below": 90},
)
assert_status("invalid settings rejected", response, 400)
assert_contains("invalid settings message", response, "spo2_critical_below must be less than spo2_warning_below")

response = client.get("/api/monitoring/exports/")
assert_status("export catalog", response, 200)

response = client.get("/api/monitoring/exports/readings/")
assert_status("export readings csv", response, 200)

response = client.get("/api/monitoring/exports/alerts/")
assert_status("export alerts csv", response, 200)

response = client.get("/api/monitoring/exports/devices/")
assert_status("export devices csv", response, 200)

response = client.get("/api/monitoring/exports/unknown/")
assert_status("unknown export blocked", response, 404)
assert_contains("unknown export message", response, "Unknown export kind")

response = post_json(f"/api/monitoring/sessions/{session_id}/stop/", {})
assert_status("stop session", response, 200)

response = post_json(f"/api/monitoring/sessions/{session_id}/stop/", {})
assert_status("stop session twice blocked", response, 400)
assert_contains("stop session twice message", response, "Only active sessions can be stopped")

response = post_json("/api/auth/logout/", {})
assert_status("logout user", response, 200)

response = client.get("/api/auth/me/")
assert_status("auth me after logout", response, 401)

response = client.post(
    "/api/alerts/999999/acknowledge/",
    data=json.dumps({"acknowledged_by": "nurse@test"}),
    content_type="application/json",
)
assert_status("acknowledge after logout requires auth", response, 401)

if User.objects.count() != 1:
    raise AssertionError("expected exactly one user in database")
if Patient.objects.count() != 1:
    raise AssertionError("expected exactly one patient in database")
if Device.objects.count() != 1:
    raise AssertionError("expected exactly one device in database")
if MonitoringSession.objects.count() != 1:
    raise AssertionError("expected exactly one monitoring session in database")
if VitalRecord.objects.count() != 2:
    raise AssertionError("expected exactly two vital records in database")
if Alert.objects.count() < 1:
    raise AssertionError("expected at least one alert in database")
if not SystemSettings.objects.exists():
    raise AssertionError("expected settings record to exist in database")
print("[ok] database persistence checks")

print("All backend operations completed successfully.")
