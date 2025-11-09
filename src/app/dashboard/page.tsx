import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrentSessionCard } from "@/components/dashboard/CurrentSessionCard";
import { formatDuration } from "@/lib/sessions";
import type { Session } from "@/lib/types";

async function fetchRecentSessions(): Promise<Session[]> {
  try {
    const res = await fetch("http://localhost:3000/api/sessions?limit=5", {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch sessions");
      return [];
    }

    const data = await res.json();
    return data.sessions || [];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const recentSessions = await fetchRecentSessions();

  return (
    <AppShell title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Current Session Timer */}
        <CurrentSessionCard />

        {/* Placeholder: Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCardPlaceholder label="Today" value="2h 34m" />
          <StatCardPlaceholder label="This Week" value="15h 20m" />
          <StatCardPlaceholder label="Streak" value="5 days" />
        </div>

        {/* Recent Sessions */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Recent Sessions</h3>
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No sessions yet. Start grinding!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">
                      {formatDuration(session.durationSeconds)}
                    </div>
                    <div className="text-sm text-slate-400">
                      {new Date(session.startedAt).toLocaleDateString()} at{" "}
                      {new Date(session.startedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  {session.roomId && <Badge variant="secondary">In Room</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

// Simple placeholder component for stats
function StatCardPlaceholder({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-400 mb-2">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      <Badge variant="secondary" className="mt-2">
        Mock Data
      </Badge>
    </Card>
  );
}
