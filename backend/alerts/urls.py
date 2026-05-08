from django.urls import path
from .views import alerts
urlpatterns=[path('',alerts)]