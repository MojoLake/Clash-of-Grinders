import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';

interface TopBarProps {
  title?: string;
}

export async function TopBar({ title }: TopBarProps) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  // Defensive: Should not happen due to middleware, but handle gracefully
  if (!user) {
    return null;
  }

  // Fetch profile data for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || null;

  return (
    <div className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
      {/* Title */}
      <div className="flex-1 md:ml-0 ml-12">
        {title && <h1 className="text-2xl font-bold">{title}</h1>}
      </div>

      {/* User menu */}
      <UserMenu displayName={displayName} avatarUrl={avatarUrl} />
    </div>
  );
}

