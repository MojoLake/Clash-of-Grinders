/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
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

describe("POST /api/rooms/[roomId]/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should join room successfully", async () => {
    const mockJoinRoom = vi.fn().mockResolvedValue(undefined);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.joinRoom = mockJoinRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/join",
      { method: "POST" }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Successfully joined room");
    expect(mockJoinRoom).toHaveBeenCalledWith("user-123", "room-123");
  });

  it("should return 404 when room not found", async () => {
    const mockJoinRoom = vi
      .fn()
      .mockRejectedValue(new Error("Room not found"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.joinRoom = mockJoinRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/join",
      { method: "POST" }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toContain("Room not found");
  });

  it("should return 400 when already a member", async () => {
    const mockJoinRoom = vi
      .fn()
      .mockRejectedValue(new Error("User is already a member of this room"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.joinRoom = mockJoinRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/join",
      { method: "POST" }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("already a member");
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth");
    (getAuthenticatedUser as any).mockRejectedValueOnce(
      new Error("Unauthorized: No authenticated user")
    );
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/join",
      { method: "POST" }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain("Unauthorized");
  });

  it("should return 500 when service throws an unexpected error", async () => {
    const mockJoinRoom = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.joinRoom = mockJoinRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/join",
      { method: "POST" }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("Database error");
  });
});

