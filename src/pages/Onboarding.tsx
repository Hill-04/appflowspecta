import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Rocket, Loader2, Wand2, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import OnboardingPreview from "@/components/onboarding/OnboardingPreview";
import { useStore } from "@/hooks/useStore";
import { OnboardingProfile } from "@/lib/onboardingGenerator";
import ScriptChat from "@/components/script/ScriptChat";

const OFFER_OPTIONS = [
  { value: "servico", label: "Prestando um serviço para clientes" },
  { value: "produto_fisico", label: "Vendendo um produto físico" },
  { value: "produto_digital", label: "Vendendo um produto digital" },
  { value: "contratos", label: "Fechando contratos ou planos mensais" },
  { value: "personalizado", label: "Fazendo algo personalizado para cada cliente" },
];

const MATURITY_OPTIONS = [
  { value: "iniciante", label: "Ainda não fechei clientes" },
  { value: "intermediario", label: "Já fechei alguns" },
  { value: "avancado", label: "Já trabalho com vários clientes" },
];

const CHANNEL_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "reuniao", label: "Reunião online" },
  { value: "ligacao", label: "Ligação" },
  { value: "presencial", label: "Presencial" },
];

const TICKET_OPTIONS = [
  { value: "ate_500", label: "Até R$500" },
  { value: "500_2000", label: "R$500 – R$2.000" },
  { value: "2000_5000", label: "R$2.000 – R$5.000" },
  { value: "acima_5000", label: "Acima de R$5.000" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState(1);
  const [finishing, setFinishing] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [showCopilot, setShowCopilot] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile>({});

  const update = (field: keyof OnboardingProfile, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 2: return !!profile.offerType;
      case 3: return !!profile.targetAudienceDescription && profile.targetAudienceDescription.trim().length >= 3;
      case 4: return !!profile.mainPain && profile.mainPain.trim().length >= 3;
      case 5: return !!profile.differential && profile.differential.trim().length >= 3;
      case 6: return !!profile.maturityLevel;
      case 7: return !!profile.contactChannel;
      case 8: return !!profile.averageTicket;
      default: return true;
    }
  };

  const next = async () => {
    if (step < 9) {
      setStep(step + 1);
      if (step + 1 === 9) {
        setFinishing(true);
        try {
          const cId = await completeOnboarding(profile);
          setCampaignId(cId);
          await new Promise((r) => setTimeout(r, 1500));
          setStep(10); // Go to step 10 instead of navigating
          setFinishing(false);
        } catch {
          navigate("/app");
        }
      }
    }
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const showPreview = step >= 2 && step <= 8;
  const destination = campaignId ? `/campaigns/${campaignId}` : "/";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {step > 1 && step < 9 && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
          <div
            className="h-full gradient-primary transition-all duration-500"
            style={{ width: `${((step - 1) / 8) * 100}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {step === 1 && <WelcomeScreen onStart={() => setStep(2)} />}

        {step === 9 && <FinishingScreen />}

        {step === 10 && !showCopilot && (
          <div className="text-center space-y-8 max-w-lg animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15">
              <Rocket className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Sua máquina está pronta!</h1>
              <p className="text-muted-foreground">Quer criar seu primeiro script personalizado com IA?</p>
            </div>
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              <button
                onClick={() => setShowCopilot(true)}
                className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-left hover:bg-primary/10 transition"
              >
                <Wand2 className="h-5 w-5 text-primary" />
                <div>
                 <p className="text-sm font-medium text-foreground">Criar com o Copiloto</p>
                  <p className="text-xs text-muted-foreground">IA conversa com você e monta o script sob medida</p>
                </div>
              </button>
              <button
                onClick={() => navigate(destination)}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4 text-left hover:bg-secondary transition"
              >
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Usar scripts automáticos</p>
                  <p className="text-xs text-muted-foreground">Já criamos scripts baseados no seu perfil</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 10 && showCopilot && (
          <div className="w-full max-w-4xl">
            <ScriptChat
              fullscreen
              onComplete={() => navigate(destination)}
            />
          </div>
        )}

        {showPreview && (
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* Question side */}
            <div className="flex flex-col justify-center space-y-6 animate-fade-in" key={step}>
              <StepQuestion step={step} profile={profile} update={update} />

              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    onClick={back}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                )}
                <button
                  onClick={next}
                  disabled={!canAdvance()}
                  className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Preview side */}
            <div className="flex flex-col justify-center">
              <OnboardingPreview profile={profile} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center space-y-6 max-w-lg animate-fade-in">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary glow-primary">
        <Rocket className="h-8 w-8 text-primary-foreground" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
        Vamos montar sua máquina de prospecção
      </h1>
      <p className="text-muted-foreground text-lg">
        Algumas perguntas rápidas e o app cria tudo para você: públicos, scripts e sua primeira campanha.
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-lg gradient-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:opacity-90 glow-primary transition"
      >
        Começar <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function FinishingScreen() {
  return (
    <div className="text-center space-y-6 max-w-lg animate-fade-in">
      <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
      <h2 className="text-2xl font-bold text-foreground">
        Perfeito. O app já está montando sua estrutura.
      </h2>
      <div className="space-y-3 max-w-sm mx-auto">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function StepQuestion({
  step,
  profile,
  update,
}: {
  step: number;
  profile: OnboardingProfile;
  update: (field: keyof OnboardingProfile, value: string) => void;
}) {
  switch (step) {
    case 2:
      return (
        <QuestionWithOptions
          question="Como você ganha dinheiro hoje?"
          options={OFFER_OPTIONS}
          value={profile.offerType || ""}
          onChange={(v) => update("offerType", v)}
        />
      );
    case 3:
      return (
        <QuestionWithText
          question="Que tipo de pessoa ou empresa normalmente paga pelo que você faz?"
          placeholder="Ex: Dentistas, Lojas de roupa, Clínicas, Restaurantes, Infoprodutores…"
          value={profile.targetAudienceDescription || ""}
          onChange={(v) => update("targetAudienceDescription", v)}
        />
      );
    case 4:
      return (
        <QuestionWithText
          question="Por que esse tipo de cliente precisa de você?"
          placeholder="Ex: não conseguem clientes, não sabem vender, não têm tempo, não têm presença online…"
          value={profile.mainPain || ""}
          onChange={(v) => update("mainPain", v)}
        />
      );
    case 5:
      return (
        <QuestionWithText
          question="O que você faz que a maioria dos outros não faz?"
          placeholder="Descreva seu diferencial..."
          value={profile.differential || ""}
          onChange={(v) => update("differential", v)}
        />
      );
    case 6:
      return (
        <QuestionWithOptions
          question="Em que momento você está hoje?"
          options={MATURITY_OPTIONS}
          value={profile.maturityLevel || ""}
          onChange={(v) => update("maturityLevel", v)}
        />
      );
    case 7:
      return (
        <QuestionWithOptions
          question="Quando alguém se interessa, onde a conversa acontece?"
          options={CHANNEL_OPTIONS}
          value={profile.contactChannel || ""}
          onChange={(v) => update("contactChannel", v)}
        />
      );
    case 8:
      return (
        <QuestionWithOptions
          question="Em média, quanto um cliente paga para você?"
          options={TICKET_OPTIONS}
          value={profile.averageTicket || ""}
          onChange={(v) => update("averageTicket", v)}
        />
      );
    default:
      return null;
  }
}

function QuestionWithOptions({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">{question}</h2>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left rounded-lg border px-4 py-3.5 text-sm font-medium transition ${
              value === opt.value
                ? "border-primary bg-primary/10 text-foreground glow-primary-sm"
                : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionWithText({
  question,
  placeholder,
  value,
  onChange,
}: {
  question: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">{question}</h2>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px] bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
        maxLength={500}
      />
    </div>
  );
}
