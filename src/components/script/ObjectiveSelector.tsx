import { useState } from "react";
import { ArrowRight, Calendar, DollarSign, Lightbulb, Search } from "lucide-react";
import { SCRIPT_OBJECTIVES, type ObjectiveValue } from "@/lib/scriptBlocks";

const OBJECTIVE_ICONS: Record<string, React.ElementType> = {
  marcar_reuniao: Calendar,
  fechar_cliente: DollarSign,
  gerar_interesse: Lightbulb,
  qualificar_lead: Search,
};

interface ObjectiveSelectorProps {
  onSelect: (objective: ObjectiveValue) => void;
}

export default function ObjectiveSelector({ onSelect }: ObjectiveSelectorProps) {
  const [selected, setSelected] = useState<ObjectiveValue | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Qual é o objetivo desta conversa?</h2>
        <p className="text-sm text-muted-foreground">
          Isso define o tom e a abordagem de cada bloco do script
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SCRIPT_OBJECTIVES.map((obj) => {
          const Icon = OBJECTIVE_ICONS[obj.value] || Search;
          const isSelected = selected === obj.value;
          return (
            <button
              key={obj.value}
              onClick={() => setSelected(obj.value)}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 glow-primary-sm"
                  : "border-border bg-secondary/50 hover:border-primary/30 hover:bg-secondary"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? "gradient-primary" : "bg-muted"
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                  {obj.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{obj.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continuar <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
