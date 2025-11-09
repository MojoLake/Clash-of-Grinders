import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCurrentUser } from '@/lib/mockUser';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const user = getCurrentUser();

  return (
    <div className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
      {/* Title */}
      <div className="flex-1 md:ml-0 ml-12">
        {title && <h1 className="text-2xl font-bold">{title}</h1>}
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div className="flex items-center gap-3 hover:opacity-80 transition">
            <span className="text-sm font-medium hidden sm:block">
              {user.displayName}
            </span>
            <Avatar>
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback>
                {user.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500">
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

