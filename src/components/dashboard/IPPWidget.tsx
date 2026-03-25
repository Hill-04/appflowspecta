import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { Settings2, Plus, Minus, Target, Check, ChevronDown } from "lucide-react";
import { ConfettiEffect } from "@/components/campaign/ConfettiEffect";

// ── Types ──────────────────────────────────────────────────
export interface Goal {
  id: string;
  name: string;
  description?: string | null;
  target: number;
  metric: string;
  color: string;
  is_active: boolean;
  campaign_id?: string | null;
  funnel_stage_id?: string | null;
  recurrence: string;
  custom_days: number[];
  created_at?: string;
  deadline?: string | null;
  is_featured?: boolean;
}

export interface GoalProgress {
  goal_id: string;
  current_value: number;
}

export const PRESET_COLORS = ["#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

export const METRIC_LABELS: Record<string, string> = {
  manual: "Manual",
  custom: "Manual",
  leads_created: "Leads criados",
  leads_advanced: "Leads avançados",
  leads_converted: "Leads convertidos",
  leads_in_stage: "Leads em etapa",
  revenue: "Faturamento",
  conversion_rate: "Taxa de conversão",
  effort: "Esforço",
  cycle_time: "Tempo de ciclo",
};

// ── Helpers ────────────────────────────────────────────────
export function formatProgress(goal: Goal, progress: number): string {
  if (goal.metric === "revenue") {
    return `R$ ${progress.toLocaleString("pt-BR")} / R$ ${goal.target.toLocaleString("pt-BR")}`;
  }
  if (goal.metric === "conversion_rate") {
    return `${progress}% / ${goal.target}%`;
  }
  if (goal.metric === "cycle_time") {
    return `Média: ${progress}d / ≤${goal.target}d`;
  }
  if (goal.metric === "effort") {
    return `${progress} / ${goal.target} ações`;
  }
  return `${progress} / ${goal.target}`;
}

export function calculateGoalPct(goal: Goal, progress: number): number {
  if (goal.metric === "cycle_time") {
    if (progress <= 0) return 100;
    if (progress <= goal.target) return 100;
    return Math.min((goal.target / progress) * 100, 100);
  }
  return Math.min((progress / goal.target) * 100, 100);
}

export function isGoalActiveToday(goal: Goal): boolean {
  if (!goal.is_active) return false;
  const day = new Date().getDay();
  if (goal.recurrence === "daily") return true;
  if (goal.recurrence === "weekdays") return day >= 1 && day <= 5;
  if (goal.recurrence === "weekly") {
    const createdDay = goal.created_at ? new Date(goal.created_at).getDay() : 1;
    return day === createdDay;
  }
  if (goal.recurrence === "custom") return (goal.custom_days || []).includes(day);
  if (goal.recurrence === "monthly") return true;
  if (goal.recurrence === "deadline") {
    if (!goal.deadline) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return goal.deadline >= todayStr;
  }
  return true;
}

function isManualMetric(metric: string): boolean {
  return ["custom", "manual", "effort"].includes(metric);
}

// ── Circular Score SVG ─────────────────────────────────────
function CircularScore({ value, animated }: { value: number; animated: boolean }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * (animated ? value : 0)) / 100;
  const color = value <= 40 ? "#ef4444" : value <= 70 ? "#f59e0b" : "#22c55e";

  return (
    <div className="relative flex-shrink-0 w-[100px] h-[100px]">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out, stroke 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
        <span className="text-[10px] text-muted-foreground font-medium tracking-wider">IPP</span>
      </div>
    </div>
  );
}

