"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { RoomsService } from "@/lib/services/rooms.service";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  validateRequired,
  validateStringLength,
} from "@/lib/api/validation";
import type { CreateRoomRequest, Room, RoomWithDetails } from "@/lib/types";

/**
 * Server Action: Creates a new room for the authenticated user.
 * @param formData - Form data containing room name and description
 * @returns The created room
 * @throws Error if validation fails or user is not authenticated
 */
export async function createRoomAction(
  formData: FormData
): Promise<{ success: true; room: Room } | { success: false; error: string }> {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    // Validate required fields
    const requiredError = validateRequired({ name }, ["name"]);
    if (requiredError) {
      return { success: false, error: requiredError };
    }

    // Validate name length (1-100 characters)
    const nameError = validateStringLength(name, "name", 1, 100);
    if (nameError) {
      return { success: false, error: nameError };
    }

    // Validate description if present (max 500 characters)
    if (description !== null && description !== undefined && description !== "") {
      const descriptionError = validateStringLength(
        description,
        "description",
        0,
        500
      );
      if (descriptionError) {
        return { success: false, error: descriptionError };
      }
    }

    // Step 1: Authenticate user with SSR client
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Step 2: Use admin client for database operations (bypasses RLS)
    const adminClient = await createAdminClient();
    const roomsService = new RoomsService(adminClient);
    
    const roomData: CreateRoomRequest = {
      name,
      description: description || undefined,
    };

    const room = await roomsService.createRoom(user.id, roomData);

    return { success: true, room };
  } catch (error) {
    console.error("Error creating room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create room",
    };
  }
}

/**
 * Server Action: Adds the authenticated user to an existing room.
 * @param roomId - The ID of the room to join
 * @returns Success status
 * @throws Error if user is not authenticated or room doesn't exist
 */
export async function joinRoomAction(
  roomId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!roomId) {
      return { success: false, error: "Room ID is required" };
    }

    // Step 1: Authenticate user with SSR client
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Step 2: Use admin client for database operations (bypasses RLS)
    const adminClient = await createAdminClient();
    const roomsService = new RoomsService(adminClient);
    await roomsService.joinRoom(user.id, roomId);

    return { success: true };
  } catch (error) {
    console.error("Error joining room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join room",
    };
  }
}

/**
 * Server Action: Removes the authenticated user from a room.
 * @param roomId - The ID of the room to leave
 * @returns Success status
 * @throws Error if user is not authenticated or not a member
 */
export async function leaveRoomAction(
  roomId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!roomId) {
      return { success: false, error: "Room ID is required" };
    }

    // Step 1: Authenticate user with SSR client
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Step 2: Use admin client for database operations (bypasses RLS)
    const adminClient = await createAdminClient();
    const roomsService = new RoomsService(adminClient);
    await roomsService.leaveRoom(user.id, roomId);

    return { success: true };
  } catch (error) {
    console.error("Error leaving room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to leave room",
    };
  }
}

/**
 * Server Action: Gets details for a specific room.
 * @param roomId - The ID of the room
 * @returns Room details with members and stats
 * @throws Error if user is not authenticated or not a member
 */
export async function getRoomDetailsAction(
  roomId: string
): Promise<
  { success: true; room: RoomWithDetails } | { success: false; error: string }
> {
  try {
    if (!roomId) {
      return { success: false, error: "Room ID is required" };
    }

    // Step 1: Authenticate user with SSR client
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Step 2: Use admin client for database operations (bypasses RLS)
    const adminClient = await createAdminClient();
    const roomsService = new RoomsService(adminClient);
    const room = await roomsService.getRoomDetails(roomId, user.id);

    return { success: true, room };
  } catch (error) {
    console.error("Error fetching room details:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch room details",
    };
  }
}

