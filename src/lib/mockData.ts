import type { User, Room, Session, RoomMembership } from './types';

/**
 * Mock data for development and testing
 */

export const mockUsers: User[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    displayName: 'Test User',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    displayName: 'Alice Johnson',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    displayName: 'Bob Smith',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  },
];

export const mockRooms: Room[] = [
  {
    id: 'room-1',
    name: 'Math Lock-in',
    description: 'Competitive math study group',
    createdBy: mockUsers[0].id,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'room-2',
    name: 'Startup Grind',
    description: 'Building our startups together',
    createdBy: mockUsers[0].id,
    createdAt: new Date().toISOString(),
  },
];

export const mockSessions: Session[] = [
  {
    id: 'session-1',
    userId: mockUsers[0].id,
    roomId: 'room-1',
    startedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    endedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    durationSeconds: 5400, // 1.5 hours
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'session-2',
    userId: mockUsers[0].id,
    roomId: 'room-2',
    startedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    endedAt: new Date(Date.now() - 165600000).toISOString(),
    durationSeconds: 7200, // 2 hours
    createdAt: new Date(Date.now() - 165600000).toISOString(),
  },
];

export const mockMemberships: RoomMembership[] = [
  {
    roomId: 'room-1',
    userId: mockUsers[0].id,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  },
  {
    roomId: 'room-1',
    userId: mockUsers[1].id,
    role: 'member',
    joinedAt: new Date().toISOString(),
  },
  {
    roomId: 'room-2',
    userId: mockUsers[0].id,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  },
];

