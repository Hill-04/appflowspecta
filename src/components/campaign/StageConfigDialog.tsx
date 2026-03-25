import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Trophy } from "lucide-react";
import { Campaign, useStore } from "@/hooks/useStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StepDraft {
  _key: string;
  id?: string;
  name: string;
  order: number;
  isConversion: boolean;
}

let keyCounter = 0;
const nextKey = () => `scd-${++keyCounter}`;

function SortableStep({
  step,
  index,
  total,
  onRename,
  onToggleConversion,
  onRemove,
}: {
  step: StepDraft;
  index: number;
  total: number;
  onRename: (val: string) => void;
  onToggleConversion: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step._key });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{index + 1}</span>
        <input
          value={step.name}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Nome da etapa"
          maxLength={100}
          className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button
          onClick={onToggleConversion}
          title={step.isConversion ? "Etapa de conversão (clique para desmarcar)" : "Marcar como etapa de conversão"}
          className={`p-1.5 rounded-md transition ${
            step.isConversion
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
        </button>
        {total > 1 && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {step.isConversion && (
        <p className="text-[11px] text-primary mt-1 ml-11 flex items-center gap-1">
          <Trophy className="h-3 w-3" /> Leads movidos para esta etapa serão contabilizados como conversão da campanha.
        </p>
      )}
    </div>
  );
}

export function StageConfigDialog({ campaign, open, onOpenChange }: Props) {
  const { updateFunnel } = useStore();
  const [steps, setSteps] = useState<StepDraft[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open) {
      setSteps(
        campaign.funnel.length > 0
          ? campaign.funnel.map((s) => ({ _key: nextKey(), id: s.id, name: s.name, order: s.order, isConversion: s.isConversion }))
          : [
              { _key: nextKey(), name: "Novo Lead", order: 1, isConversion: false },
              { _key: nextKey(), name: "Contatado", order: 2, isConversion: false },
              { _key: nextKey(), name: "Convertido", order: 3, isConversion: true },
            ]
      );
    }
  }, [open, campaign.funnel]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s._key === active.id);
      const newIndex = prev.findIndex((s) => s._key === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const handleAdd = () => {
    setSteps((prev) => [...prev, { _key: nextKey(), name: "", order: prev.length + 1, isConversion: false }]);
  };

  const handleRemove = (idx: number) => {
    setSteps((prev) => {
      const filtered = prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
      if (filtered.length > 0 && !filtered.some((s) => s.isConversion)) {
        filtered[filtered.length - 1].isConversion = true;
      }
      return filtered;
    });
  };

  const handleRename = (idx: number, name: string) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, name } : s)));
  };

  const handleToggleConversion = (idx: number) => {
    setSteps((prev) =>
      prev.map((s, i) => ({
        ...s,
        isConversion: i === idx ? !s.isConversion : false,
      }))
    );
  };

  const handleSave = async () => {
    const valid = steps.filter((s) => s.name.trim());
    if (valid.length === 0) {
      toast.error("Adicione pelo menos uma etapa");
      return;
    }
    const hasConversion = valid.some((s) => s.isConversion);
    const finalSteps = valid.map((s, i) => ({
      ...s,
      isConversion: hasConversion ? s.isConversion : i === valid.length - 1,
    }));

    await updateFunnel(
      campaign.id,
      finalSteps.map((s, i) => ({
        id: s.id,
        name: s.name.trim(),
        order: i + 1,
        variationA: campaign.funnel.find((f) => f.id === s.id)?.variations[0]?.content || "",
        variationB: campaign.funnel.find((f) => f.id === s.id)?.variations[1]?.content || "",
        isConversion: s.isConversion,
      }))
    );
    toast.success("Etapas atualizadas");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Configurar Etapas do Funil</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((s) => s._key)} strategy={verticalListSortingStrategy}>
              {steps.map((step, idx) => (
                <SortableStep
                  key={step._key}
                  step={step}
                  index={idx}
                  total={steps.length}
                  onRename={(val) => handleRename(idx, val)}
                  onToggleConversion={() => handleToggleConversion(idx)}
                  onRemove={() => handleRemove(idx)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <button
          onClick={handleAdd}
          className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition"
        >
          <Plus className="inline h-4 w-4 mr-1" /> Adicionar Etapa
        </button>

        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
            Cancelar
          </button>
          <button onClick={handleSave} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
            Salvar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
