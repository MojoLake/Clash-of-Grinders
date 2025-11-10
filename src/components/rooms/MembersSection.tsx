import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import type { RoomMemberWithProfile } from "@/lib/types";
import { Users } from "lucide-react";

interface MembersSectionProps {
  members: RoomMemberWithProfile[];
}

export function MembersSection({ members }: MembersSectionProps) {
  const getUserInitials = (displayName: string) => {
    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (role: "owner" | "admin" | "member") => {
    switch (role) {
      case "owner":
        return "default"; // violet
      case "admin":
        return "secondary"; // blue
      case "member":
        return "outline"; // slate
    }
  };

  const getRoleLabel = (role: "owner" | "admin" | "member") => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No members found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-violet-600 text-sm">
                      {getUserInitials(member.profile.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {member.profile.displayName}
                    </div>
                    <div className="text-sm text-slate-400">
                      Joined {formatDate(member.joinedAt)}
                    </div>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {getRoleLabel(member.role)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

