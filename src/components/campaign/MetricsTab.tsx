import { Users, MessageSquare, BarChart3, TrendingUp } from "lucide-react";
import { Campaign } from "@/hooks/useStore";
import { MetricCard } from "@/components/MetricCard";

interface Props {
  campaign: Campaign;
}

export function MetricsTab({ campaign }: Props) {
  const bestStep = campaign.funnel.length > 0 ? campaign.funnel[0] : null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total de Leads" value={campaign.metrics.totalLeads} icon={Users} />
        <MetricCard label="Leads Ativos" value={campaign.metrics.active} icon={Users} />
        <MetricCard label="Leads Convertidos" value={campaign.metrics.converted} icon={TrendingUp} />
        <MetricCard label="Taxa de Conversão" value={`${campaign.metrics.conversionRate}%`} icon={BarChart3} />
      </div>

      {bestStep && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Etapa com Maior Conversão</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground text-sm font-bold">
              {bestStep.order}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{bestStep.name}</p>
              <p className="text-xs text-muted-foreground">{bestStep.variations.length} variação(ões)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
