import { useState, useMemo } from "react";
import { X, ChevronRight, MessageSquare, Copy, StickyNote, Plus, Trash2, Bell, Pin, CalendarPlus, Calendar, Zap, Edit2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Campaign, CampaignLeadFull, LeadTemplate, useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScheduleEventDialog } from "./ScheduleEventDialog";
import { LeadEventsTab } from "./LeadEventsTab";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  clf: CampaignLeadFull | null;
  campaign: Campaign;
  template: LeadTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotesChanged?: () => void;
}

export function LeadSidePanel({ clf, campaign, template, open, onOpenChange, onNotesChanged }: Props) {
  const { updateLead, updateCampaignLeadStatus, addInteraction, refreshCampaigns, deleteLead, unlinkLeadFromCampaign } = useStore();
  const { createEvent } = useGoogleCalendar();
  const showGoogleCalendar = useFeatureFlag("FEATURE_GOOGLE_CALENDAR");
  const [notes, setNotes] = useState<{ id: string; content: string; created_at: string }[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeSection, setActiveSection] = useState<"fields" | "history" | "notes" | "agenda">("fields");
  const [pinnedDraft, setPinnedDraft] = useState("");
  const [reminderDraft, setReminderDraft] = useState("");
  const [editingPinned, setEditingPinned] = useState(false);
  const [editingReminder, setEditingReminder] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDefaults, setScheduleDefaults] = useState<any>(undefined);
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0);

  // Load notes when panel opens
  useMemo(() => {
    if (clf && open) {
      setLoadingNotes(true);
      setPinnedDraft(clf.campaignLead.pinnedNote || "");
      setReminderDraft(clf.campaignLead.reminderAt ? clf.campaignLead.reminderAt.slice(0, 16) : "");
      setEditingPinned(false);
      setEditingReminder(false);
      supabase
        .from("campaign_lead_notes")
        .select("*")
        .eq("campaign_id", campaign.id)
        .eq("lead_id", clf.lead.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setNotes((data as any[]) || []);
          setLoadingNotes(false);
        });
    }
  }, [clf?.lead.id, open]);

  if (!clf) return null;

  const currentStepIndex = clf.campaignLead.stepIndex;
  const currentStep = campaign.funnel.find((_, i) => i === currentStepIndex);
  const canAdvance = currentStepIndex < campaign.funnel.length - 1;

  const handleAdvanceStep = async () => {
    if (!canAdvance) return;
    await updateCampaignLeadStatus(clf.campaignLead.id, { step_index: currentStepIndex + 1 });
    toast.success("Lead avançado para próxima etapa");
  };

  const handleFieldBlur = async (fieldId: string, value: any) => {
    const newCustomData = { ...clf.lead.customData, [fieldId]: value };
    await updateLead(clf.lead.id, { customData: newCustomData });
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await supabase.from("campaign_lead_notes").insert({
      campaign_id: campaign.id,
      lead_id: clf.lead.id,
      content: newNote.trim(),
    });
    setNewNote("");
    const { data } = await supabase
      .from("campaign_lead_notes")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("lead_id", clf.lead.id)
      .order("created_at", { ascending: false });
    setNotes((data as any[]) || []);
    onNotesChanged?.();
  };

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from("campaign_lead_notes").delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    onNotesChanged?.();
  };

  const handleRegisterInteraction = async () => {
    await addInteraction(clf.lead.id, "contacted");
    await refreshCampaigns();
    toast.success("Interação registrada");
  };

  const handleUseScript = async (scriptContent: string, scriptName: string) => {
    await navigator.clipboard.writeText(scriptContent);
    await addInteraction(clf.lead.id, `script_used:${scriptName}`);
    await refreshCampaigns();
    toast.success("Script copiado e registrado");
  };

  const handleSavePinnedNote = async () => {
    await updateCampaignLeadStatus(clf.campaignLead.id, { pinned_note: pinnedDraft.trim() || null });
    setEditingPinned(false);
    toast.success("Nota fixada atualizada");
  };

  const handleSaveReminder = async () => {
    const value = reminderDraft ? new Date(reminderDraft).toISOString() : null;
    await updateCampaignLeadStatus(clf.campaignLead.id, { reminder_at: value });
    setEditingReminder(false);
    toast.success(value ? "Lembrete agendado" : "Lembrete removido");
  };

  const handleClearReminder = async () => {
    setReminderDraft("");
    await updateCampaignLeadStatus(clf.campaignLead.id, { reminder_at: null });
    setEditingReminder(false);
    toast.success("Lembrete removido");
  };

  const handleDeleteLead = async () => {
    await deleteLead(clf.lead.id);
    onOpenChange(false);
    toast.success("Lead excluído globalmente");
  };

  const handleUnlinkLead = async () => {
    await unlinkLeadFromCampaign(clf.lead.id, campaign.id);
    onOpenChange(false);
    toast.success("Lead desvinculado da campanha");
  };

  // Quick actions
  const handleQuickFollowup = async () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    date.setHours(10, 0, 0, 0);
    await createEvent({
      lead_id: clf.lead.id,
      campaign_id: campaign.id,
      type: "followup",
      title: `Follow-up: ${clf.lead.name}`,
      start_datetime: date.toISOString(),
      duration_minutes: 15,
      priority: "medium",
      source: "quick_action",
    });
    setEventsRefreshKey((k) => k + 1);
  };

  const handleQuickMeeting = async () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);
    await createEvent({
      lead_id: clf.lead.id,
      campaign_id: campaign.id,
      type: "meeting",
      title: `Reunião: ${clf.lead.name}`,
      start_datetime: date.toISOString(),
      duration_minutes: 30,
      priority: "medium",
      source: "quick_action",
    });
    setEventsRefreshKey((k) => k + 1);
  };

  const handleQuickTask = async () => {
    const date = new Date();
    date.setHours(18, 0, 0, 0);
    await createEvent({
      lead_id: clf.lead.id,
      campaign_id: campaign.id,
      type: "task",
      title: `Tarefa: ${clf.lead.name}`,
      start_datetime: date.toISOString(),
      duration_minutes: 15,
      priority: "medium",
      source: "quick_action",
    });
    setEventsRefreshKey((k) => k + 1);
  };

  // Interactions for this lead
  const leadInteractions = campaign.interactions
    .filter((i) => i.lead_id === clf.lead.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const sections = [
    { key: "fields" as const, label: "Campos" },
    { key: "history" as const, label: "Histórico" },
    { key: "notes" as const, label: "Notas" },
    ...(showGoogleCalendar ? [{ key: "agenda" as const, label: "Agenda" }] : []),
  ];

  const reminderDate = clf.campaignLead.reminderAt ? new Date(clf.campaignLead.reminderAt) : null;
  const isReminderDue = reminderDate ? reminderDate.getTime() <= Date.now() : false;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="bg-background border-border w-full sm:max-w-md overflow-y-auto p-0">
          {/* Header with gradient accent */}
          <div className="px-5 pt-5 pb-4 border-b border-border/50">
            <SheetHeader className="p-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                  {clf.lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-foreground text-lg leading-tight">{clf.lead.name}</SheetTitle>
                  {clf.lead.company && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{clf.lead.company}{clf.lead.role ? ` · ${clf.lead.role}` : ""}</p>
                  )}
                </div>
                {/* Lead actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleUnlinkLead}
                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                    title="Desvincular da campanha"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                        title="Excluir lead (global)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lead permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso removerá {clf.lead.name} de todas as campanhas, notas, interações e eventos. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Excluir permanentemente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </SheetHeader>

            {/* Current step badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">
                {currentStep?.name || `Etapa ${currentStepIndex + 1}`}
              </span>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Reminder section */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isReminderDue ? "bg-destructive/15" : "bg-secondary"}`}>
                    <Bell className={`h-3.5 w-3.5 ${isReminderDue ? "text-destructive" : "text-muted-foreground"}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">Lembrete</span>
                </div>
                {!editingReminder && (
                  <button onClick={() => setEditingReminder(true)} className="text-xs font-medium text-primary hover:text-primary/80 transition">
                    {reminderDate ? "Editar" : "Agendar"}
                  </button>
                )}
              </div>
              {editingReminder ? (
                <div className="space-y-2.5 pt-1">
                  <input type="datetime-local" value={reminderDraft} onChange={(e) => setReminderDraft(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/80 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition" />
                  <div className="flex gap-2">
                    <button onClick={handleSaveReminder} className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition">Salvar</button>
                    {reminderDate && <button onClick={handleClearReminder} className="rounded-lg px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition">Remover</button>}
                    <button onClick={() => setEditingReminder(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition">Cancelar</button>
                  </div>
                </div>
              ) : reminderDate ? (
                <p className={`text-xs pl-9 ${isReminderDue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {isReminderDue ? "⚠️ Pendente — " : ""}{reminderDate.toLocaleDateString("pt-BR")} às {reminderDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground pl-9">Nenhum lembrete agendado</p>
              )}
            </div>

            {/* Pinned note section */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Pin className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Nota fixada</span>
                </div>
                {!editingPinned && (
                  <button onClick={() => { setPinnedDraft(clf.campaignLead.pinnedNote || ""); setEditingPinned(true); }} className="text-xs font-medium text-primary hover:text-primary/80 transition">
                    {clf.campaignLead.pinnedNote ? "Editar" : "Adicionar"}
                  </button>
                )}
              </div>
              {editingPinned ? (
                <div className="space-y-2.5 pt-1">
                  <textarea value={pinnedDraft} onChange={(e) => setPinnedDraft(e.target.value)} placeholder="Ex: Ligar segunda às 14h, preferência por WhatsApp..." maxLength={300} rows={3} className="w-full rounded-lg border border-border bg-secondary/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none transition" />
                  <div className="flex gap-2">
                    <button onClick={handleSavePinnedNote} className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition">Salvar</button>
                    <button onClick={() => setEditingPinned(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition">Cancelar</button>
                  </div>
                </div>
              ) : clf.campaignLead.pinnedNote ? (
                <p className="text-sm text-foreground/90 pl-9 leading-relaxed">{clf.campaignLead.pinnedNote}</p>
              ) : (
                <p className="text-xs text-muted-foreground pl-9">Nenhuma nota fixada</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {canAdvance && (
                <button onClick={handleAdvanceStep} className="inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition glow-primary-sm">
                  <ChevronRight className="h-3.5 w-3.5" /> Avançar Etapa
                </button>
              )}
              <button onClick={handleRegisterInteraction} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition">
                <MessageSquare className="h-3.5 w-3.5" /> Registrar Interação
              </button>
              {showGoogleCalendar && (
                <button onClick={() => { setScheduleDefaults(undefined); setScheduleOpen(true); }} className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition">
                  <CalendarPlus className="h-3.5 w-3.5" /> Agendar
                </button>
              )}
            </div>

            {/* Quick actions */}
            {showGoogleCalendar && (
              <div className="flex flex-wrap gap-1.5">
                <button onClick={handleQuickFollowup} className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card/30 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition">
                  <Zap className="h-3 w-3" /> Follow-up 3 dias
                </button>
                <button onClick={handleQuickMeeting} className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card/30 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition">
                  <Zap className="h-3 w-3" /> Reunião amanhã 10h
                </button>
                <button onClick={handleQuickTask} className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card/30 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition">
                  <Zap className="h-3 w-3" /> Tarefa hoje
                </button>
              </div>
            )}
          </div>

          {/* Section tabs */}
          <div className="flex px-5 border-b border-border/50">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeSection === s.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="px-5 py-4 space-y-4">
            {activeSection === "fields" && (
              <div className="space-y-1">
                <EditableField label="Nome" value={clf.lead.name} onSave={(v) => updateLead(clf.lead.id, { name: v })} />
                <EditableField label="Empresa" value={clf.lead.company} onSave={(v) => updateLead(clf.lead.id, { company: v })} />
                <EditableField label="Cargo" value={clf.lead.role} onSave={(v) => updateLead(clf.lead.id, { role: v })} />
                <EditableField label="Telefone" value={clf.lead.phone} onSave={(v) => updateLead(clf.lead.id, { phone: v })} />
                <EditableField label="E-mail" value={clf.lead.email} onSave={(v) => updateLead(clf.lead.id, { email: v })} />

                {template?.fields
                  .filter((f) => !f.is_primary)
                  .map((field) => (
                    <EditableField
                      key={field.id}
                      label={field.label}
                      value={String(clf.lead.customData?.[field.id] ?? "")}
                      onSave={(v) => handleFieldBlur(field.id, v)}
                    />
                  ))}
              </div>
            )}

            {activeSection === "history" && (
              <div className="space-y-2">
                {leadInteractions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem interações registradas</p>
                ) : (
                  leadInteractions.map((i) => (
                    <div key={i.id} className="flex items-center justify-between rounded-lg bg-card/50 border border-border/50 px-3 py-2">
                      <span className="text-sm text-foreground">{i.outcome}</span>
                      <span className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeSection === "notes" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar nota..."
                    className="flex-1 rounded-lg border border-border bg-secondary/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  />
                  <button onClick={handleAddNote} disabled={!newNote.trim()} className="rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {loadingNotes ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem notas</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="flex items-start justify-between gap-2 rounded-lg bg-card/50 border border-border/50 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{n.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <button onClick={() => handleDeleteNote(n.id)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeSection === "agenda" && showGoogleCalendar && (
              <LeadEventsTab
                leadId={clf.lead.id}
                campaignId={campaign.id}
                refreshKey={eventsRefreshKey}
              />
            )}

            {/* Scripts section */}
            {activeSection === "fields" && campaign.scriptSetId && (
              <ScriptsForStep
                campaign={campaign}
                stepIndex={currentStepIndex}
                onUseScript={handleUseScript}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {showGoogleCalendar && clf && (
        <ScheduleEventDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          leadId={clf.lead.id}
          campaignId={campaign.id}
          defaults={scheduleDefaults}
          onCreated={() => setEventsRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}

function EditableField({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleSave = () => {
    if (localValue !== value) onSave(localValue);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
        <input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
          className="flex-1 bg-transparent text-sm text-foreground border-b border-primary outline-none"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 group cursor-pointer" onClick={() => { setLocalValue(value); setEditing(true); }}>
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="flex-1 text-sm text-foreground">{value || "—"}</span>
      <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
    </div>
  );
}

function ScriptsForStep({ campaign, stepIndex, onUseScript }: { campaign: Campaign; stepIndex: number; onUseScript: (content: string, name: string) => void }) {
  const step = campaign.funnel[stepIndex];
  if (!step?.variations?.length) return null;
  const filledVariations = step.variations.filter((v) => v.content.trim());
  if (filledVariations.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scripts da etapa</h4>
      {filledVariations.map((v) => (
        <div key={v.id} className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">{v.label}</span>
            <button
              onClick={() => onUseScript(v.content, `${step.name} - ${v.label}`)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition"
            >
              <Copy className="h-3 w-3" /> Usar
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{v.content}</p>
        </div>
      ))}
    </div>
  );
}
