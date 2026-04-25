import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types/social";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  profile?: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

export const UserAvatar = ({ profile, size = "md", className }: Props) => {
  const name = profile?.display_name || profile?.username;
  return (
    <Avatar className={cn(sizes[size], "ring-2 ring-border", className)}>
      {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name || "user"} /> : null}
      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
};
