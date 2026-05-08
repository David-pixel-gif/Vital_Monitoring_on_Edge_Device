
from djongo import models
class VitalRecord(models.Model):
 device_id=models.CharField(max_length=50)
 heart_rate=models.IntegerField()
 spo2=models.FloatField()
 temperature=models.FloatField()
 anomaly_score=models.FloatField()
 status=models.CharField(max_length=10)
 timestamp=models.DateTimeField()
