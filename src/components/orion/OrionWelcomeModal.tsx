import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Users, Target, LayoutDashboard, ArrowRight } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";

function formatName(name?: string | null, treatment?: string | null): string {
  if (!name) return "";
  if (treatment === "senhor") return `Senhor ${name}`;
  if (treatment === "senhora") return `Senhora ${name}`;
  return name;
}

export default function OrionWelcomeModal() {
  const { profileData, markOrionWelcomed } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<"intro" | "actions">("intro");

  const displayName = formatName(
    profileData?.preferredName || profileData?.firstName,
    profileData?.treatmentType
  );

  const handleNavigate = async (path: string) => {
    await markOrionWelcomed();
    navigate(path);
  };

  const handleDismiss = async () => {
    await markOrionWelcomed();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-lg animate-in fade-in duration-500">
      <div className="relative w-full max-w-lg mx-4 glass-surface-elevated p-8 sm:p-10 animate-in zoom-in-[0.96] duration-500">
        {/* ORION glow icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div className="relative h-14 w-14 rounded-full gradient-blue flex items-center justify-center border border-white/[0.1] shadow-[0_0_30px_-5px_hsl(205_90%_54%/0.4)]">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
        </div>

        {step === "intro" ? (
          <>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                {displayName ? `Ola, ${displayName}.` : "Ola."}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
                Eu sou o ORION — seu assistente estrategico dentro do FlowSpecta.
                Estou aqui para ajudar voce a organizar seus leads e transformar
                oportunidades em crescimento real.
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <Button onClick={() => setStep("actions")} className="gap-2">
                Iniciar configuracao guiada
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-foreground text-center mb-6">
              Por onde deseja comecar?
            </h3>
            <div className="grid gap-3">
              <ActionCard
                icon={<Users className="h-5 w-5 text-primary" />}
                title="Criar primeiro Lead"
                description="Cadastre um contato para iniciar sua operacao."
                onClick={() => handleNavigate("/app/leads")}
              />
              <ActionCard
                icon={<Target className="h-5 w-5 text-primary" />}
                title="Criar primeira Campanha"
                description="Estruture sua estrategia de prospecao."
                onClick={() => handleNavigate("/app/campaigns/new")}
              />
              <ActionCard
                icon={<LayoutDashboard className="h-5 w-5 text-primary" />}
                title="Personalizar pipeline"
                description="Configure as etapas do seu funil de vendas."
                onClick={() => handleNavigate("/app")}
              />
            </div>
            <div className="mt-6 flex justify-center">
              <Button variant="ghost" onClick={handleDismiss} className="text-muted-foreground text-sm">
                Explorar por conta propria
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 group"
    >
      <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}
