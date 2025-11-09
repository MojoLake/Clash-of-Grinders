import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import DevLoginPage from "./page";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
  })),
}));

describe("DevLoginPage", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it("renders login form with pre-filled credentials", () => {
    render(<DevLoginPage />);

    expect(
      screen.getByRole("heading", { name: /dev login/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue("test@example.com");
    expect(screen.getByLabelText(/password/i)).toHaveValue("1234");
    expect(
      screen.getByRole("button", { name: /^login$/i })
    ).toBeInTheDocument();
  });

  it("handles successful login and redirects to dashboard", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<DevLoginPage />);

    const loginButton = screen.getByRole("button", { name: /^login$/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "1234",
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("displays error message when login fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<DevLoginPage />);

    const loginButton = screen.getByRole("button", { name: /^login$/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(
        screen.getByText(/invalid login credentials/i)
      ).toBeInTheDocument();
    });
  });

  it("calls signOut when Sign Out button is clicked", async () => {
    mockSignOut.mockResolvedValue({});

    render(<DevLoginPage />);

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
