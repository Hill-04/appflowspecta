import { useState, useRef, useCallback } from "react";
import { Plus, Link2, Unlink, Upload, Search, Trash2, Check } from "lucide-react";
import { Campaign, CampaignLeadFull, LeadTemplate, useStore } from "@/hooks/useStore";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { LeadDetailModal } from "./LeadDetailModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  campaign: Campaign;
}

export function ListBuildingTab({ campaign }: Props) {
  const { user } = useAuth();
  const { addLead, linkLeadToCampaign, unlinkLeadFromCampaign, allLeads, leadTemplates, updateCampaign, deleteLead, refreshCampaigns, refreshLeads } = useStore();

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<CampaignLeadFull | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // CSV state
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<number, string>>({});

  // Create lead dialog state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savingLead, setSavingLead] = useState(false);

  const selectedTemplateId = campaign.defaultLeadTemplateId || "none";
  const template: LeadTemplate | null =
    selectedTemplateId !== "none" ? leadTemplates.find((t) => t.id === selectedTemplateId) || null : null;

  // Filter out archived leads from the active list
  const activeLeads = campaign.leads.filter(clf => !clf.campaignLead.archivedAt);
  const linkedLeadIds = new Set(campaign.leads.map((clf) => clf.lead.id));
  const availableLeads = allLeads.filter((l) => !linkedLeadIds.has(l.id));
  const filteredAvailable = linkSearch
    ? availableLeads.filter((l) => l.name.toLowerCase().includes(linkSearch.toLowerCase()))
    : availableLeads;

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50";

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === activeLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeLeads.map((clf) => clf.lead.id)));
    }
  };

  const handleBulkUnlink = async () => {
    const count = selectedIds.size;
    for (const id of selectedIds) {
      await unlinkLeadFromCampaign(id, campaign.id);
    }
    setSelectedIds(new Set());
    toast.success(`${count} leads desvinculados`);
  };

  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    for (const id of selectedIds) {
      await deleteLead(id);
    }
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
    toast.success(`${count} leads excluídos com sucesso`);
  };

  const ensureFieldDefs = async (tpl: LeadTemplate): Promise<any[]> => {
    const nonPrimaryFields = tpl.fields.filter(f => !f.is_primary);

    const { data: existingDefs } = await supabase
      .from('campaign_field_definitions')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('field_order');

    const existing = existingDefs || [];
    const existingNames = existing.map((d: any) => d.field_name);

    const fieldsToCreate = nonPrimaryFields.filter(f => !existingNames.includes(f.label));

    if (fieldsToCreate.length === 0) return existing;

    const typeMap: Record<string, string> = {
      short_text: 'short_text', long_text: 'long_text',
      number: 'number', link: 'url', url: 'url',
      date: 'date', dropdown: 'select', select: 'select',
      checkbox: 'checkbox', email: 'email', phone: 'phone',
    };

    const maxOrder = existing.reduce((m: number, d: any) => Math.max(m, d.field_order), -1);

    const { data: created } = await supabase
      .from('campaign_field_definitions')
      .insert(fieldsToCreate.map((f, idx) => ({
        campaign_id: campaign.id,
        user_id: user!.id,
        field_name: f.label,
        field_type: typeMap[f.type] || 'short_text',
        field_order: maxOrder + idx + 1,
        options: f.options || [],
      })))
      .select();

    return [...existing, ...(created || [])];
  };

  const handleSaveLead = async () => {
    if (!user || !template) return;

    const firstField = template.fields[0];
    const leadName = formValues[firstField?.id]?.trim();

    if (!leadName) {
      toast.error('Preencha o primeiro campo — ele será o nome do lead');
      return;
    }

    setSavingLead(true);
    try {
      // 1. Criar lead
      const leadId = await addLead({ name: leadName, company: '', role: '', phone: '', email: '' });
      if (!leadId) { toast.error('Erro ao criar lead'); return; }

      // 2. Vincular à campanha
      await linkLeadToCampaign(leadId, campaign.id);

      // 3. Garantir field definitions
      const fieldDefs = await ensureFieldDefs(template);

      // 4. Salvar valores dos campos não-primários
      const nonPrimaryFields = template.fields.slice(1);
      const valuesToInsert = nonPrimaryFields
        .map(f => {
          const def = fieldDefs.find((d: any) => d.field_name === f.label);
          if (!def) return null;
          return {
            campaign_id: campaign.id,
            lead_id: leadId,
            field_id: def.id,
            value: formValues[f.id] || '',
          };
        })
        .filter(Boolean);

      if (valuesToInsert.length > 0) {
        await supabase.from('lead_field_values').insert(valuesToInsert);
      }

      // 5. Refresh em background
      Promise.all([refreshCampaigns(), refreshLeads()]);

      // 6. Fechar e limpar
      setShowCreateModal(false);
      setFormValues({});
      toast.success('Lead salvo!');
    } catch (e) {
      console.error(e);
      toast.error('Erro inesperado');
    } finally {
      setSavingLead(false);
    }
  };

  const handleNewLeadWithName = async () => {
    if (!newLeadName.trim() || !user) return;
    const leadId = await addLead({ name: newLeadName.trim(), company: "", role: "", phone: "", email: "" });
    if (leadId) {
      await linkLeadToCampaign(leadId, campaign.id);
      Promise.all([refreshCampaigns(), refreshLeads()]);
      toast.success("Lead criado e vinculado");
    }
    setNewLeadName("");
    setShowNewLeadDialog(false);
  };

  const handleLink = async (leadId: string) => {
    await linkLeadToCampaign(leadId, campaign.id);
    toast.success("Lead vinculado");
  };

  // CSV parsing
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
      if (lines.length < 2) { toast.error("CSV vazio ou inválido"); return; }
      setCsvHeaders(lines[0]);
      setCsvData(lines.slice(1).filter((l) => l.some((c) => c)));
      setCsvMapping({});
      setShowCsvDialog(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCsvImport = async () => {
    const nameCol = Object.entries(csvMapping).find(([_, v]) => v === "name");
    if (!nameCol) { toast.error("Mapeie pelo menos a coluna 'Nome'"); return; }

    let imported = 0;
    for (const row of csvData) {
      const name = row[Number(nameCol[0])]?.trim();
      if (!name) continue;

      const customData: Record<string, any> = {};
      const payload: any = { name, company: "", role: "", phone: "", email: "" };

      for (const [colIdx, field] of Object.entries(csvMapping)) {
        const val = row[Number(colIdx)]?.trim() || "";
        if (field === "name") continue;
        if (["company", "role", "phone", "email"].includes(field)) {
          payload[field] = val;
        } else {
          customData[field] = val;
        }
      }

      const templateId = selectedTemplateId !== "none" ? selectedTemplateId : undefined;
      const leadId = await addLead({ ...payload, customData, leadTemplateId: templateId });
      if (leadId) {
        await linkLeadToCampaign(leadId, campaign.id);
        imported++;
      }
    }

    toast.success(`${imported} leads importados`);
    setShowCsvDialog(false);
    setCsvData([]);
  };

  const mappingOptions = [
    { value: "", label: "Ignorar" },
    { value: "name", label: "Nome" },
    { value: "company", label: "Empresa" },
    { value: "role", label: "Cargo" },
    { value: "phone", label: "Telefone" },
    { value: "email", label: "E-mail" },
    ...(template?.fields.filter((f) => !f.is_primary).map((f) => ({ value: f.id, label: f.label })) || []),
  ];

  const handleNewLeadClick = () => {
    template ? setShowCreateModal(true) : setShowNewLeadDialog(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Template selector */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Template da Campanha</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Define os campos personalizados dos leads</p>
          </div>
          <select
            value={selectedTemplateId}
            onChange={(e) => {
              const newValue = e.target.value;
              updateCampaign(campaign.id, { default_lead_template_id: newValue === "none" ? null : newValue });
            }}
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="none">Sem template</option>
            {leadTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-foreground">
          Leads ({activeLeads.length})
        </h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            <Upload className="h-3.5 w-3.5" /> Importar CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvFile} className="hidden" />
          <button
            onClick={() => setShowLinkDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            <Link2 className="h-3.5 w-3.5" /> Vincular Existente
          </button>
          <button
            onClick={handleNewLeadClick}
            className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Lead
          </button>
        </div>
      </div>

      {/* Leads table */}
      {activeLeads.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Nenhum lead na campanha"
          description={template ? "Adicione leads manualmente, importe CSV ou vincule leads existentes" : "Configure um template de lead antes de adicionar leads para melhor organização"}
          actionLabel="Novo Lead"
          onAction={handleNewLeadClick}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={selectedIds.size === activeLeads.length && activeLeads.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empresa</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {activeLeads.map((clf) => (
                <tr
                  key={clf.campaignLead.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition cursor-pointer"
                  style={selectedIds.has(clf.lead.id) ? { background: "rgba(239, 68, 68, 0.05)" } : undefined}
                  onClick={() => setSelectedLead(clf)}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(clf.lead.id)}
                      onCheckedChange={() => toggleSelect(clf.lead.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{clf.lead.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{clf.lead.company || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-primary">{clf.campaignLead.status}</span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button
                        onClick={() => unlinkLeadFromCampaign(clf.lead.id, campaign.id)}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                        title="Desvincular"
                      >
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
                            <AlertDialogAction onClick={async (e) => { const row = (e.target as HTMLElement).closest('tr'); if (row) row.classList.add('animate-slide-out'); await new Promise(r => setTimeout(r, 250)); await deleteLead(clf.lead.id); toast.success("Lead excluído"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
      )}

      {/* Link dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Vincular Leads Existentes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar por nome..."
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                className={inputClass + " pl-9"}
              />
            </div>
            {filteredAvailable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {allLeads.length === 0 ? "Nenhum lead cadastrado" : "Todos os leads já estão vinculados"}
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
                      <p className="text-xs text-muted-foreground">{lead.company}</p>
                    </div>
                    <Link2 className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setShowLinkDialog(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New lead — simple name dialog (fallback without template) */}
      <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input
              value={newLeadName}
              onChange={e => setNewLeadName(e.target.value)}
              placeholder="Nome do lead"
              className={inputClass}
              onKeyDown={e => e.key === "Enter" && handleNewLeadWithName()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              💡 Configure um template na campanha para pré-carregar campos personalizados.
            </p>
          </div>
          <DialogFooter>
            <button onClick={() => { setShowNewLeadDialog(false); setNewLeadName(""); }} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
              Cancelar
            </button>
            <button
              onClick={handleNewLeadWithName}
              disabled={!newLeadName.trim()}
              className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              Criar e Abrir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create lead with template fields dialog */}
      <Dialog open={showCreateModal} onOpenChange={(o) => { if (!o) { setShowCreateModal(false); setFormValues({}); } }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {template?.fields.map((field, index) => {
              const ft = field.type as string;
              const val = formValues[field.id] || '';
              const setVal = (v: string) => setFormValues(prev => ({ ...prev, [field.id]: v }));
              return (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {field.label}{index === 0 ? ' *' : ''}
                  </label>
                  {ft === 'long_text' ? (
                    <textarea value={val} onChange={e => setVal(e.target.value)} placeholder={field.label} rows={3} className={inputClass + " resize-none min-h-[80px]"} autoFocus={index === 0} />
                  ) : ft === 'number' ? (
                    <input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder={field.label} className={inputClass} autoFocus={index === 0} />
                  ) : ft === 'link' || ft === 'url' ? (
                    <input type="url" value={val} onChange={e => setVal(e.target.value)} placeholder="https://..." className={inputClass} autoFocus={index === 0} />
                  ) : ft === 'date' ? (
                    <input type="date" value={val} onChange={e => setVal(e.target.value)} className={inputClass} autoFocus={index === 0} />
                  ) : ft === 'dropdown' || ft === 'select' ? (
                    <select value={val} onChange={e => setVal(e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : ft === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                      <input type="checkbox" checked={val === 'true'} onChange={e => setVal(e.target.checked ? 'true' : 'false')} />
                      {field.label}
                    </label>
                  ) : ft === 'email' ? (
                    <input type="email" value={val} onChange={e => setVal(e.target.value)} placeholder={field.label} className={inputClass} autoFocus={index === 0} />
                  ) : ft === 'phone' ? (
                    <input type="tel" value={val} onChange={e => setVal(e.target.value)} placeholder={field.label} className={inputClass} autoFocus={index === 0} />
                  ) : (
                    <input type="text" value={val} onChange={e => setVal(e.target.value)} placeholder={field.label} className={inputClass} autoFocus={index === 0} />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <button onClick={() => { setShowCreateModal(false); setFormValues({}); }} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
              Cancelar
            </button>
            <button onClick={handleSaveLead} disabled={savingLead} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
              {savingLead ? 'Salvando...' : 'Salvar Lead'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV import dialog */}
      <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Importar CSV</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{csvData.length} linhas encontradas. Mapeie as colunas:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {csvHeaders.map((header, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-foreground font-medium w-32 truncate">{header}</span>
                <select
                  value={csvMapping[idx] || ""}
                  onChange={(e) => setCsvMapping((prev) => ({ ...prev, [idx]: e.target.value }))}
                  className="flex-1 rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm text-foreground"
                >
                  {mappingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <button onClick={() => setShowCsvDialog(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
              Cancelar
            </button>
            <button onClick={handleCsvImport} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
              Importar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead detail modal */}
      <LeadDetailModal
        clf={selectedLead}
        campaign={campaign}
        template={template}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />

      {/* Floating action bar */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-xl px-5 py-3 shadow-2xl animate-slide-up"
          style={{
            background: "#1a1b23",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary" />
            <span className="font-medium">{selectedIds.size} leads selecionados</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkUnlink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
            >
              <Unlink className="h-3.5 w-3.5" /> Desvincular
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition"
              style={{ background: "#ef4444" }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir Seleção
            </button>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} leads selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os leads serão removidos permanentemente de todas as campanhas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
