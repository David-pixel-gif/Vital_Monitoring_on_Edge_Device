
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from monitoring.models import VitalRecord

@csrf_exempt
def ingest(request):
 data=json.loads(request.body)
 VitalRecord.objects.create(**data)
 return JsonResponse({'status':'stored'})
