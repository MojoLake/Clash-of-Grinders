"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/sessions";
import type { TimerState, TimerData } from "@/lib/types";

export function CurrentSessionCard() {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("currentSession");
    if (saved) {
      try {
        const data: TimerData = JSON.parse(saved);
        setTimerState(data.state);
        setElapsedSeconds(data.elapsedSeconds);
      } catch (error) {
        console.error("Failed to parse saved session:", error);
        localStorage.removeItem("currentSession");
      }
    }
  }, []);

  // Interval for timer updates
  useEffect(() => {
    if (timerState === "running") {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerState]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (timerState !== "idle") {
      const data: TimerData = {
        state: timerState,
        startedAt: 0, // Not needed for Option B, but required by type
        elapsedSeconds,
      };
      localStorage.setItem("currentSession", JSON.stringify(data));
    }
  }, [timerState, elapsedSeconds]);

  const handleStart = () => {
    setTimerState("running");
    setElapsedSeconds(0);
  };

  const handlePause = () => {
    setTimerState("paused");
  };

  const handleResume = () => {
    setTimerState("running");
  };

  const handleEnd = async () => {
    // TODO: Call API to save session when /api/sessions endpoint is implemented
    // For now, just log the session data
    console.log("Session ended:", {
      durationSeconds: elapsedSeconds,
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
    });

    // Reset state
    setTimerState("idle");
    setElapsedSeconds(0);
    localStorage.removeItem("currentSession");
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Current Session</h2>

      {/* Big timer display */}
      <div className="text-6xl font-mono text-center my-8">
        {formatDuration(elapsedSeconds)}
      </div>

      {/* Control buttons */}
      <div className="flex gap-2 justify-center">
        {timerState === "idle" && (
          <Button onClick={handleStart} size="lg">
            Start Grinding
          </Button>
        )}
        {timerState === "running" && (
          <>
            <Button onClick={handlePause} variant="outline">
              Pause
            </Button>
            <Button onClick={handleEnd} variant="destructive">
              End Session
            </Button>
          </>
        )}
        {timerState === "paused" && (
          <>
            <Button onClick={handleResume}>Resume</Button>
            <Button onClick={handleEnd} variant="destructive">
              End Session
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
