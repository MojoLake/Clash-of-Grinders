import {
  startOfDay,
  startOfWeek,
  parseISO,
  differenceInDays,
  format,
} from "date-fns";
import type { Session } from "./types";

/**
 * Calculate total seconds of sessions for a specific day
 */
export function calculateDayTotal(
  sessions: Session[],
  date: Date = new Date()
): number {
  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return sessions
    .filter((session) => {
      const sessionDate = parseISO(session.startedAt);
      return sessionDate >= dayStart && sessionDate < dayEnd;
    })
    .reduce((total, session) => total + session.durationSeconds, 0);
}

/**
 * Calculate total seconds of sessions for the current week (Monday-Sunday)
 */
export function calculateWeekTotal(
  sessions: Session[],
  weekStart: Date = new Date()
): number {
  const weekStartDate = startOfWeek(weekStart, { weekStartsOn: 1 }); // Monday
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return sessions
    .filter((session) => {
      const sessionDate = parseISO(session.startedAt);
      return sessionDate >= weekStartDate && sessionDate < weekEnd;
    })
    .reduce((total, session) => total + session.durationSeconds, 0);
}

/**
 * Calculate the current streak (consecutive days with at least one session)
 */
export function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  // Group sessions by date
  const sessionsByDate = new Map<string, boolean>();
  sessions.forEach((session) => {
    const dateKey = format(parseISO(session.startedAt), "yyyy-MM-dd");
    sessionsByDate.set(dateKey, true);
  });

  // Check consecutive days starting from today
  let streak = 0;
  let currentDate = new Date();

  while (true) {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    if (sessionsByDate.has(dateKey)) {
      streak++;
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate the longest streak from a list of sessions
 */
export function calculateLongestStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  // Get unique dates and sort them
  const dates = Array.from(
    new Set(
      sessions.map((session) =>
        format(parseISO(session.startedAt), "yyyy-MM-dd")
      )
    )
  ).sort();

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = parseISO(dates[i - 1]);
    const currDate = parseISO(dates[i]);
    const dayDiff = differenceInDays(currDate, prevDate);

    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Format seconds into a human-readable duration string (e.g., "2h 34m")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * Format seconds with hours, minutes, and seconds (e.g., "2h 12m 30s")
 * Always includes seconds for real-time timer display
 */
export function formatDurationWithSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}

/**
 * Format seconds as HH:MM:SS for timer display
 */
export function formatTimerDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((val) => val.toString().padStart(2, "0"))
    .join(":");
}

/**
 * Format seconds as HH:MM (without seconds)
 */
export function formatDurationHHMM(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return [hours, minutes]
    .map((val) => val.toString().padStart(2, "0"))
    .join(":");
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return format(date, "MMM d");
}

/**
 * Format a date for display (e.g., "Nov 9, 2025")
 */
export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy");
}

/**
 * Get today's date range (midnight to midnight) in ISO format for queries
 * Uses the user's local timezone
 */
export function getTodayDateRange(): { start: string; end: string } {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return {
    start: dayStart.toISOString(),
    end: dayEnd.toISOString(),
  };
}
