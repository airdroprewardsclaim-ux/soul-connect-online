import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Post, PostWithMeta, Profile } from "@/types/social";

type FetchOpts = {
  userId?: string;          // posts by a specific user
  followingOnly?: boolean;  // home feed
};

export const usePosts = (opts: FetchOpts = {}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    let query = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100);

    if (opts.userId) query = query.eq("user_id", opts.userId);

    if (opts.followingOnly && user) {
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const ids = (follows ?? []).map((f) => f.following_id);
      ids.push(user.id); // include own posts
      query = query.in("user_id", ids);
    }

    const { data: postRows } = await query;
    const rawPosts = (postRows ?? []) as Post[];
    if (rawPosts.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(rawPosts.map((p) => p.user_id)));
    const postIds = rawPosts.map((p) => p.id);

    const [{ data: profileRows }, { data: likeRows }, { data: commentRows }, { data: myLikes }] = await Promise.all([
      supabase.from("profiles").select("*").in("id", userIds),
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
      user
        ? supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
        : Promise.resolve({ data: [] as { post_id: string }[] }),
    ]);

    const profileMap = new Map<string, Profile>();
    (profileRows ?? []).forEach((p) => profileMap.set(p.id, p as Profile));
    const likeCounts = new Map<string, number>();
    (likeRows ?? []).forEach((r) => likeCounts.set(r.post_id, (likeCounts.get(r.post_id) ?? 0) + 1));
    const commentCounts = new Map<string, number>();
    (commentRows ?? []).forEach((r) => commentCounts.set(r.post_id, (commentCounts.get(r.post_id) ?? 0) + 1));
    const mineSet = new Set((myLikes ?? []).map((r) => r.post_id));

    setPosts(
      rawPosts.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id)!,
        like_count: likeCounts.get(p.id) ?? 0,
        comment_count: commentCounts.get(p.id) ?? 0,
        liked_by_me: mineSet.has(p.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, opts.userId, opts.followingOnly]);

  const update = (next: PostWithMeta) => setPosts((cur) => cur.map((p) => (p.id === next.id ? next : p)));
  const remove = (id: string) => setPosts((cur) => cur.filter((p) => p.id !== id));

  return { posts, loading, reload: load, update, remove };
};
