import { useState, useCallback, useEffect, useMemo } from "react";
import { Settings, Plus, Trophy, Search, LayoutGrid, List } from "lucide-react";
import { Campaign, CampaignLeadFull, LeadTemplate, useStore } from "@/hooks/useStore";
import { KanbanCard } from "./KanbanCard";
import { LeadDetailModal } from "./LeadDetailModal";
import { StageConfigDialog } from "./StageConfigDialog";
import { LeadsTableView } from "./LeadsTableView";
import { AddLeadDialog } from "./AddLeadDialog";
import { ConfettiEffect } from "./ConfettiEffect";
import { EmptyState } from "@/components/EmptyState";
import { ColumnConversionBar } from "@/components/analytics/ColumnConversionBar";
import { useConversionData } from "@/components/analytics/useConversionData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  campaign: Campaign;
  template: LeadTemplate | null;
}

interface FieldDef {
  id: string;
  field_name: string;
  field_type: string;
  field_order: number;
}

interface FieldValueRow {
  lead_id: string;
  field_id: string;
  value: string;
}

export function KanbanBoard({ campaign, template }: Props) {
  const { user } = useAuth();
  const { updateCampaignLeadStatus, refreshCampaigns, refreshLeads, deleteLead } = useStore();
  const [selectedLead, setSelectedLead] = useState<CampaignLeadFull | null>(null);
  const [showStageConfig, setShowStageConfig] = useState(false);
  const [dragOverStep, setDragOverStep] = useState<number | null>(null);
  const [latestNotes, setLatestNotes] = useState<Record<string, { content: string; created_at: string }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [confettiStep, setConfettiStep] = useState<number | null>(null);
  const [droppedCardId, setDroppedCardId] = useState<string | null>(null);

  // View toggle with localStorage persistence
  const viewKey = `flowspecta-leads-view-${campaign.id}`;
  const [view, setView] = useState<"kanban" | "table">(() => {
    return (localStorage.getItem(viewKey) as "kanban" | "table") || "kanban";
  });
  const toggleView = (v: "kanban" | "table") => {
    setView(v);
    localStorage.setItem(viewKey, v);
  };

  // Dynamic field definitions & values
  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([]);
  const [fieldValues, setFieldValues] = useState<FieldValueRow[]>([]);

  // Add lead dialog
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addLeadStepIndex, setAddLeadStepIndex] = useState(0);

  // Load field definitions + values
  useEffect(() => {
    if (!campaign.id) return;
    supabase
      .from("campaign_field_definitions")
      .select("id, field_name, field_type, field_order")
      .eq("campaign_id", campaign.id)
      .order("field_order")
      .then(({ data }) => setFieldDefs((data as any[]) || []));
  }, [campaign.id]);

  useEffect(() => {
    if (campaign.leads.length === 0) { setFieldValues([]); return; }
    const leadIds = campaign.leads.map(clf => clf.lead.id);
    supabase
      .from("lead_field_values")
      .select("lead_id, field_id, value")
      .eq("campaign_id", campaign.id)
      .in("lead_id", leadIds)
      .then(({ data }) => setFieldValues((data as any[]) || []));
  }, [campaign.id, campaign.leads.length]);

  // Load latest note per lead
  useEffect(() => {
    if (campaign.leads.length === 0) return;
    const leadIds = campaign.leads.map((clf) => clf.lead.id);
    supabase
      .from("campaign_lead_notes")
      .select("lead_id, content, created_at")
      .eq("campaign_id", campaign.id)
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { content: string; created_at: string }> = {};
        for (const row of data) {
          if (!map[row.lead_id]) map[row.lead_id] = { content: row.content, created_at: row.created_at };
        }
        setLatestNotes(map);
      });
  }, [campaign.id, campaign.leads.length]);

  const sortedSteps = useMemo(() => [...campaign.funnel].sort((a, b) => a.order - b.order), [campaign.funnel]);
  const { getConversion, dailyData } = useConversionData(campaign.id);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStepIndex: number) => {
      e.preventDefault();
      setDragOverStep(null);
      const clId = e.dataTransfer.getData("campaignLeadId");
      if (!clId) return;
      const targetStep = sortedSteps[targetStepIndex];
      await updateCampaignLeadStatus(clId, {
        step_index: targetStepIndex,
        current_step_id: targetStep?.id,
      });

      // Bounce animation
      setDroppedCardId(clId);
      setTimeout(() => setDroppedCardId(null), 300);

      // Confetti on conversion step
      if (targetStep?.isConversion) {
        setConfettiStep(targetStepIndex);
      }
    },
    [updateCampaignLeadStatus, sortedSteps]
  );

  const handleDragOver = (e: React.DragEvent, stepIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStep(stepIndex);
  };

  const reloadFieldData = useCallback(async () => {
    const { data: defs } = await supabase
      .from("campaign_field_definitions")
      .select("id, field_name, field_type, field_order")
      .eq("campaign_id", campaign.id)
      .order("field_order");
    setFieldDefs((defs as any[]) || []);
    if (campaign.leads.length > 0) {
      const leadIds = campaign.leads.map(clf => clf.lead.id);
      const { data: vals } = await supabase
        .from("lead_field_values")
        .select("lead_id, field_id, value")
        .eq("campaign_id", campaign.id)
        .in("lead_id", leadIds);
      setFieldValues((vals as any[]) || []);
    }
  }, [campaign.id, campaign.leads]);

  const refreshNotes = useCallback(async () => {
    if (campaign.leads.length === 0) return;
    const leadIds = campaign.leads.map((clf) => clf.lead.id);
    const { data } = await supabase
      .from("campaign_lead_notes")
      .select("lead_id, content, created_at")
      .eq("campaign_id", campaign.id)
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });
    if (!data) return;
    const map: Record<string, { content: string; created_at: string }> = {};
    for (const row of data) {
      if (!map[row.lead_id]) map[row.lead_id] = { content: row.content, created_at: row.created_at };
    }
    setLatestNotes(map);
  }, [campaign.id, campaign.leads]);

  // Get first 2 dynamic fields for a lead
  const getDynamicFieldsForLead = useCallback((leadId: string) => {
    const first2 = fieldDefs.slice(0, 2);
    return first2.map(fd => ({
      label: fd.field_name,
      value: fieldValues.find(fv => fv.lead_id === leadId && fv.field_id === fd.id)?.value || "",
    })).filter(f => f.value);
  }, [fieldDefs, fieldValues]);

  const handleDuplicateLead = async (clf: CampaignLeadFull) => {
    if (!user) return;
    const { data: newLead } = await supabase.from("leads").insert({
      user_id: user.id,
      name: `${clf.lead.name} (cópia)`,
      company: clf.lead.company,
      role: clf.lead.role,
      phone: clf.lead.phone,
      email: clf.lead.email,
      custom_data: clf.lead.customData,
      lead_model_id: clf.lead.leadModelId,
    }).select().single();
    if (!newLead) { toast.error("Erro ao duplicar"); return; }
    const firstStep = sortedSteps[0];
    await supabase.from("campaign_leads").insert({
      campaign_id: campaign.id,
      lead_id: newLead.id,
      step_index: 0,
      current_step_id: firstStep?.id || null,
      priority: "medium",
      deal_value: 0,
    });
    // Copy field values
    const vals = fieldValues.filter(fv => fv.lead_id === clf.lead.id);
    if (vals.length > 0) {
      await supabase.from("lead_field_values").insert(
        vals.map(fv => ({ campaign_id: campaign.id, lead_id: newLead.id, field_id: fv.field_id, value: fv.value }))
      );
    }
    await Promise.all([refreshCampaigns(), refreshLeads()]);
    toast.success("Lead duplicado");
  };

  const handleDeleteLead = async (clf: CampaignLeadFull) => {
    await deleteLead(clf.lead.id);
    toast.success("Lead excluído");
  };

  const openAddLead = (stepIndex: number) => {
    setAddLeadStepIndex(stepIndex);
    setAddLeadOpen(true);
  };

  // Filter leads by search
  const filterLeads = useCallback((leads: CampaignLeadFull[]) => {
    if (!searchQuery) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(clf => clf.lead.name.toLowerCase().includes(q));
  }, [searchQuery]);

  if (campaign.funnel.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Settings}
          title="Nenhuma etapa configurada"
          description="Configure as etapas do funil para organizar seus leads"
          actionLabel="Configurar Etapas"
          onAction={() => setShowStageConfig(true)}
        />
        <StageConfigDialog campaign={campaign} open={showStageConfig} onOpenChange={setShowStageConfig} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar leads..."
              className="w-full rounded-lg border border-border bg-secondary/80 pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => toggleView("kanban")}
              className={`p-1.5 transition ${view === "kanban" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              title="Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleView("table")}
              className={`p-1.5 transition ${view === "table" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              title="Tabela"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowStageConfig(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
        >
          <Settings className="h-3.5 w-3.5" /> Configurar Etapas
        </button>
      </div>

      {/* View */}
      {view === "kanban" ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory items-start">
          {sortedSteps.map((step, idx) => {
            const leadsInStep = filterLeads(campaign.leads.filter(clf => clf.campaignLead.stepIndex === idx && !clf.campaignLead.archivedAt));
            const isDragOver = dragOverStep === idx;
            const conversion = idx > 0 ? getConversion(idx - 1, idx) : null;

            return (
              <div
                key={step.id}
                className={`w-64 sm:w-72 rounded-lg border transition-all snap-start overflow-hidden shrink-0 ${
                  isDragOver
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border bg-secondary/30"
                }`}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={() => setDragOverStep(null)}
                onDrop={(e) => handleDrop(e, idx)}
              >
                {/* Colored bar */}
                <div className="h-[3px] gradient-primary" />

                {/* Column header */}
                <div className="px-3 py-2.5 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                      {step.name || `Etapa ${step.order}`}
                      {step.isConversion && <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />}
                      <span className="text-xs font-medium text-muted-foreground">({leadsInStep.length})</span>
                    </h4>
                    <button
                      onClick={() => openAddLead(idx)}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                      title="Adicionar lead"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Conversion bar */}
                <ColumnConversionBar
                  stepIndex={idx}
                  stepName={step.name || `Etapa ${step.order}`}
                  prevStepName={idx > 0 ? (sortedSteps[idx - 1]?.name || `Etapa ${sortedSteps[idx - 1]?.order}`) : undefined}
                  leadsCount={leadsInStep.length}
                  conversion={conversion}
                  dailyData={dailyData}
                  campaignId={campaign.id}
                />

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto relative">
                  {confettiStep === idx && (
                    <ConfettiEffect onComplete={() => setConfettiStep(null)} />
                  )}
                  {leadsInStep.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">Sem leads</p>
                  )}
                  {leadsInStep.map((clf) => (
                    <div
                      key={clf.campaignLead.id}
                      className={droppedCardId === clf.campaignLead.id ? "animate-bounce-in" : ""}
                    >
                      <KanbanCard
                        clf={clf}
                        stepName={step.name || `Etapa ${step.order}`}
                        dynamicFields={getDynamicFieldsForLead(clf.lead.id)}
                        onClick={() => setSelectedLead(clf)}
                        onDuplicate={() => handleDuplicateLead(clf)}
                        onOpenNotes={() => setSelectedLead(clf)}
                      />
                    </div>
                  ))}
                </div>

                {/* Footer add lead */}
                <div className="px-3 py-2 border-t border-border/50">
                  <button
                    onClick={() => openAddLead(idx)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition w-full justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar lead
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <LeadsTableView
          campaign={campaign}
          fieldDefs={fieldDefs}
          fieldValues={fieldValues}
          searchQuery={searchQuery}
          onSelectLead={setSelectedLead}
          onDuplicate={handleDuplicateLead}
          onDelete={handleDeleteLead}
          onAddLead={openAddLead}
        />
      )}

      <LeadDetailModal
        clf={selectedLead}
        campaign={campaign}
        template={template}
        open={!!selectedLead}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLead(null);
            // Always reload field values when closing modal to sync changes
            reloadFieldData();
          }
        }}
        onNotesChanged={refreshNotes}
        onFieldDefsChanged={reloadFieldData}
      />

      <StageConfigDialog campaign={campaign} open={showStageConfig} onOpenChange={setShowStageConfig} />

      <AddLeadDialog
        campaign={campaign}
        stepIndex={addLeadStepIndex}
        hasFieldDefs={fieldDefs.length > 0}
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        onLeadCreated={(leadId) => {
          // Find the newly created lead and open its detail
          const clf = campaign.leads.find(c => c.lead.id === leadId);
          if (clf) setSelectedLead(clf);
        }}
      />
    </div>
  );
}
