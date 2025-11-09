import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, TrendingUp } from "lucide-react";
import type { RoomWithDetails } from "@/lib/types";

interface RoomCardProps {
  room: RoomWithDetails;
}

export function RoomCard({ room }: RoomCardProps) {
  // Determine badge styling based on role
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-violet-600 hover:bg-violet-700 text-white";
      case "admin":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "member":
      default:
        return ""; // Uses default secondary variant
    }
  };

  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="p-4 cursor-pointer hover:bg-slate-800 hover:border-violet-500 transition">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold">{room.name}</h3>
          <Badge
            variant={room.role === "member" ? "secondary" : "default"}
            className={getRoleBadgeClass(room.role)}
          >
            {room.role}
          </Badge>
        </div>

        {room.description ? (
          <p className="text-sm text-slate-400 mb-4">{room.description}</p>
        ) : (
          <p className="text-sm text-slate-500 italic mb-4">No description</p>
        )}

        <div className="flex gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{room.memberCount} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{room.stats.totalHours.toFixed(1)}h total</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{room.stats.activeToday} active today</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
