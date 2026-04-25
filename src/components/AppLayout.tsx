import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ComposePostDialog } from "./ComposePostDialog";
import { Logo } from "./Logo";

interface Props {
  children: ReactNode;
  rightRail?: ReactNode;
  onPosted?: () => void;
}

export const AppLayout = ({ children, rightRail, onPosted }: Props) => {
  const [composing, setComposing] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="lg:hidden sticky top-0 z-30 glass border-b border-border h-14 flex items-center px-4">
        <Logo />
      </header>
      <div className="mx-auto max-w-6xl flex gap-6 px-4 lg:px-6">
        <div className="w-64 shrink-0">
          <Sidebar onCompose={() => setComposing(true)} />
        </div>
        <main className="flex-1 min-w-0 border-x border-border min-h-screen pb-20 lg:pb-6">{children}</main>
        <aside className="hidden xl:block w-80 shrink-0 py-6">{rightRail}</aside>
      </div>
      <MobileNav onCompose={() => setComposing(true)} />
      <ComposePostDialog open={composing} onOpenChange={setComposing} onPosted={onPosted} />
    </div>
  );
};
