import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session, DbSession, CreateSessionRequest } from "@/lib/types";
import { dbSessionToSession } from "@/lib/types";

export interface GetSessionsOptions {
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export class SessionsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new session for a user.
   * @param userId - The ID of the user creating the session
   * @param data - Session data (startedAt, endedAt, durationSeconds, roomId)
   * @returns The created session
   * @throws Error if creation fails
   */
  async createSession(
    userId: string,
    data: CreateSessionRequest
  ): Promise<Session> {
    const { data: dbSession, error } = await this.supabase
      .from("sessions")
      .insert({
        user_id: userId,
        room_id: data.roomId ?? null,
        started_at: data.startedAt,
        ended_at: data.endedAt,
        duration_seconds: data.durationSeconds,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    if (!dbSession) {
      throw new Error("Failed to create session: No data returned");
    }

    return dbSessionToSession(dbSession as DbSession);
  }

  /**
   * Retrieves sessions for a user with optional filtering.
   * @param userId - The ID of the user
   * @param options - Optional filters (limit, startDate, endDate)
   * @returns Array of sessions
   * @throws Error if retrieval fails
   */
  async getUserSessions(
    userId: string,
    options: GetSessionsOptions = {}
  ): Promise<Session[]> {
    const { limit = 10, startDate, endDate } = options;

    let query = this.supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (startDate) {
      query = query.gte("started_at", startDate);
    }

    if (endDate) {
      query = query.lte("started_at", endDate);
    }

    query = query.limit(limit);

    const { data: dbSessions, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    if (!dbSessions) {
      return [];
    }

    return dbSessions.map((dbSession) =>
      dbSessionToSession(dbSession as DbSession)
    );
  }
}
