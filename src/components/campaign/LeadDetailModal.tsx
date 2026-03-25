import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Clock, Trash2, Copy, Plus, Check,
  ChevronDown, Archive, Bookmark, DollarSign, RotateCcw,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { Campaign, CampaignLeadFull, LeadTemplate, useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ── Types ──
interface FieldDef {
  id: string;
  campaign_id: string;
  field_name: string;
  field_type: string;
  field_order: number;
  options: string[];
}

interface FieldValue {
  id: string;
  field_id: string;
  value: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

const FIELD_TYPES = [
  { value: "short_text", label: "Texto curto" },
  { value: "long_text", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "url", label: "Link / URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefone" },
  { value: "date", label: "Data" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
];

const PRIORITIES = [
  { value: "high", label: "Alta", color: "bg-red-500/20 text-red-400 border-red-500/20" },
  { value: "medium", label: "Média", color: "bg-amber-500/20 text-amber-400 border-amber-500/20" },
  { value: "low", label: "Baixa", color: "bg-white/5 text-white/40 border-white/10" },
];

interface Props {
  clf: CampaignLeadFull | null;
  campaign: Campaign;
  template: LeadTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotesChanged?: () => void;
  onFieldDefsChanged?: () => void;
}

// Helper to generate avatar color from name
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

export function LeadDetailModal({ clf, campaign, template, open, onOpenChange, onNotesChanged, onFieldDefsChanged }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    updateLead, updateCampaignLeadStatus, deleteLead,
    unlinkLeadFromCampaign, refreshCampaigns, refreshLeads, getTemplateForLead,
  } = useStore();

  const leadTemplate = clf ? getTemplateForLead(clf.lead) : null;

  // ── State ──
  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([]);
  const [fieldValues, setFieldValues] = useState<FieldValue[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savedField, setSavedField] = useState<string | null>(null);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("short_text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [priority, setPriority] = useState("medium");
  const [applyAllDialogOpen, setApplyAllDialogOpen] = useState(false);
  const [pendingField, setPendingField] = useState<{ name: string; type: string; options: string[] } | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Record<string, string>>({});
  const [bulkSaved, setBulkSaved] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState('');
  const lastSavedNameRef = useRef("");
  const saveNamePromiseRef = useRef<Promise<void> | null>(null);
  const [dealValue, setDealValue] = useState<number | null>(null);
  const [showValuePanel, setShowValuePanel] = useState(false);
  const dealValueRef = useRef<number | null>(null);

  // ── Load data when modal opens ──
  useEffect(() => {
    if (!clf || !open) return;

    // Inicializar nome — fonte de verdade local
    const initialName = clf.lead.name === 'Novo Lead' ? '' : clf.lead.name;
    setDisplayName(initialName);
    setNameDraft(initialName);
    lastSavedNameRef.current = initialName;
    saveNamePromiseRef.current = null;

    if (clf.lead.name === 'Novo Lead') {
      setEditingName(true);
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else {
      setEditingName(false);
    }

    setPriority((clf.campaignLead as any).priority || "medium");
    setDealValue(clf.campaignLead.dealValue || null);
    setShowValuePanel(false);
    setDirtyFields({});
    setBulkSaved(false);

    loadFieldDefs();

    // Tentar carregar field values com retry (3 tentativas com backoff)
    const tryLoad = async (attempt: number) => {
      const vals = await loadFieldValues();
      if ((!vals || vals.length === 0) && attempt < 3) {
        setTimeout(() => tryLoad(attempt + 1), 600 * attempt);
      }
    };
    tryLoad(1);
    loadNotes();
  }, [clf?.lead.id, open]);

  const loadFieldDefs = useCallback(async () => {
    const { data, error } = await supabase
      .from("campaign_field_definitions")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("field_order");
    
    setFieldDefs((data as any[])?.map(d => ({ ...d, options: Array.isArray(d.options) ? d.options : [] })) || []);
  }, [campaign.id]);

  const loadFieldValues = useCallback(async () => {
    if (!clf) return [];
    const { data, error } = await supabase
      .from("lead_field_values")
      .select("id, field_id, value")
      .eq("campaign_id", campaign.id)
      .eq("lead_id", clf.lead.id);
    
    const vals = (data as any[]) || [];
    setFieldValues(vals);
    return vals;
  }, [campaign.id, clf?.lead.id]);

  const loadNotes = useCallback(async () => {
    if (!clf) return;
    const { data } = await supabase
      .from("campaign_lead_notes")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("lead_id", clf.lead.id)
      .order("created_at", { ascending: false });
    setNotes((data as any[]) || []);
  }, [campaign.id, clf?.lead.id]);

  // Sync deal value ref
  useEffect(() => { dealValueRef.current = dealValue; }, [dealValue]);

  // Save deal value when panel closes
  useEffect(() => {
    if (!showValuePanel && clf) {
      const currentValue = dealValueRef.current;
      supabase.from('campaign_leads')
        .update({ deal_value: currentValue })
        .eq('id', clf.campaignLead.id)
        .then(() => {
          if (currentValue !== null) showSaved('value');
        });
    }
  }, [showValuePanel]);

  if (!clf) return null;

  // ── Derived ──
  const sortedSteps = [...campaign.funnel].sort((a, b) => a.order - b.order);
  const currentStep = sortedSteps[clf.campaignLead.stepIndex];
  const leadInteractions = campaign.interactions
    .filter(i => i.lead_id === clf.lead.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const priorityInfo = PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];

  // ── Handlers ──
  const handleSaveName = async () => {
    const normalizedName = nameDraft.trim();

    if (!normalizedName) {
      toast.error('Digite um nome para o lead');
      nameInputRef.current?.focus();
      return;
    }

    if (normalizedName === lastSavedNameRef.current) {
      setDisplayName(normalizedName);
      setEditingName(false);
      return;
    }

    if (saveNamePromiseRef.current) {
      await saveNamePromiseRef.current;
      return;
    }

    const savePromise = (async () => {
      await updateLead(clf.lead.id, { name: normalizedName });
      lastSavedNameRef.current = normalizedName;
      setDisplayName(normalizedName);
      setEditingName(false);
      toast.success("Nome atualizado");
      showSaved("name");
    })();

    saveNamePromiseRef.current = savePromise;
    await savePromise.finally(() => {
      saveNamePromiseRef.current = null;
    });
  };

  const handleMoveStep = async (stepIndex: number) => {
    const step = sortedSteps[stepIndex];
    await updateCampaignLeadStatus(clf.campaignLead.id, {
      step_index: stepIndex,
      current_step_id: step?.id,
    });
  };

  const cyclePriority = async () => {
    const order = ["low", "medium", "high"];
    const next = order[(order.indexOf(priority) + 1) % order.length];
    setPriority(next);
    await supabase
      .from("campaign_leads")
      .update({ priority: next })
      .eq("id", clf.campaignLead.id);
    showSaved("priority");
  };

  const handleDeleteLead = async () => {
    await deleteLead(clf.lead.id);
    onOpenChange(false);
    toast.success("Lead excluído");
  };

  const handleArchive = async () => {
    const modalContent = document.querySelector('[role="dialog"]');
    if (modalContent) {
      modalContent.classList.add('animate-slide-out');
      await new Promise(r => setTimeout(r, 250));
    }

    await supabase.from("campaign_leads")
      .update({ archived_at: new Date().toISOString(), archive_reason: "manual" } as any)
      .eq("id", clf.campaignLead.id);

    onOpenChange(false);

    toast("Lead arquivado", {
      description: "Você pode restaurá-lo em Meus Leads → Arquivados",
      action: {
        label: "Ver arquivados",
        onClick: () => navigate("/app/leads?archived=true"),
      },
      duration: 5000,
    });

    await Promise.all([refreshCampaigns(), refreshLeads()]);
  };

  const handleRestore = async () => {
    await supabase.from("campaign_leads")
      .update({ archived_at: null, archive_reason: null } as any)
      .eq("id", clf.campaignLead.id);
    onOpenChange(false);
    toast.success("Lead restaurado");
    await Promise.all([refreshCampaigns(), refreshLeads()]);
  };

  const handleDuplicate = async () => {
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
      status: "pending",
      current_step_id: firstStep?.id || null,
      priority: "medium",
      deal_value: 0,
    });

    if (fieldValues.length > 0) {
      await supabase.from("lead_field_values").insert(
        fieldValues.map(fv => ({
          campaign_id: campaign.id,
          lead_id: newLead.id,
          field_id: fv.field_id,
          value: fv.value,
        }))
      );
    }

    await Promise.all([refreshCampaigns(), refreshLeads()]);
    toast.success("Lead duplicado");
  };

  // ── Field CRUD ──
  const handleAddFieldStart = () => {
    if (!newFieldName.trim() || !user) return;
    const options = newFieldType === "select"
      ? newFieldOptions.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    const field = { name: newFieldName.trim(), type: newFieldType, options };
    setPendingField(field);
    setAddFieldOpen(false);
    setTimeout(() => setApplyAllDialogOpen(true), 150);
  };

  const handleAddFieldConfirm = async (applyAll: boolean) => {
    if (!pendingField || !user || !clf) return;
    setApplyAllDialogOpen(false);

    const maxOrder = fieldDefs.reduce((m, f) => Math.max(m, f.field_order), 0);
    const { data } = await supabase.from("campaign_field_definitions").insert({
      campaign_id: campaign.id,
      user_id: user.id,
      field_name: pendingField.name,
      field_type: pendingField.type,
      field_order: maxOrder + 1,
      options: pendingField.options,
    }).select().single();

    if (data) {
      setFieldDefs(prev => [...prev, { ...data as any, options: Array.isArray((data as any).options) ? (data as any).options : [] }]);

      if (applyAll) {
        const allLeadIds = campaign.leads.map(c => c.lead.id);
        if (allLeadIds.length > 0) {
          await supabase.from("lead_field_values").insert(
            allLeadIds.map(lid => ({
              campaign_id: campaign.id,
              lead_id: lid,
              field_id: (data as any).id,
              value: "",
            }))
          );
        }
      } else {
        await supabase.from("lead_field_values").insert({
          campaign_id: campaign.id,
          lead_id: clf.lead.id,
          field_id: (data as any).id,
          value: "",
        });
      }

      await loadFieldValues();
      onFieldDefsChanged?.();
    }
    setPendingField(null);
    setNewFieldName("");
    setNewFieldType("short_text");
    setNewFieldOptions("");
  };

  const handleDeleteField = async (fieldId: string) => {
    await supabase.from("lead_field_values").delete().eq("field_id", fieldId);
    await supabase.from("campaign_field_definitions").delete().eq("id", fieldId);
    setFieldDefs(prev => prev.filter(f => f.id !== fieldId));
    setFieldValues(prev => prev.filter(v => v.field_id !== fieldId));
    onFieldDefsChanged?.();
  };

  const handleFieldValueSave = async (fieldId: string, value: string) => {
    if (!clf) return;
    const existing = fieldValues.find(v => v.field_id === fieldId);
    if (existing) {
      await supabase.from("lead_field_values").update({ value }).eq("id", existing.id);
      setFieldValues(prev => prev.map(v => v.field_id === fieldId ? { ...v, value } : v));
    } else {
      const { data } = await supabase.from("lead_field_values").insert({
        campaign_id: campaign.id,
        lead_id: clf.lead.id,
        field_id: fieldId,
        value,
      }).select().single();
      if (data) setFieldValues(prev => [...prev, data as any]);
    }
    showSaved(fieldId);
  };

  // ── Bulk save dirty fields ──
  const handleBulkSave = async () => {
    const entries = Object.entries(dirtyFields);
    for (const [fieldId, value] of entries) {
      await handleFieldValueSave(fieldId, value);
    }
    setDirtyFields({});
    setBulkSaved(true);
    setTimeout(() => setBulkSaved(false), 2000);
  };

  // ── Notes ──
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const { data } = await supabase.from("campaign_lead_notes").insert({
      campaign_id: campaign.id,
      lead_id: clf.lead.id,
      content: newNote.trim(),
    }).select().single();
    if (data) setNotes(prev => [data as any, ...prev]);
    setNewNote("");
    onNotesChanged?.();
  };

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from("campaign_lead_notes").delete().eq("id", noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    onNotesChanged?.();
  };

  const showSaved = (fieldId: string) => {
    setSavedField(fieldId);
    setTimeout(() => setSavedField(null), 1500);
  };

  // ── Value handlers ──
  const handleSaveDealValue = async () => {
    await supabase.from('campaign_leads')
      .update({ deal_value: dealValue })
      .eq('id', clf.campaignLead.id);
    await refreshCampaigns();
    showSaved('value');
  };

  const handleClearDealValue = async () => {
    setDealValue(null);
    await supabase.from('campaign_leads')
      .update({ deal_value: null })
      .eq('id', clf.campaignLead.id);
    await refreshCampaigns();
    showSaved('value');
  };


  const closeModal = async () => {
    const normalizedName = nameDraft.trim();

    if (!normalizedName) {
      toast.error('Digite um nome para o lead antes de fechar');
      return;
    }

    if (normalizedName !== lastSavedNameRef.current) {
      await handleSaveName();
    } else if (editingName) {
      setEditingName(false);
    }

    // Auto-save deal value on close
    if (dealValue !== clf.campaignLead.dealValue) {
      await handleSaveDealValue();
    }

    if (saveNamePromiseRef.current) {
      await saveNamePromiseRef.current;
    }

    onOpenChange(false);
  };

  const hasDirty = Object.keys(dirtyFields).length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { closeModal(); return; } }}>
      <DialogContent
        hideClose
        className="max-w-4xl w-full max-h-[85vh] p-0 overflow-hidden gap-0 bg-[#141518] border border-white/[0.06] shadow-2xl animate-modal-in"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* ── HEADER ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] min-w-0">
          {/* Avatar */}
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: avatarColor(displayName || 'N') }}
          >
            {(displayName.charAt(0) || '?').toUpperCase()}
          </div>

          {/* Name inline edit + template tag */}
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={e => { setNameDraft(e.target.value); setDisplayName(e.target.value); }}
                onBlur={handleSaveName}
                onKeyDown={e => e.key === "Enter" && handleSaveName()}
                placeholder="Nome do lead"
                className="text-xl font-semibold text-white bg-transparent border-none outline-none min-w-0 w-full truncate"
                autoFocus
              />
            ) : (
              <h2
                onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 0); }}
                className="text-xl font-semibold text-white truncate cursor-pointer hover:underline hover:decoration-white/20 hover:underline-offset-4 transition min-w-0"
              >
                {displayName || <span className="text-muted-foreground">Nome do lead</span>}
                {savedField === "name" && <span className="ml-2 text-xs text-emerald-400 font-medium animate-fade-check">✓</span>}
              </h2>
            )}
            {leadTemplate && (
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Bookmark className="h-2.5 w-2.5" /> {leadTemplate.name}
              </span>
            )}
          </div>

          {/* Stage pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary hover:bg-primary/25 transition shrink-0">
                {currentStep?.name || `Etapa ${clf.campaignLead.stepIndex + 1}`}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {sortedSteps.map((step, idx) => (
                <DropdownMenuItem key={step.id} onClick={() => handleMoveStep(idx)}>
                  {step.name || `Etapa ${idx + 1}`}
                  {idx === clf.campaignLead.stepIndex && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority pill */}
          <button
            onClick={cyclePriority}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition shrink-0 ${priorityInfo.color}`}
            title="Alternar prioridade"
          >
            {priorityInfo.label}
            {savedField === "priority" && <span className="ml-1 text-[10px] text-emerald-400 animate-fade-check">✓</span>}
          </button>

          {/* Value badge */}
          <button
            onClick={() => setShowValuePanel(!showValuePanel)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5 transition shrink-0"
          >
            <DollarSign className="h-3 w-3 text-green-400" />
            {dealValue ? `R$ ${dealValue.toLocaleString('pt-BR')}` : '+ Valor'}
            {savedField === "value" && <span className="ml-1 text-[10px] text-emerald-400 animate-fade-check">✓</span>}
          </button>

          {/* Action icons */}
          <div className="flex items-center gap-0.5 shrink-0 ml-auto">
            <button onClick={handleDuplicate} className="h-8 w-8 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition" title="Duplicar">
              <Copy className="h-4 w-4" />
            </button>
            {clf.campaignLead.archivedAt ? (
              <button onClick={handleRestore} className="h-8 w-8 flex items-center justify-center rounded-md text-primary hover:text-primary/80 hover:bg-white/5 transition" title="Restaurar">
                <RotateCcw className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleArchive} className="h-8 w-8 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition" title="Arquivar">
                <Archive className="h-4 w-4" />
              </button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-md text-white/40 hover:text-red-400 hover:bg-white/5 transition" title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir lead permanentemente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso removerá {displayName || 'este lead'} de todas as campanhas, notas, interações e eventos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <button onClick={closeModal} className="h-8 w-8 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition ml-1" title="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── VALUE PANEL ── */}
        {showValuePanel && (
          <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.06] bg-white/[0.02] animate-slide-up flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Valor do negócio</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/40">R$</span>
                <input
                  type="number"
                  value={dealValue ?? ''}
                  onChange={e => setDealValue(e.target.value ? Number(e.target.value) : null)}
                  onBlur={handleSaveDealValue}
                  placeholder="0,00"
                  className="w-28 bg-transparent text-sm text-white/80 outline-none border-b border-white/10 focus:border-white/30 pb-0.5"
                  onKeyDown={e => e.key === 'Enter' && handleSaveDealValue()}
                />
              </div>
            </div>
            <button
              onClick={handleSaveDealValue}
              className="rounded-md bg-primary/20 border border-primary/30 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/30 transition active:scale-95"
            >
              {savedField === "value" ? "✓ Salvo" : "Salvar"}
            </button>
            {dealValue !== null && (
              <button onClick={handleClearDealValue}
                className="text-[10px] text-white/20 hover:text-red-400 transition ml-auto">
                Remover
              </button>
            )}
          </div>
        )}
        {/* ── TWO COLUMNS ── */}
        <div className="flex flex-col md:flex-row overflow-hidden" style={{ height: "calc(85vh - 57px)" }}>
          {/* LEFT — Fields (45%) */}
          <div className="md:w-[45%] border-r border-white/[0.05] overflow-y-auto p-5 flex flex-col">
            <h3 className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-3">Campos</h3>

            <div className="flex-1 space-y-0">
              {(() => {
                const visibleFields = fieldDefs.filter(f =>
                  fieldValues.some(v => v.field_id === f.id)
                );
                if (visibleFields.length === 0) return (
                  <p className="text-xs text-white/30 py-6 text-center">
                    Nenhum campo criado ainda.
                  </p>
                );
                return visibleFields.map(field => {
                  const fv = fieldValues.find(v => v.field_id === field.id);
                  return (
                    <InlineField
                      key={field.id}
                      field={field}
                      value={dirtyFields[field.id] !== undefined ? dirtyFields[field.id] : (fv?.value || "")}
                      saved={savedField === field.id}
                      onSave={(val) => handleFieldValueSave(field.id, val)}
                      onDelete={() => handleDeleteField(field.id)}
                      onDirty={(val) => setDirtyFields(prev => ({ ...prev, [field.id]: val }))}
                      onClean={(fieldId) => setDirtyFields(prev => { const n = { ...prev }; delete n[fieldId]; return n; })}
                    />
                  );
                });
              })()}
            </div>

            {/* Add field */}
            <Popover open={addFieldOpen} onOpenChange={setAddFieldOpen}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition mt-3">
                  <Plus className="h-3 w-3" /> Adicionar campo
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-3 bg-[#1a1b1f]/95 backdrop-blur-xl border-white/[0.08] rounded-xl p-3" align="start">
                <input
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  placeholder="Nome do campo"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/[0.15] focus:bg-white/[0.06] transition-all"
                  onKeyDown={e => e.key === "Enter" && handleAddFieldStart()}
                />
                {/* Field type selector — Apple style */}
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider px-1">Tipo</span>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
                    {FIELD_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => {
                          setNewFieldType(t.value);
                          if (t.value !== "select") setNewFieldOptions("");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-all ${
                          newFieldType === t.value
                            ? "bg-primary/10 text-primary"
                            : "text-white/60 hover:bg-white/[0.04] hover:text-white/80"
                        }`}
                      >
                        <span>{t.label}</span>
                        {newFieldType === t.value && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {newFieldType === "select" && (
                  <input
                    value={newFieldOptions}
                    onChange={e => setNewFieldOptions(e.target.value)}
                    placeholder="Opções (separadas por vírgula)"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/[0.15] focus:bg-white/[0.06] transition-all"
                  />
                )}
                <button
                  onClick={handleAddFieldStart}
                  disabled={!newFieldName.trim()}
                  className="w-full rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition active:scale-[0.97] disabled:opacity-50"
                >
                  Criar campo
                </button>
              </PopoverContent>
            </Popover>

            {/* Bulk save button */}
            <div className="mt-4 min-h-[32px]">
              {bulkSaved ? (
                <span className="text-xs text-emerald-400 font-medium animate-fade-check">✓ Salvo</span>
              ) : hasDirty ? (
                <button
                  onClick={handleBulkSave}
                  className="gradient-primary text-xs px-3 py-1.5 rounded-md font-medium text-primary-foreground hover:opacity-90 transition active:scale-95 transition-transform duration-75"
                >
                  Salvar alterações
                </button>
              ) : null}
            </div>
          </div>

          {/* RIGHT — Notes (55%) */}
          <div className="md:w-[55%] overflow-y-auto p-5 flex flex-col gap-4">
            {/* Add note */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold tracking-widest text-white/30 uppercase">Notas</h3>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Escreva uma nota..."
                rows={3}
                className="w-full rounded-md bg-white/[0.03] border-none px-3 py-2 text-sm text-white/80 placeholder:text-white/20 outline-none resize-none focus:bg-white/[0.05] transition"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="gradient-primary text-xs px-3 py-1.5 rounded-md font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
              >
                Salvar
              </button>
            </div>

            {/* Notes timeline */}
            <div className="space-y-2 flex-1">
              {notes.map(note => (
                <div key={note.id} className="animate-fade-in bg-white/[0.02] rounded-lg p-3 group">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-white/70 flex-1 whitespace-pre-wrap">{note.content}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 text-white/20 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-white/25 mt-1.5">
                    {new Date(note.created_at).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(note.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-white/20 text-center py-6">Nenhuma nota ainda</p>
              )}
            </div>

            {/* Interaction history */}
            {leadInteractions.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-white/[0.04]">
                <h3 className="text-[10px] font-semibold tracking-widest text-white/30 uppercase">Histórico de Interações</h3>
                {leadInteractions.map(i => (
                  <div key={i.id} className="flex items-center gap-2 text-xs text-white/40">
                    <div className="h-1 w-1 rounded-full bg-white/20 shrink-0" />
                    <span className="flex-1">{i.outcome}</span>
                    <span className="text-white/20">{new Date(i.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Apply to all leads AlertDialog */}
      <AlertDialog open={applyAllDialogOpen} onOpenChange={setApplyAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja adicionar este campo a todos os leads desta campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              O campo "{pendingField?.name}" será criado. Escolha se deseja aplicá-lo a todos os leads ou apenas a este.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleAddFieldConfirm(false)}>Somente este lead</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAddFieldConfirm(true)}>Todos os leads</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// ── Inline Editable Field — Linear style ──
function InlineField({
  field, value, saved, onSave, onDelete, onDirty, onClean,
}: {
  field: FieldDef;
  value: string;
  saved: boolean;
  onSave: (val: string) => void;
  onDelete: () => void;
  onDirty?: (val: string) => void;
  onClean?: (fieldId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const handleBlur = () => {
    setEditing(false);
    if (draft !== value) {
      // For immediate-save types, save directly; for text types, mark dirty
      if (field.field_type === "checkbox" || field.field_type === "select") {
        onSave(draft);
        onClean?.(field.id);
      } else {
        onDirty?.(draft);
      }
    } else {
      onClean?.(field.id);
    }
  };

  const handleImmediateSave = (val: string) => {
    setDraft(val);
    onSave(val);
    onClean?.(field.id);
    setEditing(false);
  };

  const renderInput = () => {
    switch (field.field_type) {
      case "long_text":
        return (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleBlur}
            rows={3}
            autoFocus
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/80 outline-none resize-none transition"
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/80 outline-none transition"
          />
        );
      case "checkbox":
        return (
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={draft === "true"}
              onChange={e => handleImmediateSave(e.target.checked ? "true" : "false")}
              className="h-3.5 w-3.5 rounded border-white/20 accent-primary"
            />
            <span className="text-sm text-white/70">{draft === "true" ? "Sim" : "Não"}</span>
          </label>
        );
      case "select":
        return (
          <select
            value={draft}
            onChange={e => handleImmediateSave(e.target.value)}
            autoFocus
            onBlur={() => setEditing(false)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/80 outline-none transition"
          >
            <option value="">Selecione...</option>
            {(field.options || []).map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default: {
        const typeMap: Record<string, string> = {
          number: "number", url: "url", email: "email", phone: "tel",
        };
        return (
          <input
            type={typeMap[field.field_type] || "text"}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={e => e.key === "Enter" && handleBlur()}
            autoFocus
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/80 outline-none transition"
          />
        );
      }
    }
  };

  const displayValue = () => {
    if (field.field_type === "checkbox") {
      return value === "true"
        ? <span className="text-emerald-400 text-sm">✓ Sim</span>
        : <span className="text-white/30 text-sm">✗ Não</span>;
    }
    if (field.field_type === "date" && value) {
      const parts = value.split("-");
      if (parts.length === 3) return <span className="text-sm text-white/80">{`${parts[2]}/${parts[1]}/${parts[0]}`}</span>;
      return <span className="text-sm text-white/80">{value}</span>;
    }
    if (field.field_type === "select" && value) {
      return (
        <span className="inline-flex items-center rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-xs text-white/70">
          {value}
        </span>
      );
    }
    if (!value) return <span className="text-white/20 text-sm italic">Vazio</span>;
    return <span className="text-sm text-white/80">{value}</span>;
  };

  return (
    <div className="group border-b border-white/[0.04] py-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
          {field.field_name}
        </span>
        <div className="flex items-center gap-1">
          {saved && (
            <span className="text-[10px] text-emerald-400 font-medium animate-fade-check">Salvo ✓</span>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} className="text-[10px] text-red-400 font-medium hover:underline">
                Confirmar
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-white/30 hover:underline">
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/5 text-white/20 hover:text-red-400 transition"
              title="Excluir campo"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        renderInput()
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-pointer min-h-[24px] rounded px-1 -mx-1 hover:bg-white/[0.03] transition"
        >
          {displayValue()}
        </div>
      )}
    </div>
  );
}
