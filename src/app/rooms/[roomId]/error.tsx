"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function RoomDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Room detail page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="border-red-500/50 max-w-2xl w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-slate-400 max-w-md">
              {error.message || "An unexpected error occurred while loading this room."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button onClick={reset}>Try Again</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

