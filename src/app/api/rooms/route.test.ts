/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
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

describe("POST /api/rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a room successfully", async () => {
    const mockRoom = {
      id: "room-123",
      name: "Test Room",
      description: "A test room",
      createdBy: "user-123",
      createdAt: "2025-01-09T10:00:00Z",
    };

    const mockCreateRoom = vi.fn().mockResolvedValue(mockRoom);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.createRoom = mockCreateRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Room",
        description: "A test room",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({ room: mockRoom });
    expect(mockCreateRoom).toHaveBeenCalledWith("user-123", {
      name: "Test Room",
      description: "A test room",
    });
  });

  it("should create a room without description", async () => {
    const mockRoom = {
      id: "room-123",
      name: "Test Room",
      description: null,
      createdBy: "user-123",
      createdAt: "2025-01-09T10:00:00Z",
    };

    const mockCreateRoom = vi.fn().mockResolvedValue(mockRoom);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.createRoom = mockCreateRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Room",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.room.description).toBe(null);
  });

  it("should return 400 when name is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        description: "A test room",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  it("should return 400 when name is too short", async () => {
    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("name");
  });

  it("should return 400 when name is too long", async () => {
    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "a".repeat(101),
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("name");
  });

  it("should return 400 when description is too long", async () => {
    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Room",
        description: "a".repeat(501),
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("description");
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth");
    (getAuthenticatedUser as any).mockRejectedValueOnce(
      new Error("Unauthorized: No authenticated user")
    );
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Room",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain("Unauthorized");
  });

  it("should return 500 when service throws an error", async () => {
    const mockCreateRoom = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.createRoom = mockCreateRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Room",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("Database error");
  });
});

describe("GET /api/rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user's rooms successfully", async () => {
    const mockRooms = [
      {
        id: "room-1",
        name: "Room 1",
        description: "First room",
        createdBy: "user-123",
        createdAt: "2025-01-09T10:00:00Z",
        role: "owner" as const,
        joinedAt: "2025-01-09T10:00:00Z",
        members: [],
        memberCount: 1,
        stats: {
          totalHours: 10,
          totalSessions: 5,
          activeToday: 1,
          avgHoursPerMember: 10,
        },
      },
      {
        id: "room-2",
        name: "Room 2",
        description: null,
        createdBy: "user-456",
        createdAt: "2025-01-08T10:00:00Z",
        role: "member" as const,
        joinedAt: "2025-01-08T10:00:00Z",
        members: [],
        memberCount: 2,
        stats: {
          totalHours: 20,
          totalSessions: 10,
          activeToday: 2,
          avgHoursPerMember: 10,
        },
      },
    ];

    const mockGetUserRooms = vi.fn().mockResolvedValue(mockRooms);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.getUserRooms = mockGetUserRooms;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "GET",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ rooms: mockRooms });
    expect(mockGetUserRooms).toHaveBeenCalledWith("user-123");
  });

  it("should return empty array when user has no rooms", async () => {
    const mockGetUserRooms = vi.fn().mockResolvedValue([]);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.getUserRooms = mockGetUserRooms;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "GET",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.rooms).toEqual([]);
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth");
    (getAuthenticatedUser as any).mockRejectedValueOnce(
      new Error("Unauthorized: No authenticated user")
    );
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "GET",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain("Unauthorized");
  });

  it("should return 500 when service throws an error", async () => {
    const mockGetUserRooms = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.getUserRooms = mockGetUserRooms;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/rooms", {
      method: "GET",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("Database error");
  });
});

