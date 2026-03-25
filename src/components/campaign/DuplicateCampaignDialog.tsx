import { useState } from "react";
import { ArrowRight, Layers, Users, FileText, Contact, LayoutTemplate } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Campaign, useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateCampaignDialog({ campaign, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { refreshCampaigns, refreshLeads } = useStore();
  const [includeAudience, setIncludeAudience] = useState(true);
  const [includeScripts, setIncludeScripts] = useState(true);
  const [includeLeads, setIncludeLeads] = useState(false);
  const [includeTemplates, setIncludeTemplates] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!campaign) return null;

  const handleDuplicate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create campaign
      const { data: newCampaign, error: campErr } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name: `${campaign.name} (cópia)`,
        status: "active",
        investment: 0,
        audience_id: includeAudience ? campaign.audienceId || null : null,
        script_set_id: includeScripts ? campaign.scriptSetId || null : null,
        default_lead_template_id: includeTemplates ? campaign.defaultLeadTemplateId || null : null,
      }).select().single();

      if (campErr || !newCampaign) { toast.error("Erro ao duplicar campanha"); return; }

      // 2. Always duplicate steps
      const { data: steps } = await supabase
        .from("message_steps")
        .select("*")
        .eq("campaign_id", campaign.id)
        .order("step_order");

      if (steps && steps.length > 0) {
        await supabase.from("message_steps").insert(
          steps.map(s => ({
            campaign_id: newCampaign.id,
            step_name: s.step_name,
            step_order: s.step_order,
            is_conversion: s.is_conversion,
            variation_a: s.variation_a,
            variation_b: s.variation_b,
          }))
        );
      }

      // 3. Copy leads if selected
      if (includeLeads && campaign.leads.length > 0) {
        const newSteps = await supabase
          .from("message_steps")
          .select("id")
          .eq("campaign_id", newCampaign.id)
          .order("step_order")
          .limit(1);

        const firstStepId = newSteps.data?.[0]?.id || null;

        await supabase.from("campaign_leads").insert(
          campaign.leads.map(clf => ({
            campaign_id: newCampaign.id,
            lead_id: clf.lead.id,
            step_index: 0,
            current_step_id: firstStepId,
            priority: "medium",
            deal_value: 0,
          }))
        );
      }

      await Promise.all([refreshCampaigns(), refreshLeads()]);
      toast.success("Campanha duplicada com sucesso!");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao duplicar");
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { id: "steps", label: "Estrutura da campanha (etapas)", icon: Layers, checked: true, disabled: true, onChange: () => {} },
    { id: "audience", label: "Público-alvo vinculado", icon: Users, checked: includeAudience, disabled: false, onChange: () => setIncludeAudience(!includeAudience) },
    { id: "scripts", label: "Scripts vinculados", icon: FileText, checked: includeScripts, disabled: false, onChange: () => setIncludeScripts(!includeScripts) },
    { id: "leads", label: "Leads (contatos da lista)", icon: Contact, checked: includeLeads, disabled: false, onChange: () => setIncludeLeads(!includeLeads) },
    { id: "templates", label: "Lead Templates vinculados", icon: LayoutTemplate, checked: includeTemplates, disabled: false, onChange: () => setIncludeTemplates(!includeTemplates) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border" style={{ background: "#0D0E14" }}>
        <DialogHeader>
          <DialogTitle className="text-foreground text-base">Duplicar Campanha</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1 truncate">"{campaign.name}"</p>
        </DialogHeader>

        <div className="py-3 space-y-1">
          <p className="text-xs text-muted-foreground mb-3">O que deseja incluir na cópia?</p>
          {options.map(opt => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition cursor-pointer ${
                opt.disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-secondary/30"
              }`}
            >
              <Checkbox
                checked={opt.checked}
                disabled={opt.disabled}
                onCheckedChange={() => opt.onChange()}
              />
              <opt.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/30 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleDuplicate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
            style={{ background: "#3B82F6" }}
          >
            {loading ? "Duplicando..." : "Duplicar Agora"}
            {!loading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
