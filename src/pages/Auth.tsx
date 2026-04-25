import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username too short")
  .max(20)
  .regex(/^[a-z0-9_]+$/i, "Letters, numbers, underscores only");

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSchema.safeParse(email).success) return toast.error("Invalid email");
    if (!passwordSchema.safeParse(password).success)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);

    if (mode === "sign-up") {
      if (!usernameSchema.safeParse(username).success)
        return setLoading(false), toast.error("Pick a valid username");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: username.toLowerCase(),
            display_name: displayName || username,
          },
        },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome to Pulse!");
      navigate("/");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate("/");
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero side */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-surface overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative space-y-6">
          <h1 className="text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
            A social network <br />
            <span className="gradient-text">for real moments.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Share thoughts, follow people you love, and chat in real time. Pulse is your home for everything happening now.
          </p>
        </div>
        <p className="relative text-sm text-muted-foreground">© Pulse — built with care</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="lg:hidden flex justify-center">
            <Logo />
          </div>
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold">{mode === "sign-in" ? "Welcome back" : "Join Pulse"}</h2>
            <p className="text-muted-foreground">
              {mode === "sign-in" ? "Sign in to continue" : "Create your account in seconds"}
            </p>
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={google}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "sign-up" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="janedoe"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display">Display name</Label>
                  <Input
                    id="display"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                required
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
            <button
              className="text-primary font-medium hover:underline"
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            >
              {mode === "sign-in" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
