import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import maleAvatar from "@/assets/avatar_male.png";
import femaleAvatar from "@/assets/avatar_female.png";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AvatarTherapist() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
const navigate = useNavigate();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const avatar = gender === "male" ? maleAvatar : femaleAvatar;

  // =========================
  // Continuous Listening
  // =========================
  const startListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) return;

    if (recognitionRef.current) recognitionRef.current.stop();

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;

    recog.lang =
      localStorage.getItem("language") === "gu"
        ? "gu-IN"
        : localStorage.getItem("language") === "hi" ||
          localStorage.getItem("language") === "hinglish"
        ? "hi-IN"
        : "en-US";

    recog.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      send(text);
    };

    recog.start();
    recognitionRef.current = recog;
  };

  // =========================
  // Send message (interruptible)
  // =========================
  const send = async (spoken?: string) => {
    const msg = spoken || input;
    if (!msg.trim() || isSending) return;

    // interrupt avatar if user speaks
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }

    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE}/message/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: localStorage.getItem("session_id"),
          user_message: msg,
          language: localStorage.getItem("language") || "hinglish",
        }),
      });

      const data = await res.json();

      if (data.audio_url) {
        const audio = new Audio(`http://127.0.0.1:8000${data.audio_url}`);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);

        audio.onended = () => {
          setIsSpeaking(false);
          startListening(); // 🔥 auto resume mic
        };

        audio.play();
      }

      setInput("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#05051b] to-[#0a0a30]">
      <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-6">
<Button
  variant="ghost"
  className="absolute top-4 left-4"
  onClick={() => navigate("/chat")}
>
  ← Back to Chat
</Button>

        {/* Glow */}
        <div className="absolute w-72 h-72 bg-purple-600 blur-[120px] opacity-40 animate-pulse" />

        {/* Avatar */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <img
            src={avatar}
            className={`w-64 z-10 transition-transform duration-500 ${
              isSpeaking ? "scale-[1.02]" : "scale-100"
            }`}
          />
        </div>

        {/* Gender */}
        <div className="flex gap-3">
          <Button
            variant={gender === "male" ? "default" : "outline"}
            onClick={() => setGender("male")}
          >
            Male
          </Button>

          <Button
            variant={gender === "female" ? "default" : "outline"}
            onClick={() => setGender("female")}
          >
            Female
          </Button>
        </div>

        {/* Status */}
        <p className="text-sm text-muted-foreground mt-2">
          {isSending ? "🧠 Thinking…" : isSpeaking ? "🗣️ Speaking…" : "🎧 Listening"}
        </p>

        {/* Input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak or type..."
          className="border rounded-xl p-3 w-80 bg-background text-center"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />

        {/* Mic button */}
        <Button onClick={startListening}>
          {isSending ? "…" : "🎤 Talk"}
        </Button>
      </div>
    </div>
  );
}
