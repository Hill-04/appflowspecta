import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveSettingsDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [archiveConverted, setArchiveConverted] = useState("first_of_month");
  const [customDay, setCustomDay] = useState(1);
  const [inactiveDays, setInactiveDays] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("archive_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setArchiveConverted((data as any).archive_converted || "first_of_month");
          setCustomDay((data as any).archive_converted_custom_day || 1);
          setInactiveDays((data as any).archive_inactive_days ?? 30);
        }
      });
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      archive_converted: archiveConverted,
      archive_converted_custom_day: archiveConverted === "custom_date" ? customDay : null,
      archive_inactive_days: inactiveDays,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("archive_settings")
      .upsert(payload as any, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas");
      onOpenChange(false);
    }
  };

  const selectClass = "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Configurações de Arquivamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Arquivar leads convertidos</Label>
            <select
              value={archiveConverted}
              onChange={(e) => setArchiveConverted(e.target.value)}
              className={selectClass}
            >
              <option value="first_of_month">No 1º dia do mês seguinte</option>
              <option value="after_30_days">30 dias após a conversão</option>
              <option value="custom_date">Em data específica do mês</option>
              <option value="manual">Nunca (manual)</option>
            </select>
          </div>

          {archiveConverted === "custom_date" && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Dia do mês (1-28)</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={customDay}
                onChange={(e) => setCustomDay(Math.min(28, Math.max(1, Number(e.target.value))))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Arquivar leads sem movimentação após</Label>
            <select
              value={inactiveDays}
              onChange={(e) => setInactiveDays(Number(e.target.value))}
              className={selectClass}
            >
              <option value={0}>Nunca</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
