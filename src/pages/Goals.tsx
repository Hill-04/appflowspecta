import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Target, Plus, Pencil, Trash2, X, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import IPPWidget, { useGoalsData, Goal, PRESET_COLORS, METRIC_LABELS, isGoalActiveToday, formatProgress, calculateGoalPct } from "@/components/dashboard/IPPWidget";

const METRIC_OPTIONS = [
  { value: "leads_created", label: "Leads criados" },
  { value: "leads_advanced", label: "Leads avançados no funil" },
  { value: "leads_in_stage", label: "Leads em etapa específica" },
  { value: "leads_converted", label: "Leads convertidos" },
  { value: "revenue", label: "Faturamento (R$)" },
  { value: "conversion_rate", label: "Taxa de conversão (%)" },
  { value: "effort", label: "Esforço (mensagens/ações)" },
  { value: "cycle_time", label: "Tempo de ciclo (dias)" },
  { value: "manual", label: "Meta manual" },
];

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Diária" },
  { value: "weekdays", label: "Dias úteis (seg-sex)" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "deadline", label: "Até data específica" },
  { value: "custom", label: "Personalizada" },
];

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Diária",
  weekdays: "Dias úteis",
  weekly: "Semanal",
  monthly: "Mensal",
  deadline: "Até data",
  custom: "Personalizada",
};

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Campaign { id: string; name: string; }
interface FunnelStage { id: string; step_name: string; step_order: number; }

// ── Helpers for target label/display ───────────────────────
function getTargetLabel(metric: string): string {
  if (metric === "revenue") return "Meta de faturamento (R$)";
  if (metric === "conversion_rate") return "Taxa alvo (%)";
  if (metric === "cycle_time") return "Máximo de dias para converter";
  return "Meta diária *";
}

function formatTargetDisplay(goal: Goal): string {
  if (goal.metric === "revenue") return `R$ ${goal.target.toLocaleString("pt-BR")}`;
  if (goal.metric === "conversion_rate") return `${goal.target}%`;
  if (goal.metric === "cycle_time") return `≤ ${goal.target} dias`;
  if (goal.metric === "effort") return `${goal.target} ações`;
  return `${goal.target}`;
}

