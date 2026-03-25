import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Contact, Trash2, Pencil, Link2, Archive, RotateCcw, Settings } from "lucide-react";
import { useStore, LeadTemplate, CampaignLeadFull, Campaign } from "@/hooks/useStore";
import { EmptyState } from "@/components/EmptyState";
import { LeadForm } from "@/components/lead/LeadForm";
import { LeadDetailModal } from "@/components/campaign/LeadDetailModal";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArchiveSettingsDialog } from "@/components/campaign/ArchiveSettingsDialog";

export default function Leads() {
  const { user } = useAuth();
  const { allLeads, leadTemplates, campaigns, addLead, deleteLead, linkLeadToCampaign, refreshCampaigns, refreshLeads } = useStore();
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [showArchived, setShowArchived] = useState(false);
  const [showArchiveSettings, setShowArchiveSettings] = useState(false);

  // Lead detail modal state
  const [detailClf, setDetailClf] = useState<CampaignLeadFull | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);

  // Link to campaign dialog (for leads not in any campaign)
  const [linkDialogLeadId, setLinkDialogLeadId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  // Pending open after link — tracks lead that needs to open after campaigns refresh
  const [pendingOpenAfterLink, setPendingOpenAfterLink] = useState<string | null>(null);

  // Post-create campaign linking flow
  const [linkAfterCreateLeadId, setLinkAfterCreateLeadId] = useState<string | null>(null);
  const [linkAfterCreateCampaignId, setLinkAfterCreateCampaignId] = useState<string>("");
  const [linkAfterCreateStepIndex, setLinkAfterCreateStepIndex] = useState<number>(0);

  // When campaigns update and we have a pending lead to open, find and open it
  useEffect(() => {
    if (!pendingOpenAfterLink) return;
    for (const c of campaigns) {
      const clf = c.leads.find(cl => cl.lead.id === pendingOpenAfterLink);
      if (clf) {
        setDetailClf(clf);
        setDetailCampaign(c);
        setPendingOpenAfterLink(null);
        return;
      }
    }
  }, [campaigns, pendingOpenAfterLink]);

  // Compute archived leads from campaign data
  const archivedClfs: { clf: CampaignLeadFull; campaign: Campaign }[] = [];
  for (const c of campaigns) {
    for (const clf of c.leads) {
      if (clf.campaignLead.archivedAt) {
        archivedClfs.push({ clf, campaign: c });
      }
    }
  }

  const filteredArchived = archivedClfs.filter(({ clf }) => {
    return !search || clf.lead.name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredLeads = allLeads.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase());
    const matchTemplate = templateFilter === "all" ||
      (templateFilter === "none" && !l.leadModelId) ||
      l.leadModelId === templateFilter;
    return matchSearch && matchTemplate;
  });

  const handleRestore = async (campaignLeadId: string) => {
    await supabase.from("campaign_leads")
      .update({ archived_at: null, archive_reason: null } as any)
      .eq("id", campaignLeadId);
    toast.success("Lead restaurado");
    await Promise.all([refreshCampaigns(), refreshLeads()]);
  };

  const openNew = () => { setSelectedTemplateId("none"); setShowNewDialog(true); };

  const openLeadDetail = (leadId: string) => {
    for (const c of campaigns) {
      const clf = c.leads.find(cl => cl.lead.id === leadId);
      if (clf) {
        setDetailClf(clf);
        setDetailCampaign(c);
        return;
      }
    }
    // Lead not in any campaign — ask to link
    setLinkDialogLeadId(leadId);
    setSelectedCampaignId(campaigns.length > 0 ? campaigns[0].id : "");
  };

  const handleLinkAndOpen = async () => {
    if (!linkDialogLeadId || !selectedCampaignId) return;
    await linkLeadToCampaign(linkDialogLeadId, selectedCampaignId);
    toast.success("Lead vinculado à campanha");
    // Set pending and close dialog — useEffect will open modal when campaigns refresh
    setPendingOpenAfterLink(linkDialogLeadId);
    setLinkDialogLeadId(null);
    await Promise.all([refreshCampaigns(), refreshLeads()]);
  };

  const handleCreateSubmit = async (payload: { name: string; company: string; role: string; phone: string; email: string; customData?: Record<string, any> }) => {
    const templateId = selectedTemplateId !== "none" ? selectedTemplateId : undefined;
    const leadId = await addLead({ ...payload, leadTemplateId: templateId });
    toast.success("Lead criado");
    setShowNewDialog(false);
    if (leadId && campaigns.length > 0) {
      setLinkAfterCreateLeadId(leadId);
      setLinkAfterCreateCampaignId(campaigns[0].id);
      setLinkAfterCreateStepIndex(0);
    }
  };

  const handleLinkAfterCreate = async () => {
    if (!linkAfterCreateLeadId || !linkAfterCreateCampaignId || !user) return;
    await linkLeadToCampaign(linkAfterCreateLeadId, linkAfterCreateCampaignId);

    // Update step_index if not 0
    if (linkAfterCreateStepIndex > 0) {
      const camp = campaigns.find(c => c.id === linkAfterCreateCampaignId);
      const sortedSteps = camp ? [...camp.funnel].sort((a, b) => a.order - b.order) : [];
      const step = sortedSteps[linkAfterCreateStepIndex];
      if (step) {
        await supabase.from("campaign_leads")
          .update({ step_index: linkAfterCreateStepIndex, current_step_id: step.id })
          .eq("lead_id", linkAfterCreateLeadId)
          .eq("campaign_id", linkAfterCreateCampaignId);
      }
    }

    // Create empty field values from campaign field defs
    const { data: defs } = await supabase
      .from("campaign_field_definitions")
      .select("id")
      .eq("campaign_id", linkAfterCreateCampaignId);
    if (defs && defs.length > 0) {
      await supabase.from("lead_field_values").insert(
        defs.map(d => ({
          campaign_id: linkAfterCreateCampaignId,
          lead_id: linkAfterCreateLeadId!,
          field_id: d.id,
          value: "",
        }))
      );
    }

    toast.success("Lead vinculado à campanha");
    setPendingOpenAfterLink(linkAfterCreateLeadId);
    setLinkAfterCreateLeadId(null);
    await Promise.all([refreshCampaigns(), refreshLeads()]);
  };

  const handleDelete = async (id: string) => { await deleteLead(id); toast.success("Lead excluído"); };

  const getTemplateName = (leadModelId: string | null) => {
    if (!leadModelId) return "—";
    const t = leadTemplates.find((t) => t.id === leadModelId);
    return t?.name || "—";
  };

  const selectedTemplate: LeadTemplate | null =
    selectedTemplateId !== "none"
      ? leadTemplates.find((t) => t.id === selectedTemplateId) || null
      : null;

  const inputClass = "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50";
  const linkLeadName = linkDialogLeadId ? allLeads.find(l => l.id === linkDialogLeadId)?.name : "";
  const linkAfterCreateLeadName = linkAfterCreateLeadId ? allLeads.find(l => l.id === linkAfterCreateLeadId)?.name : "";
  const linkAfterCreateCampaign = campaigns.find(c => c.id === linkAfterCreateCampaignId);
  const linkAfterCreateSteps = linkAfterCreateCampaign
    ? [...linkAfterCreateCampaign.funnel].sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Meus Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{allLeads.length} lead{allLeads.length !== 1 ? "s" : ""} cadastrado{allLeads.length !== 1 ? "s" : ""}{archivedClfs.length > 0 ? ` · ${archivedClfs.length} arquivado${archivedClfs.length !== 1 ? "s" : ""}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {archivedClfs.length > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${showArchived ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived ? "← Ver ativos" : `📁 Arquivados (${archivedClfs.length})`}
            </button>
          )}
          <button onClick={() => setShowArchiveSettings(true)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition" title="Configurações de arquivamento">
            <Settings className="h-4 w-4" />
          </button>
          {!showArchived && (
            <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition flex-1 sm:flex-none">
              <Plus className="h-4 w-4" /> Novo Lead
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-secondary pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        </div>
        {!showArchived && (
          <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
            <option value="all">Todos os templates</option>
            <option value="none">Sem template</option>
            {leadTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {showArchived ? (
        /* Archived leads view */
        filteredArchived.length === 0 ? (
          <EmptyState icon={Archive} title="Nenhum lead arquivado" description="Leads arquivados aparecerão aqui" />
        ) : (
          <>
            <div className="glass-card overflow-hidden hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campanha</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Motivo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Arquivado em</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchived.map(({ clf, campaign: camp }) => {
                    const reasonLabels: Record<string, string> = {
                      manual: "Manual", converted: "Convertido", inactive: "Inativo",
                      lost: "Perdido", campaign_ended: "Campanha encerrada",
                    };
                    return (
                      <tr key={clf.campaignLead.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{clf.lead.name}</p>
                          <p className="text-xs text-muted-foreground">{clf.lead.company || ""}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{camp.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {reasonLabels[clf.campaignLead.archiveReason || ""] || "Arquivado"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {clf.campaignLead.archivedAt ? new Date(clf.campaignLead.archivedAt).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRestore(clf.campaignLead.id)}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition"
                          >
                            <RotateCcw className="h-3 w-3" /> Restaurar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile archived cards */}
            <div className="space-y-3 md:hidden">
              {filteredArchived.map(({ clf, campaign: camp }) => {
                const reasonLabels: Record<string, string> = {
                  manual: "Manual", converted: "Convertido", inactive: "Inativo",
                  lost: "Perdido", campaign_ended: "Campanha encerrada",
                };
                return (
                  <div key={clf.campaignLead.id} className="glass-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{clf.lead.name}</p>
                        <p className="text-xs text-muted-foreground">{camp.name}</p>
                        <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {reasonLabels[clf.campaignLead.archiveReason || ""] || "Arquivado"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRestore(clf.campaignLead.id)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" /> Restaurar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        /* Active leads view */
        filteredLeads.length === 0 ? (
          <EmptyState icon={Contact} title={allLeads.length === 0 ? "Nenhum lead cadastrado" : "Nenhum resultado"} description={allLeads.length === 0 ? "Crie seu primeiro lead para começar" : "Tente outro filtro ou termo de busca"} actionLabel={allLeads.length === 0 ? "Criar Lead" : undefined} onAction={allLeads.length === 0 ? openNew : undefined} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="glass-card overflow-hidden hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contato</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Template</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criado em</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/30 transition cursor-pointer" onClick={() => openLeadDetail(lead.id)}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company}{lead.role ? ` · ${lead.role}` : ""}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{lead.phone || lead.email || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{getTemplateName(lead.leadModelId)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => openLeadDetail(lead.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="glass-card p-4 cursor-pointer" onClick={() => openLeadDetail(lead.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.company}{lead.role ? ` · ${lead.role}` : ""}</p>
                      {(lead.phone || lead.email) && (
                        <p className="text-xs text-muted-foreground mt-1">{lead.phone || lead.email}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openLeadDetail(lead.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* Dialog for creating new leads */}
      <Dialog open={showNewDialog} onOpenChange={(open) => { if (!open) setShowNewDialog(false); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Template</label>
            <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className={inputClass}>
              <option value="none">Sem template (campos fixos)</option>
              {leadTemplates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <LeadForm template={selectedTemplate} onSubmit={handleCreateSubmit} onCancel={() => setShowNewDialog(false)} submitLabel="Criar Lead" />
        </DialogContent>
      </Dialog>

      {/* Link to campaign dialog (for leads not in any campaign) */}
      <AlertDialog open={!!linkDialogLeadId} onOpenChange={(open) => { if (!open) setLinkDialogLeadId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lead sem campanha vinculada</AlertDialogTitle>
            <AlertDialogDescription>
              O lead "{linkLeadName}" não está vinculado a nenhuma campanha. Vincule-o a uma campanha para ver e editar seus campos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {campaigns.length > 0 ? (
            <select value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)} className={inputClass}>
              {campaigns.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma campanha disponível. Crie uma campanha primeiro.</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {campaigns.length > 0 && (
              <AlertDialogAction onClick={handleLinkAndOpen}>
                <Link2 className="h-3.5 w-3.5 mr-1.5" /> Vincular e abrir
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post-create: ask to link to campaign */}
      <AlertDialog open={!!linkAfterCreateLeadId} onOpenChange={(open) => { if (!open) setLinkAfterCreateLeadId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vincular a uma campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              O lead "{linkAfterCreateLeadName}" foi criado. Deseja vinculá-lo a uma campanha?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {campaigns.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Campanha</label>
                <select
                  value={linkAfterCreateCampaignId}
                  onChange={e => {
                    setLinkAfterCreateCampaignId(e.target.value);
                    setLinkAfterCreateStepIndex(0);
                  }}
                  className={inputClass}
                >
                  {campaigns.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              {linkAfterCreateSteps.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Etapa do funil</label>
                  <select
                    value={linkAfterCreateStepIndex}
                    onChange={e => setLinkAfterCreateStepIndex(Number(e.target.value))}
                    className={inputClass}
                  >
                    {linkAfterCreateSteps.map((step, idx) => (
                      <option key={step.id} value={idx}>{step.name || `Etapa ${idx + 1}`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma campanha disponível.</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Não agora</AlertDialogCancel>
            {campaigns.length > 0 && (
              <AlertDialogAction onClick={handleLinkAfterCreate}>
                <Link2 className="h-3.5 w-3.5 mr-1.5" /> Vincular
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lead detail modal */}
      {detailCampaign && (
        <LeadDetailModal
          clf={detailClf}
          campaign={detailCampaign}
          template={null}
          open={!!detailClf}
          onOpenChange={(open) => { if (!open) { setDetailClf(null); setDetailCampaign(null); } }}
        />
      )}

      <ArchiveSettingsDialog open={showArchiveSettings} onOpenChange={setShowArchiveSettings} />
    </div>
  );
}