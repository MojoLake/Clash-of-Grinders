import { AppShell } from "@/components/layout/AppShell";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { RoomStatsCard } from "@/components/rooms/RoomStatsCard";
import { LeaderboardSection } from "@/components/rooms/LeaderboardSection";
import { MembersSection } from "@/components/rooms/MembersSection";
import { RoomChat } from "@/components/rooms/RoomChat";
import { RoomJoinPrompt } from "@/components/rooms/RoomJoinPrompt";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { RoomsService } from "@/lib/services/rooms.service";
import { LeaderboardService } from "@/lib/services/leaderboard.service";
import type { LeaderboardPeriod } from "@/lib/types";
import { redirect, notFound } from "next/navigation";

interface RoomDetailPageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: RoomDetailPageProps) {
  // Await params and searchParams
  const { roomId } = await params;
  const { period: periodParam } = await searchParams;

  // Create Supabase client
  const supabase = await createClient();

  // Get authenticated user
  const user = await getCurrentUser(supabase);

  // Handle unauthenticated state
  if (!user) {
    redirect("/login");
  }

  // Instantiate services (use admin client to bypass RLS for basic room info)
  const adminClient = await createAdminClient();
  const roomsService = new RoomsService(adminClient);

  // Check membership first
  const isMember = await roomsService.isUserMember(user.id, roomId);

  // If not a member, show join prompt
  if (!isMember) {
    let basicRoomInfo;
    try {
      basicRoomInfo = await roomsService.getBasicRoomInfo(roomId);
    } catch (error) {
      console.error("Error fetching room info:", error);
      notFound();
    }

    return (
      <AppShell>
        <RoomJoinPrompt room={basicRoomInfo} />
      </AppShell>
    );
  }

  // Fetch room details
  let room;
  try {
    room = await roomsService.getRoomDetails(roomId, user.id);
  } catch (error) {
    console.error("Error fetching room details:", error);
    notFound();
  }

  // Validate and set period
  const validPeriods: LeaderboardPeriod[] = ["day", "week", "month", "all-time"];
  const period: LeaderboardPeriod = validPeriods.includes(
    periodParam as LeaderboardPeriod
  )
    ? (periodParam as LeaderboardPeriod)
    : "week";
  const leaderboardService = new LeaderboardService(adminClient);

  // Fetch leaderboard
  const leaderboard = await leaderboardService.computeLeaderboard(
    roomId,
    period
  );

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <RoomHeader room={room} currentUserId={user.id} />

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column: Stats, Leaderboard, Members */}
          <div className="lg:col-span-2 space-y-6">
            <RoomStatsCard stats={room.stats} memberCount={room.memberCount} />
            <LeaderboardSection
              leaderboard={leaderboard}
              period={period}
              currentUserId={user.id}
              roomId={roomId}
            />
            <MembersSection members={room.members || []} />
          </div>

          {/* Right column: Chat (sticky on desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <RoomChat roomId={roomId} currentUser={user} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

