import { describe, it, expect, vi, beforeEach } from "vitest";
import { signupAction, loginAction } from "./auth";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Next.js cache functions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("signupAction", () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
      },
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it("should create user account with valid inputs", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const result = await signupAction({
      email: "test@example.com",
      password: "password123",
      displayName: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      options: {
        data: {
          display_name: "Test User",
        },
      },
    });
  });

  it("should reject invalid email", async () => {
    const result = await signupAction({
      email: "not-an-email",
      password: "password123",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Please enter a valid email address");
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should reject empty email", async () => {
    const result = await signupAction({
      email: "",
      password: "password123",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Please enter a valid email address");
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should reject weak password (no numbers)", async () => {
    const result = await signupAction({
      email: "test@example.com",
      password: "password",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Password must be at least 8 characters with letters and numbers"
    );
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should reject weak password (no letters)", async () => {
    const result = await signupAction({
      email: "test@example.com",
      password: "12345678",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Password must be at least 8 characters with letters and numbers"
    );
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should reject weak password (too short)", async () => {
    const result = await signupAction({
      email: "test@example.com",
      password: "pass123",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Password must be at least 8 characters with letters and numbers"
    );
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should reject empty password", async () => {
    const result = await signupAction({
      email: "test@example.com",
      password: "",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Password is required");
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should reject empty display name", async () => {
    const result = await signupAction({
      email: "test@example.com",
      password: "password123",
      displayName: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Display name must be between 1 and 50 characters");
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should reject display name that is too long", async () => {
    const result = await signupAction({
      email: "test@example.com",
      password: "password123",
      displayName: "a".repeat(51),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Display name must be between 1 and 50 characters");
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should trim display name before saving", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const result = await signupAction({
      email: "test@example.com",
      password: "password123",
      displayName: "  Test User  ",
    });

    expect(result.success).toBe(true);
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      options: {
        data: {
          display_name: "Test User",
        },
      },
    });
  });

  it("should handle duplicate email error", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const result = await signupAction({
      email: "test@example.com",
      password: "password123",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("An account with this email already exists");
  });

  it("should handle password requirement error from Supabase", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "Password should be at least 6 characters" },
    });

    const result = await signupAction({
      email: "test@example.com",
      password: "password123",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Password does not meet requirements");
  });

  it("should handle unexpected errors", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "Network error" },
    });

    const result = await signupAction({
      email: "test@example.com",
      password: "password123",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to create account. Please try again.");
  });
});

describe("loginAction", () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
      },
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it("should authenticate user with valid credentials", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const result = await loginAction({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should reject invalid email format", async () => {
    const result = await loginAction({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Please enter a valid email address");
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("should reject empty email", async () => {
    const result = await loginAction({
      email: "",
      password: "password123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Please enter a valid email address");
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("should reject empty password", async () => {
    const result = await loginAction({
      email: "test@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Password is required");
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("should handle invalid credentials error", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await loginAction({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("should handle user not found error", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid email or password" },
    });

    const result = await loginAction({
      email: "nonexistent@example.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("should handle unexpected errors", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Network error" },
    });

    const result = await loginAction({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to log in. Please try again.");
  });
});

