import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { formatRelative } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Comment, PostWithMeta, Profile } from "@/types/social";
import { z } from "zod";
import { toast } from "sonner";

interface Props {
  post: PostWithMeta | null;
  onOpenChange: (open: boolean) => void;
  onCountChange?: (postId: string, delta: number) => void;
}

const schema = z.string().trim().min(1).max(500);

export const CommentsDialog = ({ post, onOpenChange, onCountChange }: Props) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!post) return;
    setLoading(true);
    (async () => {
      const { data: rows } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
      const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);
      const map = new Map<string, Profile>();
      (profiles ?? []).forEach((p) => map.set(p.id, p as Profile));
      setComments((rows ?? []).map((r) => ({ ...(r as Comment), profile: map.get(r.user_id)! })));
      setLoading(false);
    })();
  }, [post]);

  const submit = async () => {
    if (!post || !user) return;
    const parsed = schema.safeParse(text);
    if (!parsed.success) return toast.error("Comment can't be empty");
    setPosting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, user_id: user.id, content: parsed.data })
      .select("*")
      .single();
    setPosting(false);
    if (error || !data) return toast.error(error?.message ?? "Failed");
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setComments((c) => [...c, { ...(data as Comment), profile: profile as Profile }]);
    setText("");
    onCountChange?.(post.id, 1);
  };

  return (
    <Dialog open={!!post} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        {post && (
          <div className="flex gap-3 pb-4 border-b border-border">
            <UserAvatar profile={post.profile} size="sm" />
            <div className="text-sm">
              <p className="font-semibold">{post.profile.display_name || post.profile.username}</p>
              <p className="text-muted-foreground">{post.content}</p>
            </div>
          </div>
        )}
        <div className="max-h-72 overflow-y-auto space-y-4">
          {loading && <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>}
          {!loading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Be the first to reply</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <UserAvatar profile={c.profile} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{c.profile?.display_name || c.profile?.username}</span>
                  <span className="text-muted-foreground text-xs">{formatRelative(c.created_at)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-3 border-t border-border">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
          />
          <Button variant="pill" disabled={posting || !text.trim()} onClick={submit}>
            Reply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
