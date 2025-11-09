import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RoomsService } from "@/lib/services/rooms.service";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/validation";

/**
 * GET /api/rooms/[roomId]
 * Retrieves detailed information about a specific room.
 * Only accessible to room members.
 */
export async function GET(
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

    // Check if user is a member
    const isMember = await roomsService.isUserMember(user.id, roomId);
    if (!isMember) {
      return createErrorResponse("User is not a member of this room", 403);
    }

    // Fetch room details
    const room = await roomsService.getRoomDetails(roomId, user.id);

    return createSuccessResponse({ room }, 200);
  } catch (error) {
    console.error("Error fetching room details:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return createErrorResponse(error.message, 401);
    }

    // Handle room not found
    if (error instanceof Error && error.message === "Room not found") {
      return createErrorResponse(error.message, 404);
    }

    // Handle not a member error
    if (
      error instanceof Error &&
      error.message === "User is not a member of this room"
    ) {
      return createErrorResponse(error.message, 403);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

