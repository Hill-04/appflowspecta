import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrionTour } from "@/components/orion/OrionTourProvider";
import { Plus, Search, Rocket, Users, MessageSquare, Copy, Trash2, Play, Clock } from "lucide-react";
import { useStore, Campaign } from "@/hooks/useStore";
import { StatusBadge } from "@/components/StatusBadge";
import { DuplicateCampaignDialog } from "@/components/campaign/DuplicateCampaignDialog";
import { MetricCard } from "@/components/MetricCard";
import { EmptyState } from "@/components/EmptyState";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import OrionStrategicHeader from "@/components/OrionStrategicHeader";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { AgendaWidget } from "@/components/campaign/AgendaWidget";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import IPPWidget, { useGoalsData } from "@/components/dashboard/IPPWidget";
import { Target, X as XIcon } from "lucide-react";

export default function Campaigns() {
  const navigate = useNavigate();
  const { campaigns, audiences, duplicateCampaign, deleteCampaign, updateCampaign, loading } = useStore();
  const { canCreateCampaign } = useSubscription();
  const [search, setSearch] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const showGoogleCalendar = useFeatureFlag("FEATURE_GOOGLE_CALENDAR");
  const tour = useOrionTour();
  const { todayGoals, progressMap, loading: goalsLoading } = useGoalsData();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [staleBannerDismissed, setStaleBannerDismissed] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<Campaign | null>(null);
  const staleLeadsCount = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return campaigns.reduce((count, campaign) => {
      return count + campaign.leads.filter(clf =>
        !clf.campaignLead.archivedAt &&
        !clf.campaignLead.convertedAt &&
        new Date(clf.campaignLead.createdAt) < cutoff
      ).length;
    }, 0);
  }, [campaigns]);

  const handleNewCampaign = () => {
    const activeCampaigns = campaigns.filter((c) => c.status === "active");
    if (!canCreateCampaign(activeCampaigns.length)) {
      setUpgradeOpen(true);
      return;
    }
    // Advance tour step 1 -> 2
    if (tour?.tourActive && tour.stepIndex === 1) tour.advanceTour();
    navigate("/app/campaigns/new");
  };

  const filtered = campaigns.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const totalLeads = campaigns.reduce((sum, c) => sum + c.metrics.totalLeads, 0);
  const totalActive = campaigns.reduce((sum, c) => sum + c.metrics.active, 0);
  const totalConverted = campaigns.reduce((sum, c) => sum + c.metrics.converted, 0);

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const camp = campaigns.find(c => c.id === id);
    if (camp) setDuplicateTarget(camp);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteCampaign(id);
    toast.success("Campanha excluída");
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 15) return "text-success";
    if (rate >= 5) return "text-warning";
    return "text-destructive";
  };

  const getLastActivity = (campaignInteractions: { created_at: string }[]) => {
    if (campaignInteractions.length === 0) return null;
    const sorted = [...campaignInteractions].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return new Date(sorted[0].created_at);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  }

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-6">
      <OrionStrategicHeader />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Campanhas de Prospecção</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas campanhas de abordagem</p>
        </div>
        <button onClick={handleNewCampaign} data-orion-target="new-campaign" className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 glow-primary w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Nova Campanha
        </button>
      </div>

      <IPPWidget onOpenGoals={() => navigate("/app/goals")} />

      {/* Stale leads banner */}
      {!staleBannerDismissed && staleLeadsCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3">
          <Clock className="h-4 w-4 text-orange-400 shrink-0" />
          <p className="flex-1 text-sm text-foreground">
            ⚠️ Você tem <strong>{staleLeadsCount} lead{staleLeadsCount > 1 ? "s" : ""}</strong> sem movimentação há mais de 30 dias.
          </p>
          <button onClick={() => navigate("/app/leads")} className="shrink-0 text-xs font-medium text-orange-400 hover:underline">
            Ver leads
          </button>
          <button onClick={() => setStaleBannerDismissed(true)} className="p-1 rounded-md hover:bg-white/[0.06] text-muted-foreground shrink-0">
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Goals Banner */}
      {!goalsLoading && !bannerDismissed && todayGoals.length > 0 && todayGoals.every(g => (progressMap[g.id] || 0) === 0) && (
        <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
          <Target className="h-4 w-4 text-primary shrink-0" />
          <p className="flex-1 text-sm text-foreground">
            🎯 Você tem {todayGoals.length} meta{todayGoals.length > 1 ? "s" : ""} para hoje. A mais importante: <strong>"{todayGoals[0].name}"</strong>. Vamos lá?
          </p>
          <button onClick={() => navigate("/app/goals")} className="shrink-0 text-xs font-medium text-primary hover:underline">
            Ver Metas
          </button>
          <button onClick={() => setBannerDismissed(true)} className="p-1 rounded-md hover:bg-white/[0.06] text-muted-foreground shrink-0">
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Campanhas Ativas" value={campaigns.filter((c) => c.status === "active").length} icon={Rocket} />
        <MetricCard label="Total de Leads" value={totalLeads} icon={Users} />
        <MetricCard label="Leads Ativos" value={totalActive} icon={Users} />
        <MetricCard label="Convertidos" value={totalConverted} icon={MessageSquare} />
      </div>

      {showGoogleCalendar && <AgendaWidget />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar campanhas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Rocket} title="Nenhuma campanha" description="Crie sua primeira campanha de prospecção" actionLabel="Nova Campanha" onAction={() => navigate("/app/campaigns/new")} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="glass-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[60px]" />
                  <col className="w-[20%]" />
                  <col className="w-[80px]" />
                  <col className="w-[15%]" />
                  <col className="w-[70px]" />
                  <col className="w-[70px]" />
                  <col className="w-[90px]" />
                  <col className="w-[95px]" />
                  <col className="w-[90px]" />
                  <col className="w-[80px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">On/Off</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Campanha</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Status</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Público</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Leads</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Ativos</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Convertidos</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Conversão</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Últ. Ativ.</th>
                    <th className="px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((campaign) => {
                    const audience = audiences.find((a) => a.id === campaign.audienceId);
                    const lastActivity = getLastActivity(campaign.interactions);
                    const isActive = campaign.status === "active";

                    return (
                      <tr
                        key={campaign.id}
                        onClick={() => navigate(`/app/campaigns/${campaign.id}`)}
                        className="border-b border-border/20 hover:bg-secondary/20 transition cursor-pointer group"
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => {
                              const newStatus = isActive ? "paused" : "active";
                              updateCampaign(campaign.id, { status: newStatus });
                              toast.success(newStatus === "active" ? "Campanha ativada" : "Campanha pausada");
                            }}
                            className="scale-75"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition truncate block">{campaign.name}</span>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={campaign.status} />
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-muted-foreground truncate block">{audience?.name || "—"}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-foreground font-medium text-right">{campaign.metrics.totalLeads}</td>
                        <td className="px-3 py-3 text-sm text-foreground font-medium text-right">{campaign.metrics.active}</td>
                        <td className="px-3 py-3 text-sm text-success font-medium text-right">{campaign.metrics.converted}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-sm font-semibold ${getConversionColor(campaign.metrics.conversionRate)}`}>
                              {campaign.metrics.conversionRate}%
                            </span>
                            <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${Math.min(campaign.metrics.conversionRate, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {lastActivity ? lastActivity.toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={(e) => handleDuplicate(e, campaign.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Duplicar"><Copy className="h-3.5 w-3.5" /></button>
                            <button onClick={(e) => handleDelete(e, campaign.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/50 bg-secondary/10">
                    <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Totais</td>
                    <td className="px-3 py-2.5 text-sm font-bold text-foreground text-right">{totalLeads}</td>
                    <td className="px-3 py-2.5 text-sm font-bold text-foreground text-right">{totalActive}</td>
                    <td className="px-3 py-2.5 text-sm font-bold text-success text-right">{totalConverted}</td>
                    <td className="px-3 py-2.5 text-sm font-bold text-primary text-right">
                      {totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0}%
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((campaign) => {
              const audience = audiences.find((a) => a.id === campaign.audienceId);
              const lastActivity = getLastActivity(campaign.interactions);
              const isActive = campaign.status === "active";

              return (
                <div key={campaign.id} onClick={() => navigate(`/app/campaigns/${campaign.id}`)} className="glass-card p-4 animate-slide-up cursor-pointer hover:border-primary/30 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-sm">{campaign.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{audience?.name || "Público não definido"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => {
                          const newStatus = isActive ? "paused" : "active";
                          updateCampaign(campaign.id, { status: newStatus });
                          toast.success(newStatus === "active" ? "Campanha ativada" : "Campanha pausada");
                        }}
                        className="scale-75"
                      />
                      <StatusBadge status={campaign.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between"><span>Total de leads</span><span className="text-foreground font-medium">{campaign.metrics.totalLeads}</span></div>
                    <div className="flex justify-between"><span>Ativos</span><span className="text-foreground font-medium">{campaign.metrics.active}</span></div>
                    <div className="flex justify-between"><span>Convertidos</span><span className="text-success font-medium">{campaign.metrics.converted}</span></div>
                    <div className="flex justify-between"><span>Conversão</span><span className={`font-semibold ${getConversionColor(campaign.metrics.conversionRate)}`}>{campaign.metrics.conversionRate}%</span></div>
                  </div>

                  {lastActivity && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Última atividade: {lastActivity.toLocaleDateString("pt-BR")}
                    </p>
                  )}

                  <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${campaign.metrics.conversionRate}%` }} />
                  </div>

                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/app/campaigns/${campaign.id}`)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium gradient-primary text-primary-foreground hover:opacity-90 transition">
                      <Play className="h-3 w-3" /> Acessar
                    </button>
                    <button onClick={(e) => handleDuplicate(e, campaign.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Duplicar"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={(e) => handleDelete(e, campaign.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        message="Você atingiu o limite de campanhas ativas do seu plano. Faça upgrade para criar mais campanhas."
      />

      <DuplicateCampaignDialog
        campaign={duplicateTarget}
        open={!!duplicateTarget}
        onOpenChange={(open) => { if (!open) setDuplicateTarget(null); }}
      />
    </>
  );
}
