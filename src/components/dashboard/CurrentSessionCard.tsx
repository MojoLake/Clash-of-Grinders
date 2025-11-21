"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDurationWithSeconds } from "@/lib/sessions";
import { createSessionAction } from "@/lib/actions/sessions";
import { useTimer } from "@/contexts/TimerContext";

export function CurrentSessionCard() {
  const router = useRouter();
  const {
    timerState,
    elapsedSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    endTimer,
  } = useTimer();

  const handleStart = () => {
    startTimer();
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    resumeTimer();
  };

  const handleEnd = async () => {
    // Prevent ending sessions less than 1 second
    if (elapsedSeconds < 1) {
      alert("Please wait at least 1 second before ending a session.");
      return;
    }

    try {
      await endTimer(async (sessionData) => {
        // Save session via Server Action
        const result = await createSessionAction(sessionData);

        if (!result.success) {
          throw new Error(result.error);
        }

        console.log("Session saved successfully");
      });

      // Refresh the page to update Recent Sessions list
      router.refresh();
    } catch (error) {
      console.error("Error saving session:", error);
      alert(
        error instanceof Error
          ? `Error saving session: ${error.message}`
          : "An unexpected error occurred while saving the session. Please try again."
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
