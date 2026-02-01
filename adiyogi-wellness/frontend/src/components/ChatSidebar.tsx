import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000/api";

export default function ChatSidebar({ onSelect }: { onSelect: (id: string) => void }) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/sessions/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem("token")}`,
      },
    })
      .then((r) => r.json())
      .then(setSessions);
  }, []);

  return (
    <div className="w-64 border-r bg-muted p-3 overflow-y-auto">
      <h3 className="font-bold mb-3">Chats</h3>

      {sessions.map((s) => (
        <div
          key={s.session_id}
          onClick={() => onSelect(s.session_id)}
          className="cursor-pointer p-2 rounded hover:bg-accent text-sm"
        >
          {s.issue || s.session_id}
        </div>
      ))}
    </div>
  );
}
