"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LeaveRoomDialog } from "./LeaveRoomDialog";
import { formatDate } from "@/lib/utils";
import type { RoomWithDetails } from "@/lib/types";
import { ArrowLeft, Settings, Link2, Check } from "lucide-react";

interface RoomHeaderProps {
  room: RoomWithDetails;
  currentUserId: string;
}

export function RoomHeader({ room, currentUserId }: RoomHeaderProps) {
  const router = useRouter();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = room.role === "owner";
  const hasOtherMembers = room.memberCount > 1;

  const handleCopyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/rooms/${room.id}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/rooms")}
        className="text-slate-400 hover:text-slate-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Rooms
      </Button>

      {/* Room Info */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{room.name}</h1>
        <p className="text-slate-400 mb-2">
          {room.description || "No description"}
        </p>
        <p className="text-sm text-slate-500">
          Created {formatDate(room.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyInviteLink}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              Copy Invite Link
            </>
          )}
        </Button>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement room settings page
              alert("Room settings coming soon!");
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setLeaveDialogOpen(true)}
        >
          Leave Room
        </Button>
      </div>

      {/* Leave Room Dialog */}
      <LeaveRoomDialog
        roomId={room.id}
        roomName={room.name}
        isOwner={isOwner}
        hasOtherMembers={hasOtherMembers}
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
      />
    </div>
  );
}

