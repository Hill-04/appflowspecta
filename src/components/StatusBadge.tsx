import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "bg-success/10 text-success border-success/15" },
  paused: { label: "Pausada", className: "bg-warning/10 text-warning border-warning/15" },
  completed: { label: "Concluída", className: "bg-white/[0.04] text-muted-foreground border-white/[0.06]" },
  pending: { label: "Pendente", className: "bg-white/[0.04] text-muted-foreground border-white/[0.06]" },
  contacted: { label: "Contatado", className: "bg-primary/10 text-primary border-primary/15" },
  interested: { label: "Interessado", className: "bg-success/10 text-success border-success/15" },
  info_requested: { label: "Pediu info", className: "bg-warning/10 text-warning border-warning/15" },
  not_interested: { label: "Não interessado", className: "bg-destructive/10 text-destructive border-destructive/15" },
  no_response: { label: "Sem resposta", className: "bg-white/[0.04] text-muted-foreground border-white/[0.06]" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: "bg-white/[0.04] text-muted-foreground border-white/[0.06]" };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
