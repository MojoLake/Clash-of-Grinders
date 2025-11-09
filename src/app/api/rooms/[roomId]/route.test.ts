/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: vi.fn(() =>
    Promise.resolve({
      id: "user-123",
      email: "test@example.com",
    })
  ),
}));

vi.mock("@/lib/services/rooms.service", () => ({
  RoomsService: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { RoomsService } from "@/lib/services/rooms.service";

describe("GET /api/rooms/[roomId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return room details successfully", async () => {
    const mockRoomDetails = {
      id: "room-123",
      name: "Test Room",
      description: "A test room",
      createdBy: "user-123",
      createdAt: "2025-01-09T10:00:00Z",
      role: "owner" as const,
      joinedAt: "2025-01-09T10:00:00Z",
      members: [
        {
          userId: "user-123",
          role: "owner" as const,
          joinedAt: "2025-01-09T10:00:00Z",
          profile: {
            id: "user-123",
            displayName: "Test User",
            avatarUrl: null,
            createdAt: "2025-01-09T10:00:00Z",
          },
        },
      ],
      memberCount: 1,
      stats: {
        totalHours: 10,
        totalSessions: 5,
        activeToday: 1,
        avgHoursPerMember: 10,
      },
    };

    const mockIsUserMember = vi.fn().mockResolvedValue(true);
    const mockGetRoomDetails = vi.fn().mockResolvedValue(mockRoomDetails);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.isUserMember = mockIsUserMember;
      this.getRoomDetails = mockGetRoomDetails;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123",
      { method: "GET" }
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ room: mockRoomDetails });
    expect(mockIsUserMember).toHaveBeenCalledWith("user-123", "room-123");
    expect(mockGetRoomDetails).toHaveBeenCalledWith("room-123", "user-123");
  });

  it("should return 403 when user is not a member", async () => {
    const mockIsUserMember = vi.fn().mockResolvedValue(false);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.isUserMember = mockIsUserMember;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123",
      { method: "GET" }
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toContain("not a member");
  });

  it("should return 404 when room not found", async () => {
    const mockIsUserMember = vi.fn().mockResolvedValue(true);
    const mockGetRoomDetails = vi
      .fn()
      .mockRejectedValue(new Error("Room not found"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.isUserMember = mockIsUserMember;
      this.getRoomDetails = mockGetRoomDetails;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123",
      { method: "GET" }
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toContain("Room not found");
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth");
    (getAuthenticatedUser as any).mockRejectedValueOnce(
      new Error("Unauthorized: No authenticated user")
    );
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123",
      { method: "GET" }
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain("Unauthorized");
  });

  it("should return 500 when service throws an unexpected error", async () => {
    const mockIsUserMember = vi.fn().mockResolvedValue(true);
    const mockGetRoomDetails = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.isUserMember = mockIsUserMember;
      this.getRoomDetails = mockGetRoomDetails;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123",
      { method: "GET" }
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("Database error");
  });
});

