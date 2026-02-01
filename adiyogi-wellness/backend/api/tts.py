import os
import uuid
import asyncio
import edge_tts

MEDIA_DIR = "media/tts"
os.makedirs(MEDIA_DIR, exist_ok=True)

VOICE_MAP = {
    "en": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "gu": "gu-IN-DhwaniNeural",
    "hinglish": "hi-IN-SwaraNeural",
}


async def _generate(text: str, voice: str, path: str):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(path)


def generate_tts(text: str, language: str) -> str:
    voice = VOICE_MAP.get(language, "en-IN-NeerjaNeural")

    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(MEDIA_DIR, filename)

    asyncio.run(_generate(text, voice, filepath))

    return f"/media/tts/{filename}"
