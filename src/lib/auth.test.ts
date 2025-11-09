import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthenticatedUser, getCurrentUser } from "./auth";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("getAuthenticatedUser", () => {
  let mockSupabase: Partial<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      } as any,
    };
  });

  it("should return user when authenticated", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
    };

    (mockSupabase.auth!.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const user = await getAuthenticatedUser(mockSupabase as SupabaseClient);

    expect(user).toEqual(mockUser);
    expect(mockSupabase.auth!.getUser).toHaveBeenCalledOnce();
  });

  it("should throw error when authentication fails", async () => {
    const mockError = { message: "Invalid token" };

    (mockSupabase.auth!.getUser as any).mockResolvedValue({
      data: { user: null },
      error: mockError,
    });

    await expect(
      getAuthenticatedUser(mockSupabase as SupabaseClient)
    ).rejects.toThrow("Authentication error: Invalid token");
  });

  it("should throw error when no user is authenticated", async () => {
    (mockSupabase.auth!.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(
      getAuthenticatedUser(mockSupabase as SupabaseClient)
    ).rejects.toThrow("Unauthorized: No authenticated user");
  });
});

describe("getCurrentUser", () => {
  let mockSupabase: Partial<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      } as any,
    };
  });

  it("should return user when authenticated", async () => {
    const mockUser = {
      id: "user-456",
      email: "current@example.com",
    };

    (mockSupabase.auth!.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const user = await getCurrentUser(mockSupabase as SupabaseClient);

    expect(user).toEqual(mockUser);
    expect(mockSupabase.auth!.getUser).toHaveBeenCalledOnce();
  });

  it("should return null when no user is authenticated", async () => {
    (mockSupabase.auth!.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const user = await getCurrentUser(mockSupabase as SupabaseClient);

    expect(user).toBeNull();
  });

  it("should return null when authentication fails", async () => {
    (mockSupabase.auth!.getUser as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Session expired" },
    });

    const user = await getCurrentUser(mockSupabase as SupabaseClient);

    expect(user).toBeNull();
  });
});
