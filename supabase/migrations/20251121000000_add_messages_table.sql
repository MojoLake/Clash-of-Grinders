-- Create messages table for room group chat
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Create indexes for efficient queries
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Room members can view messages
CREATE POLICY "Room members can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = messages.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

-- Room members can send messages
CREATE POLICY "Room members can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = messages.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

-- Users can update/delete own messages
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

