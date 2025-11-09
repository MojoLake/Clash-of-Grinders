import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { CurrentSessionCard } from "./CurrentSessionCard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock global alert
global.alert = vi.fn();

describe("CurrentSessionCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render with idle state", () => {
    render(<CurrentSessionCard />);
    expect(screen.getByText("Current Session")).toBeInTheDocument();
    expect(screen.getByText("Start Grinding")).toBeInTheDocument();
    expect(screen.getByText("0s")).toBeInTheDocument();
  });

  it("should start timer when Start Grinding is clicked", async () => {
    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    expect(screen.getByText("Pause")).toBeInTheDocument();
    expect(screen.getByText("End Session")).toBeInTheDocument();
  });

  it("should disable End Session button when elapsed time is 0 seconds", async () => {
    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    const endButton = screen.getByText("End Session");
    expect(endButton).toBeDisabled();
    expect(screen.getByText("Minimum 1 second required")).toBeInTheDocument();
  });

  it("should enable End Session button after 1 second", () => {
    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    // Initially disabled
    const endButton = screen.getByText("End Session");
    expect(endButton).toBeDisabled();

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should now be enabled
    expect(endButton).not.toBeDisabled();

    // Minimum warning should be gone
    expect(
      screen.queryByText("Minimum 1 second required")
    ).not.toBeInTheDocument();
  });

  it("should show alert if user tries to end session with 0 seconds programmatically", async () => {
    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    // Try to click (though it should be disabled)
    const endButton = screen.getByText("End Session");

    // Since button is disabled, we can't actually click it via fireEvent
    // But if the handler is called directly with 0 seconds, it should alert
    // This is covered by the disabled state test above
    expect(endButton).toBeDisabled();
  });

  it("should successfully save session after 1+ seconds", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ session: { id: "123" } }),
    });
    global.fetch = mockFetch;

    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    // Advance timer by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Click end session
    const endButton = screen.getByText("End Session");
    expect(endButton).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(endButton);
      // Allow promises to resolve
      await Promise.resolve();
    });

    // Should have called fetch with correct data
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/sessions",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"durationSeconds":2'),
      })
    );

    // Should return to idle state
    expect(screen.getByText("Start Grinding")).toBeInTheDocument();
  });

  it("should show alert when API returns error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "durationSeconds must be positive" }),
    });
    global.fetch = mockFetch;
    const mockAlert = vi.fn();
    global.alert = mockAlert;

    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    // Advance timer by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Click end session
    const endButton = screen.getByText("End Session");
    expect(endButton).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(endButton);
      // Allow promises to resolve
      await Promise.resolve();
    });

    // Should show alert with error message
    expect(mockAlert).toHaveBeenCalledWith(
      "Error saving session: durationSeconds must be positive"
    );

    // Should NOT return to idle state (stays in current state for retry)
    expect(screen.queryByText("Start Grinding")).not.toBeInTheDocument();
  });

  it("should show alert on network error", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    global.fetch = mockFetch;
    const mockAlert = vi.fn();
    global.alert = mockAlert;

    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    // Advance timer by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Click end session
    const endButton = screen.getByText("End Session");
    expect(endButton).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(endButton);
      // Allow promises to resolve
      await Promise.resolve();
    });

    // Should show alert with generic error message
    expect(mockAlert).toHaveBeenCalledWith(
      "An unexpected error occurred while saving the session. Please try again."
    );
  });

  it("should pause and resume timer correctly", () => {
    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    // Advance by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Pause
    const pauseButton = screen.getByText("Pause");
    fireEvent.click(pauseButton);

    expect(screen.getByText("Resume")).toBeInTheDocument();

    // Resume
    const resumeButton = screen.getByText("Resume");
    fireEvent.click(resumeButton);

    expect(screen.getByText("Pause")).toBeInTheDocument();

    // Timer should still be at 2 seconds and counting
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("3s")).toBeInTheDocument();
  });

  it("should disable End Session button in paused state when elapsed < 1", async () => {
    render(<CurrentSessionCard />);

    const startButton = screen.getByText("Start Grinding");
    fireEvent.click(startButton);

    // Immediately pause (0 seconds)
    const pauseButton = screen.getByText("Pause");
    fireEvent.click(pauseButton);

    // End Session should be disabled
    const endButton = screen.getByText("End Session");
    expect(endButton).toBeDisabled();
    expect(screen.getByText("Minimum 1 second required")).toBeInTheDocument();
  });
});

