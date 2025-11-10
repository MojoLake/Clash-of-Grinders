import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "./page";

// Mock the auth action
vi.mock("@/lib/actions/auth", () => ({
  signupAction: vi.fn(),
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { signupAction } from "@/lib/actions/auth";

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders signup form with all fields", () => {
    render(<SignupPage />);

    expect(screen.getByText("Create Your Account")).toBeInTheDocument();
    expect(screen.getByText("Start tracking your grind")).toBeInTheDocument();
    expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows link to login page", () => {
    render(<SignupPage />);

    const loginLink = screen.getByText("Log in");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows password requirements hint", () => {
    render(<SignupPage />);

    expect(
      screen.getByText("Must be at least 8 characters with letters and numbers")
    ).toBeInTheDocument();
  });

  it("displays error for invalid email", async () => {
    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "not-an-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });

    expect(signupAction).not.toHaveBeenCalled();
  });

  it("displays error for weak password (no numbers)", async () => {
    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters with letters and numbers")
      ).toBeInTheDocument();
    });

    expect(signupAction).not.toHaveBeenCalled();
  });

  it("displays error for weak password (too short)", async () => {
    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "pass123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "pass123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters with letters and numbers")
      ).toBeInTheDocument();
    });

    expect(signupAction).not.toHaveBeenCalled();
  });

  it("displays error when passwords do not match", async () => {
    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "differentpassword123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });

    expect(signupAction).not.toHaveBeenCalled();
  });

  it("displays error for invalid display name (too long)", async () => {
    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "a".repeat(51) } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Display name must be between 1 and 50 characters")
      ).toBeInTheDocument();
    });

    expect(signupAction).not.toHaveBeenCalled();
  });

  it("calls signupAction with valid inputs", async () => {
    (signupAction as any).mockResolvedValue({ success: true });

    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signupAction).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User",
      });
    });
  });

  it("disables submit button while loading", async () => {
    (signupAction as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
    });
  });

  it("displays server error message", async () => {
    (signupAction as any).mockResolvedValue({
      success: false,
      error: "An account with this email already exists",
    });

    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("An account with this email already exists")
      ).toBeInTheDocument();
    });
  });

  it("clears error when resubmitting", async () => {
    (signupAction as any).mockResolvedValueOnce({
      success: false,
      error: "An error occurred",
    });

    render(<SignupPage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("An error occurred")).toBeInTheDocument();
    });

    // Resubmit with fixed data
    (signupAction as any).mockResolvedValueOnce({ success: true });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText("An error occurred")).not.toBeInTheDocument();
    });
  });
});

