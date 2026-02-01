from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import WeeklyInsight, Message
from .therapy_session import run_therapy_turn


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def weekly_insights(request):
    user = request.user

    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # =============================
    # 1️⃣ Check cache
    # =============================
    cached = WeeklyInsight.objects.filter(
        user=user,
        week_start=week_start,
        week_end=week_end
    ).first()

    if cached:
        return Response({
            "week": f"{week_start} → {week_end}",
            "top_mood": cached.top_mood,
            "breakdown": cached.mood_breakdown,
            "summary": cached.summary,
            "suggestions": cached.suggestions,
            "cached": True
        })

    # =============================
    # 2️⃣ Collect messages
    # =============================
    messages = Message.objects.filter(
        session__user=user,
        created_at__date__range=[week_start, week_end]
    )

    mood_counts = {}

    for m in messages:
        if m.emotion:
            mood_counts[m.emotion] = mood_counts.get(m.emotion, 0) + 1

    if not mood_counts:
        return Response({"detail": "No data yet"})

    top_mood = max(mood_counts, key=mood_counts.get)

    # =============================
    # 3️⃣ Generate summary
    # =============================
    summary_prompt = f"""
User mood breakdown: {mood_counts}
Top mood: {top_mood}

Write a compassionate weekly therapy summary.
"""

    summary = run_therapy_turn(
        user_id=str(user.id),
        client_name=user.username,
        issue="weekly_summary",
        user_message=summary_prompt,
        session_id="weekly",
        chat_history=[]
    )["model_reply"]

    suggestions_prompt = f"""
Based on this mood breakdown: {mood_counts}

Give 3–5 practical suggestions for next week.
Bulleted.
"""

    suggestions = run_therapy_turn(
        user_id=str(user.id),
        client_name=user.username,
        issue="weekly_suggestions",
        user_message=suggestions_prompt,
        session_id="weekly",
        chat_history=[]
    )["model_reply"]

    # =============================
    # 4️⃣ Save to DB (CACHE)
    # =============================
    WeeklyInsight.objects.create(
        user=user,
        week_start=week_start,
        week_end=week_end,
        top_mood=top_mood,
        mood_breakdown=mood_counts,
        summary=summary,
        suggestions=suggestions,
    )

    return Response({
        "week": f"{week_start} → {week_end}",
        "top_mood": top_mood,
        "breakdown": mood_counts,
        "summary": summary,
        "suggestions": suggestions,
        "cached": False
    })
