"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDurationWithSeconds } from "@/lib/sessions";
import type { TimerState, TimerData } from "@/lib/types";
import { createSessionAction } from "@/lib/actions/sessions";

export function CurrentSessionCard() {
  const router = useRouter();

  // Lazy initialization: read from localStorage only once on mount
  const [timerState, setTimerState] = useState<TimerState>(() => {
    if (typeof window === "undefined") return "idle";
    const saved = localStorage.getItem("currentSession");
    if (saved) {
      try {
        const data: TimerData = JSON.parse(saved);
        return data.state;
      } catch (error) {
        console.error("Failed to parse saved session:", error);
        localStorage.removeItem("currentSession");
      }
    }
    return "idle";
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("currentSession");
    if (saved) {
      try {
        const data: TimerData = JSON.parse(saved);
        return data.elapsedSeconds;
      } catch (error) {
        console.error("Failed to parse saved session:", error);
        localStorage.removeItem("currentSession");
      }
    }
    return 0;
  });

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
    // Prevent ending sessions less than 1 second
    if (elapsedSeconds < 1) {
      alert("Please wait at least 1 second before ending a session.");
      return;
    }

    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - elapsedSeconds * 1000);

    try {
      // Save session via Server Action
      const result = await createSessionAction({
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSeconds: elapsedSeconds,
      });

      if (!result.success) {
        alert(`Error saving session: ${result.error}`);
        return;
      }

      console.log("Session saved successfully");

      // Reset state
      setTimerState("idle");
      setElapsedSeconds(0);
      localStorage.removeItem("currentSession");

      // Refresh the page to update Recent Sessions list
      router.refresh();
    } catch (error) {
      console.error("Error saving session:", error);
      alert(
        "An unexpected error occurred while saving the session. Please try again."
      );
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Current Session</h2>

      {/* Big timer display */}
      <div className="text-6xl font-bold text-center my-8">
        {formatDurationWithSeconds(elapsedSeconds)}
      </div>

      {/* Control buttons */}
      <div className="flex flex-col gap-2 items-center">
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
              <Button
                onClick={handleEnd}
                variant="destructive"
                disabled={elapsedSeconds < 1}
              >
                End Session
              </Button>
            </>
          )}
          {timerState === "paused" && (
            <>
              <Button onClick={handleResume}>Resume</Button>
              <Button
                onClick={handleEnd}
                variant="destructive"
                disabled={elapsedSeconds < 1}
              >
                End Session
              </Button>
            </>
          )}
        </div>
        {timerState !== "idle" && elapsedSeconds < 1 && (
          <p className="text-sm text-muted-foreground">
            Minimum 1 second required
          </p>
        )}
      </div>
    </Card>
  );
}
