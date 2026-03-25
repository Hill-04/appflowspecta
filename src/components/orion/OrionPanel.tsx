import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Users, Target, ArrowRight, AlertCircle } from "lucide-react";
import { useStore } from "@/hooks/useStore";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h <= 11) return "Bom dia";
  if (h >= 12 && h <= 17) return "Boa tarde";
  return "Boa noite";
}

function formatName(name?: string | null, treatment?: string | null): string {
  if (!name) return "";
  if (treatment === "senhor") return `Senhor ${name}`;
  if (treatment === "senhora") return `Senhora ${name}`;
  return name;
}

interface Suggestion {
  icon: React.ReactNode;
  text: string;
  path: string;
}

export default function OrionPanel({ onClose }: { onClose: () => void }) {
  const { profileData, allLeads, campaigns } = useStore();
  const navigate = useNavigate();

  const greeting = getGreeting();
  const displayName = formatName(
    profileData?.preferredName || profileData?.firstName,
    profileData?.treatmentType
  );

  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];

    if (allLeads.length === 0) {
      items.push({
        icon: <Users className="h-4 w-4 text-primary" />,
        text: "Voce ainda nao criou nenhum lead. Comece agora.",
        path: "/app/leads",
      });
    }

    if (campaigns.length === 0) {
      items.push({
        icon: <Target className="h-4 w-4 text-primary" />,
        text: "Crie sua primeira campanha para comecar a prospectar.",
        path: "/app/campaigns/new",
      });
    }

    const pendingLeads = campaigns.reduce((acc, c) => {
      return acc + c.leads.filter((l) => l.campaignLead.status === "pending").length;
    }, 0);
    if (pendingLeads > 0) {
      items.push({
        icon: <AlertCircle className="h-4 w-4 text-destructive" />,
        text: `Existem ${pendingLeads} leads aguardando follow-up.`,
        path: "/app",
      });
    }

    const pausedCampaigns = campaigns.filter((c) => c.status === "paused").length;
    if (pausedCampaigns > 0) {
      items.push({
        icon: <Target className="h-4 w-4 text-muted-foreground" />,
        text: `Voce tem ${pausedCampaigns} campanha${pausedCampaigns > 1 ? "s" : ""} pausada${pausedCampaigns > 1 ? "s" : ""}.`,
        path: "/app",
      });
    }

    return items;
  }, [allLeads, campaigns]);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="w-80 glass-surface-elevated p-5 space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full gradient-blue flex items-center justify-center shadow-[0_0_15px_-3px_hsl(205_90%_54%/0.3)]">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {displayName ? `${greeting}, ${displayName}.` : `${greeting}.`}
          </p>
          <p className="text-[11px] text-muted-foreground/60 font-medium tracking-wider uppercase">ORION</p>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleNavigate(s.path)}
              className="flex items-start gap-3 w-full text-left p-3 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-200 group"
            >
              <div className="shrink-0 mt-0.5">{s.icon}</div>
              <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                {s.text}
              </p>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tudo em ordem. Continue executando sua estrategia.
        </p>
      )}
    </div>
  );
}
