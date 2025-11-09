import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrentSessionCard } from "@/components/dashboard/CurrentSessionCard";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Current Session Timer */}
        <CurrentSessionCard />

        {/* Placeholder: Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCardPlaceholder label="Today" value="2h 34m" />
          <StatCardPlaceholder label="This Week" value="15h 20m" />
          <StatCardPlaceholder label="Streak" value="5 days" />
        </div>

        {/* Placeholder: Recent Sessions */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Recent Sessions</h3>
          <div className="text-center py-8 text-slate-400">
            <p>No sessions yet. Start grinding!</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

// Simple placeholder component for stats
function StatCardPlaceholder({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-400 mb-2">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      <Badge variant="secondary" className="mt-2">
        Mock Data
      </Badge>
    </Card>
  );
}
