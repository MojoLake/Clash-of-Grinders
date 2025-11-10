import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  DbSession,
  DbUser,
} from "@/lib/types";
import { dbUserToUser } from "@/lib/types";

interface SessionWithUser {
  duration_seconds: number;
  started_at: string;
  user_id: string;
  profiles: DbUser;
}

export class LeaderboardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Computes the leaderboard for a room based on session data for a given period.
   * @param roomId - The room's ID
   * @param period - Time period to calculate leaderboard for
   * @returns Array of leaderboard entries sorted by rank
   * @throws Error if query fails
   */
  async computeLeaderboard(
    roomId: string,
    period: LeaderboardPeriod = "week"
  ): Promise<LeaderboardEntry[]> {
    // Step 1: Get date range for period
    const { startDate, endDate } = this.getPeriodRange(period);

    // Step 2: Fetch sessions in date range with user profiles
    const { data: sessions, error } = await this.supabase
      .from("sessions")
      .select(
        `
        duration_seconds,
        started_at,
        user_id,
        profiles (
          id,
          display_name,
          avatar_url,
          created_at
        )
      `
      )
      .eq("room_id", roomId)
      .gte("started_at", startDate.toISOString())
      .lte("started_at", endDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch sessions for leaderboard: ${error.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Step 3: Aggregate by user
    const aggregated = this.aggregateByUser(
      sessions as unknown as SessionWithUser[],
      roomId
    );

    // Step 4: Sort leaderboard
    const sorted = this.sortLeaderboard(aggregated);

    // Step 5: Assign ranks
    const ranked = this.assignRanks(sorted);

    return ranked;
  }

  /**
   * Converts a period string to a date range.
   * @param period - Time period identifier
   * @returns Object with startDate and endDate
   */
  private getPeriodRange(period: LeaderboardPeriod): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        // Today from 00:00:00
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;

      case "week":
        // Last 7 days
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;

      case "month":
        // Last 30 days
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;

      case "all-time":
        // Since 2000-01-01
        startDate = new Date("2000-01-01T00:00:00Z");
        break;

      default:
        // Default to week
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    return { startDate, endDate };
  }

  /**
   * Aggregates sessions by user, summing total seconds and tracking last active.
   * @param sessions - Array of sessions with user data
   * @param roomId - The room's ID
   * @returns Array of leaderboard entries without ranks
   */
  private aggregateByUser(
    sessions: SessionWithUser[],
    roomId: string
  ): Omit<LeaderboardEntry, "rank">[] {
    // Group sessions by user
    const userMap = new Map<
      string,
      {
        totalSeconds: number;
        lastActiveAt: string;
        profile: DbUser;
      }
    >();

    for (const session of sessions) {
      const userId = session.user_id;
      const existing = userMap.get(userId);

      if (existing) {
        // Update existing entry
        existing.totalSeconds += session.duration_seconds;
        // Keep the most recent session date
        if (session.started_at > existing.lastActiveAt) {
          existing.lastActiveAt = session.started_at;
        }
      } else {
        // Create new entry
        userMap.set(userId, {
          totalSeconds: session.duration_seconds,
          lastActiveAt: session.started_at,
          profile: session.profiles,
        });
      }
    }

    // Convert map to array
    const entries: Omit<LeaderboardEntry, "rank">[] = [];
    for (const [userId, data] of userMap.entries()) {
      entries.push({
        userId,
        user: dbUserToUser(data.profile),
        roomId,
        totalSeconds: data.totalSeconds,
        lastActiveAt: data.lastActiveAt,
        streakDays: 0, // Not calculated yet, can be enhanced later
      });
    }

    return entries;
  }

  /**
   * Sorts leaderboard entries by total seconds (descending), then by last active (descending).
   * @param entries - Array of leaderboard entries without ranks
   * @returns Sorted array of entries
   */
  private sortLeaderboard(
    entries: Omit<LeaderboardEntry, "rank">[]
  ): Omit<LeaderboardEntry, "rank">[] {
    return entries.sort((a, b) => {
      // Primary sort: total seconds (descending)
      if (a.totalSeconds !== b.totalSeconds) {
        return b.totalSeconds - a.totalSeconds;
      }

      // Secondary sort: last active (most recent first)
      return b.lastActiveAt.localeCompare(a.lastActiveAt);
    });
  }

  /**
   * Assigns sequential ranks to sorted leaderboard entries.
   * @param entries - Sorted array of leaderboard entries without ranks
   * @returns Array of entries with ranks assigned
   */
  private assignRanks(
    entries: Omit<LeaderboardEntry, "rank">[]
  ): LeaderboardEntry[] {
    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }
}

