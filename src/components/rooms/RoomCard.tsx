import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Room, RoomStats } from "@/lib/types";

interface RoomCardProps {
  room: Room;
  stats: RoomStats;
  memberCount?: number;
  onClick?: () => void;
}

export function RoomCard({
  room,
  stats,
  memberCount = 0,
  onClick,
}: RoomCardProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-slate-800 transition"
      onClick={onClick}
    >
      <h3 className="text-xl font-bold mb-2">{room.name}</h3>
      {room.description && (
        <p className="text-sm text-slate-400 mb-4">{room.description}</p>
      )}
      <div className="flex gap-4 text-sm">
        <div>
          <Badge variant="secondary">{memberCount} members</Badge>
        </div>
        <div className="text-slate-400">
          {stats.totalHours.toFixed(1)}h total
        </div>
      </div>
    </Card>
  );
}
