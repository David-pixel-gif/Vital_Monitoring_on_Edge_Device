from django.urls import path
from .views import latest
urlpatterns=[path('latest/',latest)]