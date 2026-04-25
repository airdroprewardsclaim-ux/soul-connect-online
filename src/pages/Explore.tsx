import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/social";
import { Search } from "lucide-react";

const Explore = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      let q = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
      if (query.trim()) {
        const term = `%${query.trim()}%`;
        q = q.or(`username.ilike.${term},display_name.ilike.${term}`);
      }
      const { data } = await q;
      setProfiles(((data ?? []) as Profile[]).filter((p) => p.id !== user?.id));
    })();
  }, [query, user?.id]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => setFollowing(new Set((data ?? []).map((f) => f.following_id))));
  }, [user]);

  const toggle = async (id: string) => {
    if (!user) return;
    if (following.has(id)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
      setFollowing((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
      setFollowing((s) => new Set(s).add(id));
    }
  };

  return (
    <AppLayout>
      <div className="sticky top-0 z-20 glass border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="pl-10 rounded-full bg-surface border-border h-11"
          />
        </div>
      </div>
      <h1 className="px-5 pt-5 pb-2 text-xl font-bold">People to discover</h1>
      <div className="divide-y divide-border">
        {profiles.length === 0 && (
          <p className="p-10 text-center text-muted-foreground">No one matches.</p>
        )}
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-5 py-4 hover:bg-surface/40">
            <Link to={`/u/${p.username}`}>
              <UserAvatar profile={p} />
            </Link>
            <Link to={`/u/${p.username}`} className="flex-1 min-w-0">
              <p className="font-semibold truncate">{p.display_name || p.username}</p>
              <p className="text-sm text-muted-foreground truncate">@{p.username}</p>
              {p.bio && <p className="text-sm mt-1 line-clamp-2">{p.bio}</p>}
            </Link>
            <Button
              variant={following.has(p.id) ? "outline" : "pill"}
              size="sm"
              onClick={() => toggle(p.id)}
            >
              {following.has(p.id) ? "Following" : "Follow"}
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Explore;
