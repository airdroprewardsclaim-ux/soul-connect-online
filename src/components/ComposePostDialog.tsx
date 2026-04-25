import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { useMyProfile } from "@/hooks/useMyProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.string().trim().min(1, "Say something").max(500, "Max 500 characters");

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPosted?: () => void;
}

export const ComposePostDialog = ({ open, onOpenChange, onPosted }: Props) => {
  const { profile } = useMyProfile();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = 500 - content.length;

  const submit = async () => {
    const parsed = schema.safeParse(content);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("posts").insert({ user_id: user.id, content: parsed.data });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setContent("");
    onOpenChange(false);
    toast.success("Posted");
    onPosted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3">
          <UserAvatar profile={profile} />
          <div className="flex-1 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's pulsing?"
              className="min-h-[140px] border-0 bg-transparent text-lg resize-none focus-visible:ring-0 px-0"
              maxLength={500}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className={`text-sm ${remaining < 50 ? "text-destructive" : "text-muted-foreground"}`}>
                {remaining}
              </span>
              <Button variant="pill" disabled={loading || !content.trim()} onClick={submit}>
                {loading ? "Posting…" : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
