"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinRoomAction } from '@/lib/actions/rooms';

export function JoinRoomDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setRoomInput('');
      setError(null);
    }
  };

  // Extract room ID from URL or return the input as-is
  const extractRoomId = (input: string): string => {
    const trimmed = input.trim();
    
    // Check if it's a URL
    try {
      const url = new URL(trimmed);
      // Extract room ID from pathname like /rooms/{roomId}
      const match = url.pathname.match(/\/rooms\/([a-f0-9-]+)/i);
      if (match) {
        return match[1];
      }
    } catch {
      // Not a valid URL, treat as room ID
    }
    
    // Return as-is (assumes it's a room ID)
    return trimmed;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Extract room ID from input (handles both URLs and direct IDs)
      const roomId = extractRoomId(roomInput);
      
      if (!roomId) {
        setError('Please enter a valid room ID or invite link');
        setIsSubmitting(false);
        return;
      }

      // Call Server Action directly
      const result = await joinRoomAction(roomId);
      
      if (result.success) {
        setOpen(false);
        setRoomInput('');
        setError(null);
        // Refresh page to show joined room
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    }
    
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Join Room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roomInput">Room Invite Link or ID</Label>
            <Input
              id="roomInput"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              required
              placeholder="Paste invite link or room ID"
            />
            <p className="text-sm text-slate-400 mt-1">
              Paste the invite link shared by the room owner
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-400 bg-red-950/20 border border-red-900 rounded-lg p-3">
              {error}
            </div>
          )}
          <Button type="submit" disabled={isSubmitting || !roomInput} className="w-full">
            {isSubmitting ? 'Joining...' : 'Join'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

