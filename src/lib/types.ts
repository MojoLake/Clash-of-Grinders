// ============================================================================
// Database Types (matching Supabase schema)
// ============================================================================

export interface User {
  id: string; // UUID
  displayName: string;
  avatarUrl: string | null;
  createdAt: string; // ISO timestamp
}

export interface Room {
  id: string; // UUID
  name: string;
  description: string | null;
  createdBy: string; // User ID
  createdAt: string; // ISO timestamp
}

export interface RoomMembership {
  roomId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string; // ISO timestamp
}

export interface RoomMemberWithProfile {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string; // ISO timestamp
  profile: User; // Joined user profile data
}

export interface RoomWithDetails extends Room {
  members: RoomMemberWithProfile[];
  memberCount: number;
  role: "owner" | "admin" | "member"; // Current user's role
  joinedAt: string; // Current user's join date
  stats: RoomStats;
}

export interface Session {
  id: string; // UUID
  userId: string;
  startedAt: string; // ISO timestamp
  endedAt: string | null; // ISO timestamp, null if ongoing
  durationSeconds: number;
  createdAt: string; // ISO timestamp
}

// ============================================================================
// Computed/Derived Types
// ============================================================================

export interface LeaderboardEntry {
  userId: string;
  user: User; // Joined user data
  roomId: string;
  totalSeconds: number;
  streakDays: number;
  lastActiveAt: string; // ISO timestamp
  rank: number;
}

export interface RoomStats {
  totalHours: number;
  totalSessions: number;
  activeToday: number; // Number of members active today
  avgHoursPerMember: number;
}

export interface UserStats {
  totalSessions: number;
  totalSeconds: number;
  todaySeconds: number;
  weekSeconds: number;
  currentStreak: number; // Days
  longestStreak: number; // Days
  topRoom: {
    roomId: string;
    roomName: string;
    totalSeconds: number;
  } | null;
}

export interface DailyTotal {
  date: Date; // Midnight of the day
  seconds: number; // Total grind time
  isToday: boolean; // Flag for styling today differently
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateSessionRequest {
  startedAt: string; // ISO timestamp
  endedAt: string; // ISO timestamp
  durationSeconds: number;
}

export interface CreateSessionResponse {
  session: Session;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
}

export interface CreateRoomResponse {
  room: Room;
  membership: RoomMembership;
}

export interface GetLeaderboardParams {
  roomId: string;
  period: "day" | "week" | "month" | "all-time";
}

export interface GetLeaderboardResponse {
  entries: LeaderboardEntry[];
  period: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface SessionCardProps {
  onSessionEnd: (durationSeconds: number) => void;
}

export interface StatsCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface RoomCardProps {
  room: Room;
  stats: RoomStats;
  onClick?: () => void;
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Period = "day" | "week" | "month" | "all-time";

export type LeaderboardPeriod = "day" | "week" | "month" | "all-time";

export type TimerState = "idle" | "running" | "paused";

export interface TimerData {
  state: TimerState;
  startedAt: number; // Unix timestamp (ms)
  elapsedSeconds: number;
  roomId?: string | null;
}

// ============================================================================
// Form Types
// ============================================================================

export interface CreateRoomFormData {
  name: string;
  description: string;
}

export interface SessionFormData {
  roomId?: string;
  note?: string;
}

// ============================================================================
// Database Response Types (from Supabase)
// ============================================================================

// These match the snake_case column names from Supabase
export interface DbUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface DbRoom {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface DbSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface DbRoomMembership {
  room_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

// ============================================================================
// Mapper Functions (DB <-> App Types)
// ============================================================================

export function dbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    displayName: dbUser.display_name,
    avatarUrl: dbUser.avatar_url,
    createdAt: dbUser.created_at,
  };
}

export function dbRoomToRoom(dbRoom: DbRoom): Room {
  return {
    id: dbRoom.id,
    name: dbRoom.name,
    description: dbRoom.description,
    createdBy: dbRoom.created_by,
    createdAt: dbRoom.created_at,
  };
}

export function dbSessionToSession(dbSession: DbSession): Session {
  return {
    id: dbSession.id,
    userId: dbSession.user_id,
    startedAt: dbSession.started_at,
    endedAt: dbSession.ended_at,
    durationSeconds: dbSession.duration_seconds,
    createdAt: dbSession.created_at,
  };
}

export function dbMembershipToMembership(
  dbMembership: DbRoomMembership
): RoomMembership {
  return {
    roomId: dbMembership.room_id,
    userId: dbMembership.user_id,
    role: dbMembership.role,
    joinedAt: dbMembership.joined_at,
  };
}
