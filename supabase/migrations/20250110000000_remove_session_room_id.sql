-- Remove the RLS policy that checks room membership via session.room_id
DROP POLICY IF EXISTS "Room members can view room sessions" ON sessions;

-- Drop the room_id column and its index
DROP INDEX IF EXISTS idx_sessions_room_id;
ALTER TABLE sessions DROP COLUMN room_id;

