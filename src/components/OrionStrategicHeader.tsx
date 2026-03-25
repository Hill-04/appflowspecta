import { useMemo } from "react";
import { Zap } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useGoalsData } from "@/components/dashboard/IPPWidget";

const FALLBACK_PHRASES = [
  "Pronto para evoluir sua operacao hoje?",
  "Cada interacao e uma oportunidade estrategica.",
  "Identifique padroes. Otimize resultados.",
  "Foco, execucao e resultado. Esse e o caminho.",
  "Performance e construida com consistencia.",
  "Dados sao o novo diferencial competitivo.",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h <= 11) return "Bom dia";
  if (h >= 12 && h <= 17) return "Boa tarde";
  return "Boa noite";
}

function getInitials(first?: string | null, last?: string | null): string {
  const f = first?.charAt(0) || "";
  const l = last?.charAt(0) || "";
  return (f + l).toUpperCase() || "U";
}

export default function OrionStrategicHeader() {
  const { profileData, allLeads, campaigns } = useStore();
  const { todayGoals, progressMap, ipp } = useGoalsData();

  const greeting = getGreeting();
  const name = profileData?.preferredName || profileData?.firstName || "";
  const treatment = profileData?.treatmentType;
  const avatarUrl = profileData?.avatarUrl;

  const fullGreeting = useMemo(() => {
    if (!name) return `${greeting}. Vamos avancar?`;
    if (treatment === "senhor") return `${greeting}, Senhor ${name}.`;
    if (treatment === "senhora") return `${greeting}, Senhora ${name}.`;
    return `${greeting}, ${name}.`;
  }, [greeting, name, treatment]);

  const phrase = useMemo(() => {
    const h = new Date().getHours();

    // Goals-based contextual phrases
    if (todayGoals.length > 0) {
      if (h < 12) {
        // Morning — show urgency
        const leastProgress = todayGoals.reduce((min, g) => {
          const pct = (progressMap[g.id] || 0) / g.target;
          return pct < (progressMap[min.id] || 0) / min.target ? g : min;
        }, todayGoals[0]);
        return `Você tem ${todayGoals.length} meta${todayGoals.length > 1 ? "s" : ""} para hoje. Sua mais urgente é "${leastProgress.name}".`;
      }
      if (h < 18) {
        // Afternoon — show progress %
        return `Você já completou ${ipp}% das suas metas de hoje.`;
      }
      // Evening — show IPP score
      const msg = ipp >= 80 ? "Parabéns pelo desempenho!" : "Amanhã é uma nova chance.";
      return `Você fechou o dia com IPP de ${ipp}. ${msg}`;
    }

    // Fallback contextual phrases
    if (allLeads.length === 0) return "Comece cadastrando seu primeiro lead.";
    if (campaigns.length === 0) return "Crie sua primeira campanha para iniciar a prospecção.";

    const pendingCount = campaigns.reduce(
      (acc, c) => acc + c.leads.filter((l) => l.campaignLead.status === "pending").length,
      0
    );
    if (pendingCount > 0) return `Existem ${pendingCount} leads aguardando follow-up.`;

    const totalConverted = campaigns.reduce((acc, c) => acc + c.metrics.converted, 0);
    if (totalConverted > 0) return "Seus resultados estão evoluindo. Continue executando.";

    return FALLBACK_PHRASES[Math.floor(Math.random() * FALLBACK_PHRASES.length)];
  }, [allLeads, campaigns, todayGoals, progressMap, ipp]);

  return (
    <div className="relative overflow-hidden glass-surface-elevated p-5 sm:p-6 animate-fade-in">
      {/* Ambient glow */}
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

      <div className="relative flex items-center gap-4">
        {/* Avatar with gradient ring */}
        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0">
          <div className="absolute inset-0 rounded-full gradient-blue opacity-60 blur-[1px]" />
          <div className="relative h-full w-full rounded-full border-2 border-primary/30 bg-secondary flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg sm:text-xl font-bold text-muted-foreground">
                {getInitials(profileData?.firstName, profileData?.lastName)}
              </span>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight truncate">
            {fullGreeting}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{phrase}</p>
        </div>

        {/* ORION badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm text-xs text-muted-foreground/70 shrink-0">
          <Zap className="h-3 w-3 text-primary/60" />
          <span className="font-medium tracking-wider uppercase">ORION</span>
        </div>
      </div>
    </div>
  );
}
