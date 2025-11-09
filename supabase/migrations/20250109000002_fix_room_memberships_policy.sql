-- Fix infinite recursion in room_memberships policies
-- The original policies queried room_memberships from within room_memberships policies
-- This caused infinite recursion when sessions tried to check room access

-- Drop the recursive policies
DROP POLICY IF EXISTS "Memberships viewable by room members" ON room_memberships;
DROP POLICY IF EXISTS "Room owners can manage memberships" ON room_memberships;

-- Create a security definer function that bypasses RLS to check room membership
CREATE OR REPLACE FUNCTION user_is_room_member(check_room_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM room_memberships
    WHERE room_id = check_room_id
      AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security definer function to check if user is room owner/admin
CREATE OR REPLACE FUNCTION user_is_room_admin(check_room_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM room_memberships
    WHERE room_id = check_room_id
      AND user_id = check_user_id
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace with non-recursive policies using security definer functions
CREATE POLICY "Users can view their own memberships"
  ON room_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view memberships of rooms they belong to"
  ON room_memberships FOR SELECT
  USING (user_is_room_member(room_id, auth.uid()));

CREATE POLICY "Room admins can insert memberships"
  ON room_memberships FOR INSERT
  WITH CHECK (user_is_room_admin(room_id, auth.uid()));

CREATE POLICY "Room admins can update memberships"
  ON room_memberships FOR UPDATE
  USING (user_is_room_admin(room_id, auth.uid()));

CREATE POLICY "Room admins can delete memberships"
  ON room_memberships FOR DELETE
  USING (user_is_room_admin(room_id, auth.uid()));

