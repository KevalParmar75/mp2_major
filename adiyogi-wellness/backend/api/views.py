from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
    parser_classes,
)
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
# from langdetect import detect
from .views_insights import weekly_insights
from .models import WeeklyInsight

from .models import Session, Message, Ebook
from .serializers import (
    MessageSerializer,
    SessionSerializer,
    CreateMessageInputSerializer,
    EbookSerializer,
)

from .therapy_session import run_therapy_turn
from .pdf_loader import load_pdf_text
from .vectorstore import LocalVectorStore
from .tts import generate_tts

import os


# =====================================================
# Global vector store (simple local RAG)
# =====================================================
store = LocalVectorStore()


# =====================================================
# Upload PDF Report (AUTH ONLY)
# =====================================================
@api_view(["POST"])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_report(request):
    print("FILES >>>", request.FILES)

    if "file" not in request.FILES:
        return Response({"error": "file field missing"}, status=400)

    file = request.FILES["file"]

    os.makedirs("media", exist_ok=True)
    path = f"media/{file.name}"

    with open(path, "wb+") as f:
        for chunk in file.chunks():
            f.write(chunk)

    text = load_pdf_text(path)

    if not text.strip():
        return Response({"error": "Empty PDF"}, status=400)

    chunks = [text[i:i + 800] for i in range(0, len(text), 800)]

    # 🔐 User scoped embeddings
    store.add(chunks, user_id=str(request.user.id))

    return Response({
        "status": "indexed",
        "chunks": len(chunks),
    })


# =====================================================
# Health
# =====================================================
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok"}, status=200)


# =====================================================
# Chat Message (Guest + Auth)
# =====================================================
@api_view(["POST"])
@permission_classes([AllowAny])
def create_message(request):
    serializer = CreateMessageInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    data = serializer.validated_data
    print("LANG FROM FRONTEND =", data.get("language"))

    lang = data.get("language")

    if not lang:
        lang = "hinglish"  # only fallback

    name = data.get("name") or "Client"
    emotion = data.get("emotion") or ""
    issue = data.get("issue") or ""
    session_id = data["session_id"]
    user_message = data["user_message"]

    # ======================
    # Create / get session
    # ======================
    session, created = Session.objects.get_or_create(
        session_id=session_id,
        defaults={
            "issue": issue,
            "language": lang,
            "user": request.user if request.user.is_authenticated else None,
        },
    )

    # Update session fields
    # if name:
        # session.name = name

    # if emotion:
        # session.initial_emotion = emotion

    if created:
        session.name = name
        session.initial_emotion = emotion
        session.language = lang
        session.issue = issue

    if request.user.is_authenticated and not session.user:
        session.user = request.user

    session.save()
    lang = session.language

    # ======================
    # Save user message
    # ======================
    user_msg = Message.objects.create(
        session=session,
        role="user",
        text=user_message,
        emotion=emotion,
        extra=None,
    )
    # Auto title only once
    if not session.title:
        session.title = user_message[:60]
        session.save()

    # ======================
    # RAG context
    # ======================
    rag_context = store.search(
        user_message,
        user_id=str(request.user.id) if request.user.is_authenticated else "guest",
        k=3,
    )

    rag_text = "\n".join(rag_context) if rag_context else ""

    # ======================
    # Load history (memory)
    # ======================
    history = session.messages.order_by("-created_at")[:10]
    history = reversed(history)

    chat_history = []
    for m in history:
        chat_history.append({
            "role": m.role,
            "content": m.text,
        })
    user_turns = len([m for m in chat_history if m["role"] == "user"])
    mode = "explore" if user_turns < 3 else "solution"
    if user_turns >= 6:
        mode = "deep_solution"

    # ======================
    # Prompt
    # ======================
    enriched_message = f"""
You are a compassionate therapy assistant.

Conversation phase: {mode}

RULES:

If phase == explore:
- Ask gentle questions
- Reflect emotions
- Do NOT give advice yet

If phase == solution:
- Start offering practical steps
- Give coping strategies
- Be concrete and actionable

If phase == deep_solution:
- CBT techniques
- Breathing exercises
- Journaling
- Action plans

Language rules:
- hinglish → Hinglish (Hindi + English mixed)
- hi → Pure Hindi (Hindi)
- en → English
- gu → Gujarati

You MUST reply strictly in the selected language.
Do not translate unless asked.

Selected language: {session.language}

Client name: {session.name}
Emotion: {emotion}
Main issue: {issue}

User message:
{user_message}
"""

    if rag_text:
        enriched_message += f"\n\nPrevious therapy notes:\n{rag_text}"

    # ======================
    # Model call
    # ======================
    ml_result = run_therapy_turn(
        user_id=str(request.user.id) if request.user.is_authenticated else "guest",
        client_name=session.name or name,
        issue=issue or session.issue or "general",
        user_message=enriched_message,
        session_id=session_id,
        chat_history=chat_history,
    )

    assistant_text = ml_result.get("model_reply") or "I’m here with you."
    audio_url = generate_tts(
        assistant_text,
        session.language or "en"
    )

    assistant_msg = Message.objects.create(
        session=session,
        role="assistant",
        text=assistant_text,
        emotion=ml_result.get("text_emotion", ""),
        extra={"emotion_scores": ml_result.get("emotion_scores", {})},
    )

    return Response(
        {
            "session": SessionSerializer(session).data,
            "messages": MessageSerializer([user_msg, assistant_msg], many=True).data,
            "audio_url": audio_url,
        },
        status=201,
    )


