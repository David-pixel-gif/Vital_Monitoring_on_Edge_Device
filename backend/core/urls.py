
from django.urls import path,include
urlpatterns=[
 path('api/ingest/',include('ingestion.urls')),
 path('api/monitoring/',include('monitoring.urls')),
 path('api/alerts/',include('alerts.urls')),
]
