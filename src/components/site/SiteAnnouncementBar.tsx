import { useState } from "react";
import { X, Rocket } from "lucide-react";

export function SiteAnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
        height: "40px",
      }}
      className="relative flex items-center justify-center px-10 z-50"
    >
      <div className="flex items-center gap-2 text-white text-[13px] font-medium">
        <Rocket className="h-3.5 w-3.5 shrink-0" />
        <span>
          Novo: Insights de IA disponíveis —{" "}
          <button className="underline underline-offset-2 hover:no-underline font-semibold transition-all">
            Ver novidade →
          </button>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Fechar aviso"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
