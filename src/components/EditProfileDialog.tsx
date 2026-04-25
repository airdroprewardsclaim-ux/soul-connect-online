import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/social";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  display_name: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(160).optional(),
  avatar_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

interface Props {
  profile: Profile;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}

export const EditProfileDialog = ({ profile, open, onOpenChange, onSaved }: Props) => {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = schema.safeParse({ display_name: displayName, bio, avatar_url: avatar });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatar || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Avatar URL</Label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </div>
          <Button variant="hero" className="w-full" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
