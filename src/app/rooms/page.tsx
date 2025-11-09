import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { RoomCard } from "@/components/rooms/RoomCard";
import { CreateRoomDialog } from "@/components/rooms/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/rooms/JoinRoomDialog";
import { getUserRooms, getAllRooms } from "@/lib/rooms";
import { getCurrentUser } from "@/lib/mockUser";
import Link from "next/link";

export default function RoomsPage() {
  const user = getCurrentUser();
  const userRooms = getUserRooms(user.id);
  const allRooms = getAllRooms();

  return (
    <AppShell>
      <TopBar title="Rooms" />
      <div className="p-6">
        {/* Header with Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Rooms</h1>
          <div className="flex gap-2">
            <JoinRoomDialog
              availableRooms={allRooms}
              userRoomIds={userRooms.map((r) => r.id)}
            />
            <CreateRoomDialog />
          </div>
        </div>

        {/* Empty State */}
        {userRooms.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-xl mb-4">
              You haven&apos;t joined any rooms yet.
            </p>
            <p className="text-sm mb-6">
              Create a new room or join an existing one to get started.
            </p>
            <div className="flex gap-2 justify-center">
              <JoinRoomDialog availableRooms={allRooms} userRoomIds={[]} />
              <CreateRoomDialog />
            </div>
          </div>
        )}

        {/* Room Grid */}
        {userRooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`}>
                <RoomCard room={room} stats={room.stats} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
