/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/mockUser", () => ({
  getCurrentUser: vi.fn(() => ({
    id: "user-123",
    displayName: "Test User",
    avatarUrl: null,
    createdAt: "2025-01-09T00:00:00Z",
  })),
}));

vi.mock("@/lib/services", () => ({
  SessionsService: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { SessionsService } from "@/lib/services";

describe("POST /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a session successfully", async () => {
    const mockSession = {
      id: "session-123",
      userId: "user-123",
      roomId: null,
      startedAt: "2025-01-09T10:00:00Z",
      endedAt: "2025-01-09T11:00:00Z",
      durationSeconds: 3600,
      createdAt: "2025-01-09T11:00:00Z",
    };

    const mockCreateSession = vi.fn().mockResolvedValue(mockSession);
    (SessionsService as any).mockImplementation(function (this: any) {
      this.createSession = mockCreateSession;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        startedAt: "2025-01-09T10:00:00Z",
        endedAt: "2025-01-09T11:00:00Z",
        durationSeconds: 3600,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({ session: mockSession });
    expect(mockCreateSession).toHaveBeenCalledWith("user-123", {
      startedAt: "2025-01-09T10:00:00Z",
      endedAt: "2025-01-09T11:00:00Z",
      durationSeconds: 3600,
      roomId: null,
    });
  });

  it("should create a session with roomId", async () => {
    const mockSession = {
      id: "session-123",
      userId: "user-123",
      roomId: "room-456",
      startedAt: "2025-01-09T10:00:00Z",
      endedAt: "2025-01-09T11:00:00Z",
      durationSeconds: 3600,
      createdAt: "2025-01-09T11:00:00Z",
    };

    const mockCreateSession = vi.fn().mockResolvedValue(mockSession);
    (SessionsService as any).mockImplementation(function (this: any) {
      this.createSession = mockCreateSession;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        startedAt: "2025-01-09T10:00:00Z",
        endedAt: "2025-01-09T11:00:00Z",
        durationSeconds: 3600,
        roomId: "room-456",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.session.roomId).toBe("room-456");
  });

  it("should return 400 when required fields are missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        startedAt: "2025-01-09T10:00:00Z",
        // missing endedAt and durationSeconds
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  it("should return 400 when durationSeconds is not positive", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        startedAt: "2025-01-09T10:00:00Z",
        endedAt: "2025-01-09T11:00:00Z",
        durationSeconds: -100,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("must be positive");
  });

  it("should return 400 when date range is invalid", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        startedAt: "2025-01-09T11:00:00Z",
        endedAt: "2025-01-09T10:00:00Z", // End before start
        durationSeconds: 3600,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("Start date must be before end date");
  });

  it("should return 500 when service throws an error", async () => {
    const mockCreateSession = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (SessionsService as any).mockImplementation(function (this: any) {
      this.createSession = mockCreateSession;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        startedAt: "2025-01-09T10:00:00Z",
        endedAt: "2025-01-09T11:00:00Z",
        durationSeconds: 3600,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("Database error");
  });
});

describe("GET /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch sessions with default options", async () => {
    const mockSessions = [
      {
        id: "session-1",
        userId: "user-123",
        roomId: null,
        startedAt: "2025-01-09T12:00:00Z",
        endedAt: "2025-01-09T13:00:00Z",
        durationSeconds: 3600,
        createdAt: "2025-01-09T13:00:00Z",
      },
    ];

    const mockGetUserSessions = vi.fn().mockResolvedValue(mockSessions);
    (SessionsService as any).mockImplementation(function (this: any) {
      this.getUserSessions = mockGetUserSessions;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "GET",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ sessions: mockSessions });
    expect(mockGetUserSessions).toHaveBeenCalledWith("user-123", {
      limit: 10,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("should fetch sessions with custom limit", async () => {
    const mockGetUserSessions = vi.fn().mockResolvedValue([]);
    (SessionsService as any).mockImplementation(function (this: any) {
      this.getUserSessions = mockGetUserSessions;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/sessions?limit=5",
      { method: "GET" }
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetUserSessions).toHaveBeenCalledWith("user-123", {
      limit: 5,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("should fetch sessions with date range", async () => {
    const mockGetUserSessions = vi.fn().mockResolvedValue([]);
    (SessionsService as any).mockImplementation(function (this: any) {
      this.getUserSessions = mockGetUserSessions;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest(
      "http://localhost:3000/api/sessions?startDate=2025-01-09T00:00:00Z&endDate=2025-01-09T23:59:59Z",
      { method: "GET" }
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetUserSessions).toHaveBeenCalledWith("user-123", {
      limit: 10,
      startDate: "2025-01-09T00:00:00Z",
      endDate: "2025-01-09T23:59:59Z",
    });
  });

  it("should return 400 when limit is not a positive number", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/sessions?limit=-5",
      { method: "GET" }
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("must be positive");
  });

  it("should return 400 when date range is invalid", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/sessions?startDate=2025-01-09T23:59:59Z&endDate=2025-01-09T00:00:00Z",
      { method: "GET" }
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("Start date must be before end date");
  });

  it("should return 500 when service throws an error", async () => {
    const mockGetUserSessions = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (SessionsService as any).mockImplementation(function (this: any) {
      this.getUserSessions = mockGetUserSessions;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "GET",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("Database error");
  });

  it("should return empty array when no sessions found", async () => {
    const mockGetUserSessions = vi.fn().mockResolvedValue([]);
    (SessionsService as any).mockImplementation(function (this: any) {
      this.getUserSessions = mockGetUserSessions;
    });
    (createClient as any).mockResolvedValue({});

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "GET",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.sessions).toEqual([]);
  });
});
