import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AgendaMetrics {
  meetingsToday: number;
  followupsToday: number;
  overdueTasks: number;
  next7Days: number;
  completionRate: number;
}

export function AgendaWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AgendaMetrics>({
    meetingsToday: 0,
    followupsToday: 0,
    overdueTasks: 0,
    next7Days: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMetrics = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const next7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

      const [todayRes, overdueRes, next7Res, completedRes, totalRes] = await Promise.all([
        supabase
          .from("lead_calendar_events")
          .select("type, status")
          .eq("user_id", user.id)
          .eq("status", "scheduled")
          .gte("start_datetime", startOfDay)
          .lt("start_datetime", endOfDay),
        supabase
          .from("lead_calendar_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("status", ["overdue", "missed"])
          .eq("is_overdue", true),
        supabase
          .from("lead_calendar_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "scheduled")
          .gte("start_datetime", startOfDay)
          .lt("start_datetime", next7),
        supabase
          .from("lead_calendar_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed"),
        supabase
          .from("lead_calendar_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "cancelled"),
      ]);

      const todayEvents = todayRes.data || [];
      const meetingsToday = todayEvents.filter((e) => e.type === "meeting").length;
      const followupsToday = todayEvents.filter((e) => e.type === "followup").length;
      const overdueTasks = overdueRes.count || 0;
      const next7Days = next7Res.count || 0;
      const completed = completedRes.count || 0;
      const total = totalRes.count || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setMetrics({ meetingsToday, followupsToday, overdueTasks, next7Days, completionRate });
      setLoading(false);
    };

    fetchMetrics();
  }, [user]);

  const hasAnyActivity = metrics.meetingsToday + metrics.followupsToday + metrics.overdueTasks + metrics.next7Days > 0;

  if (loading || !hasAnyActivity) return null;

  const items = [
    { label: "Reuniões hoje", value: metrics.meetingsToday, icon: CalendarDays, color: "text-primary" },
    { label: "Follow-ups hoje", value: metrics.followupsToday, icon: Clock, color: "text-accent-foreground" },
    { label: "Atrasados", value: metrics.overdueTasks, icon: AlertTriangle, color: "text-destructive", highlight: metrics.overdueTasks > 0 },
    { label: "Próx. 7 dias", value: metrics.next7Days, icon: TrendingUp, color: "text-foreground" },
    { label: "Conclusão", value: `${metrics.completionRate}%`, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <div className="glass-card p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" /> Agenda de Hoje
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-xl border p-3 text-center transition ${
                item.highlight
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border/50 bg-card/30 hover:border-primary/30"
              }`}
            >
              <Icon className={`h-4 w-4 mx-auto mb-1 ${item.color}`} />
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