// ── Goal Form Modal ────────────────────────────────────────
function GoalFormModal({
  open, onOpenChange, editGoal, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editGoal?: Goal | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("manual");
  const [campaignId, setCampaignId] = useState<string>("");
  const [funnelStageId, setFunnelStageId] = useState<string>("");
  const [target, setTarget] = useState(10);
  const [recurrence, setRecurrence] = useState("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deadline, setDeadline] = useState("");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);

  // Load campaigns
  useEffect(() => {
    if (!user || !open) return;
    supabase.from("campaigns").select("id, name").eq("user_id", user.id).order("name").then(({ data }) => {
      setCampaigns(data || []);
    });
  }, [user, open]);

  // Load funnel stages when campaign changes
  useEffect(() => {
    if (!campaignId || metric !== "leads_in_stage") { setStages([]); return; }
    supabase.from("message_steps").select("id, step_name, step_order").eq("campaign_id", campaignId).order("step_order").then(({ data }) => {
      setStages(data || []);
    });
  }, [campaignId, metric]);

  // Populate form for edit
  useEffect(() => {
    if (open && editGoal) {
      setName(editGoal.name);
      setDescription(editGoal.description || "");
      setMetric(editGoal.metric === "custom" ? "manual" : editGoal.metric);
      setCampaignId(editGoal.campaign_id || "");
      setFunnelStageId(editGoal.funnel_stage_id || "");
      setTarget(editGoal.target);
      setRecurrence(editGoal.recurrence || "daily");
      setCustomDays(editGoal.custom_days || []);
      setColor(editGoal.color || PRESET_COLORS[0]);
      setDeadline(editGoal.deadline || "");
    } else if (open) {
      setName(""); setDescription(""); setMetric("manual"); setCampaignId("");
      setFunnelStageId(""); setTarget(10); setRecurrence("daily"); setCustomDays([]);
      setColor(PRESET_COLORS[0]); setDeadline("");
    }
  }, [open, editGoal]);

  const toggleDay = (d: number) => {
    setCustomDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) { toast.error("Preencha o nome da meta"); return; }
    if (target < 1) { toast.error("A meta deve ser pelo menos 1"); return; }
    if (metric === "effort" && !description.trim()) {
      toast.error("Para metas de esforço, descreva o que será contado");
      return;
    }
    if (recurrence === "deadline" && !deadline) {
      toast.error("Selecione uma data limite");
      return;
    }
    setSaving(true);

    const payload: any = {
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      target,
      metric,
      campaign_id: campaignId || null,
      funnel_stage_id: metric === "leads_in_stage" ? (funnelStageId || null) : null,
      color,
      recurrence,
      custom_days: recurrence === "custom" ? customDays : [],
      deadline: recurrence === "deadline" ? deadline : null,
    };

    let error;
    if (editGoal) {
      ({ error } = await supabase.from("prospecting_goals").update(payload).eq("id", editGoal.id));
    } else {
      ({ error } = await supabase.from("prospecting_goals").insert(payload));
    }

    setSaving(false);
    if (error) { toast.error("Erro ao salvar meta"); return; }
    toast.success(editGoal ? "Meta atualizada!" : "Meta criada!");
    onOpenChange(false);
    onSaved();
  };

  const isEffort = metric === "effort";
  const isRevenue = metric === "revenue";
  const isConversionRate = metric === "conversion_rate";
  const isCycleTime = metric === "cycle_time";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="text-foreground">{editGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome da meta *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Prospectar novos leads" className="mt-1" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {isEffort ? "Descrição (obrigatória) *" : "Descrição (opcional)"}
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isEffort ? "O que você vai contar? (ex: mensagens enviadas)" : "Adicionar leads frescos à lista todos os dias"}
              className="mt-1 min-h-[60px]"
            />
          </div>

          {/* Metric type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo de meta *</label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Campanha (opcional)</label>
            <Select value={campaignId || "__all__"} onValueChange={v => setCampaignId(v === "__all__" ? "" : v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas as campanhas</SelectItem>
                {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Funnel stage (conditional) */}
          {metric === "leads_in_stage" && campaignId && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Etapa do funil</label>
              <Select value={funnelStageId || "__none__"} onValueChange={v => setFunnelStageId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione uma etapa</SelectItem>
                  {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.step_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Target — conditional label + affixes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">{getTargetLabel(metric)}</label>
            <div className="flex items-center gap-2 mt-1">
              {isRevenue && <span className="text-sm text-muted-foreground font-medium">R$</span>}
              <Input
                type="number"
                min={1}
                max={isConversionRate ? 100 : undefined}
                value={target}
                onChange={e => setTarget(parseInt(e.target.value) || 1)}
                className="w-32"
              />
              {isConversionRate && <span className="text-sm text-muted-foreground font-medium">%</span>}
              {isCycleTime && <span className="text-sm text-muted-foreground font-medium">dias</span>}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Recorrência *</label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline date picker (conditional) */}
          {recurrence === "deadline" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Data limite *</label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-1 w-48"
              />
            </div>
          )}

          {/* Custom days */}
          {recurrence === "custom" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Dias da semana</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${customDays.includes(i) ? "bg-primary text-primary-foreground" : "bg-white/[0.04] border border-white/[0.08] text-muted-foreground hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Cor</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-white/40 scale-110" : "opacity-60 hover:opacity-100"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
          <button onClick={() => onOpenChange(false)} className="flex-1 rounded-lg border border-white/[0.08] px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg gradient-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Meta"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Goals Page ─────────────────────────────────────────────
export default function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { goals, todayGoals, progressMap, ipp, fetchData } = useGoalsData();
  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("campaigns").select("id, name").eq("user_id", user.id).then(({ data }) => {
      setCampaigns(data || []);
    });
  }, [user]);

  const handleEdit = (goal: Goal) => {
    setEditGoal(goal);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditGoal(null);
    setFormOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    await supabase.from("prospecting_goals").delete().eq("id", goalId);
    toast.success("Meta excluída");
    fetchData();
  };

  const handleToggle = async (goal: Goal) => {
    await supabase.from("prospecting_goals").update({ is_active: !goal.is_active }).eq("id", goal.id);
    fetchData();
  };

  const handleToggleFeatured = async (goal: Goal) => {
    if (!goal.is_featured) {
      const featuredCount = goals.filter(g => g.is_featured).length;
      if (featuredCount >= 3) {
        toast.error("Máximo de 3 metas em destaque. Remova uma antes de adicionar.");
        return;
      }
    }
    await supabase.from("prospecting_goals")
      .update({ is_featured: !goal.is_featured })
      .eq("id", goal.id);
    fetchData();
  };

  const getCampaignName = (id?: string | null) => {
    if (!id) return "Todas as campanhas";
    return campaigns.find(c => c.id === id)?.name || "—";
  };

  // Sort: featured first
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Metas de Prospecção</h1>
          <p className="text-sm text-muted-foreground mt-1">Defina, acompanhe e supere seus objetivos diários</p>
        </div>
        <button onClick={handleNew} className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 glow-primary w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Nova Meta
        </button>
      </div>

      {/* IPP Widget */}
      <IPPWidget onOpenGoals={handleNew} />

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Target className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Nenhuma meta configurada</p>
          <p className="text-xs text-muted-foreground mb-4">Crie sua primeira meta para começar a acompanhar sua performance</p>
          <button onClick={handleNew} className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
            <Plus className="h-4 w-4 inline mr-1.5" />Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedGoals.map(goal => {
            const isToday = isGoalActiveToday(goal);
            const progress = progressMap[goal.id] || 0;
            const pct = calculateGoalPct(goal, progress);

            return (
              <div key={goal.id} className={`glass-card p-4 transition-all ${!goal.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  {/* Color dot */}
                  <div className="w-3 h-3 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: goal.color }} />

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{goal.name}</h3>
                        {goal.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{goal.description}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleFeatured(goal)}
                          className="p-1.5 rounded-md hover:bg-white/[0.06] transition"
                          title={goal.is_featured ? "Remover destaque" : "Destacar meta"}
                        >
                          <Star
                            className="h-3.5 w-3.5"
                            fill={goal.is_featured ? "#f59e0b" : "none"}
                            stroke={goal.is_featured ? "#f59e0b" : "currentColor"}
                            strokeWidth={goal.is_featured ? 0 : 2}
                          />
                        </button>
                        <Switch checked={goal.is_active} onCheckedChange={() => handleToggle(goal)} className="scale-75" />
                        <button onClick={() => handleEdit(goal)} className="p-1.5 rounded-md hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {METRIC_LABELS[goal.metric] || goal.metric}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 text-[10px] text-muted-foreground">
                        {getCampaignName(goal.campaign_id)}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 text-[10px] text-muted-foreground">
                        {RECURRENCE_LABELS[goal.recurrence] || goal.recurrence}
                        {goal.recurrence === "deadline" && goal.deadline && ` (${new Date(goal.deadline + "T12:00:00").toLocaleDateString("pt-BR")})`}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        Meta: {formatTargetDisplay(goal)}
                      </span>
                    </div>

                    {/* Progress bar (only if today is active) */}
                    {isToday && goal.is_active && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct >= 100 ? "#22c55e" : goal.color,
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                          {formatProgress(goal, progress)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoalFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editGoal={editGoal}
        onSaved={fetchData}
      />
    </div>
  );
}
