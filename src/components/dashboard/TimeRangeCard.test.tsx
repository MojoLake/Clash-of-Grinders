import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TimeRangeCard } from "./TimeRangeCard";
import { TimerProvider } from "@/contexts/TimerContext";
import type { Session, TimerData } from "@/lib/types";

describe("TimeRangeCard", () => {
  // Helper to create mock sessions
  const createSession = (id: string, durationSeconds: number): Session => ({
    id,
    userId: "user-1",
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds,
    createdAt: new Date().toISOString(),
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("renders the card with custom label", () => {
      render(
        <TimerProvider>
          <TimeRangeCard sessions={[]} label="Today" />
        </TimerProvider>
      );

      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("renders the card with 'This Week' label", () => {
      render(
        <TimerProvider>
          <TimeRangeCard sessions={[]} label="This Week" />
        </TimerProvider>
      );

      expect(screen.getByText("This Week")).toBeInTheDocument();
    });

    it("displays 0s when there are no sessions", () => {
      render(
        <TimerProvider>
          <TimeRangeCard sessions={[]} label="Today" />
        </TimerProvider>
      );

      expect(screen.getByText("0s")).toBeInTheDocument();
    });

    it("displays formatted duration for single session", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      expect(screen.getByText("1h")).toBeInTheDocument();
    });

    it("displays total duration for multiple sessions", () => {
      const sessions = [
        createSession("s1", 3600), // 1 hour
        createSession("s2", 5400), // 1 hour 30 minutes
      ];

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      expect(screen.getByText("2h 30m")).toBeInTheDocument();
    });

    it("formats minutes correctly", () => {
      const sessions = [createSession("s1", 2700)]; // 45 minutes

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      expect(screen.getByText("45m")).toBeInTheDocument();
    });

    it("formats seconds correctly for short durations", () => {
      const sessions = [createSession("s1", 45)]; // 45 seconds

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      expect(screen.getByText("45s")).toBeInTheDocument();
    });
  });

  describe("localStorage integration", () => {
    it("includes running session from localStorage", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      const currentSession: TimerData = {
        state: "running",
        startedAt: Date.now(),
        elapsedSeconds: 1800, // 30 minutes running
      };

      localStorage.setItem("currentSession", JSON.stringify(currentSession));

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should show 1h + 30m = 1h 30m
      expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });

    it("includes paused session from localStorage", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      const currentSession: TimerData = {
        state: "paused",
        startedAt: Date.now(),
        elapsedSeconds: 600, // 10 minutes paused
      };

      localStorage.setItem("currentSession", JSON.stringify(currentSession));

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should show 1h + 10m = 1h 10m
      expect(screen.getByText("1h 10m")).toBeInTheDocument();
    });

    it("ignores idle session from localStorage", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      const currentSession: TimerData = {
        state: "idle",
        startedAt: Date.now(),
        elapsedSeconds: 600, // Should be ignored
      };

      localStorage.setItem("currentSession", JSON.stringify(currentSession));

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should only show completed session: 1h
      expect(screen.getByText("1h")).toBeInTheDocument();
    });

    it("handles missing localStorage data", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should show only completed sessions
      expect(screen.getByText("1h")).toBeInTheDocument();
    });

    it("handles invalid JSON in localStorage", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      localStorage.setItem("currentSession", "invalid json {");

      // Should not throw error
      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should show only completed sessions
      expect(screen.getByText("1h")).toBeInTheDocument();
    });

    it("handles corrupted session data in localStorage", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      // Missing required fields
      localStorage.setItem("currentSession", JSON.stringify({ invalid: true }));

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should show only completed sessions
      expect(screen.getByText("1h")).toBeInTheDocument();
    });
  });

  describe("real-time updates", () => {
    it("reads localStorage on mount", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      // Set up a running session before render
      const currentSession: TimerData = {
        state: "running",
        startedAt: Date.now(),
        elapsedSeconds: 600, // 10 minutes
      };

      localStorage.setItem("currentSession", JSON.stringify(currentSession));

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should show completed + current immediately
      expect(screen.getByText("1h 10m")).toBeInTheDocument();
    });

    it("re-reads localStorage when it changes (new component mount)", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      // First render without current session
      const { unmount } = render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );
      expect(screen.getByText("1h")).toBeInTheDocument();
      unmount();

      // Add a current session to localStorage
      const currentSession: TimerData = {
        state: "running",
        startedAt: Date.now(),
        elapsedSeconds: 1800, // 30 minutes
      };

      localStorage.setItem("currentSession", JSON.stringify(currentSession));

      // Re-render component
      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should now include current session
      expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });

    it("handles session state transitions correctly", () => {
      const sessions = [createSession("s1", 3600)]; // 1 hour completed

      // Start with running session
      const runningSession: TimerData = {
        state: "running",
        startedAt: Date.now(),
        elapsedSeconds: 600, // 10 minutes
      };

      localStorage.setItem("currentSession", JSON.stringify(runningSession));
      const { unmount } = render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );
      expect(screen.getByText("1h 10m")).toBeInTheDocument();
      unmount();

      // Change to idle (session ended)
      const idleSession: TimerData = {
        state: "idle",
        startedAt: Date.now(),
        elapsedSeconds: 600, // Should be ignored now
      };

      localStorage.setItem("currentSession", JSON.stringify(idleSession));

      // Re-render
      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      // Should only show completed sessions
      expect(screen.getByText("1h")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles very large durations", () => {
      const sessions = [createSession("s1", 86400)]; // 24 hours

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="This Week" />
        </TimerProvider>
      );

      expect(screen.getByText("24h")).toBeInTheDocument();
    });

    it("handles empty sessions array with no localStorage", () => {
      render(
        <TimerProvider>
          <TimeRangeCard sessions={[]} label="This Week" />
        </TimerProvider>
      );

      expect(screen.getByText("0s")).toBeInTheDocument();
    });

    it("calculates total correctly with many sessions", () => {
      const sessions = [
        createSession("s1", 600), // 10 minutes
        createSession("s2", 600), // 10 minutes
        createSession("s3", 600), // 10 minutes
        createSession("s4", 600), // 10 minutes
        createSession("s5", 600), // 10 minutes
      ];

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="This Week" />
        </TimerProvider>
      );

      expect(screen.getByText("50m")).toBeInTheDocument();
    });

    it("handles zero-duration sessions", () => {
      const sessions = [
        createSession("s1", 0),
        createSession("s2", 3600), // 1 hour
      ];

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="Today" />
        </TimerProvider>
      );

      expect(screen.getByText("1h")).toBeInTheDocument();
    });
  });

  describe("label customization", () => {
    it("works with any custom label", () => {
      render(
        <TimerProvider>
          <TimeRangeCard sessions={[]} label="Custom Period" />
        </TimerProvider>
      );

      expect(screen.getByText("Custom Period")).toBeInTheDocument();
    });

    it("displays correct data regardless of label", () => {
      const sessions = [createSession("s1", 7200)]; // 2 hours

      render(
        <TimerProvider>
          <TimeRangeCard sessions={sessions} label="This Month" />
        </TimerProvider>
      );

      expect(screen.getByText("This Month")).toBeInTheDocument();
      expect(screen.getByText("2h")).toBeInTheDocument();
    });
  });
});
