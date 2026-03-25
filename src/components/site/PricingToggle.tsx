import { cn } from "@/lib/utils";

interface PricingToggleProps {
  period: "monthly" | "annual";
  onChange: (period: "monthly" | "annual") => void;
}

export function PricingToggle({ period, onChange }: PricingToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-sm">
      <button
        onClick={() => onChange("monthly")}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-medium transition-all duration-300",
          period === "monthly"
            ? "gradient-blue text-primary-foreground shadow-[0_0_12px_-3px_hsl(205_90%_54%/0.3)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Mensal
      </button>
      <button
        onClick={() => onChange("annual")}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2",
          period === "annual"
            ? "gradient-blue text-primary-foreground shadow-[0_0_12px_-3px_hsl(205_90%_54%/0.3)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Anual
        <span className="text-[10px] font-bold bg-white/20 rounded-full px-2 py-0.5">
          -17%
        </span>
      </button>
    </div>
  );
}
