from django.urls import path

from .views import (
    device_detail,
    devices,
    export_catalog,
    export_data,
    history,
    latest,
    patient_detail,
    patients,
    readings,
    sessions,
    settings_view,
    stop_session,
    system_status,
)

urlpatterns = [
    path("latest/", latest),
    path("readings/", readings),
    path("patients/", patients),
    path("patients/<str:patient_id>/", patient_detail),
    path("devices/", devices),
    path("devices/<str:device_id>/", device_detail),
    path("sessions/", sessions),
    path("sessions/<int:session_id>/stop/", stop_session),
    path("history/", history),
    path("status/", system_status),
    path("settings/", settings_view),
    path("exports/", export_catalog),
    path("exports/<str:kind>/", export_data),
]
