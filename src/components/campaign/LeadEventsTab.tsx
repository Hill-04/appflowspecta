import { useEffect, useState } from "react";
import { CalendarCheck, CalendarX, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useGoogleCalendar, type CalendarEvent } from "@/hooks/useGoogleCalendar";

interface Props {
  leadId: string;
  campaignId: string;
  refreshKey?: number;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  scheduled: { label: "Agendado", className: "bg-primary/10 text-primary border-primary/20", icon: Clock },
  completed: { label: "Concluído", className: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground border-border", icon: XCircle },
  missed: { label: "Perdido", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
  overdue: { label: "Atrasado", className: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
};

const TYPE_ICONS: Record<string, string> = {
  meeting: "🤝",
  followup: "🔄",
  task: "✅",
};

export function LeadEventsTab({ leadId, campaignId, refreshKey }: Props) {
  const { listEvents, completeEvent, cancelEvent } = useGoogleCalendar();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    const data = await listEvents({ lead_id: leadId, campaign_id: campaignId });
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, [leadId, campaignId, refreshKey]);

  const now = new Date();
  const upcoming = events.filter((e) => e.status === "scheduled" && new Date(e.start_datetime) >= now);
  const pastOrActive = events.filter((e) => e.status !== "scheduled" || new Date(e.start_datetime) < now);

  const handleComplete = async (id: string) => {
    const result = await completeEvent(id);
    if (result) loadEvents();
  };

  const handleCancel = async (id: string) => {
    const result = await cancelEvent(id);
    if (result) loadEvents();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-6 animate-pulse">Carregando agenda...</p>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <CalendarX className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">Nenhum evento agendado</p>
      </div>
    );
  }

  const renderEvent = (event: CalendarEvent) => {
    const config = STATUS_CONFIG[event.status] || STATUS_CONFIG.scheduled;
    const StatusIcon = config.icon;
    const isActionable = event.status === "scheduled" || event.status === "overdue";
    const dateObj = new Date(event.start_datetime);

    return (
      <div key={event.id} className={`rounded-xl border p-3 space-y-2 ${event.is_overdue ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-card/50"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">{TYPE_ICONS[event.type] || "📅"}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {dateObj.toLocaleDateString("pt-BR")} às {dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                {event.duration_minutes ? ` · ${event.duration_minutes}min` : ""}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${config.className}`}>
            <StatusIcon className="h-2.5 w-2.5" />
            {config.label}
          </span>
        </div>

        {event.location && (
          <p className="text-xs text-muted-foreground pl-6">📍 {event.location}</p>
        )}

        {isActionable && (
          <div className="flex gap-2 pl-6">
            <button
              onClick={() => handleComplete(event.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium bg-success/10 text-success hover:bg-success/20 transition"
            >
              <CheckCircle className="h-3 w-3" /> Concluir
            </button>
            <button
              onClick={() => handleCancel(event.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
            >
              <XCircle className="h-3 w-3" /> Cancelar
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CalendarCheck className="h-3 w-3" /> Próximos ({upcoming.length})
          </h4>
          {upcoming.map(renderEvent)}
        </div>
      )}
      {pastOrActive.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Passados ({pastOrActive.length})
          </h4>
          {pastOrActive.map(renderEvent)}
        </div>
      )}
    </div>
  );
}
