import { useState, useEffect } from "react";
import { Check, Save } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useScriptCopilot, type ProfileData } from "@/hooks/useScriptCopilot";
import { SCRIPT_BLOCKS, SCRIPT_OBJECTIVES, combineBlocksToContent, type BlockId, type ObjectiveValue } from "@/lib/scriptBlocks";
import ObjectiveSelector from "./ObjectiveSelector";
import ScriptBlockEditor from "./ScriptBlockEditor";
import { toast } from "sonner";
import { UpgradeGate } from "@/components/UpgradeGate";

interface ScriptCopilotProps {
  onComplete: (scriptId?: string) => void;
  objective?: string;
  audienceId?: string;
  fullscreen?: boolean;
}

function ScriptCopilotInner({ onComplete, objective: initialObjective, audienceId, fullscreen }: ScriptCopilotProps) {
  const { addScript, profileData } = useStore();
  const [objective, setObjective] = useState<ObjectiveValue | null>((initialObjective as ObjectiveValue) || null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [showFinish, setShowFinish] = useState(false);
  const [scriptName, setScriptName] = useState("");
  const [saving, setSaving] = useState(false);

  const copilot = useScriptCopilot({
    objective: objective || "marcar_reuniao",
    channel: profileData?.contactChannel || "whatsapp",
    profileData: profileData || {},
  });

  const currentBlock = SCRIPT_BLOCKS[currentBlockIndex];
  const objectiveLabel = SCRIPT_OBJECTIVES.find((o) => o.value === objective)?.label || "";

  // Auto-generate first block when objective is selected
  useEffect(() => {
    if (objective && copilot.blockStatus[SCRIPT_BLOCKS[0].id] === "pending") {
      copilot.generateBlock(SCRIPT_BLOCKS[0].id as BlockId);
    }
  }, [objective]);

  const handleApproveAndNext = () => {
    copilot.approveBlock(currentBlock.id as BlockId);

    if (currentBlockIndex < SCRIPT_BLOCKS.length - 1) {
      const nextIndex = currentBlockIndex + 1;
      setCurrentBlockIndex(nextIndex);
      const nextBlock = SCRIPT_BLOCKS[nextIndex];
      if (copilot.blockStatus[nextBlock.id] === "pending") {
        copilot.generateBlock(nextBlock.id as BlockId);
      }
    } else {
      setShowFinish(true);
    }
  };

  const handleSave = async () => {
    if (!scriptName.trim()) {
      toast.error("Dê um nome ao script");
      return;
    }
    setSaving(true);
    try {
      const content = combineBlocksToContent(copilot.blocks);
      await addScript({
        name: scriptName,
        type: "opening",
        content,
        tags: objective ? [objectiveLabel] : [],
        objective: objective || undefined,
        audienceId: audienceId || undefined,
      });
      toast.success("Script salvo com sucesso!");
      onComplete();
    } catch {
      toast.error("Erro ao salvar script");
    } finally {
      setSaving(false);
    }
  };

  if (!objective) {
    return (
      <div className={`${fullscreen ? "min-h-screen flex items-center justify-center p-4" : ""}`}>
        <div className="w-full max-w-2xl mx-auto">
          <ObjectiveSelector onSelect={(v) => setObjective(v)} />
        </div>
      </div>
    );
  }

  if (showFinish) {
    return (
      <div className={`${fullscreen ? "min-h-screen flex items-center justify-center p-4" : ""}`}>
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* Progress */}
          <ProgressBar blockStatus={copilot.blockStatus} />

          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
              <Check className="h-7 w-7 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Script pronto!</h2>
            <p className="text-sm text-muted-foreground">Todos os blocos foram aprovados. Dê um nome e salve.</p>
          </div>

          <input
            value={scriptName}
            onChange={(e) => setScriptName(e.target.value)}
            placeholder="Nome do script (ex: Abertura CEOs SaaS)"
            maxLength={100}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition"
          />

          {/* Preview all blocks */}
          <div className="space-y-2">
            {SCRIPT_BLOCKS.map((b) => (
              <div key={b.id} className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{b.label}</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{copilot.blocks[b.id]}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={!scriptName.trim() || saving}
              className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition disabled:opacity-40"
            >
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Script"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullscreen ? "min-h-screen flex items-center justify-center p-4" : ""}`}>
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in" key={currentBlockIndex}>
        {/* Progress */}
        <ProgressBar blockStatus={copilot.blockStatus} currentIndex={currentBlockIndex} />

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Objetivo: <span className="text-primary font-medium">{objectiveLabel}</span> · Bloco {currentBlockIndex + 1} de {SCRIPT_BLOCKS.length}
          </p>
        </div>

        <ScriptBlockEditor
          blockId={currentBlock.id}
          label={currentBlock.label}
          description={currentBlock.description}
          content={copilot.blocks[currentBlock.id] || ""}
          status={copilot.blockStatus[currentBlock.id]}
          onGenerate={() => copilot.generateBlock(currentBlock.id as BlockId)}
          onApprove={handleApproveAndNext}
          onRegenerate={() => copilot.generateVariation(currentBlock.id as BlockId)}
          onRefine={(fb) => copilot.refineBlock(currentBlock.id as BlockId, fb)}
          onContentChange={(c) => copilot.updateBlockContent(currentBlock.id as BlockId, c)}
        />

        {/* Navigation dots for going back */}
        {currentBlockIndex > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setCurrentBlockIndex((i) => Math.max(0, i - 1))}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              ← Voltar ao bloco anterior
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScriptCopilot(props: ScriptCopilotProps) {
  return (
    <UpgradeGate feature="advanced_copilot" fallbackMessage="Copilot IA Avançado disponível a partir do plano Growth">
      <ScriptCopilotInner {...props} />
    </UpgradeGate>
  );
}

function ProgressBar({ blockStatus, currentIndex }: { blockStatus: Record<string, string>; currentIndex?: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {SCRIPT_BLOCKS.map((b, i) => {
        const st = blockStatus[b.id];
        const isCurrent = currentIndex === i;
        return (
          <div key={b.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                st === "approved"
                  ? "bg-success text-success-foreground"
                  : isCurrent
                  ? "gradient-primary text-primary-foreground glow-primary-sm"
                  : "bg-muted text-muted-foreground"
              }`}
              title={b.label}
            >
              {st === "approved" ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < SCRIPT_BLOCKS.length - 1 && (
              <div className={`h-px w-6 ${st === "approved" ? "bg-success" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
