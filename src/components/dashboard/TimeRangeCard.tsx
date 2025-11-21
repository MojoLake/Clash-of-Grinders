"use client";

import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/sessions";
import type { Session } from "@/lib/types";
import { useTimer } from "@/contexts/TimerContext";

interface TimeRangeCardProps {
  sessions: Session[];
  label: string;
}

export function TimeRangeCard({ sessions, label }: TimeRangeCardProps) {
  const { elapsedSeconds } = useTimer();

  // Calculate total seconds from completed sessions
  const completedSeconds = sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );

  const totalSeconds = completedSeconds + elapsedSeconds;

  return (
    <Card className="p-4">
      <div className="text-sm text-slate-400 mb-2">{label}</div>
      <div className="text-3xl font-bold">{formatDuration(totalSeconds)}</div>
    </Card>
  );
}
