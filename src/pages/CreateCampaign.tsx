import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Users, MessageSquare, Tag, Plus, Trash2, Trophy, GripVertical } from "lucide-react";
import { useOrionTour } from "@/components/orion/OrionTourProvider";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { useDraftStore, FunnelStepDraft } from "@/hooks/useDraftStore";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Step = 1 | 2 | 3;

let keyCounter = 100;
const nextKey = () => `fs-${++keyCounter}`;

const emptyAudienceForm = { name: "", description: "", segment: "", criteria: "" };

function SortableFunnelStep({
  fStep, index, total, onRename, onToggleConversion, onRemove,
}: {
  fStep: FunnelStepDraft; index: number; total: number;
  onRename: (val: string) => void; onToggleConversion: () => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: fStep._key });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="glass-card p-4">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-primary-foreground text-xs font-bold shrink-0">{index + 1}</div>
        <input type="text" value={fStep.name} onChange={(e) => onRename(e.target.value)} className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none border-b border-transparent focus:border-primary transition" placeholder="Nome da etapa" />
        <button onClick={onToggleConversion} title={fStep.isConversion ? "Etapa de conversão" : "Marcar como conversão"} className={`p-1.5 rounded-md transition ${fStep.isConversion ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
          <Trophy className="h-4 w-4" />
        </button>
        {total > 1 && (
          <button onClick={onRemove} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {fStep.isConversion && (
        <p className="text-xs text-primary mt-2 pl-14 flex items-center gap-1">
          <Trophy className="h-3 w-3" /> Leads movidos para esta etapa serão contabilizados como conversão da campanha.
        </p>
      )}
    </div>
  );
}

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { audiences, addAudience, addCampaign } = useStore();
  const tour = useOrionTour();
  const _subscription = useSubscription();
  const { campaignDraft: draft, setCampaignDraft: setDraft, clearCampaignDraft } = useDraftStore();

  const step = draft.step;
  const selectedAudience = draft.selectedAudience;
  const campaignName = draft.campaignName;
  const funnelSteps = draft.funnelSteps;

  const setStep = (s: Step) => setDraft((prev) => ({ ...prev, step: s }));
  const setSelectedAudience = (a: string) => setDraft((prev) => ({ ...prev, selectedAudience: a }));
  const setCampaignName = (n: string) => setDraft((prev) => ({ ...prev, campaignName: n }));
  const setFunnelSteps = (fn: FunnelStepDraft[] | ((prev: FunnelStepDraft[]) => FunnelStepDraft[])) => {
    if (typeof fn === "function") {
      setDraft((prev) => ({ ...prev, funnelSteps: fn(prev.funnelSteps) }));
    } else {
      setDraft((prev) => ({ ...prev, funnelSteps: fn }));
    }
  };

  const [audienceDialogOpen, setAudienceDialogOpen] = useState(false);
  const [audienceForm, setAudienceForm] = useState(emptyAudienceForm);

  const handleCreateAudience = async () => {
    if (!audienceForm.name.trim()) return;
    const criteria = audienceForm.criteria.split(",").map((c) => c.trim()).filter(Boolean);
    await addAudience({ name: audienceForm.name, description: audienceForm.description, segment: audienceForm.segment, criteria });
    toast.success("Público criado!");
    setAudienceDialogOpen(false);
    setAudienceForm(emptyAudienceForm);
    setTimeout(() => {
      const newest = audiences[audiences.length - 1];
      if (newest) setSelectedAudience(newest.id);
    }, 500);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFunnelSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s._key === active.id);
      const newIndex = prev.findIndex((s) => s._key === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleToggleConversion = (idx: number) => {
    setFunnelSteps((prev) => prev.map((s, i) => ({ ...s, isConversion: i === idx ? !s.isConversion : false })));
  };

  const handleRemove = (idx: number) => {
    setFunnelSteps((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length > 0 && !updated.some((s) => s.isConversion)) {
        updated[updated.length - 1].isConversion = true;
      }
      return updated;
    });
  };

  const steps = [
    { num: 1, label: "Público", icon: Users },
    { num: 2, label: "Funil", icon: MessageSquare },
    { num: 3, label: "Nome", icon: Tag },
  ];

  const canProceed = () => {
    if (step === 1) return !!selectedAudience;
    if (step === 2) return funnelSteps.length > 0 && funnelSteps.every((s) => s.name.trim()) && funnelSteps.some((s) => s.isConversion);
    if (step === 3) return !!campaignName;
    return false;
  };

  const handleCreate = async () => {
    let finalSteps = [...funnelSteps];
    if (!finalSteps.some((s) => s.isConversion) && finalSteps.length > 0) {
      finalSteps[finalSteps.length - 1].isConversion = true;
    }
    const id = await addCampaign({
      name: campaignName,
      audienceId: selectedAudience || null,
      funnelSteps: finalSteps.map((s) => ({ name: s.name, isConversion: s.isConversion })),
    });
    if (id) {
      toast.success(`Campanha "${campaignName}" criada com sucesso!`);
      clearCampaignDraft();
      if (tour?.tourActive && tour.stepIndex === 4) tour.advanceTour();
      navigate(`/app/campaigns/${id}`);
    } else {
      toast.error("Erro ao criar campanha");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <button onClick={() => navigate("/app")} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-secondary transition shrink-0 mt-0.5">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Nova Campanha</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Configure sua campanha de prospecção</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <div className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-all flex-1 ${
              step === s.num ? "bg-primary/10 text-primary border border-primary/20"
                : step > s.num ? "bg-success/10 text-success border border-success/20"
                : "bg-secondary text-muted-foreground border border-border"
            }`}>
              <s.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-px w-2 sm:w-4 shrink-0 ${step > s.num ? "bg-success" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="animate-fade-in">
        {step === 1 && (
          <div className="space-y-4" data-orion-target="audience-section">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Selecione o público-alvo</h2>
              <button onClick={() => { setAudienceForm(emptyAudienceForm); setAudienceDialogOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition">
                <Plus className="h-3.5 w-3.5" /> Novo Público
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {audiences.map((audience) => (
                <div key={audience.id} onClick={() => setSelectedAudience(audience.id)} className={`glass-card p-4 cursor-pointer transition-all ${selectedAudience === audience.id ? "border-primary glow-primary-sm" : "hover:border-primary/30"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{audience.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{audience.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {audience.criteria.map((c, i) => (
                          <span key={i} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{c}</span>
                        ))}
                      </div>
                    </div>
                    {selectedAudience === audience.id && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {audiences.length === 0 && (
                <div className="glass-card p-6 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum público criado ainda</p>
                  <button onClick={() => { setAudienceForm(emptyAudienceForm); setAudienceDialogOpen(true); }} className="mt-3 inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition">
                    <Plus className="h-3.5 w-3.5" /> Criar Primeiro Público
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4" data-orion-target="funnel-section">
            <h2 className="text-lg font-semibold text-foreground">Monte o funil de mensagens</h2>
            <p className="text-sm text-muted-foreground">Arraste para reordenar. Marque 🏆 para definir a etapa de conversão.</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={funnelSteps.map((s) => s._key)} strategy={verticalListSortingStrategy}>
                {funnelSteps.map((fStep, i) => (
                  <SortableFunnelStep key={fStep._key} fStep={fStep} index={i} total={funnelSteps.length}
                    onRename={(val) => setFunnelSteps((prev) => prev.map((s, j) => (j === i ? { ...s, name: val } : s)))}
                    onToggleConversion={() => handleToggleConversion(i)}
                    onRemove={() => handleRemove(i)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button onClick={() => setFunnelSteps([...funnelSteps, { _key: nextKey(), name: "", isConversion: false }])} className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition">
              <Plus className="inline h-4 w-4 mr-1" /> Adicionar etapa
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4" data-orion-target="campaign-name">
            <h2 className="text-lg font-semibold text-foreground">Nomeie sua campanha</h2>
            <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Ex: Prospecção CEOs SaaS Q1 2026" maxLength={150} className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button onClick={() => step > 1 && setStep((step - 1) as Step)} disabled={step === 1} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        {step < 3 ? (
          <button
            onClick={() => {
              if (canProceed()) {
                const nextStep = (step + 1) as Step;
                setStep(nextStep);
                if (tour?.tourActive) {
                  if (step === 1 && tour.stepIndex === 2) tour.advanceTour();
                  else if (step === 2 && tour.stepIndex === 3) tour.advanceTour();
                }
              }
            }}
            disabled={!canProceed()}
            className={`inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-30 transition hover:opacity-90 ${
              tour?.tourActive && canProceed() && ((step === 1 && tour.stepIndex === 2) || (step === 2 && tour.stepIndex === 3))
                ? "relative z-[201] orion-ripple shadow-[0_0_30px_-2px_hsl(var(--primary)/0.7)] ring-2 ring-primary/50" : ""
            }`}
          >
            Próximo <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleCreate} disabled={!canProceed()}
            className={`inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-30 transition glow-primary hover:opacity-90 ${
              tour?.tourActive && canProceed() && tour.stepIndex === 4
                ? "relative z-[201] orion-ripple shadow-[0_0_30px_-2px_hsl(var(--primary)/0.7)] ring-2 ring-primary/50" : ""
            }`}
          >
            <Check className="h-4 w-4" /> Criar Campanha
          </button>
        )}
      </div>

      <Dialog open={audienceDialogOpen} onOpenChange={setAudienceDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Novo Público</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <input placeholder="Nome" value={audienceForm.name} onChange={(e) => setAudienceForm({ ...audienceForm, name: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            <textarea placeholder="Descrição" value={audienceForm.description} onChange={(e) => setAudienceForm({ ...audienceForm, description: e.target.value })} rows={2} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
            <input placeholder="Segmento" value={audienceForm.segment} onChange={(e) => setAudienceForm({ ...audienceForm, segment: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            <input placeholder="Critérios (separados por vírgula)" value={audienceForm.criteria} onChange={(e) => setAudienceForm({ ...audienceForm, criteria: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <DialogFooter>
            <button onClick={() => setAudienceDialogOpen(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancelar</button>
            <button onClick={handleCreateAudience} disabled={!audienceForm.name.trim()} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">Criar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
