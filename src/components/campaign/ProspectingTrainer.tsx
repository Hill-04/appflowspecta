import { Users, Play, ArrowRight, MessageCircle } from "lucide-react";
import { Campaign } from "@/hooks/useStore";

interface Props {
  campaign: Campaign;
  onAddLead: () => void;
  onGoToProspecting: () => void;
  onGoToLeads: () => void;
}

interface Step {
  number: number;
  title: string;
  message: string;
  icon: React.ElementType;
  buttons: { label: string; action: () => void; variant: "primary" | "secondary" }[];
}

function getStep(props: Props): Step {
  const { campaign, onAddLead, onGoToProspecting, onGoToLeads } = props;
  const pendingCount = campaign.leads.filter((clf) => clf.campaignLead.status === "pending").length;

  // Priority 1: No leads yet
  if (campaign.leads.length === 0) {
    return {
      number: 1,
      title: "Monte sua lista de leads",
      message: "Vincule leads existentes ou crie novos para começar a prospectar nesta campanha.",
      icon: Users,
      buttons: [{ label: "Vincular Lead", action: onAddLead, variant: "primary" }],
    };
  }

  // Priority 2: Has leads but not started
  if (campaign.prospectingStatus === "not_started") {
    return {
      number: 2,
      title: "Inicie a abordagem",
      message: "Sua lista está pronta. Use seus scripts para começar a abordar.",
      icon: Play,
      buttons: [{ label: "Iniciar Prospecção", action: onGoToProspecting, variant: "primary" }],
    };
  }

  // Priority 3: In progress
  if (campaign.prospectingStatus === "in_progress") {
    return {
      number: 3,
      title: "Continue a prospecção",
      message: `Continue de onde parou. Você tem ${pendingCount} lead${pendingCount !== 1 ? "s" : ""} restante${pendingCount !== 1 ? "s" : ""}.`,
      icon: ArrowRight,
      buttons: [{ label: "Continuar Prospecção", action: onGoToProspecting, variant: "primary" }],
    };
  }

  // Priority 4: Leads responding — never disappears
  return {
    number: 4,
    title: "Leads responderam",
    message: "Sua campanha está em andamento. Continue abordando novos leads e acompanhando respostas.",
    icon: MessageCircle,
    buttons: [
      { label: "Continuar Prospecção", action: onGoToProspecting, variant: "secondary" },
      { label: "Ver Leads Ativos", action: onGoToLeads, variant: "primary" },
    ],
  };
}

export function ProspectingTrainer(props: Props) {
  const step = getStep(props);
  const Icon = step.icon;

  return (
    <div className="glass-card border-l-4 border-l-primary p-4 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {step.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{step.message}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {step.buttons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                btn.variant === "primary"
                  ? "gradient-primary text-primary-foreground hover:opacity-90"
                  : "border border-border text-foreground hover:bg-secondary"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
