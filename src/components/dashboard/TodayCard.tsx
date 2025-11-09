"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/sessions";
import type { Session, TimerData } from "@/lib/types";

interface TodayCardProps {
  sessions: Session[];
}

export function TodayCard({ sessions }: TodayCardProps) {
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);

  // Calculate total seconds from completed sessions
  const completedSeconds = sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );

  // Load current session from localStorage and set up real-time updates
  useEffect(() => {
    const updateCurrentSession = () => {
      const saved = localStorage.getItem("currentSession");
      if (saved) {
        try {
          const data: TimerData = JSON.parse(saved);
          if (data.state === "running" || data.state === "paused") {
            setCurrentSessionSeconds(data.elapsedSeconds);
          } else {
            setCurrentSessionSeconds(0);
          }
        } catch (error) {
          console.error("Failed to parse saved session:", error);
          setCurrentSessionSeconds(0);
        }
      } else {
        setCurrentSessionSeconds(0);
      }
    };

    // Initial load
    updateCurrentSession();

    // Set up interval to update every second
    const interval = setInterval(updateCurrentSession, 1000);

    // Listen for storage events (if localStorage is modified in another tab)
    window.addEventListener("storage", updateCurrentSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", updateCurrentSession);
    };
  }, []);

  const totalSeconds = completedSeconds + currentSessionSeconds;

  return (
    <Card className="p-4">
      <div className="text-sm text-slate-400 mb-2">Today</div>
      <div className="text-3xl font-bold">{formatDuration(totalSeconds)}</div>
    </Card>
  );
}
