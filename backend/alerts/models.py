from django.db import models

from monitoring.models import VitalRecord


class Alert(models.Model):
    vital_record = models.ForeignKey(
        VitalRecord,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="alerts",
    )
    vital_id = models.CharField(max_length=50, blank=True)
    patient_id = models.CharField(max_length=50, blank=True)
    device_id = models.CharField(max_length=50, blank=True)
    alert_type = models.CharField(max_length=50, default="vital_threshold")
    severity = models.CharField(max_length=20, default="warning")
    reason = models.TextField(blank=True)
    reading_values = models.CharField(max_length=255, blank=True)
    ml_reason = models.CharField(max_length=255, blank=True)
    acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.CharField(max_length=120, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    reviewed = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="open")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
