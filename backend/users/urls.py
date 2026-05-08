from django.urls import path

from .views import login_view, logout_view, me, register

urlpatterns = [
    path("register/", register),
    path("login/", login_view),
    path("logout/", logout_view),
    path("me/", me),
]
