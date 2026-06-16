import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useIsAdmin(userId: string | undefined) {
  const [state, setState] = useState<{ isAdmin: boolean | null; userId: string | undefined }>({
    isAdmin: null,
    userId: undefined,
  });

  useEffect(() => {
    console.log("[useIsAdmin] Effect triggered. userId:", userId);
    if (!userId) {
      console.log("[useIsAdmin] Effect: No userId, setting isAdmin to false");
      setState({ isAdmin: false, userId: undefined });
      return;
    }
    
    console.log("[useIsAdmin] Effect: Fetching role for", userId);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data, error }) => {
        console.log("[useIsAdmin] Query finished. data:", data, "error:", error);
        if (error) {
          console.error("[useIsAdmin] Query error:", error.message);
          setState({ isAdmin: false, userId });
        } else {
          setState({ isAdmin: !!data, userId });
        }
      });
  }, [userId]);

  // Synchronous loading check during render
  if (state.userId !== userId) {
    console.log("[useIsAdmin] Render check: userId mismatch. state.userId:", state.userId, "requested:", userId, "-> returning null (loading)");
    return null;
  }

  console.log("[useIsAdmin] Render check: userId match. Returning", state.isAdmin);
  return state.isAdmin;
}
