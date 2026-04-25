import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Compass, User, Plus } from "lucide-react";
import { useMyProfile } from "@/hooks/useMyProfile";
import { cn } from "@/lib/utils";

export const MobileNav = ({ onCompose }: { onCompose: () => void }) => {
  const { profile } = useMyProfile();
  const item = "flex flex-col items-center justify-center flex-1 gap-1 text-xs";
  const active = "text-primary";
  const inactive = "text-muted-foreground";

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border h-16 flex items-center px-2">
      <NavLink to="/" end className={({ isActive }) => cn(item, isActive ? active : inactive)}>
        <Home className="h-5 w-5" />
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => cn(item, isActive ? active : inactive)}>
        <Compass className="h-5 w-5" />
      </NavLink>
      <button onClick={onCompose} className={cn(item, "text-foreground")}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
          <Plus className="h-5 w-5 text-primary-foreground" />
        </span>
      </button>
      <NavLink to="/messages" className={({ isActive }) => cn(item, isActive ? active : inactive)}>
        <MessageCircle className="h-5 w-5" />
      </NavLink>
      <NavLink
        to={profile ? `/u/${profile.username}` : "/"}
        className={({ isActive }) => cn(item, isActive ? active : inactive)}
      >
        <User className="h-5 w-5" />
      </NavLink>
    </nav>
  );
};
