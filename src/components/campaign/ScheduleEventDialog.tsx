import { useState } from "react";
import { Calendar, Clock, MapPin, FileText, Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  campaignId: string;
  onCreated?: () => void;
  defaults?: {
    type?: string;
    title?: string;
    start_datetime?: string;
    duration_minutes?: number;
  };
}

const EVENT_TYPES = [
  { value: "meeting", label: "Reunião", icon: "🤝" },
  { value: "followup", label: "Follow-up", icon: "🔄" },
  { value: "task", label: "Tarefa", icon: "✅" },
];

const DURATIONS = [15, 30, 45, 60, 90];
const PRIORITIES = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];

export function ScheduleEventDialog({ open, onOpenChange, leadId, campaignId, onCreated, defaults }: Props) {
  const { createEvent } = useGoogleCalendar();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState(defaults?.type || "meeting");
  const [title, setTitle] = useState(defaults?.title || "");
  const [startDatetime, setStartDatetime] = useState(defaults?.start_datetime || "");
  const [duration, setDuration] = useState(defaults?.duration_minutes || 30);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleSubmit = async () => {
    if (!title.trim() || !startDatetime) return;
    setSaving(true);
    const result = await createEvent({
      lead_id: leadId,
      campaign_id: campaignId,
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      start_datetime: new Date(startDatetime).toISOString(),
      duration_minutes: duration,
      priority,
      source: "manual",
    });
    setSaving(false);
    if (result) {
      onOpenChange(false);
      resetForm();
      onCreated?.();
    }
  };

  const resetForm = () => {
    setType("meeting");
    setTitle("");
    setStartDatetime("");
    setDuration(30);
    setDescription("");
    setLocation("");
    setPriority("medium");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Agendar Evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type selection */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <div className="flex gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    type === t.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Apresentação do produto"
            />
          </div>

          {/* Date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Data e Hora
              </Label>
              <input
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Duração
              </Label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Descrição
            </Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Opcional..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Local
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Link ou endereço..."
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Flag className="h-3 w-3" /> Prioridade
            </Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    priority === p.value
                      ? p.value === "high"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : p.value === "medium"
                        ? "border-warning bg-warning/10 text-warning"
                        : "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim() || !startDatetime}>
            {saving ? "Salvando..." : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
