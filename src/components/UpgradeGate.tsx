import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

interface UpgradeGateProps {
  feature: string;
  children: ReactNode;
  fallbackMessage?: string;
}

export function UpgradeGate({ feature, children, fallbackMessage }: UpgradeGateProps) {
  const { isFeatureEnabled, isOwner, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) return <>{children}</>;

  if (isOwner || isFeatureEnabled(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-sm rounded-lg cursor-pointer"
        onClick={() => navigate("/pricing")}
      >
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center px-4">
          {fallbackMessage || "Recurso disponível em planos superiores"}
        </p>
        <span className="text-xs text-primary font-medium">Ver planos →</span>
      </div>
    </div>
  );
}
