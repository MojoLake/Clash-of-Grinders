import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RoomsService } from "@/lib/services/rooms.service";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  validateRequired,
  validateStringLength,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/validation";
import type { CreateRoomRequest } from "@/lib/types";

/**
 * POST /api/rooms
 * Creates a new room for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredError = validateRequired(body, ["name"]);
    if (requiredError) {
      return createErrorResponse(requiredError, 400);
    }

    // Validate name length (1-100 characters)
    const nameError = validateStringLength(body.name, "name", 1, 100);
    if (nameError) {
      return createErrorResponse(nameError, 400);
    }

    // Validate description if present (max 500 characters)
    if (body.description !== undefined && body.description !== null) {
      const descriptionError = validateStringLength(
        body.description,
        "description",
        0,
        500
      );
      if (descriptionError) {
        return createErrorResponse(descriptionError, 400);
      }
    }

    // Get authenticated user
    console.log("MOOOI!");
    const supabase = await createClient();
    console.log("Supabase", supabase);
    const user = await getAuthenticatedUser(supabase);

    console.log("User ID", user.id);
    console.log("HABLABALBA");

    // Create room
    const roomsService = new RoomsService(supabase);

    const roomData: CreateRoomRequest = {
      name: body.name,
      description: body.description,
    };

    const room = await roomsService.createRoom(user.id, roomData);

    return createSuccessResponse({ room }, 201);
  } catch (error) {
    console.error("Error creating room:", error);

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
 * GET /api/rooms
 * Retrieves all rooms for the current user.
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Fetch user's rooms
    const roomsService = new RoomsService(supabase);
    const rooms = await roomsService.getUserRooms(user.id);

    return createSuccessResponse({ rooms }, 200);
  } catch (error) {
    console.error("Error fetching rooms:", error);

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
