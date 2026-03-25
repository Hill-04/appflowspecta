import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface PlanLimits {
  plan: string;
  max_users: number;
  max_active_campaigns: number;
  max_audiences: number;
  features: Record<string, boolean>;
}

interface SubscriptionContextType {
  plan: string | null;
  status: string | null;
  subscriptionEnd: string | null;
  limits: PlanLimits | null;
  loading: boolean;
  isOwner: boolean;
  isFeatureEnabled: (feature: string) => boolean;
  canCreateCampaign: (currentCount: number) => boolean;
  canCreateAudience: (currentCount: number) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isOwner, loading: roleLoading } = useUserRole();
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Bypass subscription checks in development
    if (import.meta.env.DEV || isOwner) {
      setPlan("scale");
      setStatus("active");
      setSubscriptionEnd(null);
      setLimits({
        plan: "scale",
        max_users: -1,
        max_active_campaigns: -1,
        max_audiences: -1,
        features: {},
      });
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error("check-subscription error:", error);
        return;
      }

      if (data?.subscribed && data?.plan) {
        setPlan(data.plan);
        setStatus("active");
        setSubscriptionEnd(data.subscription_end);

        const { data: planData } = await supabase
          .from("plan_limits")
          .select("*")
          .eq("plan", data.plan)
          .maybeSingle();

        if (planData) {
          setLimits(planData as PlanLimits);
        }
      } else {
        setPlan(null);
        setStatus(null);
        setSubscriptionEnd(null);
        setLimits(null);
      }
    } catch (err) {
      console.error("Subscription check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isOwner]);

  useEffect(() => {
    if (roleLoading) return;
    refreshSubscription();
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [refreshSubscription, roleLoading]);

  const isFeatureEnabled = useCallback((feature: string) => {
    if (isOwner) return true;
    if (!limits) return false;
    return limits.features?.[feature] === true;
  }, [limits, isOwner]);

  const canCreateCampaign = useCallback((currentCount: number) => {
    if (isOwner) return true;
    if (!limits) return false;
    if (limits.max_active_campaigns === -1) return true;
    return currentCount < limits.max_active_campaigns;
  }, [limits, isOwner]);

  const canCreateAudience = useCallback((currentCount: number) => {
    if (isOwner) return true;
    if (!limits) return false;
    if (limits.max_audiences === -1) return true;
    return currentCount < limits.max_audiences;
  }, [limits, isOwner]);

  return (
    <SubscriptionContext.Provider value={{
      plan, status, subscriptionEnd, limits, loading: loading || roleLoading,
      isOwner, isFeatureEnabled, canCreateCampaign, canCreateAudience, refreshSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
