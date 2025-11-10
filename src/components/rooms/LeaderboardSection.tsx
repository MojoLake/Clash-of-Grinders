"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/types";
import { Trophy } from "lucide-react";

interface LeaderboardSectionProps {
  leaderboard: LeaderboardEntry[];
  period: LeaderboardPeriod;
  currentUserId: string;
  roomId: string;
}

export function LeaderboardSection({
  leaderboard,
  period,
  currentUserId,
  roomId,
}: LeaderboardSectionProps) {
  const router = useRouter();

  const handlePeriodChange = (newPeriod: string) => {
    router.push(`/rooms/${roomId}?period=${newPeriod}`);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="text-slate-500">#{rank}</span>;
    }
  };

  const getUserInitials = (displayName: string) => {
    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Tabs */}
        <Tabs value={period} onValueChange={handlePeriodChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all-time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Leaderboard Table */}
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No activity yet</p>
            <p className="text-sm">
              Start grinding to see your name on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => {
                  const isCurrentUser = entry.userId === currentUserId;
                  return (
                    <TableRow
                      key={entry.userId}
                      className={
                        isCurrentUser
                          ? "bg-violet-950/30 border-violet-500/50"
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {getRankIcon(entry.rank)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-violet-600 text-xs">
                              {getUserInitials(entry.user.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {entry.user.displayName}
                            {isCurrentUser && (
                              <span className="text-violet-400 ml-2">(You)</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatDuration(entry.totalSeconds)}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {formatRelativeTime(entry.lastActiveAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

