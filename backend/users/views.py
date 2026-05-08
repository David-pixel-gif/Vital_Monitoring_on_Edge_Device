import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

User = get_user_model()


def parse_json(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_authenticated": True,
    }


@csrf_exempt
def register(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use POST to register a user."}, status=405)

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    role = str(payload.get("role", "NURSE")).upper()

    if not username:
        return JsonResponse({"detail": "Username is required."}, status=400)
    if len(username) < 3:
        return JsonResponse({"detail": "Username must be at least 3 characters long."}, status=400)
    if not password:
        return JsonResponse({"detail": "Password is required."}, status=400)
    if len(password) < 6:
        return JsonResponse({"detail": "Password must be at least 6 characters long."}, status=400)
    if role not in {"NURSE", "DOCTOR"}:
        return JsonResponse({"detail": "Role must be NURSE or DOCTOR."}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"detail": "A user with that username already exists."}, status=400)

    user = User.objects.create_user(username=username, password=password, role=role)
    return JsonResponse({"user": user_payload(user)}, status=201)


@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use POST to log in."}, status=405)

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not username or not password:
        return JsonResponse({"detail": "Username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if not user:
        return JsonResponse({"detail": "Invalid username or password."}, status=401)

    login(request, user)
    return JsonResponse({"user": user_payload(user)})


@csrf_exempt
def logout_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed. Use POST to log out."}, status=405)
    logout(request)
    return JsonResponse({"detail": "Logged out successfully."})


def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)
    return JsonResponse({"user": user_payload(request.user)})
