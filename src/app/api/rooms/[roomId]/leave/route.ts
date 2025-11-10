import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RoomsService } from "@/lib/services/rooms.service";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/validation";

/**
 * DELETE /api/rooms/[roomId]/leave
 * Removes the authenticated user from a room.
 * If the user is the owner and only member, the room is deleted.
 */
export async function DELETE(
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

    // Call leaveRoom service method
    await roomsService.leaveRoom(user.id, roomId);

    return createSuccessResponse({ message: "Successfully left room" }, 200);
  } catch (error) {
    console.error("Error leaving room:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return createErrorResponse(error.message, 401);
    }

    // Handle not a member error
    if (
      error instanceof Error &&
      error.message === "User is not a member of this room"
    ) {
      return createErrorResponse(error.message, 400);
    }

    // Handle owner with other members error
    if (
      error instanceof Error &&
      error.message === "Room owner cannot leave while other members exist"
    ) {
      return createErrorResponse(error.message, 400);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}
