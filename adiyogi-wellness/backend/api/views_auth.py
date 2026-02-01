from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model

from .models import Session

User = get_user_model()


# =====================================
# SIGNUP
# =====================================
@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    data = request.data

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("first_name", "")
    last_name = data.get("last_name", "")

    if not username or not password or not email:
        return Response(
            {"error": "Please provide username, email and password"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already exists"}, status=400)

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        user.bio = ""
        user.profile_photo = ""
        user.save()

        token, _ = Token.objects.get_or_create(user=user)

        # 🔥 CREATE FIRST SESSION
        session = Session.objects.create(
            user=user,
            session_id=f"sess-{user.id}",
        )

        return Response(
            {
                "token": token.key,
                "session_id": session.session_id,
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# =====================================
# LOGIN
# =====================================
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    data = request.data

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return Response({"error": "Please provide username and password"}, status=400)

    user = authenticate(username=username, password=password)

    if not user:
        return Response({"error": "Invalid Credentials"}, status=401)

    token, _ = Token.objects.get_or_create(user=user)

    # 🔥 RESTORE LAST SESSION
    last_session = (
        Session.objects.filter(user=user)
        .order_by("-created_at")
        .first()
    )

    # If none exists, create one
    if not last_session:
        last_session = Session.objects.create(
            user=user,
            session_id=f"sess-{user.id}",
        )

    return Response(
        {
            "token": token.key,
            "session_id": last_session.session_id,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
        },
        status=status.HTTP_200_OK,
    )


# =====================================
# PROFILE
# =====================================
@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user

    if request.method == "GET":
        return Response(
            {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "bio": user.bio,
                "profile_photo": user.profile_photo,
                "reports": user.reports,
            }
        )

    elif request.method == "PUT":
        data = request.data

        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.email = data.get("email", user.email)
        user.bio = data.get("bio", user.bio)
        user.profile_photo = data.get("profile_photo", user.profile_photo)

        user.save()

        return Response(
            {
                "message": "Profile updated successfully",
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "bio": user.bio,
                    "profile_photo": user.profile_photo,
                    "reports": user.reports,
                },
            }
        )
