"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { joinRoomAction } from "@/lib/actions/rooms";
import { Users, ArrowLeft } from "lucide-react";
import type { Room } from "@/lib/types";

interface RoomJoinPromptProps {
  room: Room & { memberCount: number };
}

export function RoomJoinPrompt({ room }: RoomJoinPromptProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);

    try {
      const result = await joinRoomAction(room.id);

      if (result.success) {
        // Refresh the page to show the room content
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    }

    setIsJoining(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/rooms")}
          className="text-slate-400 hover:text-slate-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{room.name}</CardTitle>
            <CardDescription>
              {room.description || "No description"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Users className="h-4 w-4" />
              <span>{room.memberCount} {room.memberCount === 1 ? "member" : "members"}</span>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-950/20 border border-red-900 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full"
                size="lg"
              >
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
              <p className="text-xs text-center text-slate-500">
                You'll be able to track your study sessions and compete on the leaderboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

