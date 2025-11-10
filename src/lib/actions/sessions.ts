"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SessionsService } from "@/lib/services/sessions.service";
import { getAuthenticatedUser } from "@/lib/auth";
import type { CreateSessionRequest, Session } from "@/lib/types";

/**
 * Server Action: Creates a new session for the authenticated user.
 * @param data - Session data (startedAt, endedAt, durationSeconds)
 * @returns The created session
 * @throws Error if validation fails or user is not authenticated
 */
export async function createSessionAction(
  data: CreateSessionRequest
): Promise<
  { success: true; session: Session } | { success: false; error: string }
> {
  try {
    // Validate required fields
    if (!data.startedAt) {
      return { success: false, error: "startedAt is required" };
    }
    if (!data.endedAt) {
      return { success: false, error: "endedAt is required" };
    }
    if (data.durationSeconds === undefined || data.durationSeconds === null) {
      return { success: false, error: "durationSeconds is required" };
    }

    // Validate duration is positive
    if (data.durationSeconds < 0) {
      return { success: false, error: "durationSeconds must be positive" };
    }

    // Validate dates
    const startedAt = new Date(data.startedAt);
    const endedAt = new Date(data.endedAt);

    if (isNaN(startedAt.getTime())) {
      return { success: false, error: "Invalid startedAt date" };
    }
    if (isNaN(endedAt.getTime())) {
      return { success: false, error: "Invalid endedAt date" };
    }
    if (endedAt < startedAt) {
      return { success: false, error: "endedAt must be after startedAt" };
    }

    // Step 1: Authenticate user with SSR client
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Step 2: Use admin client for database operations (bypasses RLS)
    const adminClient = await createAdminClient();
    const sessionsService = new SessionsService(adminClient);
    const session = await sessionsService.createSession(user.id, data);

    return { success: true, session };
  } catch (error) {
    console.error("Error creating session:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create session",
    };
  }
}

