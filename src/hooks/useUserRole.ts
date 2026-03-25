import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "owner" | "admin" | "member";

interface UserRoleState {
  role: AppRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export function useUserRole(): UserRoleState {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } else {
        setRole((data?.role as AppRole) ?? null);
      }
    } catch (err) {
      console.error("Failed to fetch user role:", err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const isDev = import.meta.env.DEV;

  return {
    role: isDev ? "owner" : role,
    isOwner: isDev || role === "owner",
    isAdmin: isDev || role === "admin" || role === "owner",
    loading,
  };
}
