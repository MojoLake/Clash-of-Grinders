/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoomsService } from "./rooms.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateRoomRequest,
  DbRoom,
  DbUser,
  RoomMemberWithProfile,
} from "@/lib/types";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockFrom = vi.fn();

  // Default chain setup
  mockSelect.mockReturnValue({
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    eq: mockEq,
  });

  mockInsert.mockReturnValue({
    select: mockSelect,
  });

  mockDelete.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
  });

  mockOrder.mockReturnValue({
    eq: mockEq,
  });

  mockFrom.mockReturnValue({
    insert: mockInsert,
    select: mockSelect,
    delete: mockDelete,
  });

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
    },
  } as unknown as SupabaseClient & { _mocks: any };
};

describe("RoomsService", () => {
  let service: RoomsService;
  let mockClient: SupabaseClient & { _mocks: any };

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    service = new RoomsService(mockClient);
  });

  describe("isUserMember", () => {
    const userId = "user-123";
    const roomId = "room-456";

    it("should return true when user is a member", async () => {
      mockClient._mocks.maybeSingle.mockResolvedValue({
        data: { user_id: userId },
        error: null,
      });

      const result = await service.isUserMember(userId, roomId);

      expect(result).toBe(true);
      expect(mockClient._mocks.from).toHaveBeenCalledWith("room_memberships");
      expect(mockClient._mocks.select).toHaveBeenCalledWith("user_id");
      expect(mockClient._mocks.eq).toHaveBeenCalledWith("room_id", roomId);
      expect(mockClient._mocks.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should return false when user is not a member", async () => {
      mockClient._mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.isUserMember(userId, roomId);

      expect(result).toBe(false);
    });

    it("should throw error when query fails", async () => {
      mockClient._mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      await expect(service.isUserMember(userId, roomId)).rejects.toThrow(
        "Failed to check membership: Database error"
      );
    });
  });

  describe("createRoom", () => {
    const userId = "user-123";
    const roomData: CreateRoomRequest = {
      name: "Test Room",
      description: "Test Description",
    };

    const mockDbRoom: DbRoom = {
      id: "room-123",
      name: "Test Room",
      description: "Test Description",
      created_by: userId,
      created_at: "2025-01-09T10:00:00Z",
    };

    it("should create a room and owner membership successfully", async () => {
      // Mock room creation
      mockClient._mocks.single.mockResolvedValueOnce({
        data: mockDbRoom,
        error: null,
      });

      // Mock membership creation
      const mockInsertForMembership = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: mockClient._mocks.single,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          return {
            insert: mockInsertForMembership,
          };
        }
        return mockClient._mocks;
      });

      const result = await service.createRoom(userId, roomData);

      expect(result).toEqual({
        id: "room-123",
        name: "Test Room",
        description: "Test Description",
        createdBy: userId,
        createdAt: "2025-01-09T10:00:00Z",
      });

      expect(mockInsertForMembership).toHaveBeenCalledWith({
        room_id: mockDbRoom.id,
        user_id: userId,
        role: "owner",
      });
    });

    it("should create room with null description when not provided", async () => {
      const roomDataWithoutDesc = { name: "Test Room" };
      const mockDbRoomNoDesc = { ...mockDbRoom, description: null };

      mockClient._mocks.single.mockResolvedValueOnce({
        data: mockDbRoomNoDesc,
        error: null,
      });

      const mockInsertForMembership = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: mockClient._mocks.single,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          return {
            insert: mockInsertForMembership,
          };
        }
        return mockClient._mocks;
      });

      const result = await service.createRoom(userId, roomDataWithoutDesc);

      expect(result.description).toBeNull();
    });

    it("should throw error when room creation fails", async () => {
      mockClient._mocks.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: mockClient._mocks.single,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.createRoom(userId, roomData)).rejects.toThrow(
        "Failed to create room: Database error"
      );
    });

    it("should throw error when no data returned from room insert", async () => {
      mockClient._mocks.single.mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: mockClient._mocks.single,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.createRoom(userId, roomData)).rejects.toThrow(
        "Failed to create room: No data returned"
      );
    });

    it("should throw error when membership creation fails", async () => {
      mockClient._mocks.single.mockResolvedValueOnce({
        data: mockDbRoom,
        error: null,
      });

      const mockInsertForMembership = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Membership error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: mockClient._mocks.single,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          return {
            insert: mockInsertForMembership,
          };
        }
        return mockClient._mocks;
      });

      await expect(service.createRoom(userId, roomData)).rejects.toThrow(
        "Failed to add owner membership: Membership error"
      );
    });
  });

  describe("joinRoom", () => {
    const userId = "user-123";
    const roomId = "room-456";

    it("should successfully add member when room exists and user is not a member", async () => {
      // Mock room existence check
      const mockRoomCheck = vi.fn().mockResolvedValue({
        data: { id: roomId },
        error: null,
      });

      // Mock isUserMember check (not a member)
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock membership insert
      const mockInsertMembership = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      let callCount = 0;
      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomCheck,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          callCount++;
          if (callCount === 1) {
            // First call: isUserMember check
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: mockMembershipCheck,
                  }),
                }),
              }),
            };
          } else {
            // Second call: insert membership
            return {
              insert: mockInsertMembership,
            };
          }
        }
        return mockClient._mocks;
      });

      await service.joinRoom(userId, roomId);

      expect(mockRoomCheck).toHaveBeenCalled();
      expect(mockMembershipCheck).toHaveBeenCalled();
      expect(mockInsertMembership).toHaveBeenCalledWith({
        room_id: roomId,
        user_id: userId,
        role: "member",
      });
    });

    it("should throw error when room not found", async () => {
      const mockRoomCheck = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomCheck,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.joinRoom(userId, roomId)).rejects.toThrow(
        "Room not found"
      );
    });

    it("should throw error when room query fails", async () => {
      const mockRoomCheck = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomCheck,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.joinRoom(userId, roomId)).rejects.toThrow(
        "Failed to check room: Database error"
      );
    });

    it("should throw error when user is already a member", async () => {
      const mockRoomCheck = vi.fn().mockResolvedValue({
        data: { id: roomId },
        error: null,
      });

      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: { user_id: userId },
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomCheck,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: mockMembershipCheck,
                }),
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.joinRoom(userId, roomId)).rejects.toThrow(
        "User is already a member of this room"
      );
    });

    it("should throw error when membership insertion fails", async () => {
      const mockRoomCheck = vi.fn().mockResolvedValue({
        data: { id: roomId },
        error: null,
      });

      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockInsertMembership = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert error" },
      });

      let callCount = 0;
      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomCheck,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: mockMembershipCheck,
                  }),
                }),
              }),
            };
          } else {
            return {
              insert: mockInsertMembership,
            };
          }
        }
        return mockClient._mocks;
      });

      await expect(service.joinRoom(userId, roomId)).rejects.toThrow(
        "Failed to join room: Insert error"
      );
    });
  });

  describe("leaveRoom", () => {
    const userId = "user-123";
    const roomId = "room-456";

    it("should successfully remove a regular member", async () => {
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: { role: "member" },
        error: null,
      });

      const mockDeleteMembership = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: mockMembershipCheck,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: mockDeleteMembership,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await service.leaveRoom(userId, roomId);

      expect(mockMembershipCheck).toHaveBeenCalled();
      expect(mockDeleteMembership).toHaveBeenCalled();
    });

    it("should delete room when owner is the only member", async () => {
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: { role: "owner" },
        error: null,
      });

      const mockCountQuery = vi.fn().mockResolvedValue({
        count: 1,
        error: null,
      });

      const mockDeleteRoom = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      let roomMembershipCallCount = 0;
      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          roomMembershipCallCount++;
          if (roomMembershipCallCount === 1) {
            // First call: check membership
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: mockMembershipCheck,
                  }),
                }),
              }),
            };
          } else {
            // Second call: count members
            return {
              select: vi.fn().mockReturnValue({
                eq: mockCountQuery,
              }),
            };
          }
        }
        if (table === "rooms") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: mockDeleteRoom,
            }),
          };
        }
        return mockClient._mocks;
      });

      await service.leaveRoom(userId, roomId);

      expect(mockMembershipCheck).toHaveBeenCalled();
      expect(mockCountQuery).toHaveBeenCalled();
      expect(mockDeleteRoom).toHaveBeenCalled();
    });

    it("should throw error when owner tries to leave with other members", async () => {
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: { role: "owner" },
        error: null,
      });

      const mockCountQuery = vi.fn().mockResolvedValue({
        count: 3,
        error: null,
      });

      let callCount = 0;
      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: mockMembershipCheck,
                  }),
                }),
              }),
            };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                eq: mockCountQuery,
              }),
            };
          }
        }
        return mockClient._mocks;
      });

      await expect(service.leaveRoom(userId, roomId)).rejects.toThrow(
        "Room owner cannot leave while other members exist"
      );
    });

    it("should throw error when user is not a member", async () => {
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: mockMembershipCheck,
                }),
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.leaveRoom(userId, roomId)).rejects.toThrow(
        "User is not a member of this room"
      );
    });

    it("should throw error when membership check fails", async () => {
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: mockMembershipCheck,
                }),
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.leaveRoom(userId, roomId)).rejects.toThrow(
        "Failed to check membership: Database error"
      );
    });

    it("should throw error when count query fails", async () => {
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: { role: "owner" },
        error: null,
      });

      const mockCountQuery = vi.fn().mockResolvedValue({
        count: null,
        error: { message: "Count error" },
      });

      let callCount = 0;
      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: mockMembershipCheck,
                  }),
                }),
              }),
            };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                eq: mockCountQuery,
              }),
            };
          }
        }
        return mockClient._mocks;
      });

      await expect(service.leaveRoom(userId, roomId)).rejects.toThrow(
        "Failed to count members: Count error"
      );
    });

    it("should throw error when room deletion fails", async () => {
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: { role: "owner" },
        error: null,
      });

      const mockCountMembers = vi.fn().mockResolvedValue({
        count: 1,
        error: null,
      });

      const mockDeleteRoom = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Delete error" },
      });

      let callCount = 0;
      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: mockMembershipCheck,
                  }),
                }),
              }),
            };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(mockCountMembers),
              }),
            };
          }
        }
        if (table === "rooms") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: mockDeleteRoom,
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.leaveRoom(userId, roomId)).rejects.toThrow(
        "Failed to delete room: Delete error"
      );
    });

    it("should throw error when membership deletion fails", async () => {
      const mockMembershipCheck = vi.fn().mockResolvedValue({
        data: { role: "member" },
        error: null,
      });

      const mockDeleteMembership = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Delete error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: mockMembershipCheck,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: mockDeleteMembership,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.leaveRoom(userId, roomId)).rejects.toThrow(
        "Failed to leave room: Delete error"
      );
    });
  });

  describe("getRoomMembers", () => {
    const roomId = "room-123";

    const mockDbUser: DbUser = {
      id: "user-456",
      display_name: "Test User",
      avatar_url: null,
      created_at: "2025-01-01T00:00:00Z",
    };

    it("should return array of members with profiles", async () => {
      const mockMemberships = [
        {
          user_id: "user-456",
          role: "owner",
          joined_at: "2025-01-09T10:00:00Z",
          profiles: mockDbUser,
        },
        {
          user_id: "user-789",
          role: "member",
          joined_at: "2025-01-09T11:00:00Z",
          profiles: {
            id: "user-789",
            display_name: "Another User",
            avatar_url: "https://example.com/avatar.png",
            created_at: "2025-01-02T00:00:00Z",
          },
        },
      ];

      const mockQuery = vi.fn().mockResolvedValue({
        data: mockMemberships,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      const result = await service.getRoomMembers(roomId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userId: "user-456",
        role: "owner",
        joinedAt: "2025-01-09T10:00:00Z",
        profile: {
          id: "user-456",
          displayName: "Test User",
          avatarUrl: null,
          createdAt: "2025-01-01T00:00:00Z",
        },
      });
      expect(result[1].profile.displayName).toBe("Another User");
      expect(mockQuery).toHaveBeenCalled();
    });

    it("should return empty array when no members found", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      const result = await service.getRoomMembers(roomId);

      expect(result).toEqual([]);
    });

    it("should return empty array when data is null", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      const result = await service.getRoomMembers(roomId);

      expect(result).toEqual([]);
    });

    it("should throw error when query fails", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.getRoomMembers(roomId)).rejects.toThrow(
        "Failed to fetch room members: Database error"
      );
    });
  });

  describe("getUserRooms", () => {
    const userId = "user-123";

    const mockDbRoom: DbRoom = {
      id: "room-456",
      name: "Test Room",
      description: "Test Description",
      created_by: "user-000",
      created_at: "2025-01-09T10:00:00Z",
    };

    const mockMembers: RoomMemberWithProfile[] = [
      {
        userId: "user-000",
        role: "owner",
        joinedAt: "2025-01-09T10:00:00Z",
        profile: {
          id: "user-000",
          displayName: "Owner",
          avatarUrl: null,
          createdAt: "2025-01-01T00:00:00Z",
        },
      },
    ];

    it("should return array of rooms with details", async () => {
      const mockMemberships = [
        {
          role: "member",
          joined_at: "2025-01-09T11:00:00Z",
          rooms: mockDbRoom,
        },
      ];

      const mockQuery = vi.fn().mockResolvedValue({
        data: mockMemberships,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        if (table === "sessions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    duration_seconds: 3600,
                    user_id: "user-000",
                    started_at: "2025-01-09T10:00:00Z",
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      // Spy on getRoomMembers and getRoomStats
      const getRoomMembersSpy = vi
        .spyOn(service, "getRoomMembers")
        .mockResolvedValue(mockMembers);

      const result = await service.getUserRooms(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("room-456");
      expect(result[0].name).toBe("Test Room");
      expect(result[0].role).toBe("member");
      expect(result[0].joinedAt).toBe("2025-01-09T11:00:00Z");
      expect(result[0].members).toEqual(mockMembers);
      expect(result[0].memberCount).toBe(1);
      expect(result[0].stats).toBeDefined();
      expect(getRoomMembersSpy).toHaveBeenCalledWith("room-456");

      getRoomMembersSpy.mockRestore();
    });

    it("should return empty array when user has no rooms", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      const result = await service.getUserRooms(userId);

      expect(result).toEqual([]);
    });

    it("should return empty array when data is null", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      const result = await service.getUserRooms(userId);

      expect(result).toEqual([]);
    });

    it("should handle multiple rooms correctly", async () => {
      const mockMemberships = [
        {
          role: "owner",
          joined_at: "2025-01-09T10:00:00Z",
          rooms: mockDbRoom,
        },
        {
          role: "member",
          joined_at: "2025-01-10T10:00:00Z",
          rooms: {
            id: "room-789",
            name: "Another Room",
            description: null,
            created_by: "user-999",
            created_at: "2025-01-10T10:00:00Z",
          },
        },
      ];

      const mockQuery = vi.fn().mockResolvedValue({
        data: mockMemberships,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        if (table === "sessions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      const getRoomMembersSpy = vi
        .spyOn(service, "getRoomMembers")
        .mockResolvedValue(mockMembers);

      const result = await service.getUserRooms(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("room-456");
      expect(result[1].id).toBe("room-789");
      expect(getRoomMembersSpy).toHaveBeenCalledTimes(2);

      getRoomMembersSpy.mockRestore();
    });

    it("should throw error when query fails", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: mockQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.getUserRooms(userId)).rejects.toThrow(
        "Failed to fetch user rooms: Database error"
      );
    });
  });

  describe("getRoomDetails", () => {
    const roomId = "room-456";
    const userId = "user-123";

    const mockDbRoom: DbRoom = {
      id: roomId,
      name: "Test Room",
      description: "Test Description",
      created_by: "user-000",
      created_at: "2025-01-09T10:00:00Z",
    };

    const mockMembers: RoomMemberWithProfile[] = [
      {
        userId: "user-000",
        role: "owner",
        joinedAt: "2025-01-09T10:00:00Z",
        profile: {
          id: "user-000",
          displayName: "Owner",
          avatarUrl: null,
          createdAt: "2025-01-01T00:00:00Z",
        },
      },
    ];

    it("should return full room details with members and stats", async () => {
      const mockRoomQuery = vi.fn().mockResolvedValue({
        data: mockDbRoom,
        error: null,
      });

      const mockMembershipQuery = vi.fn().mockResolvedValue({
        data: { role: "member", joined_at: "2025-01-09T11:00:00Z" },
        error: null,
      });

      let roomCallCount = 0;
      let membershipCallCount = 0;

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          roomCallCount++;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomQuery,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          membershipCallCount++;
          if (membershipCallCount === 1) {
            // First call: get user's membership
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: mockMembershipQuery,
                  }),
                }),
              }),
            };
          } else {
            // Second call: get all member IDs for stats
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ user_id: "user-000" }],
                  error: null,
                }),
              }),
            };
          }
        }
        if (table === "sessions") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    duration_seconds: 7200,
                    user_id: "user-000",
                    started_at: "2025-01-09T10:00:00Z",
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      const getRoomMembersSpy = vi
        .spyOn(service, "getRoomMembers")
        .mockResolvedValue(mockMembers);

      const result = await service.getRoomDetails(roomId, userId);

      expect(result.id).toBe(roomId);
      expect(result.name).toBe("Test Room");
      expect(result.role).toBe("member");
      expect(result.joinedAt).toBe("2025-01-09T11:00:00Z");
      expect(result.members).toEqual(mockMembers);
      expect(result.memberCount).toBe(1);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalHours).toBe(2);
      expect(getRoomMembersSpy).toHaveBeenCalledWith(roomId);

      getRoomMembersSpy.mockRestore();
    });

    it("should throw error when room not found", async () => {
      const mockRoomQuery = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.getRoomDetails(roomId, userId)).rejects.toThrow(
        "Room not found"
      );
    });

    it("should throw error when room query fails", async () => {
      const mockRoomQuery = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomQuery,
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.getRoomDetails(roomId, userId)).rejects.toThrow(
        "Failed to fetch room: Database error"
      );
    });

    it("should throw error when user is not a member", async () => {
      const mockRoomQuery = vi.fn().mockResolvedValue({
        data: mockDbRoom,
        error: null,
      });

      const mockMembershipQuery = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomQuery,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: mockMembershipQuery,
                }),
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.getRoomDetails(roomId, userId)).rejects.toThrow(
        "User is not a member of this room"
      );
    });

    it("should throw error when membership query fails", async () => {
      const mockRoomQuery = vi.fn().mockResolvedValue({
        data: mockDbRoom,
        error: null,
      });

      const mockMembershipQuery = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockClient._mocks.from.mockImplementation((table: string) => {
        if (table === "rooms") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockRoomQuery,
              }),
            }),
          };
        }
        if (table === "room_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: mockMembershipQuery,
                }),
              }),
            }),
          };
        }
        return mockClient._mocks;
      });

      await expect(service.getRoomDetails(roomId, userId)).rejects.toThrow(
        "Failed to fetch membership: Database error"
      );
    });
  });
});