# =====================================================
# Get Session Messages
# =====================================================
@api_view(["GET"])
@permission_classes([AllowAny])
def get_session_messages(request, session_id):
    try:
        session = Session.objects.get(session_id=session_id)
    except Session.DoesNotExist:
        return Response({"session": None, "messages": []}, status=200)

    messages = session.messages.order_by("created_at")

    return Response({
        "session": SessionSerializer(session).data,
        "messages": MessageSerializer(messages, many=True).data,
    })


# =====================================================
# Ebooks
# =====================================================
@api_view(["GET"])
@permission_classes([AllowAny])
def get_ebooks(request):
    category = request.query_params.get("category")
    featured = request.query_params.get("featured") == "true"
    limit = int(request.query_params.get("limit", 30))

    ebooks = Ebook.objects.all()[:limit]

    if category:
        ebooks = ebooks.filter(category=category)
    if featured:
        ebooks = ebooks.filter(featured=True)

    return Response(EbookSerializer(ebooks, many=True).data)


# =====================================================
# Ebook Download (AUTH)
# =====================================================
@api_view(["POST"])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def download_ebook(request, slug):
    try:
        ebook = Ebook.objects.get(slug=slug)
        ebook.downloads += 1
        ebook.save()

        return Response({
            "ebook": EbookSerializer(ebook).data,
            "download_url": ebook.file_url,
        })

    except Ebook.DoesNotExist:
        return Response({"error": "Ebook not found"}, status=404)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_sessions(request):
    sessions = Session.objects.filter(user=request.user).order_by("-created_at")

    data = []
    for s in sessions:
        data.append({
            "session_id": s.session_id,
            "issue": s.issue,
            "created_at": s.created_at,
        })

    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def weekly_insights(request):
    user = request.user

    insight = WeeklyInsight.objects.filter(user=user).order_by("-created_at").first()

    if not insight:
        insight = weekly_insights(user)

    if not insight:
        return Response({"status": "no data yet"})

    return Response({
        "week": f"{insight.week_start} → {insight.week_end}",
        "top_mood": insight.top_mood,
        "breakdown": insight.mood_breakdown,
        "summary": insight.summary,
        "suggestions": insight.suggestions,
    })
