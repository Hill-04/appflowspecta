import { MessageSquare, TrendingUp, Users, Shield } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useStore } from "@/hooks/useStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";
import { UpgradeGate } from "@/components/UpgradeGate";

const COLORS = [
  "hsl(0, 72%, 51%)",
  "hsl(37, 90%, 56%)",
  "hsl(187, 80%, 48%)",
  "hsl(270, 60%, 60%)",
];

export default function Insights() {
  const { campaigns, audiences, objections } = useStore();

  const stats = useMemo(() => {
    const allCampaignLeads = campaigns.flatMap((c) => c.leads);
    const totalLeads = allCampaignLeads.length;
    const active = allCampaignLeads.filter((clf) => clf.campaignLead.convertedAt == null).length;
    const converted = allCampaignLeads.filter((clf) => clf.campaignLead.convertedAt != null).length;
    const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

    // Response rate by audience
    const audienceStats = audiences.map((a) => {
      const relatedCampaigns = campaigns.filter((c) => c.audienceId === a.id);
      const leads = relatedCampaigns.flatMap((c) => c.leads);
      const total = leads.length;
      const conv = leads.filter((clf) => clf.campaignLead.convertedAt != null).length;
      return { name: a.name, value: total > 0 ? Math.round((conv / total) * 100) : 0 };
    }).filter((a) => a.value > 0);

    // Objection categories grouped
    const objectionMap: Record<string, number> = {};
    objections.forEach((o) => {
      const cat = o.category || "Outros";
      objectionMap[cat] = (objectionMap[cat] || 0) + o.frequency;
    });
    const objectionData = Object.entries(objectionMap)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Campaign performance
    const campaignPerf = campaigns.map((c) => ({
      name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name,
      taxa: c.metrics.conversionRate,
    })).sort((a, b) => b.taxa - a.taxa).slice(0, 5);

    return { totalLeads, active, converted, conversionRate, audienceStats, objectionData, campaignPerf, totalObjections: objections.length };
  }, [campaigns, audiences, objections]);

  return (
    <UpgradeGate feature="cross_campaign_insights" fallbackMessage="Insights cross-campaign disponível a partir do plano Growth">
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Insights & Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">Análise consolidada de todas as campanhas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total de Leads" value={String(stats.totalLeads)} icon={Users} />
        <MetricCard label="Leads Ativos" value={String(stats.active)} icon={Users} />
        <MetricCard label="Convertidos" value={String(stats.converted)} icon={TrendingUp} />
        <MetricCard label="Taxa de Conversão" value={`${stats.conversionRate}%`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Response by audience */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Taxa de Resposta por Público</h3>
          {stats.audienceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.audienceStats}>
                <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: "8px", color: "hsl(210, 20%, 94%)" }} />
                <Bar dataKey="value" fill="hsl(187, 80%, 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum dado de público disponível</p>
          )}
        </div>

        {/* Campaign performance */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Performance de Campanhas</h3>
          {stats.campaignPerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.campaignPerf} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: "8px", color: "hsl(210, 20%, 94%)" }} />
                <Bar dataKey="taxa" fill="hsl(152, 60%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma campanha ativa</p>
          )}
        </div>

        {/* Objections chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Objeções Mais Comuns</h3>
          {stats.objectionData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={stats.objectionData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} strokeWidth={0}>
                    {stats.objectionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {stats.objectionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="text-sm font-medium text-foreground ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma objeção registrada</p>
          )}
        </div>

        {/* Best performing */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Destaques</h3>
          {campaigns.length > 0 ? (
            <div className="space-y-4">
              {stats.audienceStats.length > 0 && (
                <div className="rounded-lg bg-success/5 border border-success/10 p-3">
                  <p className="text-xs text-success font-medium mb-1">🏆 Melhor Público</p>
                  <p className="text-sm text-foreground">
                    {stats.audienceStats.sort((a, b) => b.value - a.value)[0]?.name} — {stats.audienceStats.sort((a, b) => b.value - a.value)[0]?.value}% de resposta
                  </p>
                </div>
              )}
              {stats.campaignPerf.length > 0 && (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs text-primary font-medium mb-1">💬 Melhor Campanha</p>
                  <p className="text-sm text-foreground">
                    {stats.campaignPerf[0]?.name} — {stats.campaignPerf[0]?.taxa}% de taxa
                  </p>
                </div>
              )}
              {stats.objectionData.length > 0 && (
                <div className="rounded-lg bg-warning/5 border border-warning/10 p-3">
                  <p className="text-xs text-warning font-medium mb-1">⚡ Maior Objeção</p>
                  <p className="text-sm text-foreground">
                    {stats.objectionData[0]?.name} — {stats.objectionData[0]?.value} registros
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Crie campanhas para ver destaques</p>
          )}
        </div>
      </div>
    </div>
    </UpgradeGate>
  );
}
