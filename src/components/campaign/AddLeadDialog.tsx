import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStore, Campaign } from "@/hooks/useStore";
import { toast } from "sonner";

interface Props {
  campaign: Campaign;
  stepIndex: number;
  hasFieldDefs: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadCreated: (leadId: string) => void;
}

export function AddLeadDialog({ campaign, stepIndex, hasFieldDefs, open, onOpenChange, onLeadCreated }: Props) {
  const { user } = useAuth();
  const { refreshCampaigns, refreshLeads } = useStore();
  const [mode, setMode] = useState<"welcome" | "name">(hasFieldDefs ? "name" : "welcome");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const sortedSteps = [...campaign.funnel].sort((a, b) => a.order - b.order);

  const createLead = async (openFields: boolean) => {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const { data: newLead } = await supabase.from("leads").insert({
        user_id: user.id,
        name: name.trim(),
        lead_model_id: campaign.defaultLeadTemplateId || null,
      }).select().single();
      if (!newLead) { toast.error("Erro ao criar lead"); return; }

      const step = sortedSteps[stepIndex];
      await supabase.from("campaign_leads").insert({
        campaign_id: campaign.id,
        lead_id: newLead.id,
        step_index: stepIndex,
        current_step_id: step?.id || null,
        priority: "medium",
        deal_value: 0,
      });

      // Create empty field values for field defs that exist
      const { data: defs } = await supabase
        .from("campaign_field_definitions")
        .select("id")
        .eq("campaign_id", campaign.id);
      if (defs && defs.length > 0) {
        await supabase.from("lead_field_values").insert(
          defs.map(d => ({
            campaign_id: campaign.id,
            lead_id: newLead.id,
            field_id: d.id,
            value: "",
          }))
        );
      }

      await Promise.all([refreshCampaigns(), refreshLeads()]);
      toast.success("Lead criado");
      onOpenChange(false);
      setName("");
      setMode(hasFieldDefs ? "name" : "welcome");
      onLeadCreated(newLead.id);
    } catch {
      toast.error("Erro ao criar lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setName(""); setMode(hasFieldDefs ? "name" : "welcome"); } }}>
      <DialogContent className="max-w-md">
        {mode === "welcome" ? (
          <>
            <DialogHeader>
              <DialogTitle>Como você quer organizar seus leads?</DialogTitle>
              <DialogDescription>
                Você pode criar campos personalizados para registrar informações importantes sobre cada lead.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do lead"
                className="w-full rounded-lg border border-border bg-secondary/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && name.trim() && createLead(true)}
              />
              <button
                onClick={() => createLead(true)}
                disabled={!name.trim() || loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" /> Criar campos agora
              </button>
              <button
                onClick={() => createLead(false)}
                disabled={!name.trim() || loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition disabled:opacity-50"
              >
                <Zap className="h-4 w-4" /> Começar simples
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Adicionar lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do lead"
                className="w-full rounded-lg border border-border bg-secondary/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && name.trim() && createLead(false)}
              />
              <button
                onClick={() => createLead(false)}
                disabled={!name.trim() || loading}
                className="w-full rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
              >
                Criar lead
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
