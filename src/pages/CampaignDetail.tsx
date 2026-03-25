import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ListPlus, Users, FileText } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { StatusBadge } from "@/components/StatusBadge";
import { ListBuildingTab } from "@/components/campaign/ListBuildingTab";
import { KanbanBoard } from "@/components/campaign/KanbanBoard";
import { CampaignScriptsTab } from "@/components/campaign/CampaignScriptsTab";
import { OrionInsightCard } from "@/components/analytics/OrionInsightCard";

type Tab = "list" | "leads" | "scripts";

function ValueCard({ label, value, color, hint }: { label: string; value: number; color: "blue" | "purple" | "green" | "orange"; hint?: string }) {
  const colors = {
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    green: 'text-green-400 bg-green-400/10 border-green-400/20',
    orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-[10px] uppercase tracking-widest opacity-60">{label}</p>
      {hint && <p className="text-[9px] opacity-40 mb-1">{hint}</p>}
      <p className="text-lg font-bold">
        R$ {value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { campaigns, audiences, leadTemplates, loading } = useStore();
  const campaign = campaigns.find((c) => c.id === id);

  const [activeTab, setActiveTab] = useState<Tab>("list");

  const valueMetrics = useMemo(() => {
    if (!campaign) return { pipeline: 0, pipelinePonderado: 0, convertedValue: 0, avgValue: 0, hasData: false };
    const nonArchivedLeads = campaign.leads.filter(clf => !clf.campaignLead.archivedAt);
    const activeLeads = nonArchivedLeads.filter(clf => !clf.campaignLead.convertedAt);
    const convertedThisMonth = nonArchivedLeads.filter(clf => {
      const convertedAt = clf.campaignLead.convertedAt;
      if (!convertedAt) return false;
      const date = new Date(convertedAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const pipeline = activeLeads.reduce((sum, clf) =>
      sum + (Number(clf.campaignLead.dealValue) || 0), 0);

    const convertedValue = convertedThisMonth.reduce((sum, clf) =>
      sum + (Number(clf.campaignLead.dealValue) || 0), 0);

    const leadsWithValue = nonArchivedLeads.filter(clf => clf.campaignLead.dealValue > 0);
    const avgValue = leadsWithValue.length > 0
      ? leadsWithValue.reduce((sum, clf) => sum + (Number(clf.campaignLead.dealValue) || 0), 0) / leadsWithValue.length
      : 0;

    return { pipeline, convertedValue, avgValue, hasData: leadsWithValue.length > 0 };
  }, [campaign?.leads]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  }

  if (!campaign) {
    return <div className="flex items-center justify-center h-96"><p className="text-muted-foreground">Campanha não encontrada</p></div>;
  }

  const audience = audiences.find((a) => a.id === campaign.audienceId);

  const firstLeadWithTemplate = campaign.leads.find((clf) => clf.lead.leadModelId);
  const template = firstLeadWithTemplate
    ? leadTemplates.find((t) => t.id === firstLeadWithTemplate.lead.leadModelId) || null
    : null;

  const tabs: { key: Tab; label: string; shortLabel: string; icon: any }[] = [
    { key: "list", label: "Construção de Lista", shortLabel: "Lista", icon: ListPlus },
    { key: "leads", label: "CRM", shortLabel: "CRM", icon: Users },
    { key: "scripts", label: "Scripts", shortLabel: "Scripts", icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <button onClick={() => navigate("/app")} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-secondary transition shrink-0 mt-0.5">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
            {audience?.name || "Público não definido"} · Criada em {new Date(campaign.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Value metrics */}
      {valueMetrics.hasData && (
        <div className="grid grid-cols-3 gap-3">
          <ValueCard label="Pipeline Total" value={valueMetrics.pipeline} color="blue" />
          <ValueCard label="Convertido este mês" value={valueMetrics.convertedValue} color="green" />
          <ValueCard label="Valor médio" value={valueMetrics.avgValue} color="orange" />
        </div>
      )}

      {/* ORION Insight Card */}
      <OrionInsightCard campaign={campaign} onSwitchTab={(tab) => setActiveTab(tab as Tab)} />

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            data-orion-target={tab.key === "list" ? "list-building-tab" : undefined}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      <div>
        {activeTab === "list" && <ListBuildingTab campaign={campaign} />}
        {activeTab === "leads" && <KanbanBoard campaign={campaign} template={template} />}
        {activeTab === "scripts" && <CampaignScriptsTab campaign={campaign} />}
      </div>
    </div>
  );
}
