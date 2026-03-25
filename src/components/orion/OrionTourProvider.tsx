import { createContext, useContext, useCallback, useMemo, ReactNode } from "react";
import { useStore } from "@/hooks/useStore";
import { useLocation } from "react-router-dom";

export interface TourStep {
  id: number;
  target: string | null;
  text: string;
  route: string | null;
  action: "button" | "wait" | "click-target";
  buttonLabel?: string;
}

interface OrionTourContextType {
  tourActive: boolean;
  currentStep: TourStep | null;
  stepIndex: number;
  advanceTour: () => void;
  skipTour: () => void;
}

const OrionTourContext = createContext<OrionTourContextType | null>(null);

export function useOrionTour() {
  return useContext(OrionTourContext);
}

function buildSteps(displayName: string): TourStep[] {
  return [
    {
      id: 0,
      target: null,
      text: `Olá${displayName ? `, ${displayName}` : ""}. Eu sou o ORION — seu assistente estratégico. Vou guiá-lo pela construção da sua primeira operação de prospecção.`,
      route: "/app",
      action: "button",
      buttonLabel: "Iniciar",
    },
    {
      id: 1,
      target: "new-campaign",
      text: "Este é o ponto de partida. Cada campanha representa uma operação de prospecção com público, funil e scripts próprios. Clique aqui para criar sua primeira.",
      route: "/app",
      action: "click-target",
    },
    {
      id: 2,
      target: "audience-section",
      text: "Aqui você define quem será abordado nesta campanha. Selecione um público existente ou crie um novo. Depois, clique em Próximo para avançar.",
      route: "/app/campaigns/new",
      action: "wait",
    },
    {
      id: 3,
      target: "funnel-section",
      text: "O funil organiza as fases da sua abordagem — do primeiro contato até a conversão. Personalize as etapas e clique em Próximo.",
      route: "/app/campaigns/new",
      action: "wait",
    },
    {
      id: 4,
      target: "campaign-name",
      text: "Dê um nome claro à sua campanha para identificá-la rapidamente. Preencha e clique em Criar Campanha.",
      route: "/app/campaigns/new",
      action: "wait",
    },
    {
      id: 5,
      target: "list-building-tab",
      text: "Aqui você alimenta a base de leads desta campanha. Adicione manualmente, importe CSV ou vincule leads existentes.",
      route: "/app/campaigns/",
      action: "button",
      buttonLabel: "Entendido",
    },
    {
      id: 6,
      target: null,
      text: "Sua primeira campanha está configurada. A partir de agora, sua operação de prospecção está em movimento. Estarei disponível sempre que precisar.",
      route: null,
      action: "button",
      buttonLabel: "Concluir",
    },
  ];
}

export function OrionTourProvider({ children }: { children: ReactNode }) {
  const { orionWelcomed, orionTourStep, profileData, setOrionTourStep, completeOrionTour, personalProfileCompleted, profileCompleted } = useStore();
  const location = useLocation();

  const displayName = useMemo(() => {
    const name = profileData?.preferredName || profileData?.firstName;
    if (!name) return "";
    const t = profileData?.treatmentType;
    if (t === "senhor") return `Senhor ${name}`;
    if (t === "senhora") return `Senhora ${name}`;
    return name;
  }, [profileData]);

  const steps = useMemo(() => buildSteps(displayName), [displayName]);

  const shouldShowTour = !orionWelcomed && personalProfileCompleted && profileCompleted === true;
  const tourActive = shouldShowTour && orionTourStep >= 0 && orionTourStep < steps.length;

  const currentStep = tourActive ? steps[orionTourStep] : null;

  const stepMatchesRoute = currentStep
    ? currentStep.route === null || (currentStep.route === "/app" ? location.pathname === "/app" : location.pathname.startsWith(currentStep.route))
    : false;

  const advanceTour = useCallback(() => {
    const next = orionTourStep + 1;
    if (next >= steps.length) {
      completeOrionTour();
    } else {
      setOrionTourStep(next);
    }
  }, [orionTourStep, steps.length, setOrionTourStep, completeOrionTour]);

  const skipTour = useCallback(() => {
    completeOrionTour();
  }, [completeOrionTour]);

  const value = useMemo(
    () => ({
      tourActive: tourActive && stepMatchesRoute,
      currentStep: stepMatchesRoute ? currentStep : null,
      stepIndex: orionTourStep,
      advanceTour,
      skipTour,
    }),
    [tourActive, stepMatchesRoute, currentStep, orionTourStep, advanceTour, skipTour]
  );

  return (
    <OrionTourContext.Provider value={value}>
      {children}
    </OrionTourContext.Provider>
  );
}
