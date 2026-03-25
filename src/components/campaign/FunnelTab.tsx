import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore, Campaign, FunnelStep } from "@/hooks/useStore";
import { toast } from "sonner";

interface Props {
  campaign: Campaign;
}

export function FunnelTab({ campaign }: Props) {
  const { updateFunnel } = useStore();

  const toUpdateFormat = (steps: FunnelStep[]) =>
    steps.map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      variationA: s.variations[0]?.content || "",
      variationB: s.variations[1]?.content || "",
    }));

  const handleAddStep = () => {
    const current = toUpdateFormat(campaign.funnel);
    current.push({
      id: undefined as any,
      name: "",
      order: campaign.funnel.length + 1,
      variationA: "",
      variationB: "",
    });
    updateFunnel(campaign.id, current);
    toast.success("Etapa adicionada");
  };

  const handleRemoveStep = (stepId: string) => {
    const updated = toUpdateFormat(campaign.funnel)
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    updateFunnel(campaign.id, updated);
    toast.success("Etapa removida");
  };

  const handleUpdateStep = (stepId: string, field: string, value: string) => {
    const updated = toUpdateFormat(campaign.funnel).map((s) =>
      s.id === stepId ? { ...s, [field]: value } : s
    );
    updateFunnel(campaign.id, updated);
  };

  const handleUpdateVariation = (stepId: string, varIndex: number, content: string) => {
    const updated = toUpdateFormat(campaign.funnel).map((s) => {
      if (s.id !== stepId) return s;
      if (varIndex === 0) return { ...s, variationA: content };
      return { ...s, variationB: content };
    });
    updateFunnel(campaign.id, updated);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {campaign.funnel.map((step) => (
        <div key={step.id} className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground text-sm font-bold shrink-0">
              {step.order}
            </div>
            <input
              value={step.name}
              onChange={(e) => handleUpdateStep(step.id, "name", e.target.value)}
              placeholder="Nome da etapa"
              className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none border-b border-transparent focus:border-primary transition"
            />
            <button
              onClick={() => handleRemoveStep(step.id)}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {step.variations.map((v, vi) => (
              <div key={v.id} className="space-y-1">
                <span className="text-xs font-semibold text-primary">{v.label}</span>
                <textarea
                  value={v.content}
                  onChange={(e) => handleUpdateVariation(step.id, vi, e.target.value)}
                  placeholder="Mensagem..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none transition"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleAddStep}
        className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition"
      >
        <Plus className="inline h-4 w-4 mr-1" />
        Adicionar Etapa
      </button>
    </div>
  );
}
