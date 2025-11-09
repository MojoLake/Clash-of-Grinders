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
}
