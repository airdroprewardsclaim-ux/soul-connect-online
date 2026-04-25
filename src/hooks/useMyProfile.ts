import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/social";

export const useMyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setProfile(data as Profile | null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(data as Profile | null);
  };

  return { profile, loading, refresh };
};
