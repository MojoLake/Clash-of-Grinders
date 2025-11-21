import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityGraphCard } from "./ActivityGraphCard";
import { TimerProvider } from "@/contexts/TimerContext";
import type { Session } from "@/lib/types";
import { subDays } from "date-fns";

describe("ActivityGraphCard", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders the card with title", () => {
    render(
      <TimerProvider>
        <ActivityGraphCard sessions={[]} />
      </TimerProvider>
    );
    expect(screen.getByText("Last 5 Days")).toBeInTheDocument();
  });

  it("renders 5 day labels", () => {
    render(
      <TimerProvider>
        <ActivityGraphCard sessions={[]} />
      </TimerProvider>
    );
    
    // Should have "Today" label
    expect(screen.getByText("Today")).toBeInTheDocument();
    
    // Should have 4 other day labels (Mon, Tue, Wed, Thu, Fri, Sat, or Sun)
    const dayLabels = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Today)$/);
    expect(dayLabels).toHaveLength(5);
  });

  it("shows 'No activity yet' message when all days have zero seconds", () => {
    render(
      <TimerProvider>
        <ActivityGraphCard sessions={[]} />
      </TimerProvider>
    );
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("does not show graph when there is no activity", () => {
    const { container } = render(
      <TimerProvider>
        <ActivityGraphCard sessions={[]} />
      </TimerProvider>
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeInTheDocument();
  });

  it("renders canvas when there is activity", () => {
    const today = new Date();
    const sessions: Session[] = [
      {
        id: "s1",
        userId: "user-1",
        startedAt: today.toISOString(),
        endedAt: null,
        durationSeconds: 3600,
        createdAt: today.toISOString(),
      },
    ];

    const { container } = render(
      <TimerProvider>
        <ActivityGraphCard sessions={sessions} />
      </TimerProvider>
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("shows peak day stat when there is activity", () => {
    const today = new Date();
    const sessions: Session[] = [
      {
        id: "s1",
        userId: "user-1",
        startedAt: today.toISOString(),
        endedAt: null,
        durationSeconds: 3600,
        createdAt: today.toISOString(),
      },
    ];

    render(
      <TimerProvider>
        <ActivityGraphCard sessions={sessions} />
      </TimerProvider>
    );
    expect(screen.getByText("Peak Day")).toBeInTheDocument();
    expect(screen.getByText(/Today • 1h/)).toBeInTheDocument();
  });

  it("does not show peak day stat when there is no activity", () => {
    render(
      <TimerProvider>
        <ActivityGraphCard sessions={[]} />
      </TimerProvider>
    );
    expect(screen.queryByText("Peak Day")).not.toBeInTheDocument();
  });

  it("includes current session in today's total", () => {
    const today = new Date();
    const sessions: Session[] = [
      {
        id: "s1",
        userId: "user-1",
        startedAt: today.toISOString(),
        endedAt: null,
        durationSeconds: 1800, // 30 minutes
        createdAt: today.toISOString(),
      },
    ];

    // Simulate a running session with 1800 more seconds (30 minutes)
    localStorage.setItem(
      "currentSession",
      JSON.stringify({
        state: "running",
        elapsedSeconds: 1800,
        startedAt: Date.now(),
      })
    );

    render(
      <TimerProvider>
        <ActivityGraphCard sessions={sessions} />
      </TimerProvider>
    );
    
    // Peak day should show total of completed + current session (1h)
    expect(screen.getByText(/Today • 1h/)).toBeInTheDocument();
  });

  it("aggregates multiple sessions per day", () => {
    const today = new Date();
    const sessions: Session[] = [
      {
        id: "s1",
        userId: "user-1",
        roomId: null,
        startedAt: today.toISOString(),
        endedAt: null,
        durationSeconds: 3600, // 1 hour
        createdAt: today.toISOString(),
      },
      {
        id: "s2",
        userId: "user-1",
        startedAt: today.toISOString(),
        endedAt: null,
        durationSeconds: 5400, // 1.5 hours
        createdAt: today.toISOString(),
      },
    ];

    render(
      <TimerProvider>
        <ActivityGraphCard sessions={sessions} />
      </TimerProvider>
    );
    
    // Peak day should show total of 2h 30m
    expect(screen.getByText(/Today • 2h 30m/)).toBeInTheDocument();
  });

  it("identifies peak day correctly across multiple days", () => {
    const today = new Date();
    const twoDaysAgo = subDays(today, 2);
    const sessions: Session[] = [
      {
        id: "s1",
        userId: "user-1",
        roomId: null,
        startedAt: today.toISOString(),
        endedAt: null,
        durationSeconds: 3600, // 1 hour today
        createdAt: today.toISOString(),
      },
      {
        id: "s2",
        userId: "user-1",
        startedAt: twoDaysAgo.toISOString(),
        endedAt: null,
        durationSeconds: 7200, // 2 hours two days ago
        createdAt: twoDaysAgo.toISOString(),
      },
    ];

    render(
      <TimerProvider>
        <ActivityGraphCard sessions={sessions} />
      </TimerProvider>
    );
    
    // Peak day should be two days ago (not today)
    expect(screen.getByText("Peak Day")).toBeInTheDocument();
    expect(screen.queryByText(/Today • 2h/)).not.toBeInTheDocument();
  });

  it("handles paused session state", () => {
    const today = new Date();
    const sessions: Session[] = [];

    localStorage.setItem(
      "currentSession",
      JSON.stringify({
        state: "paused",
        elapsedSeconds: 1800,
        startedAt: Date.now(),
      })
    );

    render(
      <TimerProvider>
        <ActivityGraphCard sessions={sessions} />
      </TimerProvider>
    );
    
    // Should include paused session in today's total
    expect(screen.getByText(/Today • 30m/)).toBeInTheDocument();
  });

  it("ignores idle session state", () => {
    const sessions: Session[] = [];

    localStorage.setItem(
      "currentSession",
      JSON.stringify({
        state: "idle",
        elapsedSeconds: 0,
        startedAt: Date.now(),
      })
    );

    render(
      <TimerProvider>
        <ActivityGraphCard sessions={sessions} />
      </TimerProvider>
    );
    
    // Should not include idle session
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("handles malformed localStorage data gracefully", () => {
    const sessions: Session[] = [];
    localStorage.setItem("currentSession", "invalid json");

    // Should not throw error
    expect(() =>
      render(
        <TimerProvider>
          <ActivityGraphCard sessions={sessions} />
        </TimerProvider>
      )
    ).not.toThrow();
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("renders all 5 days even with sparse data", () => {
    const fourDaysAgo = subDays(new Date(), 4);
    const sessions: Session[] = [
      {
        id: "s1",
        userId: "user-1",
        startedAt: fourDaysAgo.toISOString(),
        endedAt: null,
        durationSeconds: 3600,
        createdAt: fourDaysAgo.toISOString(),
      },
    ];

    render(
      <TimerProvider>
        <ActivityGraphCard sessions={sessions} />
      </TimerProvider>
    );
    
    // Should still render all 5 day labels
    const dayLabels = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Today)$/);
    expect(dayLabels).toHaveLength(5);
  });
});

