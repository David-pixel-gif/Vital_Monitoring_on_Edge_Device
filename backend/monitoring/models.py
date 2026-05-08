from django.db import models


class Patient(models.Model):
    patient_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=120, blank=True)
    initials = models.CharField(max_length=8, blank=True)
    monitoring_status = models.CharField(max_length=20, default="inactive")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.patient_id


class Device(models.Model):
    device_id = models.CharField(max_length=50, unique=True)
    assigned_patient = models.ForeignKey(
        Patient,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="devices",
    )
    location = models.CharField(max_length=120, blank=True)
    firmware_version = models.CharField(max_length=50, blank=True)
    model_version = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, default="ready")
    last_seen = models.DateTimeField(null=True, blank=True)
    maintenance_status = models.CharField(max_length=30, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.device_id


class MonitoringSession(models.Model):
    patient = models.ForeignKey(
        Patient,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sessions",
    )
    device = models.ForeignKey(
        Device,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sessions",
    )
    status = models.CharField(max_length=20, default="active")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)


class VitalRecord(models.Model):
    patient_link = models.ForeignKey(
        Patient,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="readings",
    )
    device_link = models.ForeignKey(
        Device,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="readings",
    )
    patient_id = models.CharField(max_length=50, blank=True)
    device_id = models.CharField(max_length=50)
    heart_rate = models.IntegerField()
    spo2 = models.FloatField()
    temperature = models.FloatField()
    anomaly_score = models.FloatField(default=0)
    status = models.CharField(max_length=20, default="normal")
    signal_quality = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp", "-id"]


class SystemSettings(models.Model):
    spo2_warning_below = models.FloatField(default=94)
    spo2_critical_below = models.FloatField(default=90)
    heart_rate_warning_low = models.IntegerField(default=50)
    heart_rate_warning_high = models.IntegerField(default=120)
    temperature_warning_low = models.FloatField(default=35.5)
    temperature_warning_high = models.FloatField(default=38.0)
    stale_device_timeout_minutes = models.IntegerField(default=5)
    ml_model_version = models.CharField(max_length=50, default="baseline-logreg")
    firmware_version = models.CharField(max_length=50, default="unknown")
    device_maintenance_status = models.CharField(max_length=30, default="pending")
    updated_at = models.DateTimeField(auto_now=True)
