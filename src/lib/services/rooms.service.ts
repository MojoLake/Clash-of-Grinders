import type { SupabaseClient } from "@supabase/supabase-js";
import type { Room, DbRoom, CreateRoomRequest } from "@/lib/types";
import { dbRoomToRoom } from "@/lib/types";

export class RoomsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Checks if a user is a member of a room.
   * @param userId - The user's ID
   * @param roomId - The room's ID
   * @returns true if user is a member, false otherwise
   * @throws Error if query fails
   */
  async isUserMember(userId: string, roomId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("room_memberships")
      .select("user_id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check membership: ${error.message}`);
    }

    return data !== null;
  }

  /**
   * Creates a new room and adds the creator as owner.
   * @param userId - The ID of the user creating the room
   * @param data - Room data (name, description)
   * @returns The created room
   * @throws Error if creation fails
   */
  async createRoom(userId: string, data: CreateRoomRequest): Promise<Room> {
    // Step 1: Insert room record
    const { data: dbRoom, error: roomError } = await this.supabase
      .from("rooms")
      .insert({
        name: data.name,
        description: data.description ?? null,
        created_by: userId,
      })
      .select()
      .single();

    // Step 2: Handle room creation errors
    if (roomError) {
      throw new Error(`Failed to create room: ${roomError.message}`);
    }
    if (!dbRoom) {
      throw new Error("Failed to create room: No data returned");
    }

    // Step 3: Insert owner membership
    const { error: membershipError } = await this.supabase
      .from("room_memberships")
      .insert({
        room_id: dbRoom.id,
        user_id: userId,
        role: "owner",
      });

    // Step 4: Handle membership errors
    if (membershipError) {
      throw new Error(
        `Failed to add owner membership: ${membershipError.message}`
      );
    }

    // Step 5: Return mapped room
    return dbRoomToRoom(dbRoom as DbRoom);
  }
}
