"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates email format.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password requirements:
 * - Minimum 8 characters
 * - At least one letter (A-Z or a-z)
 * - At least one number (0-9)
 */
function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validates display name:
 * - Length between 1 and 50 characters (after trimming)
 */
function isValidDisplayName(displayName: string): boolean {
  const trimmed = displayName.trim();
  return trimmed.length >= 1 && trimmed.length <= 50;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Server Action: Creates a new user account.
 * Validates inputs and creates user with display name in metadata.
 */
export async function signupAction(formData: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, password, displayName } = formData;

  // Validate email
  if (!email || !isValidEmail(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  // Validate password
  if (!password) {
    return { success: false, error: "Password is required" };
  }

  if (!isValidPassword(password)) {
    return {
      success: false,
      error: "Password must be at least 8 characters with letters and numbers",
    };
  }

  // Validate display name
  if (!displayName || !isValidDisplayName(displayName)) {
    return {
      success: false,
      error: "Display name must be between 1 and 50 characters",
    };
  }

  try {
    const supabase = await createClient();

    // Create user account with display name in metadata
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (signUpError) {
      // Handle specific error cases
      if (signUpError.message.includes("already registered")) {
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }

      if (signUpError.message.includes("Password")) {
        return {
          success: false,
          error: "Password does not meet requirements",
        };
      }

      // Generic error
      console.error("Signup error:", signUpError);
      return {
        success: false,
        error: "Failed to create account. Please try again.",
      };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Unexpected signup error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Server Action: Authenticates an existing user.
 * Validates credentials and signs user in.
 */
export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, password } = formData;

  // Validate email
  if (!email || !isValidEmail(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  // Validate password presence
  if (!password) {
    return { success: false, error: "Password is required" };
  }

  try {
    const supabase = await createClient();

    // Attempt to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Handle invalid credentials
      if (
        signInError.message.includes("Invalid") ||
        signInError.message.includes("credentials")
      ) {
        return { success: false, error: "Invalid email or password" };
      }

      // Generic error
      console.error("Login error:", signInError);
      return { success: false, error: "Failed to log in. Please try again." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Unexpected login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Server Action: Logs out the current user.
 * Clears Supabase session and redirects to login page.
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

