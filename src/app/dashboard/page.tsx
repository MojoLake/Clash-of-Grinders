import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrentSessionCard } from "@/components/dashboard/CurrentSessionCard";
import { TimeRangeCard } from "@/components/dashboard/TimeRangeCard";
import { ActivityGraphCard } from "@/components/dashboard/ActivityGraphCard";
import {
  formatDuration,
  getTodayDateRange,
  getThisWeekDateRange,
} from "@/lib/sessions";
import type { Session } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SessionsService } from "@/lib/services/sessions.service";

// Force dynamic rendering - this page uses cookies for auth
export const dynamic = "force-dynamic";

async function fetchRecentSessions(): Promise<Session[]> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      // Middleware should prevent this, but defensive coding
      console.warn("No user found in fetchRecentSessions");
      return [];
    }

    const sessionsService = new SessionsService(supabase);
    return await sessionsService.getUserSessions(user.id, { limit: 5 });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

async function fetchTodaySessions(): Promise<Session[]> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      console.warn("No user found in fetchTodaySessions");
      return [];
    }

    const { start, end } = getTodayDateRange();
    const sessionsService = new SessionsService(supabase);
    return await sessionsService.getUserSessions(user.id, {
      startDate: start,
      endDate: end,
    });
  } catch (error) {
    console.error("Error fetching today's sessions:", error);
    return [];
  }
}

async function fetchThisWeekSessions(): Promise<Session[]> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      console.warn("No user found in fetchThisWeekSessions");
      return [];
    }

    const { start, end } = getThisWeekDateRange();
    const sessionsService = new SessionsService(supabase);
    return await sessionsService.getUserSessions(user.id, {
      startDate: start,
      endDate: end,
    });
  } catch (error) {
    console.error("Error fetching this week's sessions:", error);
    return [];
  }
}

async function fetchLast5DaysSessions(): Promise<Session[]> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      console.warn("No user found in fetchLast5DaysSessions");
      return [];
    }

    // Get sessions from 5 days ago to now
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 4);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    const sessionsService = new SessionsService(supabase);
    return await sessionsService.getUserSessions(user.id, {
      startDate: fiveDaysAgo.toISOString(),
      endDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching last 5 days sessions:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const [recentSessions, todaySessions, thisWeekSessions, last5DaysSessions] =
    await Promise.all([
      fetchRecentSessions(),
      fetchTodaySessions(),
      fetchThisWeekSessions(),
      fetchLast5DaysSessions(),
    ]);

  return (
    <AppShell title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Current Session Timer */}
        <CurrentSessionCard />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TimeRangeCard sessions={todaySessions} label="Today" />
          <TimeRangeCard sessions={thisWeekSessions} label="This Week" />
          <ActivityGraphCard sessions={last5DaysSessions} />
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
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
