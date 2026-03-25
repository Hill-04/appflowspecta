import { useState, useEffect } from "react";
import { Plus, Users, Link2, Unlink, Trash2 } from "lucide-react";
import { useStore, Campaign, LeadTemplate } from "@/hooks/useStore";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { LeadForm } from "@/components/lead/LeadForm";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  campaign: Campaign;
  onAddLead: () => void;
  externalOpen: boolean;
  onExternalOpenChange: (open: boolean) => void;
}

export function LeadsTab({ campaign, onAddLead, externalOpen, onExternalOpenChange }: Props) {
  const { addLead, unlinkLeadFromCampaign, linkLeadToCampaign, allLeads, leadTemplates, deleteLead } = useStore();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");

  // Sync external open to link dialog
  useEffect(() => {
    if (externalOpen) {
      setShowLinkDialog(true);
      onExternalOpenChange(false);
    }
  }, [externalOpen]);

  const selectedTemplate: LeadTemplate | null =
    selectedTemplateId !== "none"
      ? leadTemplates.find((t) => t.id === selectedTemplateId) || null
      : null;

  const handleNewLead = async (payload: { name: string; company: string; role: string; phone: string; email: string; customData?: Record<string, any> }) => {
    const templateId = selectedTemplateId !== "none" ? selectedTemplateId : undefined;
    const leadId = await addLead({ ...payload, leadTemplateId: templateId });
    if (leadId) {
      await linkLeadToCampaign(leadId, campaign.id);
      toast.success("Lead criado e vinculado");
    }
    setShowNewLeadDialog(false);
    setSelectedTemplateId("none");
  };

  const handleUnlink = async (leadId: string) => {
    await unlinkLeadFromCampaign(leadId, campaign.id);
    toast.success("Lead desvinculado");
  };

  const handleLink = async (leadId: string) => {
    await linkLeadToCampaign(leadId, campaign.id);
    toast.success("Lead vinculado");
  };

  // Leads not yet linked to this campaign
  const linkedLeadIds = new Set(campaign.leads.map((clf) => clf.lead.id));
  const availableLeads = allLeads.filter((l) => !linkedLeadIds.has(l.id));
  const filteredAvailable = linkSearch
    ? availableLeads.filter((l) => l.name.toLowerCase().includes(linkSearch.toLowerCase()))
    : availableLeads;

  const inputClass = "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50";

  if (campaign.leads.length === 0 && !showLinkDialog && !showNewLeadDialog) {
    return (
      <div className="space-y-4 animate-fade-in">
        <EmptyState
          icon={Users}
          title="Sem leads nesta campanha"
          description="Vincule leads existentes ou crie novos para começar"
          actionLabel="Vincular Lead"
          onAction={() => setShowLinkDialog(true)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Leads da Campanha</h3>
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectedTemplateId("none"); setShowNewLeadDialog(true); }}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition"
          >
            <Plus className="h-4 w-4" /> Novo Lead
          </button>
          <button
            onClick={() => setShowLinkDialog(true)}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            <Link2 className="h-4 w-4" /> Vincular Lead
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contato</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status no Funil</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaign.leads.map((clf) => (
              <tr key={clf.campaignLead.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{clf.lead.name}</p>
                  <p className="text-xs text-muted-foreground">{clf.lead.company} · {clf.lead.role}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {clf.lead.phone || clf.lead.email}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={clf.campaignLead.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleUnlink(clf.lead.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Desvincular">
                      <Unlink className="h-3.5 w-3.5" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Excluir lead (global)">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir lead permanentemente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso removerá {clf.lead.name} de todas as campanhas. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => { await deleteLead(clf.lead.id); toast.success("Lead excluído"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Link existing leads dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Vincular Lead à Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input
              placeholder="Buscar por nome..."
              value={linkSearch}
              onChange={(e) => setLinkSearch(e.target.value)}
              className={inputClass}
            />
            {filteredAvailable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {allLeads.length === 0 ? "Nenhum lead cadastrado. Crie um primeiro." : "Todos os leads já estão vinculados."}
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredAvailable.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleLink(lead.id)}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-secondary transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.company} · {lead.role}</p>
                    </div>
                    <Link2 className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setShowLinkDialog(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New lead dialog with template selector + LeadForm */}
      <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Lead</DialogTitle>
          </DialogHeader>

          {/* Template selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className={inputClass}
            >
              <option value="none">Sem template (campos fixos)</option>
              {leadTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <LeadForm
            template={selectedTemplate}
            onSubmit={handleNewLead}
            onCancel={() => setShowNewLeadDialog(false)}
            submitLabel="Criar e Vincular"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
