import { useEffect, useState, useRef } from "react";
import { useOrionTour } from "./OrionTourProvider";
import OrionTourBubble from "./OrionTourBubble";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useDialogOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const check = () => setOpen(!!document.querySelector("[role='dialog']"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  return open;
}

export default function OrionSpotlight() {
  const tour = useOrionTour();
  const dialogOpen = useDialogOpen();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!tour?.tourActive || !tour.currentStep) return;

    const target = tour.currentStep.target;
    if (!target) {
      setTargetRect(null);
      return;
    }

    const track = () => {
      const el = document.querySelector(`[data-orion-target="${target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const padding = 8;
        setTargetRect({
          top: r.top - padding,
          left: r.left - padding,
          width: r.width + padding * 2,
          height: r.height + padding * 2,
        });
      } else {
        setTargetRect(null);
      }
      rafRef.current = requestAnimationFrame(track);
    };

    rafRef.current = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tour?.tourActive, tour?.currentStep]);

  if (!tour?.tourActive || !tour.currentStep || dialogOpen) return null;

  const isCentered = !tour.currentStep.target;

  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: "none" }}>
      {/* Backdrop: purely visual, never blocks clicks */}
      {targetRect ? (
        <>
          <div
            className="absolute bg-black/65 transition-all duration-300"
            style={{ pointerEvents: "none", top: 0, left: 0, right: 0, height: Math.max(0, targetRect.top) }}
          />
          <div
            className="absolute bg-black/65 transition-all duration-300"
            style={{ pointerEvents: "none", top: targetRect.top + targetRect.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="absolute bg-black/65 transition-all duration-300"
            style={{ pointerEvents: "none", top: targetRect.top, left: 0, width: Math.max(0, targetRect.left), height: targetRect.height }}
          />
          <div
            className="absolute bg-black/65 transition-all duration-300"
            style={{ pointerEvents: "none", top: targetRect.top, left: targetRect.left + targetRect.width, right: 0, height: targetRect.height }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-black/65 transition-opacity duration-500"
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Ripple on target - purely visual */}
      {targetRect && (
        <div
          className="absolute orion-ripple rounded-lg"
          style={{
            pointerEvents: "none",
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Bubble - interactive */}
      <div style={{ pointerEvents: "auto" }}>
        <OrionTourBubble
          step={tour.currentStep}
          targetRect={targetRect}
          isCentered={isCentered}
          onNext={tour.advanceTour}
          onSkip={tour.skipTour}
        />
      </div>
    </div>
  );
}
