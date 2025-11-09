import { describe, it, expect } from "vitest";
import { formatDuration, formatTimerDisplay } from "./sessions";

describe("formatDuration", () => {
  it("formats seconds only when < 60s", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats minutes only when < 1h", () => {
    expect(formatDuration(420)).toBe("7m");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(5460)).toBe("1h 31m");
  });

  it("formats hours only for exact hours", () => {
    expect(formatDuration(7200)).toBe("2h");
  });

  it("handles zero duration", () => {
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("formatTimerDisplay", () => {
  it("formats with leading zeros for seconds", () => {
    expect(formatTimerDisplay(5)).toBe("00:00:05");
  });

  it("formats with leading zeros for minutes", () => {
    expect(formatTimerDisplay(65)).toBe("00:01:05");
  });

  it("formats with leading zeros for hours", () => {
    expect(formatTimerDisplay(3665)).toBe("01:01:05");
  });
});

