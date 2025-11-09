-- Allow room creators to add themselves as members during room creation
-- This fixes the chicken-and-egg problem where creators can't insert themselves
-- as owners because they're not yet admins

CREATE POLICY "Room creators can add themselves as members"
  ON room_memberships FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
        AND rooms.created_by = auth.uid()
    )
  );

