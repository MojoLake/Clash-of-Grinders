"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function JoinRoomDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setRoomId('');
      setError(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setOpen(false);
        setRoomId('');
        setError(null);
        // Refresh page to show joined room
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join room');
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
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            />
            <p className="text-sm text-slate-400 mt-1">
              Ask the room owner for the room ID to join
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-400 bg-red-950/20 border border-red-900 rounded-lg p-3">
              {error}
            </div>
          )}
          <Button type="submit" disabled={isSubmitting || !roomId} className="w-full">
            {isSubmitting ? 'Joining...' : 'Join'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

