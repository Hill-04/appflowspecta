import { useState, useRef, useEffect } from "react";
import { Zap } from "lucide-react";
import OrionPanel from "./OrionPanel";
import OrionChatDrawer from "./OrionChatDrawer";
import { useStore } from "@/hooks/useStore";
import { useOrionTour } from "./OrionTourProvider";

export default function OrionFloatingWidget() {
  const [open, setOpen] = useState(false);
  const { orionWelcomed } = useStore();
  const tour = useOrionTour();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Widget is ALWAYS visible — ORION chat must always be accessible

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && <OrionChatDrawer onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen((v) => !v)}
        className="group relative h-12 w-12 rounded-full gradient-blue flex items-center justify-center border border-white/[0.1] shadow-[0_0_25px_-5px_hsl(205_90%_54%/0.35)] hover:shadow-[0_0_35px_-5px_hsl(205_90%_54%/0.5)] hover:scale-105 transition-all duration-300 active:scale-95"
        aria-label="Abrir ORION"
      >
        <Zap className="h-5 w-5 text-primary-foreground" />
      </button>
    </div>
  );
}
