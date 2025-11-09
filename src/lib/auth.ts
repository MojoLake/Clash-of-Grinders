import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Gets the currently authenticated user.
 * Throws an error if no user is authenticated.
 */
export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }

  if (!user) {
    throw new Error("Unauthorized: No authenticated user");
  }

  return user;
}

/**
 * Checks if a user is authenticated.
 * Returns the user or null.
 */
export async function getCurrentUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
