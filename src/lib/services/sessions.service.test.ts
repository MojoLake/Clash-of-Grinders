/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionsService } from "./sessions.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateSessionRequest, DbSession } from "@/lib/types";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockFrom = vi.fn();

  // Chain methods properly
  mockSelect.mockReturnValue({ single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockEq.mockReturnValue({
    order: mockOrder,
    gte: mockGte,
    lte: mockLte,
    limit: mockLimit,
  });
  mockOrder.mockReturnValue({
    gte: mockGte,
    lte: mockLte,
    limit: mockLimit,
  });
  mockGte.mockReturnValue({
    lte: mockLte,
    limit: mockLimit,
    gte: mockGte,
  });
  mockLte.mockReturnValue({
    limit: mockLimit,
    lte: mockLte,
    gte: mockGte,
  });
  mockLimit.mockResolvedValue({ data: [], error: null });

  mockFrom.mockReturnValue({
    insert: mockInsert,
    select: mockSelect,
  });

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
      limit: mockLimit,
    },
  } as unknown as SupabaseClient & { _mocks: any };
};

describe("SessionsService", () => {
  let service: SessionsService;
  let mockClient: SupabaseClient & { _mocks: any };

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    service = new SessionsService(mockClient);
  });

  describe("createSession", () => {
    const userId = "user-123";
    const sessionData: CreateSessionRequest = {
      startedAt: "2025-01-09T10:00:00Z",
      endedAt: "2025-01-09T11:00:00Z",
      durationSeconds: 3600,
    };

    const mockDbSession: DbSession = {
      id: "session-123",
      user_id: userId,
      started_at: "2025-01-09T10:00:00Z",
      ended_at: "2025-01-09T11:00:00Z",
      duration_seconds: 3600,
      created_at: "2025-01-09T11:00:00Z",
    };

    it("should create a session successfully", async () => {
      mockClient._mocks.single.mockResolvedValue({
        data: mockDbSession,
        error: null,
      });

      const result = await service.createSession(userId, sessionData);

      expect(result).toEqual({
        id: "session-123",
        userId: userId,
        startedAt: "2025-01-09T10:00:00Z",
        endedAt: "2025-01-09T11:00:00Z",
        durationSeconds: 3600,
        createdAt: "2025-01-09T11:00:00Z",
      });

      expect(mockClient._mocks.from).toHaveBeenCalledWith("sessions");
      expect(mockClient._mocks.insert).toHaveBeenCalledWith({
        user_id: userId,
        started_at: sessionData.startedAt,
        ended_at: sessionData.endedAt,
        duration_seconds: sessionData.durationSeconds,
      });
    });

    it("should throw error when Supabase returns an error", async () => {
      mockClient._mocks.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      await expect(service.createSession(userId, sessionData)).rejects.toThrow(
        "Failed to create session: Database error"
      );
    });

    it("should throw error when no data is returned", async () => {
      mockClient._mocks.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(service.createSession(userId, sessionData)).rejects.toThrow(
        "Failed to create session: No data returned"
      );
    });
  });

  describe("getUserSessions", () => {
    const userId = "user-123";

    const mockDbSessions: DbSession[] = [
      {
        id: "session-1",
        user_id: userId,
        started_at: "2025-01-09T12:00:00Z",
        ended_at: "2025-01-09T13:00:00Z",
        duration_seconds: 3600,
        created_at: "2025-01-09T13:00:00Z",
      },
      {
        id: "session-2",
        user_id: userId,
        started_at: "2025-01-09T10:00:00Z",
        ended_at: "2025-01-09T11:00:00Z",
        duration_seconds: 3600,
        created_at: "2025-01-09T11:00:00Z",
      },
    ];

    beforeEach(() => {
      // Reset the mock chain for each test
      mockClient = createMockSupabaseClient();
      service = new SessionsService(mockClient);

      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockOrder = vi.fn();
      const mockLimit = vi.fn();

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockReturnValue({
        limit: mockLimit,
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
      });
      mockLimit.mockResolvedValue({ data: mockDbSessions, error: null });

      mockClient._mocks.from.mockReturnValue({
        select: mockSelect,
      });
      mockClient._mocks.select = mockSelect;
      mockClient._mocks.eq = mockEq;
      mockClient._mocks.order = mockOrder;
      mockClient._mocks.limit = mockLimit;
    });

    it("should fetch sessions with default options", async () => {
      const result = await service.getUserSessions(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("session-1");
      expect(result[1].id).toBe("session-2");

      expect(mockClient._mocks.from).toHaveBeenCalledWith("sessions");
      expect(mockClient._mocks.select).toHaveBeenCalledWith("*");
      expect(mockClient._mocks.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockClient._mocks.order).toHaveBeenCalledWith("started_at", {
        ascending: false,
      });
      expect(mockClient._mocks.limit).toHaveBeenCalledWith(10);
    });

    it("should fetch sessions with custom limit", async () => {
      await service.getUserSessions(userId, { limit: 5 });

      expect(mockClient._mocks.limit).toHaveBeenCalledWith(5);
    });

    it("should fetch sessions with date range filters", async () => {
      const mockGte = vi.fn().mockReturnThis();
      const mockLte = vi.fn().mockReturnThis();
      const mockLimit = vi
        .fn()
        .mockResolvedValue({ data: mockDbSessions, error: null });

      mockClient._mocks.order.mockReturnValue({
        gte: mockGte,
        lte: mockLte,
        limit: mockLimit,
      });

      mockGte.mockReturnValue({ lte: mockLte, limit: mockLimit });
      mockLte.mockReturnValue({ limit: mockLimit });

      await service.getUserSessions(userId, {
        startDate: "2025-01-09T00:00:00Z",
        endDate: "2025-01-09T23:59:59Z",
      });

      expect(mockGte).toHaveBeenCalledWith(
        "started_at",
        "2025-01-09T00:00:00Z"
      );
      expect(mockLte).toHaveBeenCalledWith(
        "started_at",
        "2025-01-09T23:59:59Z"
      );
    });

    it("should return empty array when no sessions found", async () => {
      mockClient._mocks.limit.mockResolvedValue({ data: [], error: null });

      const result = await service.getUserSessions(userId);

      expect(result).toEqual([]);
    });

    it("should return empty array when data is null", async () => {
      mockClient._mocks.limit.mockResolvedValue({ data: null, error: null });

      const result = await service.getUserSessions(userId);

      expect(result).toEqual([]);
    });

    it("should throw error when Supabase returns an error", async () => {
      mockClient._mocks.limit.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      await expect(service.getUserSessions(userId)).rejects.toThrow(
        "Failed to fetch sessions: Database error"
      );
    });
  });
});
