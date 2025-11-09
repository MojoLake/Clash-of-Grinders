"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/sessions";
import type { TimerState, TimerData } from "@/lib/types";

export function CurrentSessionCard() {
  const router = useRouter();
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
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - elapsedSeconds * 1000);

    try {
      // Save session to API
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          durationSeconds: elapsedSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save session");
      }

      console.log("Session saved successfully");

      // Refresh the page to update Recent Sessions list
      router.refresh();
    } catch (error) {
      console.error("Error saving session:", error);
      // Continue with reset even if API call fails
    }

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
