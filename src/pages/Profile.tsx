import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { CommentsDialog } from "@/components/CommentsDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import type { Profile, PostWithMeta } from "@/types/social";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { EditProfileDialog } from "@/components/EditProfileDialog";

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [iFollow, setIFollow] = useState(false);
  const [editing, setEditing] = useState(false);

  const loadProfile = async () => {
    if (!username) return;
    const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
    setProfile(data as Profile | null);
    if (data) {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", data.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", data.id),
      ]);
      setStats({ followers: followers ?? 0, following: following ?? 0 });
      if (user && user.id !== data.id) {
        const { data: f } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", data.id)
          .maybeSingle();
        setIFollow(!!f);
      }
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, user?.id]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    if (iFollow) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      setIFollow(false);
      setStats((s) => ({ ...s, followers: s.followers - 1 }));
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      setIFollow(true);
      setStats((s) => ({ ...s, followers: s.followers + 1 }));
    }
  };

  const { posts, update, remove } = usePosts({ userId: profile?.id });
  const [openComments, setOpenComments] = useState<PostWithMeta | null>(null);

  const isMe = user?.id === profile?.id;

  return (
    <AppLayout>
      <div className="sticky top-0 z-20 glass border-b border-border px-4 py-3 flex items-center gap-4">
        <Link to="/" className="p-2 rounded-full hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-bold">{profile?.display_name || profile?.username || "Profile"}</h1>
          {profile && <p className="text-xs text-muted-foreground">{posts.length} posts</p>}
        </div>
      </div>

      {!profile ? (
        <p className="p-10 text-center text-muted-foreground">User not found</p>
      ) : (
        <>
          <div className="h-32 sm:h-40 bg-gradient-primary opacity-80" />
          <div className="px-5 pb-5 -mt-12 relative">
            <div className="flex justify-between items-end">
              <UserAvatar profile={profile} size="xl" className="ring-4 ring-background" />
              {isMe ? (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Link to={`/messages/${profile.username}`}>
                    <Button variant="outline" size="icon" aria-label="Message">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant={iFollow ? "outline" : "pill"} onClick={toggleFollow}>
                    {iFollow ? "Following" : "Follow"}
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <h2 className="text-xl font-bold">{profile.display_name || profile.username}</h2>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
              {profile.bio && <p className="text-[15px] whitespace-pre-wrap">{profile.bio}</p>}
              <div className="flex gap-5 text-sm">
                <span>
                  <strong>{stats.following}</strong>{" "}
                  <span className="text-muted-foreground">Following</span>
                </span>
                <span>
                  <strong>{stats.followers}</strong>{" "}
                  <span className="text-muted-foreground">Followers</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-border">
            {posts.length === 0 ? (
              <p className="p-10 text-center text-muted-foreground">No posts yet</p>
            ) : (
              posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onChange={update}
                  onDeleted={remove}
                  onOpenComments={setOpenComments}
                />
              ))
            )}
          </div>
        </>
      )}

      <CommentsDialog
        post={openComments}
        onOpenChange={(o) => !o && setOpenComments(null)}
        onCountChange={(id, delta) => {
          const target = posts.find((p) => p.id === id);
          if (target) update({ ...target, comment_count: target.comment_count + delta });
        }}
      />
      {profile && (
        <EditProfileDialog
          profile={profile}
          open={editing}
          onOpenChange={setEditing}
          onSaved={loadProfile}
        />
      )}
    </AppLayout>
  );
};

export default Profile;
