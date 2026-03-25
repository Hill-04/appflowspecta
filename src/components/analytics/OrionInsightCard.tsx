import { useState, useEffect, useMemo } from "react";
import { Zap, ArrowRight, BarChart3, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Campaign } from "@/hooks/useStore";
import { useConversionData } from "./useConversionData";
import { ConversionDetailDialog } from "./ConversionDetailDialog";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  campaign: Campaign;
  onSwitchTab: (tab: string) => void;
}

interface Insight {
  gargalo_principal: string;
  motivo_provavel: string;
  acao_recomendada: string;
  score_funil: number;
  status: "critico" | "atencao" | "saudavel";
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getScoreColor(status: string) {
  switch (status) {
    case "critico": return "#ef4444";
    case "atencao": return "#f59e0b";
    case "saudavel": return "#22c55e";
    default: return "#6366f1";
  }
}

export function OrionInsightCard({ campaign, onSwitchTab }: Props) {
  const { getConversion, dailyData, daysOfData, loading: convLoading } = useConversionData(campaign.id);
  const [funnelDialogOpen, setFunnelDialogOpen] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sortedSteps = useMemo(
    () => [...campaign.funnel].sort((a, b) => a.order - b.order),
    [campaign.funnel]
  );

  const totalLeads = useMemo(() => {
    return campaign.leads.filter(clf => !clf.campaignLead.archivedAt).length;
  }, [campaign.leads]);

  const convertedLeads = useMemo(() => {
    return campaign.leads.filter(clf => !clf.campaignLead.archivedAt && clf.campaignLead.convertedAt).length;
  }, [campaign.leads]);

  const daysSinceCreated = useMemo(() => {
    return Math.max(1, Math.floor((Date.now() - new Date(campaign.createdAt).getTime()) / 86400000));
  }, [campaign.createdAt]);

  // Calculate per-step metrics
  const stepMetrics = useMemo(() => {
    const nonArchived = campaign.leads.filter(clf => !clf.campaignLead.archivedAt);
    return sortedSteps.map((step, idx) => {
      const leadsInStep = nonArchived.filter(clf => clf.campaignLead.stepIndex === idx);
      const leadsCount = leadsInStep.length;
      const conv = idx < sortedSteps.length - 1 ? getConversion(idx, idx + 1) : null;
      const avgDays = leadsInStep.length > 0
        ? Math.round(leadsInStep.reduce((sum, clf) => {
            return sum + (Date.now() - new Date(clf.campaignLead.createdAt).getTime()) / 86400000;
          }, 0) / leadsInStep.length)
        : 0;

      return {
        step_name: step.name || `Etapa ${step.order}`,
        step_order: idx,
        leads_count: leadsCount,
        conversion_rate: conv?.rate !== null && conv?.rate !== undefined ? Math.round(conv.rate) : 0,
        avg_days_in_step: avgDays,
      };
    });
  }, [sortedSteps, campaign.leads, getConversion]);

  const fetchInsight = async (skipCache = false) => {
    if (totalLeads < 5) {
      setLoading(false);
      return;
    }

    const CACHE_KEY = `orion_insight_${campaign.id}`;

    if (!skipCache) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setInsight(data);
            setLoading(false);
            setError(false);
            return;
          }
        }
      } catch { /* ignore bad cache */ }
    }

    setLoading(true);
    setError(false);

    const overallRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const payload = {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      steps: stepMetrics,
      total_leads: totalLeads,
      converted: convertedLeads,
      overall_conversion_rate: overallRate,
      days_active: daysSinceCreated,
      user_profile: {
        offer_type: "",
        target_audience: "",
        contact_channel: "",
      },
    };

    // Fetch user profile for context
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("offer_type, target_audience_description, contact_channel")
        .single();
      if (profile) {
        payload.user_profile = {
          offer_type: profile.offer_type || "",
          target_audience: profile.target_audience_description || "",
          contact_channel: profile.contact_channel || "",
        };
      }
    } catch { /* proceed without profile */ }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("orion-campaign-insight", {
        body: payload,
      });

      if (fnError || !data || data.error) {
        setError(true);
        setLoading(false);
        return;
      }

      setInsight(data as Insight);
      setError(false);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!convLoading && sortedSteps.length >= 2) {
      fetchInsight();
    }
  }, [convLoading, campaign.id, totalLeads]);

  if (convLoading || sortedSteps.length < 2) return null;

  // Calibrating state — less than 5 leads
  if (totalLeads < 5) {
    return (
      <div
        className="rounded-xl p-4 transition-all duration-500 ease-out"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)) 85%, rgba(99,102,241,0.06) 100%)",
          borderLeft: "3px solid #6366f1",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4" style={{ color: "#6366f1" }} />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">ORION</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Calibrando modelo... Adicione pelo menos 5 leads para ativar a análise inteligente do funil.
        </p>
        <div className="flex items-center gap-3">
          <Progress value={(totalLeads / 5) * 100} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{totalLeads}/5 leads</span>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="rounded-xl p-4 sm:p-5 transition-all duration-500 ease-out"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)) 85%, rgba(99,102,241,0.06) 100%)",
          borderLeft: "3px solid #6366f1",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 animate-pulse" style={{ color: "#6366f1" }} />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            ORION — Analisando seu funil...
          </span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2 mt-2" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !insight) {
    return (
      <div
        className="rounded-xl p-4 sm:p-5 transition-all duration-500 ease-out"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)) 85%, rgba(99,102,241,0.06) 100%)",
          borderLeft: "3px solid #6366f1",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4" style={{ color: "#6366f1" }} />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">ORION</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Não foi possível analisar o funil agora. Tente novamente.
        </p>
        <button
          onClick={() => fetchInsight(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-300"
          style={{ color: "#6366f1", background: "rgba(99,102,241,0.1)" }}
        >
          <RefreshCw className="h-3 w-3" /> Tentar novamente
        </button>
      </div>
    );
  }

  // Find bottleneck step index for detail dialog
  const bottleneckStepIdx = sortedSteps.findIndex(
    s => (s.name || `Etapa ${s.order}`) === insight.gargalo_principal
  );
  const bottleneckConversion = bottleneckStepIdx >= 0 && bottleneckStepIdx < sortedSteps.length - 1
    ? getConversion(bottleneckStepIdx, bottleneckStepIdx + 1)
    : null;

  return (
    <>
      <div
        className="rounded-xl p-4 sm:p-5 transition-all duration-500 ease-out"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)) 85%, rgba(99,102,241,0.06) 100%)",
          borderLeft: "3px solid #6366f1",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: "#6366f1" }} />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              ORION — Análise Estratégica
            </span>
          </div>
          <span
            className="text-xs font-bold"
            style={{ color: getScoreColor(insight.status) }}
          >
            Score: {insight.score_funil}/100
          </span>
        </div>

        {/* Diagnosis */}
        <p className="text-sm text-foreground/90 leading-relaxed mb-3">
          ⚠️ {insight.motivo_provavel}
        </p>

        {/* Critical metric */}
        <p className="text-xs text-muted-foreground mb-4">
          Gargalo: "{insight.gargalo_principal}" · Score do funil:{" "}
          <span className="font-bold" style={{ color: getScoreColor(insight.status) }}>
            {insight.score_funil}/100
          </span>
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onSwitchTab("scripts")}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-300"
            style={{ color: "#6366f1", background: "rgba(99,102,241,0.1)" }}
          >
            <ArrowRight className="h-3 w-3" /> {insight.acao_recomendada}
          </button>
          <button
            onClick={() => setFunnelDialogOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <BarChart3 className="h-3 w-3" /> Detalhar Funil
          </button>
        </div>
      </div>

      {/* Funnel detail dialog */}
      {bottleneckConversion && bottleneckStepIdx >= 0 && (
        <ConversionDetailDialog
          open={funnelDialogOpen}
          onOpenChange={setFunnelDialogOpen}
          stepAName={insight.gargalo_principal}
          stepBName={sortedSteps[bottleneckStepIdx + 1]?.name || `Etapa ${bottleneckStepIdx + 2}`}
          stepAIndex={bottleneckStepIdx}
          stepBIndex={bottleneckStepIdx + 1}
          dailyData={dailyData}
          conversion={bottleneckConversion}
        />
      )}
    </>
  );
}
