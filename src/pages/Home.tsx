import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { CommentsDialog } from "@/components/CommentsDialog";
import { usePosts } from "@/hooks/usePosts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { PostWithMeta } from "@/types/social";
import { RightRail } from "@/components/RightRail";

const Feed = ({ followingOnly }: { followingOnly: boolean }) => {
  const { posts, loading, reload, update, remove } = usePosts({ followingOnly });
  const [openComments, setOpenComments] = useState<PostWithMeta | null>(null);

  return (
    <>
      {loading && <p className="p-10 text-center text-muted-foreground">Loading feed…</p>}
      {!loading && posts.length === 0 && (
        <div className="p-12 text-center space-y-2">
          <p className="text-lg font-semibold">It's quiet here</p>
          <p className="text-muted-foreground text-sm">
            {followingOnly ? "Follow people on Explore to see their posts." : "Be the first to post — tap New post."}
          </p>
        </div>
      )}
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          onChange={update}
          onDeleted={remove}
          onOpenComments={setOpenComments}
        />
      ))}
      <CommentsDialog
        post={openComments}
        onOpenChange={(o) => !o && setOpenComments(null)}
        onCountChange={(id, delta) => {
          const target = posts.find((p) => p.id === id);
          if (target) update({ ...target, comment_count: target.comment_count + delta });
        }}
      />
      <button onClick={reload} className="hidden" aria-hidden />
    </>
  );
};

const Home = () => {
  const [tab, setTab] = useState("following");
  // hacky reload key on post created
  const [key, setKey] = useState(0);

  return (
    <AppLayout rightRail={<RightRail />} onPosted={() => setKey((k) => k + 1)}>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="sticky top-0 lg:top-0 z-20 glass border-b border-border">
          <TabsList className="w-full bg-transparent h-14 p-0 rounded-none">
            <TabsTrigger
              value="following"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-1 data-[state=active]:after:w-12 data-[state=active]:after:rounded-full data-[state=active]:after:bg-gradient-primary"
            >
              Following
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-1 data-[state=active]:after:w-12 data-[state=active]:after:rounded-full data-[state=active]:after:bg-gradient-primary"
            >
              For you
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="following" className="m-0">
          <Feed key={`f-${key}`} followingOnly />
        </TabsContent>
        <TabsContent value="all" className="m-0">
          <Feed key={`a-${key}`} followingOnly={false} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Home;
