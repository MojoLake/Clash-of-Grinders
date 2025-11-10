import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoomStats } from "@/lib/types";
import { Clock, Activity, Users, Zap } from "lucide-react";

interface RoomStatsCardProps {
  stats: RoomStats | undefined;
  memberCount: number;
}

export function RoomStatsCard({ stats, memberCount }: RoomStatsCardProps) {
  const totalHours = stats?.totalHours ?? 0;
  const totalSessions = stats?.totalSessions ?? 0;
  const activeToday = stats?.activeToday ?? 0;
  const avgHoursPerMember = stats?.avgHoursPerMember ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Room Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Hours */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="h-4 w-4" />
              <span>Total Hours</span>
            </div>
            <div className="text-2xl font-bold">
              {totalHours.toFixed(1)}h
            </div>
          </div>

          {/* Total Sessions */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Activity className="h-4 w-4" />
              <span>Sessions</span>
            </div>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </div>

          {/* Members */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Users className="h-4 w-4" />
              <span>Members</span>
            </div>
            <div className="text-2xl font-bold">{memberCount}</div>
          </div>

          {/* Active Today */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Zap className="h-4 w-4" />
              <span>Active Today</span>
            </div>
            <div className="text-2xl font-bold">{activeToday}</div>
          </div>
        </div>

        {/* Average Hours (shown on separate row for emphasis) */}
        {memberCount > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-sm text-slate-400">
              Average per member:{" "}
              <span className="font-semibold text-slate-200">
                {avgHoursPerMember.toFixed(1)}h
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

