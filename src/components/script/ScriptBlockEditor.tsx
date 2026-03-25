import { useState } from "react";
import { Check, Edit2, RefreshCw, Send, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PLACEHOLDERS } from "@/lib/scriptBlocks";
import type { BlockStatus } from "@/hooks/useScriptCopilot";

interface ScriptBlockEditorProps {
  blockId: string;
  label: string;
  description: string;
  content: string;
  status: BlockStatus;
  onGenerate: () => void;
  onApprove: () => void;
  onRegenerate: () => void;
  onRefine: (feedback: string) => void;
  onContentChange: (content: string) => void;
}

const STATUS_STYLES: Record<BlockStatus, string> = {
  pending: "border-border",
  generating: "border-primary/30 animate-pulse",
  ready: "border-warning/50",
  approved: "border-success/50",
};

const STATUS_BADGES: Record<BlockStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-muted text-muted-foreground" },
  generating: { label: "Gerando...", className: "bg-primary/15 text-primary" },
  ready: { label: "Pronto", className: "bg-warning/15 text-warning" },
  approved: { label: "Aprovado", className: "bg-success/15 text-success" },
};

export default function ScriptBlockEditor({
  blockId,
  label,
  description,
  content,
  status,
  onGenerate,
  onApprove,
  onRegenerate,
  onRefine,
  onContentChange,
}: ScriptBlockEditorProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [feedback, setFeedback] = useState("");
  const badge = STATUS_BADGES[status];

  const usedPlaceholders = PLACEHOLDERS.filter((p) => content.includes(p.key));

  const handleSaveEdit = () => {
    onContentChange(editContent);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setEditing(false);
  };

  const handleRefine = () => {
    if (!feedback.trim()) return;
    onRefine(feedback);
    setFeedback("");
  };

  return (
    <div className={`glass-card p-5 space-y-4 border-2 transition-colors ${STATUS_STYLES[status]}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">{label}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Content area */}
      {status === "pending" && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <p className="text-sm text-muted-foreground">Pronto para gerar este bloco</p>
          <button
            onClick={onGenerate}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition"
          >
            Gerar com IA
          </button>
        </div>
      )}

      {status === "generating" && (
        <div className="space-y-3 py-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}

      {(status === "ready" || status === "approved") && !editing && (
        <div className="rounded-lg bg-secondary/50 p-4">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      )}

      {editing && (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancelEdit} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition">
              <X className="h-4 w-4" />
            </button>
            <button onClick={handleSaveEdit} className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/25 transition">
              <Check className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* Placeholders */}
      {usedPlaceholders.length > 0 && (status === "ready" || status === "approved") && (
        <div className="flex flex-wrap gap-1.5">
          {usedPlaceholders.map((p) => (
            <span key={p.key} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {p.key}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {status === "ready" && !editing && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-2 text-xs font-medium text-success hover:bg-success/25 transition"
            >
              <Check className="h-3.5 w-3.5" /> Aprovar
            </button>
            <button
              onClick={() => { setEditContent(content); setEditing(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </button>
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Gerar outro
            </button>
          </div>

          {/* Feedback */}
          <div className="flex gap-2">
            <input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="O que ajustar? (ex: mais informal, mais curto...)"
              className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              onKeyDown={(e) => e.key === "Enter" && handleRefine()}
            />
            <button
              onClick={handleRefine}
              disabled={!feedback.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
            >
              <Send className="h-3 w-3" /> Refinar
            </button>
          </div>
        </div>
      )}

      {/* Approved: allow re-editing */}
      {status === "approved" && !editing && (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditContent(content); setEditing(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <Edit2 className="h-3.5 w-3.5" /> Editar
          </button>
        </div>
      )}
    </div>
  );
}
