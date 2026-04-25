import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Conversation, Message, Profile } from "@/types/social";
import { formatRelative } from "@/lib/format";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePeer, setActivePeer] = useState<Profile | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  const loadConversations = async () => {
    if (!user) return;
    const { data: rows } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    const msgs = (rows ?? []) as Message[];
    const map = new Map<string, Conversation>();
    for (const m of msgs) {
      const peerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!map.has(peerId)) {
        map.set(peerId, {
          user: { id: peerId } as Profile,
          last_message: m,
          unread: 0,
        });
      }
      if (m.recipient_id === user.id && !m.read) {
        const c = map.get(peerId)!;
        c.unread += 1;
      }
    }
    const peerIds = Array.from(map.keys());
    if (peerIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", peerIds);
      (profiles ?? []).forEach((p) => {
        const c = map.get(p.id);
        if (c) c.user = p as Profile;
      });
    }
    setConversations(Array.from(map.values()));
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Resolve peer from URL
  useEffect(() => {
    if (!username) {
      setActivePeer(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle()
      .then(({ data }) => setActivePeer((data as Profile) ?? null));
  }, [username]);

  // Load thread when activePeer changes
  useEffect(() => {
    if (!user || !activePeer) {
      setThread([]);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${activePeer.id}),and(sender_id.eq.${activePeer.id},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });
      setThread((data ?? []) as Message[]);
      // mark as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("recipient_id", user.id)
        .eq("sender_id", activePeer.id)
        .eq("read", false);
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`dm-${user.id}-${activePeer.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          const involved =
            (m.sender_id === user.id && m.recipient_id === activePeer.id) ||
            (m.sender_id === activePeer.id && m.recipient_id === user.id);
          if (involved) setThread((t) => [...t, m]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activePeer]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const send = async () => {
    if (!user || !activePeer || !text.trim()) return;
    const trimmed = text.trim().slice(0, 2000);
    setText("");
    const { error } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, recipient_id: activePeer.id, content: trimmed });
    if (error) toast.error(error.message);
    loadConversations();
  };

  return (
    <AppLayout>
      <div className="grid md:grid-cols-[280px_1fr] min-h-screen">
        {/* Conversations list */}
        <div
          className={cn(
            "border-r border-border",
            activePeer ? "hidden md:block" : "block"
          )}
        >
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No conversations yet. Start one from a profile.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((c) => (
                <Link
                  key={c.user.id}
                  to={`/messages/${c.user.username}`}
                  className={cn(
                    "flex gap-3 p-4 hover:bg-surface/40 transition-colors",
                    activePeer?.id === c.user.id && "bg-surface/60"
                  )}
                >
                  <UserAvatar profile={c.user} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate text-sm">{c.user.display_name || c.user.username}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRelative(c.last_message.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">{c.last_message.content}</p>
                      {c.unread > 0 && (
                        <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Thread */}
        <div className={cn("flex flex-col", !activePeer && "hidden md:flex")}>
          {!activePeer ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-10 text-center">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-10 glass border-b border-border p-3 flex items-center gap-3">
                <button
                  onClick={() => navigate("/messages")}
                  className="md:hidden p-2 rounded-full hover:bg-secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Link to={`/u/${activePeer.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <UserAvatar profile={activePeer} />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{activePeer.display_name || activePeer.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{activePeer.username}</p>
                  </div>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {thread.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-10">Say hi 👋</p>
                )}
                {thread.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2 rounded-2xl text-[15px] animate-scale-in",
                          mine
                            ? "bg-gradient-primary text-primary-foreground rounded-br-sm shadow-glow"
                            : "bg-surface-elevated rounded-bl-sm"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1 opacity-70",
                            mine ? "text-primary-foreground" : "text-muted-foreground"
                          )}
                        >
                          {formatRelative(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Message…"
                  maxLength={2000}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  className="rounded-full bg-surface"
                />
                <Button variant="hero" size="icon" onClick={send} disabled={!text.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
