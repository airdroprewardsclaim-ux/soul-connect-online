import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <Link to="/" className={cn("flex items-center gap-2 group", className)}>
    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow transition-transform group-hover:scale-105">
      <Sparkles className="h-5 w-5 text-primary-foreground" />
    </div>
    <span className="text-xl font-bold tracking-tight">Pulse</span>
  </Link>
);
