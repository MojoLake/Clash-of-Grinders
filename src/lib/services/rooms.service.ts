import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Room,
  DbRoom,
  CreateRoomRequest,
  RoomStats,
  RoomMemberWithProfile,
  DbUser,
  RoomWithDetails,
} from "@/lib/types";
import { dbRoomToRoom, dbUserToUser } from "@/lib/types";

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

  /**
   * Adds a user to an existing room as a member.
   * @param userId - The user's ID
   * @param roomId - The room's ID
   * @throws Error if room doesn't exist, user is already a member, or insertion fails
   */
  async joinRoom(userId: string, roomId: string): Promise<void> {
    // Step 1: Check room exists
    const { data: room, error: roomError } = await this.supabase
      .from("rooms")
      .select("id")
      .eq("id", roomId)
      .maybeSingle();

    if (roomError) {
      throw new Error(`Failed to check room: ${roomError.message}`);
    }
    if (!room) {
      throw new Error("Room not found");
    }

    // Step 2: Check not already a member
    const isMember = await this.isUserMember(userId, roomId);
    if (isMember) {
      throw new Error("User is already a member of this room");
    }

    // Step 3: Insert membership
    const { error: insertError } = await this.supabase
      .from("room_memberships")
      .insert({
        room_id: roomId,
        user_id: userId,
        role: "member",
      });

    if (insertError) {
      throw new Error(`Failed to join room: ${insertError.message}`);
    }
  }

  /**
   * Removes a user from a room. If the user is the owner and sole member,
   * the room is deleted. Owners cannot leave if other members exist.
   * @param userId - The user's ID
   * @param roomId - The room's ID
   * @throws Error if user is not a member, owner tries to leave with other members, or deletion fails
   */
  async leaveRoom(userId: string, roomId: string): Promise<void> {
    // Step 1: Get user's membership
    const { data: membership, error: membershipError } = await this.supabase
      .from("room_memberships")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) {
      throw new Error(`Failed to check membership: ${membershipError.message}`);
    }
    if (!membership) {
      throw new Error("User is not a member of this room");
    }

    // Step 2: Handle owner case
    if (membership.role === "owner") {
      // Count other members
      const { count, error: countError } = await this.supabase
        .from("room_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("room_id", roomId);

      if (countError) {
        throw new Error(`Failed to count members: ${countError.message}`);
      }

      if (count !== null && count > 1) {
        throw new Error("Room owner cannot leave while other members exist");
      }

      // Delete room (CASCADE will delete membership)
      const { error: deleteError } = await this.supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (deleteError) {
        throw new Error(`Failed to delete room: ${deleteError.message}`);
      }
    } else {
      // Step 3: Regular member - just delete membership
      const { error: deleteError } = await this.supabase
        .from("room_memberships")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", userId);

      if (deleteError) {
        throw new Error(`Failed to leave room: ${deleteError.message}`);
      }
    }
  }

  /**
   * Counts the number of members in a room.
   * @param roomId - The room's ID
   * @returns The number of members
   * @throws Error if query fails
   */
  private async getRoomMemberCount(roomId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("room_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (error) {
      throw new Error(`Failed to count room members: ${error.message}`);
    }

    return count ?? 0;
  }

  /**
   * Calculates aggregated statistics for a room.
   * @param roomId - The room's ID
   * @returns Statistics object with totals and averages
   * @throws Error if query fails
   */
  private async getRoomStats(roomId: string): Promise<RoomStats> {
    // Fetch all sessions for the room
    const { data: sessions, error } = await this.supabase
      .from("sessions")
      .select("duration_seconds, user_id, started_at")
      .eq("room_id", roomId);

    if (error) {
      throw new Error(`Failed to fetch room sessions: ${error.message}`);
    }

    // Calculate totals
    const totalSeconds =
      sessions?.reduce((sum, session) => sum + session.duration_seconds, 0) ??
      0;
    const totalHours = totalSeconds / 3600;
    const totalSessions = sessions?.length ?? 0;

    // Calculate active today (unique users with sessions starting today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const activeUserIds = new Set(
      sessions
        ?.filter((session) => session.started_at >= todayIso)
        .map((session) => session.user_id) ?? []
    );
    const activeToday = activeUserIds.size;

    // Calculate average hours per member
    const memberCount = await this.getRoomMemberCount(roomId);
    const avgHoursPerMember = memberCount > 0 ? totalHours / memberCount : 0;

    return {
      totalHours,
      totalSessions,
      activeToday,
      avgHoursPerMember,
    };
  }

  /**
   * Retrieves all members of a room with their profile information.
   * @param roomId - The room's ID
   * @returns Array of members with profile data, ordered by join date
   * @throws Error if query fails
   */
  async getRoomMembers(roomId: string): Promise<RoomMemberWithProfile[]> {
    const { data: memberships, error } = await this.supabase
      .from("room_memberships")
      .select(
        `
      user_id,
      role,
      joined_at,
      profiles (
        id,
        display_name,
        avatar_url,
        created_at
      )
    `
      )
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch room members: ${error.message}`);
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    // Map database results to RoomMemberWithProfile
    return memberships.map((membership) => ({
      userId: membership.user_id,
      role: membership.role as "owner" | "admin" | "member",
      joinedAt: membership.joined_at,
      profile: dbUserToUser(membership.profiles as unknown as DbUser),
    }));
  }

  /**
   * Retrieves all rooms a user is a member of, with full details.
   * @param userId - The user's ID
   * @returns Array of rooms with members, stats, and user's role
   * @throws Error if query fails
   */
  async getUserRooms(userId: string): Promise<RoomWithDetails[]> {
    // Fetch user's room memberships with room data
    const { data: memberships, error } = await this.supabase
      .from("room_memberships")
      .select(
        `
      role,
      joined_at,
      rooms (
        id,
        name,
        description,
        created_by,
        created_at
      )
    `
      )
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user rooms: ${error.message}`);
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    // Build RoomWithDetails for each room
    const roomsWithDetails: RoomWithDetails[] = [];

    for (const membership of memberships) {
      const room = membership.rooms as unknown as DbRoom;
      const roomId = room.id;

      // Fetch members and stats in parallel
      const [members, stats] = await Promise.all([
        this.getRoomMembers(roomId),
        this.getRoomStats(roomId),
      ]);

      roomsWithDetails.push({
        // Base room data
        ...dbRoomToRoom(room),
        // User's membership info
        role: membership.role as "owner" | "admin" | "member",
        joinedAt: membership.joined_at,
        // Enriched data
        members,
        memberCount: members.length,
        stats,
      });
    }

    return roomsWithDetails;
  }
}
