import { Play, Plus, AlertTriangle, CheckCircle, XCircle, Users, MessageSquare, TrendingUp, Award } from "lucide-react";
import { Campaign } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";

interface Props {
  campaign: Campaign;
  audienceName?: string;
  onNavigate: (tab: "leads" | "prospecting") => void;
}

export function OperationalPanel({ campaign, audienceName, onNavigate }: Props) {
  const totalLeads = campaign.leads.length;
  const abordados = campaign.leads.filter((clf) => clf.campaignLead.status !== "pending").length;
  const restantes = totalLeads - abordados;

  // Ritmo: leads abordados / dias únicos com interação
  const uniqueDays = new Set(campaign.interactions.map((i) => i.created_at.split("T")[0])).size;
  const ritmo = uniqueDays > 0 ? Math.round((abordados / uniqueDays) * 10) / 10 : 0;

  // Melhor step por taxa de resposta
  const bestStep = (() => {
    if (campaign.funnel.length === 0) return null;
    let best: { name: string; rate: number } | null = null;
    for (const step of campaign.funnel) {
      const leadsAtStep = campaign.leads.filter((clf) => clf.campaignLead.stepIndex >= step.order);
      if (leadsAtStep.length === 0) continue;
      const responded = leadsAtStep.filter((clf) => clf.campaignLead.status !== "pending").length;
      const rate = responded / leadsAtStep.length;
      if (!best || rate > best.rate) {
        best = { name: step.name, rate };
      }
    }
    return best;
  })();

  const scriptPrincipal = campaign.funnel.length > 0 ? campaign.funnel[0].name : "Nenhum script definido";
  const diasRestantes = ritmo > 0 ? Math.ceil(restantes / ritmo) : null;
  const totalMensagens = campaign.interactions.length;
  const taxaConversao = campaign.metrics.conversionRate;

  // Decisão inteligente
  const situation = restantes === 0 ? 3 : (ritmo === 0 || restantes > ritmo) ? 1 : 2;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Topo */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-bold text-foreground">{campaign.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {audienceName || "Público não definido"} · {scriptPrincipal}
        </p>
      </div>

      {/* Bloco 1 – Status da Base */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard label="Leads totais" value={totalLeads} />
        <StatusCard label="Abordados" value={abordados} />
        <StatusCard label="Restantes" value={restantes} />
        <StatusCard label="Ritmo/dia" value={ritmo > 0 ? ritmo.toFixed(1) : "—"} />
      </div>

      {/* Bloco 2 – Inteligência */}
      <div className="glass-card p-6">
        {situation === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Você tem leads suficientes para hoje</span>
            </div>
            <Button onClick={() => onNavigate("prospecting")} className="w-full gradient-primary text-primary-foreground glow-primary" size="lg">
              <Play className="h-4 w-4" /> Começar a chamar leads
            </Button>
          </div>
        )}

        {situation === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Sua base acaba hoje</span>
            </div>
            <Button onClick={() => onNavigate("leads")} className="w-full" size="lg">
              <Plus className="h-4 w-4" /> Alimentar lista primeiro
            </Button>
            <Button onClick={() => onNavigate("prospecting")} variant="outline" className="w-full" size="lg">
              <Play className="h-4 w-4" /> Mesmo assim, começar a chamar
            </Button>
          </div>
        )}

        {situation === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Você não tem leads para trabalhar</span>
            </div>
            <Button onClick={() => onNavigate("leads")} className="w-full" size="lg">
              <Plus className="h-4 w-4" /> Vincular leads
            </Button>
          </div>
        )}
      </div>

      {/* Bloco 3 – Indicadores inteligentes */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Indicadores</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <Indicator icon={Users} text={diasRestantes !== null ? `No seu ritmo atual, essa base dura ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""}` : "Sem dados de ritmo ainda"} />
          <Indicator icon={MessageSquare} text={`Você já enviou ${totalMensagens} mensagen${totalMensagens !== 1 ? "s" : ""} nessa campanha`} />
          <Indicator icon={TrendingUp} text={`Taxa de conversão: ${taxaConversao}%`} />
          <Indicator icon={Award} text={bestStep ? `Script com melhor desempenho: ${bestStep.name}` : "Sem dados de desempenho ainda"} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function Indicator({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
}
