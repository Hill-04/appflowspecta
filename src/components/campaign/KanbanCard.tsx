import { useState } from "react";
import { MessageSquare, Copy } from "lucide-react";
import { CampaignLeadFull } from "@/hooks/useStore";

interface Props {
  clf: CampaignLeadFull;
  stepName: string;
  stepColor?: string;
  dynamicFields: { label: string; value: string }[];
  onClick: () => void;
  onDuplicate: () => void;
  onOpenNotes: () => void;
}

export function KanbanCard({ clf, stepName, dynamicFields, onClick, onDuplicate, onOpenNotes }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("campaignLeadId", clf.campaignLead.id);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={onClick}
      className={`glass-card p-3 cursor-pointer transition-all duration-200 group
        hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-0.5
        ${isDragging ? "shadow-2xl rotate-[2deg] scale-105 opacity-80" : ""}
      `}
    >
      {/* Name */}
      <p className="text-sm font-semibold text-foreground truncate">{clf.lead.name}</p>

      {/* Step badge */}
      <div className="mt-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          {stepName}
        </span>
      </div>

      {/* Dynamic fields (max 2) */}
      {dynamicFields.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {dynamicFields.map((f) => (
            <div key={f.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground truncate">{f.label}</span>
              <span className="text-foreground font-medium truncate ml-2 max-w-[60%] text-right">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Value footer */}
      {clf.campaignLead.dealValue > 0 && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
          <span className="text-[10px] text-green-400 font-medium">
            R$ {Number(clf.campaignLead.dealValue).toLocaleString('pt-BR')}
          </span>
        </div>
      )}

      {/* Footer icons */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onOpenNotes(); }}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition"
          title="Notas"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition"
          title="Duplicar"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
