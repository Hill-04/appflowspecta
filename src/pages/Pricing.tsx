import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, Crown, Zap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: Math.round(49 * 12 * 0.83),
    icon: Rocket,
    description: "Ideal para profissionais individuais começando a prospectar",
    features: [
      "2 campanhas ativas",
      "1 público salvo",
      "Funil personalizado",
      "Kanban completo",
      "Scripts básicos",
      "Templates de leads",
      "Métricas básicas",
      "Suporte por email",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 69,
    annualPrice: Math.round(69 * 12 * 0.83),
    icon: Zap,
    popular: true,
    description: "Para quem quer escalar com inteligência",
    features: [
      "Tudo do Starter +",
      "10 campanhas ativas",
      "5 públicos salvos",
      "Insights cross-campaign",
      "Biblioteca de objeções",
      "Copilot IA avançado",
      "Edição de valor de deal",
      "Suporte por email + chat",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 147,
    annualPrice: Math.round(147 * 12 * 0.83),
    icon: Crown,
    description: "Para operações avançadas com automação completa",
    features: [
      "Tudo do Growth +",
      "Campanhas ilimitadas",
      "Públicos ilimitados",
      "Automações avançadas",
      "Exportação de dados",
      "Integrações API",
      "Copilot IA ilimitado",
      "Suporte prioritário",
    ],
  },
];

export default function Pricing() {
  const [currentPlan] = useState<string | null>(null);
  const [loading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasNoPlan = !currentPlan && !loading;

  // Handle redirect results
  useState(() => {
    if (searchParams.get("payment_failed") === "true") {
      toast.error("Pagamento não foi aprovado. Tente novamente.");
    }
    if (searchParams.get("payment_pending") === "true") {
      toast.info("Pagamento pendente. Você receberá a confirmação por e-mail.");
    }
  });

  const handleSelectPlan = (planId: string) => {
    if (currentPlan === planId) return;
    navigate(`/checkout?plan=${planId}&period=${billingPeriod}&origin=app`);

  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/app")}
        className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {hasNoPlan ? "Assine para acessar o FlowSpecta" : "Escolha seu plano"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {hasNoPlan
            ? "Para utilizar a plataforma, escolha um dos planos abaixo"
            : "Desbloqueie recursos avançados para escalar sua prospecção"}
        </p>

        {/* Billing Period Toggle */}
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              billingPeriod === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              billingPeriod === "annual"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anual
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
              -17%
            </Badge>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const Icon = p.icon;
          const isCurrent = currentPlan === p.id;
          const price = billingPeriod === "annual" ? p.annualPrice : p.monthlyPrice;
          const monthlyEquivalent = billingPeriod === "annual" ? Math.round(p.annualPrice / 12) : null;

          return (
            <Card
              key={p.id}
              className={cn(
                "relative flex flex-col transition-all",
                p.popular && "border-primary glow-primary",
                isCurrent && "border-primary/50"
              )}
            >
              {p.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground">
                  Mais popular
                </Badge>
              )}
              {isCurrent && (
                <Badge variant="outline" className="absolute -top-3 right-4 border-primary text-primary">
                  Plano atual
                </Badge>
              )}

              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <CardDescription className="text-xs">{p.description}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold">R${price}</span>
                  <span className="text-muted-foreground text-sm">
                    /{billingPeriod === "annual" ? "ano" : "mês"}
                  </span>
                  {monthlyEquivalent && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ≈ R${monthlyEquivalent}/mês
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano atual
                  </Button>
                ) : (
                  <Button
                    className={cn("w-full", p.popular && "gradient-primary")}
                    onClick={() => handleSelectPlan(p.id)}
                    disabled={loading}
                  >
                    Assinar
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
