import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SessionsService } from "@/lib/services";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  validateRequired,
  validatePositiveNumber,
  validateDateRange,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/validation";
import type { CreateSessionRequest } from "@/lib/types";

/**
 * POST /api/sessions
 * Creates a new session for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredError = validateRequired(body, [
      "startedAt",
      "endedAt",
      "durationSeconds",
    ]);
    if (requiredError) {
      return createErrorResponse(requiredError, 400);
    }

    // Validate durationSeconds
    const durationError = validatePositiveNumber(
      body.durationSeconds,
      "durationSeconds"
    );
    if (durationError) {
      return createErrorResponse(durationError, 400);
    }

    // Validate date range
    const dateRangeError = validateDateRange(body.startedAt, body.endedAt);
    if (dateRangeError) {
      return createErrorResponse(dateRangeError, 400);
    }

    // Get authenticated user
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Create session
    const sessionsService = new SessionsService(supabase);

    const sessionData: CreateSessionRequest = {
      startedAt: body.startedAt,
      endedAt: body.endedAt,
      durationSeconds: body.durationSeconds,
      roomId: body.roomId ?? null,
    };

    const session = await sessionsService.createSession(user.id, sessionData);

    return createSuccessResponse({ session }, 201);
  } catch (error) {
    console.error("Error creating session:", error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return createErrorResponse(error.message, 401);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

/**
 * GET /api/sessions
 * Retrieves sessions for the current user with optional filters.
 * Query params:
 * - limit: Number of sessions to retrieve (default: 10)
 * - startDate: Filter sessions starting from this date (ISO string)
 * - endDate: Filter sessions up to this date (ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parse query parameters
    const limitParam = searchParams.get("limit");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate limit if provided
    let limit = 10;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      const limitError = validatePositiveNumber(parsedLimit, "limit");
      if (limitError) {
        return createErrorResponse(limitError, 400);
      }
      limit = parsedLimit;
    }

    // Validate date range if both provided
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) {
        return createErrorResponse(dateRangeError, 400);
      }
    }

    // Get authenticated user
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Fetch sessions
    const sessionsService = new SessionsService(supabase);

    const sessions = await sessionsService.getUserSessions(user.id, {
      limit,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
    });

    return createSuccessResponse({ sessions }, 200);
  } catch (error) {
    console.error("Error fetching sessions:", error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return createErrorResponse(error.message, 401);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}
