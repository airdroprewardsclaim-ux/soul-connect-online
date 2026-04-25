import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { UserAvatar } from "./UserAvatar";
import { formatRelative } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { PostWithMeta } from "@/types/social";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  post: PostWithMeta;
  onChange?: (post: PostWithMeta) => void;
  onDeleted?: (id: string) => void;
  onOpenComments?: (post: PostWithMeta) => void;
}

export const PostCard = ({ post, onChange, onDeleted, onOpenComments }: Props) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const isMine = user?.id === post.user_id;

  const toggleLike = async () => {
    if (!user || busy) return;
    setBusy(true);
    const liked = post.liked_by_me;
    // optimistic
    onChange?.({ ...post, liked_by_me: !liked, like_count: post.like_count + (liked ? -1 : 1) });
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", post.id);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, post_id: post.id });
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    onDeleted?.(post.id);
  };

  return (
    <article className="px-5 py-4 border-b border-border hover:bg-surface/40 transition-colors animate-fade-in">
      <div className="flex gap-3">
        <Link to={`/u/${post.profile.username}`} className="shrink-0">
          <UserAvatar profile={post.profile} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link to={`/u/${post.profile.username}`} className="font-semibold hover:underline truncate">
              {post.profile.display_name || post.profile.username}
            </Link>
            <span className="text-muted-foreground truncate">@{post.profile.username}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatRelative(post.created_at)}</span>
            {isMine && (
              <button
                onClick={remove}
                className="ml-auto p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.content}</p>
          <div className="mt-3 flex items-center gap-6 text-muted-foreground">
            <button
              onClick={() => onOpenComments?.(post)}
              className="group flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <span className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </span>
              {post.comment_count > 0 && <span>{post.comment_count}</span>}
            </button>
            <button
              onClick={toggleLike}
              className={cn(
                "group flex items-center gap-2 text-sm transition-colors",
                post.liked_by_me ? "text-like" : "hover:text-like"
              )}
            >
              <span className={cn("p-2 rounded-full transition-colors", "group-hover:bg-like/10")}>
                <Heart
                  className={cn("h-4 w-4 transition-transform", post.liked_by_me && "fill-current animate-like-pop")}
                />
              </span>
              {post.like_count > 0 && <span>{post.like_count}</span>}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
