-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_rooms_created_by ON rooms(created_by);

-- Create room_memberships table (before rooms policies that reference it)
CREATE TABLE room_memberships (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX idx_room_memberships_user ON room_memberships(user_id);
CREATE INDEX idx_room_memberships_room ON room_memberships(room_id);

-- Enable RLS for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Rooms are viewable by members"
  ON rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = rooms.id
        AND room_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable RLS for room_memberships
ALTER TABLE room_memberships ENABLE ROW LEVEL SECURITY;

-- Room memberships policies
CREATE POLICY "Memberships viewable by room members"
  ON room_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships rm
      WHERE rm.room_id = room_memberships.room_id
        AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can manage memberships"
  ON room_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships rm
      WHERE rm.room_id = room_memberships.room_id
        AND rm.user_id = auth.uid()
        AND rm.role IN ('owner', 'admin')
    )
  );

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (ended_at IS NULL OR ended_at >= started_at),
  CHECK (duration_seconds >= 0)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_room_id ON sessions(room_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX idx_sessions_user_started ON sessions(user_id, started_at DESC);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Room members can view room sessions"
  ON sessions FOR SELECT
  USING (
    room_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = sessions.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

