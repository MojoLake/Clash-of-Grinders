import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RoomsService } from "@/lib/services/rooms.service";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/validation";

/**
 * POST /api/rooms/[roomId]/join
 * Adds the authenticated user to an existing room as a member.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Extract roomId from params
    const { roomId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Instantiate RoomsService
    const roomsService = new RoomsService(supabase);

    // Call joinRoom service method
    await roomsService.joinRoom(user.id, roomId);

    return createSuccessResponse(
      { message: "Successfully joined room" },
      200
    );
  } catch (error) {
    console.error("Error joining room:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return createErrorResponse(error.message, 401);
    }

    // Handle room not found
    if (error instanceof Error && error.message === "Room not found") {
      return createErrorResponse(error.message, 404);
    }

    // Handle already a member error
    if (
      error instanceof Error &&
      error.message === "User is already a member of this room"
    ) {
      return createErrorResponse(error.message, 400);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

