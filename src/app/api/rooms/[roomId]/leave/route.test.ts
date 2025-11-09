/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";
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

describe("DELETE /api/rooms/[roomId]/leave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should leave room successfully", async () => {
    const mockLeaveRoom = vi.fn().mockResolvedValue(undefined);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.leaveRoom = mockLeaveRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/leave",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Successfully left room");
    expect(mockLeaveRoom).toHaveBeenCalledWith("user-123", "room-123");
  });

  it("should return 400 when user is not a member", async () => {
    const mockLeaveRoom = vi
      .fn()
      .mockRejectedValue(new Error("User is not a member of this room"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.leaveRoom = mockLeaveRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/leave",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("not a member");
  });

  it("should return 400 when owner tries to leave with other members", async () => {
    const mockLeaveRoom = vi
      .fn()
      .mockRejectedValue(
        new Error("Room owner cannot leave while other members exist")
      );
    (RoomsService as any).mockImplementation(function (this: any) {
      this.leaveRoom = mockLeaveRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/leave",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("owner cannot leave");
  });

  it("should allow owner to leave when they are the only member (room deleted)", async () => {
    const mockLeaveRoom = vi.fn().mockResolvedValue(undefined);
    (RoomsService as any).mockImplementation(function (this: any) {
      this.leaveRoom = mockLeaveRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/leave",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Successfully left room");
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth");
    (getAuthenticatedUser as any).mockRejectedValueOnce(
      new Error("Unauthorized: No authenticated user")
    );
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/leave",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain("Unauthorized");
  });

  it("should return 500 when service throws an unexpected error", async () => {
    const mockLeaveRoom = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (RoomsService as any).mockImplementation(function (this: any) {
      this.leaveRoom = mockLeaveRoom;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/room-123/leave",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ roomId: "room-123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("Database error");
  });
});

