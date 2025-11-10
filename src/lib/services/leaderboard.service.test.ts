/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeaderboardService } from "./leaderboard.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbUser, LeaderboardPeriod } from "@/lib/types";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockIn = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockFrom = vi.fn();

  // Chain methods properly for sessions query (with .in())
  mockIn.mockReturnValue({ gte: mockGte });
  mockGte.mockReturnValue({ lte: mockLte });
  mockLte.mockResolvedValue({ data: [], error: null });

  // Chain methods for memberships query (with .eq())
  mockSelect.mockReturnValue({ eq: mockEq, in: mockIn });
  mockEq.mockReturnValue({ gte: mockGte, in: mockIn });

  mockFrom.mockReturnValue({
    select: mockSelect,
  });

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
      gte: mockGte,
      lte: mockLte,
    },
  } as unknown as SupabaseClient & { _mocks: any };
};

describe("LeaderboardService", () => {
  let service: LeaderboardService;
  let mockClient: SupabaseClient & { _mocks: any };

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    service = new LeaderboardService(mockClient);
  });

  describe("computeLeaderboard", () => {
    const roomId = "room-123";

    const mockDbUser1: DbUser = {
      id: "user-1",
      display_name: "Alice",
      avatar_url: null,
      created_at: "2025-01-01T00:00:00Z",
    };

    const mockDbUser2: DbUser = {
      id: "user-2",
      display_name: "Bob",
      avatar_url: null,
      created_at: "2025-01-01T00:00:00Z",
    };

    const mockDbUser3: DbUser = {
      id: "user-3",
      display_name: "Charlie",
      avatar_url: null,
      created_at: "2025-01-01T00:00:00Z",
    };

    it("should return empty array when no members exist", async () => {
      // Mock memberships query to return empty
      mockClient._mocks.eq.mockResolvedValue({ data: [], error: null });

      const result = await service.computeLeaderboard(roomId, "week");

      expect(result).toEqual([]);
      expect(mockClient._mocks.from).toHaveBeenCalledWith("room_memberships");
    });

    it("should return empty array when no sessions exist", async () => {
      // Mock memberships query
      mockClient._mocks.eq.mockResolvedValue({
        data: [{ user_id: "user-1" }],
        error: null,
      });
      // Mock sessions query to return empty
      mockClient._mocks.lte.mockResolvedValue({ data: [], error: null });

      const result = await service.computeLeaderboard(roomId, "week");

      expect(result).toEqual([]);
      expect(mockClient._mocks.from).toHaveBeenCalledWith("sessions");
    });

    it("should return empty array when session data is null", async () => {
      // Mock memberships query
      mockClient._mocks.eq.mockResolvedValue({
        data: [{ user_id: "user-1" }],
        error: null,
      });
      // Mock sessions query to return null
      mockClient._mocks.lte.mockResolvedValue({ data: null, error: null });

      const result = await service.computeLeaderboard(roomId, "week");

      expect(result).toEqual([]);
    });

    it("should compute leaderboard for a single user", async () => {
      // Mock memberships query
      mockClient._mocks.eq.mockResolvedValue({
        data: [{ user_id: "user-1" }],
        error: null,
      });

      const mockSessions = [
        {
          duration_seconds: 3600,
          started_at: "2025-01-09T10:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 1800,
          started_at: "2025-01-09T12:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
      ];

      mockClient._mocks.lte.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const result = await service.computeLeaderboard(roomId, "week");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        rank: 1,
        userId: "user-1",
        roomId: roomId,
        totalSeconds: 5400, // 3600 + 1800
        lastActiveAt: "2025-01-09T12:00:00Z", // Most recent
        user: {
          id: "user-1",
          displayName: "Alice",
          avatarUrl: null,
        },
      });
    });

    it("should compute leaderboard for multiple users sorted correctly", async () => {
      // Mock memberships query
      mockClient._mocks.eq.mockResolvedValue({
        data: [
          { user_id: "user-1" },
          { user_id: "user-2" },
          { user_id: "user-3" },
        ],
        error: null,
      });

      const mockSessions = [
        {
          duration_seconds: 3600,
          started_at: "2025-01-09T10:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 7200,
          started_at: "2025-01-09T11:00:00Z",
          user_id: "user-2",
          profiles: mockDbUser2,
        },
        {
          duration_seconds: 1800,
          started_at: "2025-01-09T12:00:00Z",
          user_id: "user-3",
          profiles: mockDbUser3,
        },
      ];

      mockClient._mocks.lte.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const result = await service.computeLeaderboard(roomId, "week");

      expect(result).toHaveLength(3);

      // Check ranks are assigned correctly
      expect(result[0].rank).toBe(1);
      expect(result[0].userId).toBe("user-2"); // 7200 seconds
      expect(result[0].totalSeconds).toBe(7200);

      expect(result[1].rank).toBe(2);
      expect(result[1].userId).toBe("user-1"); // 3600 seconds
      expect(result[1].totalSeconds).toBe(3600);

      expect(result[2].rank).toBe(3);
      expect(result[2].userId).toBe("user-3"); // 1800 seconds
      expect(result[2].totalSeconds).toBe(1800);
    });

    it("should handle tie in total seconds using lastActiveAt as tiebreaker", async () => {
      // Mock memberships query
      mockClient._mocks.eq.mockResolvedValue({
        data: [{ user_id: "user-1" }, { user_id: "user-2" }],
        error: null,
      });

      const mockSessions = [
        {
          duration_seconds: 3600,
          started_at: "2025-01-09T10:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 3600,
          started_at: "2025-01-09T12:00:00Z", // More recent
          user_id: "user-2",
          profiles: mockDbUser2,
        },
      ];

      mockClient._mocks.lte.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const result = await service.computeLeaderboard(roomId, "week");

      expect(result).toHaveLength(2);

      // User 2 should be ranked higher due to more recent activity
      expect(result[0].rank).toBe(1);
      expect(result[0].userId).toBe("user-2");
      expect(result[0].lastActiveAt).toBe("2025-01-09T12:00:00Z");

      expect(result[1].rank).toBe(2);
      expect(result[1].userId).toBe("user-1");
      expect(result[1].lastActiveAt).toBe("2025-01-09T10:00:00Z");
    });

    it("should aggregate multiple sessions per user correctly", async () => {
      // Mock memberships query
      mockClient._mocks.eq.mockResolvedValue({
        data: [{ user_id: "user-1" }],
        error: null,
      });

      const mockSessions = [
        {
          duration_seconds: 3600,
          started_at: "2025-01-09T10:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 1800,
          started_at: "2025-01-09T12:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 900,
          started_at: "2025-01-09T14:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
      ];

      mockClient._mocks.lte.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const result = await service.computeLeaderboard(roomId, "week");

      expect(result).toHaveLength(1);
      expect(result[0].totalSeconds).toBe(6300); // 3600 + 1800 + 900
      expect(result[0].lastActiveAt).toBe("2025-01-09T14:00:00Z"); // Most recent
    });

    it("should throw error when fetching memberships fails", async () => {
      mockClient._mocks.eq.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      await expect(
        service.computeLeaderboard(roomId, "week")
      ).rejects.toThrow("Failed to fetch room members: Database error");
    });

    it("should throw error when fetching sessions fails", async () => {
      // Mock memberships query successfully
      mockClient._mocks.eq.mockResolvedValue({
        data: [{ user_id: "user-1" }],
        error: null,
      });
      // Mock sessions query with error
      mockClient._mocks.lte.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      await expect(
        service.computeLeaderboard(roomId, "week")
      ).rejects.toThrow("Failed to fetch sessions for leaderboard: Database error");
    });

    it("should use correct date range for different periods", async () => {
      // Mock memberships query for all calls
      mockClient._mocks.eq.mockResolvedValue({
        data: [{ user_id: "user-1" }],
        error: null,
      });
      mockClient._mocks.lte.mockResolvedValue({ data: [], error: null });

      await service.computeLeaderboard(roomId, "day");
      expect(mockClient._mocks.gte).toHaveBeenCalled();

      await service.computeLeaderboard(roomId, "month");
      expect(mockClient._mocks.gte).toHaveBeenCalled();

      await service.computeLeaderboard(roomId, "all-time");
      expect(mockClient._mocks.gte).toHaveBeenCalled();
    });
  });

  describe("getPeriodRange", () => {
    it("should return correct date range for 'day' period", () => {
      const result = (service as any).getPeriodRange("day");

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Start date should be today at 00:00:00
      const expectedStart = new Date();
      expectedStart.setHours(0, 0, 0, 0);

      expect(result.startDate.getHours()).toBe(0);
      expect(result.startDate.getMinutes()).toBe(0);
      expect(result.startDate.getSeconds()).toBe(0);
    });

    it("should return correct date range for 'week' period", () => {
      const result = (service as any).getPeriodRange("week");

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Should be approximately 7 days ago
      const expectedDiff = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const actualDiff = result.endDate.getTime() - result.startDate.getTime();

      // Allow some tolerance for test execution time
      expect(Math.abs(actualDiff - expectedDiff)).toBeLessThan(1000);
    });

    it("should return correct date range for 'month' period", () => {
      const result = (service as any).getPeriodRange("month");

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Should be approximately 30 days ago
      const expectedDiff = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      const actualDiff = result.endDate.getTime() - result.startDate.getTime();

      // Allow some tolerance for test execution time and DST changes
      expect(Math.abs(actualDiff - expectedDiff)).toBeLessThanOrEqual(3600000); // 1 hour tolerance
    });

    it("should return correct date range for 'all-time' period", () => {
      const result = (service as any).getPeriodRange("all-time");

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Should start from 2000-01-01
      expect(result.startDate.getFullYear()).toBe(2000);
      expect(result.startDate.getMonth()).toBe(0); // January
      expect(result.startDate.getDate()).toBe(1);
    });

    it("should default to 'week' for invalid period", () => {
      const result = (service as any).getPeriodRange("invalid" as LeaderboardPeriod);

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Should behave like 'week'
      const expectedDiff = 7 * 24 * 60 * 60 * 1000;
      const actualDiff = result.endDate.getTime() - result.startDate.getTime();

      expect(Math.abs(actualDiff - expectedDiff)).toBeLessThan(1000);
    });
  });

  describe("aggregateByUser", () => {
    const roomId = "room-123";

    const mockDbUser1: DbUser = {
      id: "user-1",
      display_name: "Alice",
      avatar_url: null,
      created_at: "2025-01-01T00:00:00Z",
    };

    it("should aggregate sessions by user", () => {
      const sessions = [
        {
          duration_seconds: 3600,
          started_at: "2025-01-09T10:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 1800,
          started_at: "2025-01-09T12:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
      ];

      const result = (service as any).aggregateByUser(sessions, roomId);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user-1");
      expect(result[0].totalSeconds).toBe(5400); // 3600 + 1800
      expect(result[0].lastActiveAt).toBe("2025-01-09T12:00:00Z"); // Most recent
    });

    it("should track most recent activity for each user", () => {
      const mockDbUser2: DbUser = {
        id: "user-2",
        display_name: "Bob",
        avatar_url: null,
        created_at: "2025-01-01T00:00:00Z",
      };

      const sessions = [
        {
          duration_seconds: 3600,
          started_at: "2025-01-09T10:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 1800,
          started_at: "2025-01-09T14:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 900,
          started_at: "2025-01-09T12:00:00Z",
          user_id: "user-1",
          profiles: mockDbUser1,
        },
        {
          duration_seconds: 7200,
          started_at: "2025-01-09T11:00:00Z",
          user_id: "user-2",
          profiles: mockDbUser2,
        },
      ];

      const result = (service as any).aggregateByUser(sessions, roomId);

      expect(result).toHaveLength(2);

      const user1 = result.find((e: any) => e.userId === "user-1");
      expect(user1.lastActiveAt).toBe("2025-01-09T14:00:00Z"); // Most recent

      const user2 = result.find((e: any) => e.userId === "user-2");
      expect(user2.lastActiveAt).toBe("2025-01-09T11:00:00Z");
    });

    it("should handle empty sessions array", () => {
      const result = (service as any).aggregateByUser([], roomId);

      expect(result).toEqual([]);
    });
  });

  describe("sortLeaderboard", () => {
    it("should sort by total seconds descending", () => {
      const entries = [
        {
          userId: "user-1",
          user: { id: "user-1", displayName: "Alice", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 3600,
          lastActiveAt: "2025-01-09T10:00:00Z",
          streakDays: 0,
        },
        {
          userId: "user-2",
          user: { id: "user-2", displayName: "Bob", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 7200,
          lastActiveAt: "2025-01-09T11:00:00Z",
          streakDays: 0,
        },
        {
          userId: "user-3",
          user: { id: "user-3", displayName: "Charlie", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 1800,
          lastActiveAt: "2025-01-09T12:00:00Z",
          streakDays: 0,
        },
      ];

      const result = (service as any).sortLeaderboard(entries);

      expect(result[0].userId).toBe("user-2"); // 7200 seconds
      expect(result[1].userId).toBe("user-1"); // 3600 seconds
      expect(result[2].userId).toBe("user-3"); // 1800 seconds
    });

    it("should use lastActiveAt as tiebreaker when total seconds are equal", () => {
      const entries = [
        {
          userId: "user-1",
          user: { id: "user-1", displayName: "Alice", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 3600,
          lastActiveAt: "2025-01-09T10:00:00Z",
          streakDays: 0,
        },
        {
          userId: "user-2",
          user: { id: "user-2", displayName: "Bob", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 3600,
          lastActiveAt: "2025-01-09T12:00:00Z", // More recent
          streakDays: 0,
        },
      ];

      const result = (service as any).sortLeaderboard(entries);

      expect(result[0].userId).toBe("user-2"); // More recent activity
      expect(result[1].userId).toBe("user-1");
    });

    it("should handle empty array", () => {
      const result = (service as any).sortLeaderboard([]);

      expect(result).toEqual([]);
    });
  });

  describe("assignRanks", () => {
    it("should assign sequential ranks", () => {
      const entries = [
        {
          userId: "user-1",
          user: { id: "user-1", displayName: "Alice", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 7200,
          lastActiveAt: "2025-01-09T10:00:00Z",
          streakDays: 0,
        },
        {
          userId: "user-2",
          user: { id: "user-2", displayName: "Bob", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 3600,
          lastActiveAt: "2025-01-09T11:00:00Z",
          streakDays: 0,
        },
        {
          userId: "user-3",
          user: { id: "user-3", displayName: "Charlie", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 1800,
          lastActiveAt: "2025-01-09T12:00:00Z",
          streakDays: 0,
        },
      ];

      const result = (service as any).assignRanks(entries);

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it("should handle single entry", () => {
      const entries = [
        {
          userId: "user-1",
          user: { id: "user-1", displayName: "Alice", avatarUrl: null, createdAt: "" },
          roomId: "room-123",
          totalSeconds: 3600,
          lastActiveAt: "2025-01-09T10:00:00Z",
          streakDays: 0,
        },
      ];

      const result = (service as any).assignRanks(entries);

      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
    });

    it("should handle empty array", () => {
      const result = (service as any).assignRanks([]);

      expect(result).toEqual([]);
    });
  });
});

