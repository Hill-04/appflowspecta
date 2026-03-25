import { Zap } from "lucide-react";
import type { TourStep } from "./OrionTourProvider";

interface Props {
  step: TourStep;
  targetRect: { top: number; left: number; width: number; height: number } | null;
  isCentered: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export default function OrionTourBubble({ step, targetRect, isCentered, onNext, onSkip }: Props) {
  // Position the bubble
  let style: React.CSSProperties = {};

  if (isCentered) {
    style = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  } else if (targetRect) {
    const bubbleWidth = 340;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Prefer below, then above, then right
    const spaceBelow = viewportHeight - (targetRect.top + targetRect.height);
    const spaceAbove = targetRect.top;

    if (spaceBelow > 180) {
      style = {
        position: "fixed",
        top: targetRect.top + targetRect.height + 16,
        left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - bubbleWidth / 2, viewportWidth - bubbleWidth - 16)),
      };
    } else if (spaceAbove > 180) {
      style = {
        position: "fixed",
        bottom: viewportHeight - targetRect.top + 16,
        left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - bubbleWidth / 2, viewportWidth - bubbleWidth - 16)),
      };
    } else {
      style = {
        position: "fixed",
        top: Math.max(16, targetRect.top),
        left: Math.min(targetRect.left + targetRect.width + 16, viewportWidth - bubbleWidth - 16),
      };
    }
  }

  return (
    <div
      className="w-[340px] max-w-[calc(100vw-32px)] glass-surface-elevated p-5 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400"
      style={style}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse" />
          <div className="relative h-9 w-9 rounded-full gradient-blue flex items-center justify-center border border-white/[0.1] shadow-[0_0_20px_-5px_hsl(205_90%_54%/0.35)]">
            <Zap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground/60 font-medium tracking-wider uppercase">ORION</p>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm leading-relaxed text-foreground/90">{step.text}</p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition"
        >
          Pular tour
        </button>
        {(step.action === "button") && (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition glow-primary-sm"
          >
            {step.buttonLabel || "Próximo"}
          </button>
        )}
        {step.action === "click-target" && (
          <span className="text-xs text-primary/70 animate-pulse">
            Clique no elemento destacado
          </span>
        )}
        {step.action === "wait" && (
          <span className="text-xs text-primary/70">
            Complete a etapa para continuar
          </span>
        )}
      </div>
    </div>
  );
}
