import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/social";
import { UserAvatar } from "./UserAvatar";
import { Button } from "./ui/button";
import { TrendingUp } from "lucide-react";

export const RightRail = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Profile[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const exclude = new Set([user.id, ...(follows ?? []).map((f) => f.following_id)]);
      const { data } = await supabase.from("profiles").select("*").limit(20);
      setSuggestions((data ?? []).filter((p) => !exclude.has(p.id)).slice(0, 5) as Profile[]);
    })();
  }, [user]);

  const follow = async (id: string) => {
    if (!user) return;
    await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
    setSuggestions((s) => s.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4 sticky top-6">
      <div className="rounded-2xl bg-surface p-5 border border-border">
        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          Trending now
        </h2>
        <div className="space-y-3 text-sm">
          {["#design", "#startups", "#ai", "#music"].map((t) => (
            <div key={t} className="hover:bg-secondary/40 -mx-2 px-2 py-1 rounded-lg cursor-default">
              <p className="text-muted-foreground text-xs">Trending</p>
              <p className="font-semibold">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-5 border border-border">
        <h2 className="font-bold text-lg mb-4">Who to follow</h2>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions yet</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Link to={`/u/${p.username}`}>
                  <UserAvatar profile={p} />
                </Link>
                <Link to={`/u/${p.username}`} className="flex-1 min-w-0 hover:underline">
                  <p className="font-semibold truncate text-sm">{p.display_name || p.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                </Link>
                <Button variant="pill" size="sm" onClick={() => follow(p.id)}>
                  Follow
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
