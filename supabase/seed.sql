-- Seed file for local development
-- This file runs automatically after migrations during `supabase db reset`

-- ============================================================================
-- IMPORTANT: Creating Test Users
-- ============================================================================
-- You CANNOT insert directly into auth.users from SQL.
-- Instead, create test users via:
--   1. Local Studio UI: http://localhost:54323 → Authentication → Users
--   2. Auth API signup endpoint (see curl example below)
--   3. Your app's signup page
--
-- Once you have test users, note their UUIDs and use them below.
-- ============================================================================

-- Example curl command to create a test user (run in terminal):
-- curl -X POST 'http://localhost:54321/auth/v1/signup' \
--   -H "apikey: YOUR_LOCAL_ANON_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{
--     "email": "test@example.com",
--     "password": "password123",
--     "options": {
--       "data": {
--         "display_name": "Test User"
--       }
--     }
--   }'

-- ============================================================================
-- Test Data (uncomment and update with real user IDs)
-- ============================================================================

-- Example: Create a test room
-- Replace 'REAL_USER_UUID_HERE' with an actual UUID from auth.users
-- 
-- INSERT INTO rooms (name, description, created_by)
-- VALUES (
--   'Morning Grinders',
--   'Early bird study group',
--   'REAL_USER_UUID_HERE'
-- );

-- INSERT INTO rooms (name, description, created_by)
-- VALUES (
--   'Night Owls',
--   'Late night coding sessions',
--   'REAL_USER_UUID_HERE'
-- );

-- Example: Add room membership
-- 
-- INSERT INTO room_memberships (room_id, user_id, role)
-- SELECT 
--   r.id,
--   'REAL_USER_UUID_HERE',
--   'owner'
-- FROM rooms r
-- WHERE r.name = 'Morning Grinders';

-- Example: Create a test session
-- 
-- INSERT INTO sessions (user_id, room_id, started_at, ended_at, duration_seconds)
-- SELECT
--   'REAL_USER_UUID_HERE',
--   r.id,
--   NOW() - INTERVAL '2 hours',
--   NOW() - INTERVAL '30 minutes',
--   5400  -- 90 minutes in seconds
-- FROM rooms r
-- WHERE r.name = 'Morning Grinders';

-- ============================================================================
-- Development Tips
-- ============================================================================
-- 1. Create users first via Studio UI or signup endpoint
-- 2. Copy their UUIDs
-- 3. Uncomment the examples above and replace UUIDs
-- 4. Run: supabase db reset
-- 5. Your test data will be ready!

