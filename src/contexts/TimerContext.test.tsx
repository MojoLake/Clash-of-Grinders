import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { TimerProvider, useTimer } from "./TimerContext";
import type { ReactNode } from "react";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("TimerContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TimerProvider>{children}</TimerProvider>
  );

  it("initializes with idle state and 0 seconds", () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    expect(result.current.timerState).toBe("idle");
    expect(result.current.elapsedSeconds).toBe(0);
  });

  it("hydrates from localStorage on mount", () => {
    localStorageMock.setItem(
      "currentSession",
      JSON.stringify({
        state: "paused",
        startedAt: 0,
        elapsedSeconds: 120,
      })
    );

    const { result } = renderHook(() => useTimer(), { wrapper });

    expect(result.current.timerState).toBe("paused");
    expect(result.current.elapsedSeconds).toBe(120);
  });

  it("starts timer and increments every second", () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.timerState).toBe("running");
    expect(result.current.elapsedSeconds).toBe(0);

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.elapsedSeconds).toBe(1);

    // Advance another 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.elapsedSeconds).toBe(3);
  });

  it("pauses timer correctly", () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.elapsedSeconds).toBe(3);

    act(() => {
      result.current.pauseTimer();
    });

    expect(result.current.timerState).toBe("paused");

    // Advance time while paused - should not increment
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedSeconds).toBe(3);
  });

  it("resumes timer correctly", () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.pauseTimer();
    });

    expect(result.current.elapsedSeconds).toBe(2);

    act(() => {
      result.current.resumeTimer();
    });

    expect(result.current.timerState).toBe("running");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.elapsedSeconds).toBe(4);
  });

  it("saves to localStorage every 5 seconds when running", () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startTimer();
    });

    // Should not save immediately (only on state change)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // After 5 seconds, should save
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    const saved = localStorageMock.getItem("currentSession");
    expect(saved).toBeTruthy();
    const data = JSON.parse(saved!);
    expect(data.state).toBe("running");
    expect(data.elapsedSeconds).toBe(5);
  });

  it("saves immediately on state transitions", () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startTimer();
    });

    // Should save immediately after starting
    let saved = localStorageMock.getItem("currentSession");
    expect(saved).toBeTruthy();
    let data = JSON.parse(saved!);
    expect(data.state).toBe("running");
    expect(data.elapsedSeconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.pauseTimer();
    });

    // Should save immediately after pausing
    saved = localStorageMock.getItem("currentSession");
    expect(saved).toBeTruthy();
    data = JSON.parse(saved!);
    expect(data.state).toBe("paused");
    expect(data.elapsedSeconds).toBe(2);
  });

  it("clears localStorage on session end", async () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const mockCallback = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.endTimer(mockCallback);
    });

    expect(mockCallback).toHaveBeenCalledWith({
      startedAt: expect.any(String),
      endedAt: expect.any(String),
      durationSeconds: 2,
    });

    expect(result.current.timerState).toBe("idle");
    expect(result.current.elapsedSeconds).toBe(0);
    expect(localStorageMock.getItem("currentSession")).toBeNull();
  });

  it("throws error when ending session less than 1 second", async () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startTimer();
    });

    const mockCallback = vi.fn();

    await expect(
      act(async () => {
        await result.current.endTimer(mockCallback);
      })
    ).rejects.toThrow("Session must be at least 1 second");

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("throws error when useTimer is used outside TimerProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTimer());
    }).toThrow("useTimer must be used within a TimerProvider");

    consoleSpy.mockRestore();
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorageMock.setItem("currentSession", "invalid json");

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useTimer(), { wrapper });

    expect(result.current.timerState).toBe("idle");
    expect(result.current.elapsedSeconds).toBe(0);

    consoleSpy.mockRestore();
  });

  it("resets elapsed seconds when starting a new session", () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedSeconds).toBe(5);

    act(() => {
      result.current.pauseTimer();
    });

    // Start a new session
    act(() => {
      result.current.startTimer();
    });

    expect(result.current.elapsedSeconds).toBe(0);
  });
});