// ── Goal Progress Bar ──────────────────────────────────────
function GoalBar({
  goal, progress, animated, onIncrement, onDecrement,
}: {
  goal: Goal; progress: number; animated: boolean;
  onIncrement: () => void; onDecrement: () => void;
}) {
  const pct = calculateGoalPct(goal, progress);
  const isCycleTime = goal.metric === "cycle_time";
  const complete = isCycleTime ? (progress > 0 && progress <= goal.target) : pct >= 100;
  const showButtons = isManualMetric(goal.metric);

  const barColor = complete ? "#22c55e" : (isCycleTime && progress > goal.target) ? "#ef4444" : goal.color;

  return (
    <div className={`flex items-center gap-3 group ${complete ? "animate-pulse-once" : ""}`}>
      {showButtons && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onDecrement} className="p-1 rounded-md hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition active:scale-90">
            <Minus className="h-3 w-3" />
          </button>
          <button onClick={onIncrement} className="p-1 rounded-md hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition active:scale-90">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
      <span className="text-xs text-muted-foreground w-24 truncate shrink-0">{goal.name}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: animated ? `${pct}%` : "0%",
            backgroundColor: barColor,
          }}
        />
      </div>
      <div className="flex items-center gap-1.5 shrink-0 min-w-[72px] justify-end">
        {complete && <Check className="h-3 w-3 text-success" />}
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatProgress(goal, progress)}
        </span>
      </div>
    </div>
  );
}

