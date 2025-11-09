import type { User } from './types';

// Mock user ID - this should match a user inserted into your Supabase profiles table
const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

/**
 * Returns a hardcoded mock user for development.
 * Replace this with actual Supabase Auth once authentication is implemented.
 */
export function getCurrentUser(): User {
  return {
    id: MOCK_USER_ID,
    displayName: 'Test User',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
}

