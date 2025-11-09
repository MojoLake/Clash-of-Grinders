"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DevLoginPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Successful login, redirect to dashboard
      router.push("/dashboard");
      router.refresh(); // Refresh to load user session
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="p-8 max-w-md w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dev Login</h1>
          <p className="text-sm text-muted-foreground">
            Quick login for local development
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Sign Out
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">
            Default Credentials:
          </p>
          <p className="text-xs text-muted-foreground">
            Email: test@example.com
            <br />
            Password: password123
          </p>
        </div>
      </Card>
    </div>
  );
}