// ── Auto-calculate progress for a goal ─────────────────────
async function calculateAutoProgress(goal: Goal, userId: string, today: string): Promise<number> {
  const campaignFilter = goal.campaign_id;

  if (goal.metric === "leads_created") {
    const query = supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59.999`);
    const { count } = await query;
    return count || 0;
  }

  if (goal.metric === "leads_advanced") {
    let query = supabase
      .from("campaign_leads")
      .select("*, campaigns!inner(user_id)", { count: "exact", head: true })
      .eq("campaigns.user_id", userId)
      .is("archived_at", null)
      .gt("step_index", 0)
      .gte("created_at", `${today}T00:00:00`);
    if (campaignFilter) query = query.eq("campaign_id", campaignFilter);
    const { count } = await query;
    return count || 0;
  }

  if (goal.metric === "leads_converted") {
    let query = supabase
      .from("campaign_leads")
      .select("*, campaigns!inner(user_id)", { count: "exact", head: true })
      .eq("campaigns.user_id", userId)
      .is("archived_at", null)
      .not("converted_at", "is", null)
      .gte("converted_at", `${today}T00:00:00`);
    if (campaignFilter) query = query.eq("campaign_id", campaignFilter);
    const { count } = await query;
    return count || 0;
  }

  if (goal.metric === "leads_in_stage" && goal.funnel_stage_id) {
    let query = supabase
      .from("campaign_leads")
      .select("*, campaigns!inner(user_id)", { count: "exact", head: true })
      .eq("campaigns.user_id", userId)
      .is("archived_at", null)
      .eq("current_step_id", goal.funnel_stage_id);
    if (campaignFilter) query = query.eq("campaign_id", campaignFilter);
    const { count } = await query;
    return count || 0;
  }

  if (goal.metric === "revenue") {
    let query = supabase
      .from("campaign_leads")
      .select("deal_value, campaigns!inner(user_id)")
      .eq("campaigns.user_id", userId)
      .is("archived_at", null)
      .not("converted_at", "is", null)
      .gte("converted_at", `${today}T00:00:00`)
      .lte("converted_at", `${today}T23:59:59.999`);
    if (campaignFilter) query = query.eq("campaign_id", campaignFilter);
    const { data } = await query;
    if (!data || data.length === 0) return 0;
    return data.reduce((sum: number, row: any) => sum + (Number(row.deal_value) || 0), 0);
  }

  if (goal.metric === "conversion_rate") {
    let convertedQuery = supabase
      .from("campaign_leads")
      .select("*, campaigns!inner(user_id)", { count: "exact", head: true })
      .eq("campaigns.user_id", userId)
      .is("archived_at", null)
      .not("converted_at", "is", null);
    let totalQuery = supabase
      .from("campaign_leads")
      .select("*, campaigns!inner(user_id)", { count: "exact", head: true })
      .eq("campaigns.user_id", userId)
      .is("archived_at", null);
    if (campaignFilter) {
      convertedQuery = convertedQuery.eq("campaign_id", campaignFilter);
      totalQuery = totalQuery.eq("campaign_id", campaignFilter);
    }
    const [{ count: converted }, { count: total }] = await Promise.all([convertedQuery, totalQuery]);
    if (!total || total === 0) return 0;
    return Math.round(((converted || 0) / total) * 100);
  }

  if (goal.metric === "cycle_time") {
    let query = supabase
      .from("campaign_leads")
      .select("created_at, converted_at, campaigns!inner(user_id)")
      .eq("campaigns.user_id", userId)
      .is("archived_at", null)
      .not("converted_at", "is", null)
      .gte("converted_at", `${today}T00:00:00`);
    if (campaignFilter) query = query.eq("campaign_id", campaignFilter);
    const { data } = await query;
    if (!data || data.length === 0) return 0;
    const totalDays = data.reduce((sum: number, row: any) => {
      const created = new Date(row.created_at).getTime();
      const converted = new Date(row.converted_at).getTime();
      return sum + Math.max(0, (converted - created) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round(totalDays / data.length);
  }

  return -1;
}

// ── Hook to fetch goals + progress ─────────────────────────
export function useGoalsData() {
  const { user } = useAuth();
  const { campaigns } = useStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  // Create a version that changes when lead attributes change (archive, convert, value, step)
  const campaignsVersion = campaigns.reduce((hash, c) => {
    return hash + c.leads.reduce((h, clf) => {
      return h + (clf.campaignLead.archivedAt || '') + (clf.campaignLead.convertedAt || '') + clf.campaignLead.dealValue + clf.campaignLead.stepIndex;
    }, '');
  }, '');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: goalsData } = await supabase
      .from("prospecting_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (!goalsData) { setLoading(false); return; }
    
    const mapped: Goal[] = goalsData.map((g: any) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      target: g.target,
      metric: g.metric,
      color: g.color || "#6366f1",
      is_active: g.is_active ?? true,
      campaign_id: g.campaign_id,
      funnel_stage_id: g.funnel_stage_id,
      recurrence: g.recurrence || "daily",
      custom_days: g.custom_days || [],
      created_at: g.created_at,
      deadline: g.deadline || null,
      is_featured: g.is_featured ?? false,
    }));
    setGoals(mapped);

    const todayGoals = mapped.filter(isGoalActiveToday);

    // Separate monthly goals for accumulated progress
    const monthlyGoals = todayGoals.filter(g => g.recurrence === "monthly");
    const nonMonthlyGoals = todayGoals.filter(g => g.recurrence !== "monthly");

    // Fetch today's progress for non-monthly goals
    const { data: progressData } = await supabase
      .from("prospecting_progress")
      .select("goal_id, current_value")
      .eq("user_id", user.id)
      .eq("date", today);

    const pMap: Record<string, number> = {};
    (progressData || []).forEach((p: any) => { pMap[p.goal_id] = p.current_value; });

    // Fetch monthly accumulated progress
    if (monthlyGoals.length > 0) {
      const monthStart = today.slice(0, 7) + "-01";
      const { data: monthlyProgress } = await supabase
        .from("prospecting_progress")
        .select("goal_id, current_value, date")
        .eq("user_id", user.id)
        .gte("date", monthStart)
        .lte("date", today);

      monthlyGoals.forEach(goal => {
        const monthTotal = (monthlyProgress || [])
          .filter((p: any) => p.goal_id === goal.id)
          .reduce((sum: number, p: any) => sum + (p.current_value || 0), 0);
        pMap[goal.id] = monthTotal;
      });
    }

    // Auto-calculate for non-manual metrics
    for (const goal of todayGoals) {
      if (!isManualMetric(goal.metric)) {
        const val = await calculateAutoProgress(goal, user.id, today);
        if (val >= 0) {
          pMap[goal.id] = val;
        }
      }
    }

    setProgressMap(pMap);
    setLoading(false);
  }, [user, today, campaignsVersion]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayGoals = goals.filter(isGoalActiveToday);

  const ipp = todayGoals.length === 0 ? 0 : Math.round(
    todayGoals.reduce((sum, goal) => {
      const val = progressMap[goal.id] || 0;
      return sum + calculateGoalPct(goal, val);
    }, 0) / todayGoals.length
  );

  return { goals, todayGoals, progressMap, ipp, loading, fetchData, today };
}

// ── Main Widget ────────────────────────────────────────────
export default function IPPWidget({ onOpenGoals }: { onOpenGoals?: () => void }) {
  const { user } = useAuth();
  const { goals, todayGoals, progressMap, ipp, fetchData, today } = useGoalsData();
  const [animated, setAnimated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevIppRef = useRef(0);
  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { setLocalProgress(progressMap); }, [progressMap]);

  useEffect(() => {
    if (goals.length > 0) setTimeout(() => setAnimated(true), 50);
  }, [goals]);

  const liveIpp = todayGoals.length === 0 ? 0 : Math.round(
    todayGoals.reduce((sum, goal) => {
      const val = localProgress[goal.id] || 0;
      return sum + calculateGoalPct(goal, val);
    }, 0) / todayGoals.length
  );

  useEffect(() => {
    if (liveIpp === 100 && prevIppRef.current < 100) setShowConfetti(true);
    prevIppRef.current = liveIpp;
  }, [liveIpp]);

  const handleIncrement = async (goalId: string, delta: number) => {
    if (!user) return;
    const current = localProgress[goalId] || 0;
    const newVal = Math.max(0, current + delta);
    setLocalProgress(prev => ({ ...prev, [goalId]: newVal }));

    await supabase.from("prospecting_progress").upsert({
      user_id: user.id,
      goal_id: goalId,
      date: today,
      current_value: newVal,
    }, { onConflict: "user_id,goal_id,date" });
  };

  // Empty state
  if (goals.length === 0) {
    return (
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Performance de Prospecção</p>
            <p className="text-xs text-muted-foreground">Defina metas diárias para acompanhar seu desempenho</p>
          </div>
        </div>
        <button onClick={onOpenGoals} className="rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition active:scale-[0.97]">
          Criar primeira meta
        </button>
      </div>
    );
  }

  if (todayGoals.length === 0) {
    return (
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Sem metas para hoje</p>
            <p className="text-xs text-muted-foreground">Nenhuma meta ativa está programada para este dia</p>
          </div>
        </div>
        {onOpenGoals && (
          <button onClick={onOpenGoals} className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
            <Settings2 className="h-3.5 w-3.5 inline mr-1" /> Gerenciar
          </button>
        )}
      </div>
    );
  }

  // Sort: featured first
  const sortedGoals = [...todayGoals].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  const MAX_VISIBLE = 3;
  const visibleGoals = expanded ? sortedGoals : sortedGoals.slice(0, MAX_VISIBLE);
  const hiddenCount = sortedGoals.length - MAX_VISIBLE;

  return (
    <div className="glass-card p-4 relative overflow-hidden">
      {showConfetti && <ConfettiEffect onComplete={() => setShowConfetti(false)} />}

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Performance de Hoje</p>
            {onOpenGoals && (
              <button onClick={onOpenGoals} className="p-1.5 rounded-md hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition">
                <Settings2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="space-y-2 transition-all duration-300">
            {visibleGoals.map(goal => (
              <GoalBar
                key={goal.id} goal={goal}
                progress={localProgress[goal.id] || 0}
                animated={animated}
                onIncrement={() => handleIncrement(goal.id, 1)}
                onDecrement={() => handleIncrement(goal.id, -1)}
              />
            ))}
          </div>
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mt-1"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "Ver menos" : `Ver mais ${hiddenCount} meta${hiddenCount > 1 ? "s" : ""}`}
            </button>
          )}
        </div>

        <CircularScore value={liveIpp} animated={animated} />
      </div>
    </div>
  );
}
