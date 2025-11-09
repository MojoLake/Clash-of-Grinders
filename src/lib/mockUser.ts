import type { User } from "./types";

// Mock user ID - this should match a user inserted into your Supabase profiles table
const MOCK_USER_ID = "6229270e-4abd-429c-94f7-faa9d4ed47ba";

/**
 * Returns a hardcoded mock user for development.
 * Replace this with actual Supabase Auth once authentication is implemented.
 */
export function getCurrentUser(): User {
  return {
    id: MOCK_USER_ID,
    displayName: "Test User",
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
}
