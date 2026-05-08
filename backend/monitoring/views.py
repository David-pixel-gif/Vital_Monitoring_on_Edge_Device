
from django.http import JsonResponse
from .models import VitalRecord
def latest(request):
 v=VitalRecord.objects.last()
 return JsonResponse({
  'heart_rate':v.heart_rate,'spo2':v.spo2,'temperature':v.temperature,
  'anomaly_score':v.anomaly_score,'status':v.status,'timestamp':v.timestamp
 })
