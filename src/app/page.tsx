import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Timer, Users, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Clash of Grinders
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Track your grind sessions. Compete with friends. Build
            accountability through leaderboards.
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/rooms">
                  <Button size="lg" variant="outline" className="text-lg">
                    Browse Rooms
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="text-lg">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg">
                    Log In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Timer className="w-12 h-12" />}
            title="Track Sessions"
            description="Log every grind session with our easy-to-use timer."
          />
          <FeatureCard
            icon={<Users className="w-12 h-12" />}
            title="Compete in Rooms"
            description="Join rooms with friends and compete on leaderboards."
          />
          <FeatureCard
            icon={<Flame className="w-12 h-12" />}
            title="Build Streaks"
            description="Track your consistency and build daily grind streaks."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-4 text-violet-400">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}
