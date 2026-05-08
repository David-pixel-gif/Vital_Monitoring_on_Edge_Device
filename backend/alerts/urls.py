from django.urls import path

from .views import acknowledge, alerts, review

urlpatterns = [
    path("", alerts),
    path("<int:alert_id>/acknowledge/", acknowledge),
    path("<int:alert_id>/review/", review),
]
