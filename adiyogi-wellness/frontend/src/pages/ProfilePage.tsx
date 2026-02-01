import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navigate } from "react-router-dom";
// import Navbar from "@/components/Navbar";
const API_BASE = "http://127.0.0.1:8000/api";

type WeeklyInsight = {
  week: string;
  top_mood: string;
  breakdown: Record<string, number>;
  summary: string;
  suggestions: string;
};

const ProfilePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);

  const token = localStorage.getItem("token");

  // ======================
  // Load weekly insights
  // ======================
 useEffect(() => {
  fetch("http://127.0.0.1:8000/api/insights/weekly/", {
    headers: {
      Authorization: `Token ${localStorage.getItem("token")}`,
    },
  })
    .then((r) => r.json())
    .then(setInsight);
}, []);


  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">

        {/* ================= User Card ================= */}
        <Card className="w-full md:w-1/3 h-fit">
          <CardHeader className="flex flex-col items-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="text-2xl">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <CardTitle className="text-2xl">
              {user?.first_name} {user?.last_name}
            </CardTitle>

            <p className="text-muted-foreground">@{user?.username}</p>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <p className="text-sm italic">{user?.bio || "No bio yet."}</p>

            <Button variant="destructive" onClick={logout} className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* ================= Right Column ================= */}
        <div className="w-full md:w-2/3 space-y-6">

          {/* -------- Weekly Insights -------- */}
          <Card className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-white/10">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      🧠 Weekly Mental Health Insights
    </CardTitle>
  </CardHeader>

  <CardContent>
    {!insight ? (
      <p className="text-muted-foreground text-center py-10">
        Not enough data yet. Keep chatting 🙂
      </p>
    ) : (
      <div className="space-y-6">

        {/* Week + Top Mood */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {insight.week}
          </div>

          <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-sm">
            Top Mood: {insight.top_mood}
          </span>
        </div>

        {/* Mood Breakdown Bars */}
        <div>
          <h4 className="font-semibold mb-3">Mood Breakdown</h4>

          <div className="space-y-3">
            {Object.entries(insight.breakdown || {}).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{k}</span>
                  <span>{v}</span>
                </div>

                <div className="w-full h-2 bg-white/10 rounded">
                  <div
                    className="h-2 rounded bg-purple-500"
                    style={{ width: `${Math.min(v * 20, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-black/30 rounded-xl p-4">
          <h4 className="font-semibold mb-2">Weekly Summary</h4>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {insight.summary}
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-black/30 rounded-xl p-4">
          <h4 className="font-semibold mb-2">Suggestions</h4>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {insight.suggestions}
          </p>
        </div>

      </div>
    )}
  </CardContent>
</Card>


          {/* -------- Reports -------- */}
          <Card>
            <CardHeader>
              <CardTitle>My Reports</CardTitle>
            </CardHeader>

            <CardContent>
              {user?.reports && user.reports.length > 0 ? (
                <div className="space-y-2">
                  {user.reports.map((_, idx) => (
                    <div key={idx} className="p-4 border rounded bg-slate-50">
                      Report #{idx + 1}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No reports available yet.</p>
                  <p className="text-sm">
                    Complete chat sessions to generate insights.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
