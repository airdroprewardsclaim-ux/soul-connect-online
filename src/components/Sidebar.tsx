import { NavLink, useNavigate } from "react-router-dom";
import { Home, User, MessageCircle, Compass, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/messages", label: "Messages", icon: MessageCircle },
];

export const Sidebar = ({ onCompose }: { onCompose: () => void }) => {
  const { signOut } = useAuth();
  const { profile } = useMyProfile();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col gap-2 sticky top-0 h-screen py-6 pr-4">
      <div className="px-3 mb-4">
        <Logo />
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-4 py-3 rounded-full text-base font-medium transition-colors",
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        {profile && (
          <NavLink
            to={`/u/${profile.username}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-4 py-3 rounded-full text-base font-medium transition-colors",
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )
            }
          >
            <User className="h-5 w-5" />
            Profile
          </NavLink>
        )}
      </nav>
      <Button variant="hero" size="lg" onClick={onCompose} className="mt-3">
        New post
      </Button>
      <div className="mt-auto">
        {profile && (
          <button
            onClick={() => navigate(`/u/${profile.username}`)}
            className="flex w-full items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-colors text-left"
          >
            <UserAvatar profile={profile} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate text-sm">{profile.display_name || profile.username}</p>
              <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
            </div>
            <LogOut
              className="h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                signOut();
              }}
            />
          </button>
        )}
      </div>
    </aside>
  );
};
