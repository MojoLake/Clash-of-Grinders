"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Room } from '@/lib/types';

interface JoinRoomDialogProps {
  availableRooms: Room[];
  userRoomIds: string[];
}

export function JoinRoomDialog({ availableRooms, userRoomIds }: JoinRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter out rooms user is already in
  const joinableRooms = availableRooms.filter(room => !userRoomIds.includes(room.id));
  
  const handleJoinRoom = async (roomId: string) => {
    setIsSubmitting(true);
    
    try {
      // TODO: Backend implementation pending
      // This endpoint doesn't exist yet but is ready for integration
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      
      if (response.ok) {
        setOpen(false);
        // Refresh page to show joined room
        window.location.reload();
      } else {
        console.error('Failed to join room:', await response.text());
      }
    } catch (error) {
      // Expected to fail until backend is implemented
      console.log('Join room request (backend pending):', { roomId });
      console.error('API call failed (expected until backend is implemented):', error);
    }
    
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Join Room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Room</DialogTitle>
        </DialogHeader>
        
        {joinableRooms.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No available rooms to join.</p>
            <p className="text-sm mt-2">You're already in all existing rooms!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {joinableRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 border border-slate-700 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                onClick={() => handleJoinRoom(room.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold">{room.name}</h4>
                    {room.description && (
                      <p className="text-sm text-slate-400 mt-1">{room.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">Join</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {isSubmitting && (
          <div className="text-center text-sm text-slate-400">
            Joining room...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

