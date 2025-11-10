"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { leaveRoomAction } from "@/lib/actions/rooms";
import { AlertTriangle } from "lucide-react";

interface LeaveRoomDialogProps {
  roomId: string;
  roomName: string;
  isOwner: boolean;
  hasOtherMembers: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveRoomDialog({
  roomId,
  roomName,
  isOwner,
  hasOtherMembers,
  open,
  onOpenChange,
}: LeaveRoomDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = async () => {
    setIsLoading(true);
    setError(null);

    const result = await leaveRoomAction(roomId);

    if (result.success) {
      // Close dialog and redirect to rooms page
      onOpenChange(false);
      router.push("/rooms");
      router.refresh();
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  // If owner with other members, show warning dialog
  if (isOwner && hasOtherMembers) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Cannot Leave Room
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                You are the owner of this room and other members are still
                present.
              </p>
              <p>
                Please transfer ownership or remove all members before leaving.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Normal leave confirmation
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Room?</DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to leave &quot;{roomName}&quot;?
            {isOwner && (
              <span className="block mt-2 text-yellow-500">
                As the owner, leaving will delete this room permanently.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-950/50 border border-red-500 rounded-md p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLeave}
            disabled={isLoading}
          >
            {isLoading ? "Leaving..." : "Leave Room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

