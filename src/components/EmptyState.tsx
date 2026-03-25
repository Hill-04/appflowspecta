import { LucideIcon, Plus } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass-surface mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-blue shadow-[inset_0_1px_0_hsl(0_0%_100%/0.1)]">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1 tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl gradient-blue px-5 py-2.5 text-sm font-medium text-white transition-all duration-250 apple-ease hover:scale-[1.02] hover:shadow-[0_0_20px_-3px_hsl(205_90%_54%/0.4)] active:scale-[0.98] border border-white/[0.1]"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
