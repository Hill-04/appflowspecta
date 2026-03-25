import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn(
      "glass-surface p-5 animate-slide-up hover:scale-[1.015] hover:border-white/[0.1] transition-all duration-250 apple-ease",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-blue shadow-[inset_0_1px_0_hsl(0_0%_100%/0.1)]">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
      {trend && <p className="text-xs text-primary mt-1.5 font-medium">{trend}</p>}
    </div>
  );
}
