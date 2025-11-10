"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { LeaderboardService } from "@/lib/services/leaderboard.service";
import { RoomsService } from "@/lib/services/rooms.service";
import { getAuthenticatedUser } from "@/lib/auth";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/types";

/**
 * Server Action: Retrieves the leaderboard for a room for a given time period.
 * @param roomId - The room's ID
 * @param period - Time period for leaderboard (default: "week")
 * @returns The leaderboard entries sorted by rank
 * @throws Error if validation fails, user is not authenticated, or not a member of the room
 */
export async function getLeaderboardAction(
  roomId: string,
  period: LeaderboardPeriod = "week"
): Promise<
  | { success: true; leaderboard: LeaderboardEntry[] }
  | { success: false; error: string }
> {
  try {
    // Validate roomId
    if (!roomId || typeof roomId !== "string") {
      return { success: false, error: "roomId is required and must be a string" };
    }

    // Validate period
    const validPeriods: LeaderboardPeriod[] = ["day", "week", "month", "all-time"];
    if (!validPeriods.includes(period)) {
      return {
        success: false,
        error: `Invalid period. Must be one of: ${validPeriods.join(", ")}`,
      };
    }

    // Step 1: Authenticate user with SSR client
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Step 2: Check if user is a member of the room
    const roomsService = new RoomsService(supabase);
    const isMember = await roomsService.isUserMember(user.id, roomId);

    if (!isMember) {
      return {
        success: false,
        error: "Access denied: You must be a member of this room to view the leaderboard",
      };
    }

    // Step 3: Use admin client to fetch leaderboard (bypasses RLS)
    const adminClient = await createAdminClient();
    const leaderboardService = new LeaderboardService(adminClient);
    const leaderboard = await leaderboardService.computeLeaderboard(
      roomId,
      period
    );

    return { success: true, leaderboard };
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch leaderboard",
    };
  }
}

