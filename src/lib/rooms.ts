import { parseISO, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import type { Session, LeaderboardEntry, User, Room, RoomStats, Period } from './types';
import { calculateStreak } from './sessions';

/**
 * Compute leaderboard entries for a room based on sessions
 */
export function computeLeaderboard(
  sessions: Session[],
  users: Map<string, User>,
  period: Period = 'week'
): LeaderboardEntry[] {
  // Filter sessions by period
  const filteredSessions = filterSessionsByPeriod(sessions, period);

  // Group sessions by user
  const userSessions = new Map<string, Session[]>();
  filteredSessions.forEach(session => {
    const existing = userSessions.get(session.userId) || [];
    userSessions.set(session.userId, [...existing, session]);
  });

  // Calculate totals and streaks for each user
  const entries: LeaderboardEntry[] = [];
  userSessions.forEach((userSessionList, userId) => {
    const user = users.get(userId);
    if (!user) return;

    const totalSeconds = userSessionList.reduce(
      (sum, session) => sum + session.durationSeconds,
      0
    );

    const streakDays = calculateStreak(userSessionList);
    const lastSession = userSessionList.reduce((latest, session) => {
      const sessionDate = parseISO(session.startedAt);
      const latestDate = parseISO(latest.startedAt);
      return sessionDate > latestDate ? session : latest;
    });

    entries.push({
      userId,
      user,
      roomId: userSessionList[0].roomId || '',
      totalSeconds,
      streakDays,
      lastActiveAt: lastSession.startedAt,
      rank: 0, // Will be assigned after sorting
    });
  });

  // Sort by total seconds (descending) and assign ranks
  entries.sort((a, b) => b.totalSeconds - a.totalSeconds);
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

/**
 * Filter sessions by time period
 */
function filterSessionsByPeriod(sessions: Session[], period: Period): Session[] {
  if (period === 'all-time') {
    return sessions;
  }

  const now = new Date();
  let cutoffDate: Date;

  switch (period) {
    case 'day':
      cutoffDate = startOfDay(now);
      break;
    case 'week':
      cutoffDate = startOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      cutoffDate = startOfMonth(now);
      break;
    default:
      return sessions;
  }

  return sessions.filter(session => {
    const sessionDate = parseISO(session.startedAt);
    return sessionDate >= cutoffDate;
  });
}

/**
 * Calculate statistics for a room
 */
export function getRoomStats(
  room: Room,
  sessions: Session[],
  memberCount: number
): RoomStats {
  const totalSeconds = sessions.reduce(
    (sum, session) => sum + session.durationSeconds,
    0
  );
  const totalHours = totalSeconds / 3600;

  const today = startOfDay(new Date());
  const activeUserIds = new Set(
    sessions
      .filter(session => parseISO(session.startedAt) >= today)
      .map(session => session.userId)
  );

  return {
    totalMembers: memberCount,
    totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
    avgHoursPerMember: memberCount > 0 ? Math.round((totalHours / memberCount) * 10) / 10 : 0,
    activeToday: activeUserIds.size,
  };
}

