import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Message, ChatResponse } from "@/lib/api";
import ChatSidebar from "@/components/ChatSidebar";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Chat() {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // ======================
  // Session (per user + per day)
  // ======================
  const [sessionId] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    const key = `session_${storedUser.id}_${today}`;

    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const sid = `sess-${storedUser.id}-${today}`;
    localStorage.setItem(key, sid);
    return sid;
  });

  // ======================
  // Intake
  // ======================
  const [language, setLanguage] = useState(localStorage.getItem("language") || "hinglish");
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [mainConcern, setMainConcern] = useState(localStorage.getItem("issue") || "");
  const [currentEmotion, setCurrentEmotion] = useState(localStorage.getItem("emotion") || "");
  const [intakeDone, setIntakeDone] = useState(localStorage.getItem("intakeDone") === "true");

  // ======================
  // Chat
  // ======================
  const [input, setInput] = useState("");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  // ======================
  // Upload
  // ======================
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Persist language
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // ======================
  // Load history
  // ======================
  useEffect(() => {
    if (!intakeDone) return;

    fetch(`${API_BASE_URL}/session/${sessionId}/messages/`, {
      headers: token ? { Authorization: `Token ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d: ChatResponse) => setAllMessages(d.messages || []));
  }, [intakeDone, sessionId]);

  // ======================
  // Auto scroll
  // ======================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // ======================
  // Upload PDF
  // ======================
  const uploadReport = async () => {
    if (!reportFile) return;

    setIsUploading(true);

    try {
      const form = new FormData();
      form.append("file", reportFile);

      const res = await fetch(`${API_BASE_URL}/upload-report/`, {
        method: "POST",
        headers: token ? { Authorization: `Token ${token}` } : {},
        body: form,
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }

      alert("Report uploaded ✅");
      setReportFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // ======================
  // Send message
  // ======================
  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);

    const res = await fetch(`${API_BASE_URL}/message/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify({
        session_id: sessionId,
        name,
        emotion: currentEmotion,
        issue: mainConcern,
        user_message: input,
        language,
      }),
    });

    const data = await res.json();

    if (Array.isArray(data.messages)) {
      setAllMessages((p) => [...p, ...data.messages]);
    }

    setInput("");
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ======================
  // UI
  // ======================
  return (
    <div className="h-screen flex">
      <ChatSidebar
        onSelect={(id) => {
          localStorage.setItem(`session_${storedUser.id}_${new Date().toISOString().split("T")[0]}`, id);
          window.location.reload();
        }}
      />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 px-6 pt-24 pb-6">

          {!intakeDone ? (
            <Card className="p-6 space-y-4 max-w-xl mx-auto">
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Main concern" value={mainConcern} onChange={(e) => setMainConcern(e.target.value)} />
              <Input placeholder="Emotion" value={currentEmotion} onChange={(e) => setCurrentEmotion(e.target.value)} />

              <select className="w-full bg-background border rounded-md p-2" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="hinglish">Hinglish 🇮🇳</option>
                <option value="hi">Hindi 🇮🇳</option>
                <option value="en">English 🇬🇧</option>
                <option value="gu">Gujarati 🇮🇳</option>
              </select>

              <Button
                disabled={!name}
                onClick={() => {
                  localStorage.setItem("name", name);
                  localStorage.setItem("issue", mainConcern);
                  localStorage.setItem("emotion", currentEmotion);
                  localStorage.setItem("intakeDone", "true");
                  setIntakeDone(true);
                }}
              >
                Start Session
              </Button>

            </Card>
          ) : (
            <>
              <div className="mb-3 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    Object.keys(localStorage)
                      .filter(k => k.startsWith(`session_${storedUser.id}`))
                      .forEach(k => localStorage.removeItem(k));

                    localStorage.removeItem("intakeDone");
                    window.location.reload();
                  }}
                >
                  ➕ New Chat
                </Button>

                <Button variant="secondary" onClick={() => navigate("/avatar")}>
                  🧑‍⚕️ Avatar Therapist
                </Button>
              </div>

              <Card className="flex flex-col h-full">

                <div className="border-b p-3 flex gap-3">
                  <Input type="file" accept="application/pdf" onChange={(e) => setReportFile(e.target.files?.[0] || null)} />
                  <Button disabled={!reportFile || isUploading} onClick={uploadReport}>
                    {isUploading ? "Uploading..." : "Upload Report"}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {allMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`px-4 py-2 rounded-xl max-w-[80%] ${m.role === "user" ? "bg-primary text-white" : "bg-muted text-white"}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t p-4 flex gap-2">
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} />
                  <Button onClick={sendMessage}>{isSending ? "..." : "Send"}</Button>
                </div>

              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
