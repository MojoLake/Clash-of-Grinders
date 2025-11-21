"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { TimerState, TimerData } from "@/lib/types";

interface SessionData {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

interface TimerContextValue {
  timerState: TimerState;
  elapsedSeconds: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  endTimer: (callback: (data: SessionData) => Promise<void>) => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

interface TimerProviderProps {
  children: ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
  // Initialize state from localStorage once on mount
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
        // Only restore elapsed seconds if not idle and valid
        if (
          data.state !== "idle" &&
          typeof data.elapsedSeconds === "number" &&
          !isNaN(data.elapsedSeconds)
        ) {
          return data.elapsedSeconds;
        }
      } catch (error) {
        console.error("Failed to parse saved session:", error);
        localStorage.removeItem("currentSession");
      }
    }
    return 0;
  });

  // Helper to save to localStorage
  const saveToLocalStorage = useCallback(() => {
    const data: TimerData = {
      state: timerState,
      startedAt: 0, // Not needed for current implementation
      elapsedSeconds,
    };
    localStorage.setItem("currentSession", JSON.stringify(data));
  }, [timerState, elapsedSeconds]);

  // Increment timer every second when running
  useEffect(() => {
    if (timerState === "running") {
      const tickInterval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(tickInterval);
    }
  }, [timerState]);

  // Save to localStorage every 5 seconds when running
  useEffect(() => {
    if (timerState === "running") {
      const saveInterval = setInterval(() => {
        saveToLocalStorage();
      }, 5000);

      return () => clearInterval(saveInterval);
    }
  }, [timerState, saveToLocalStorage]);

  // Save immediately on state transitions
  useEffect(() => {
    if (timerState !== "idle") {
      saveToLocalStorage();
    }
  }, [timerState, saveToLocalStorage]);

  // Actions
  const startTimer = useCallback(() => {
    setTimerState("running");
    setElapsedSeconds(0);
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState("paused");
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState("running");
  }, []);

  const endTimer = useCallback(
    async (callback: (data: SessionData) => Promise<void>) => {
      if (elapsedSeconds < 1) {
        throw new Error("Session must be at least 1 second");
      }

      const endedAt = new Date();
      const startedAt = new Date(endedAt.getTime() - elapsedSeconds * 1000);

      const sessionData: SessionData = {
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSeconds: elapsedSeconds,
      };

      // Call the callback to save the session
      await callback(sessionData);

      // Reset state
      setTimerState("idle");
      setElapsedSeconds(0);
      localStorage.removeItem("currentSession");
    },
    [elapsedSeconds]
  );

  const value: TimerContextValue = {
    timerState,
    elapsedSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    endTimer,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
