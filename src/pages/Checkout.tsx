import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { ArrowLeft, Shield, Check, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCheckoutOrigin, getBackDestination } from "@/hooks/useCheckoutOrigin";
import { useConversionTracking } from "@/hooks/useConversionTracking";

const plans = [
  { id: "starter", name: "Starter", monthlyPrice: 49, annualPrice: Math.round(49 * 12 * 0.83) },
  { id: "growth", name: "Growth", monthlyPrice: 69, annualPrice: Math.round(69 * 12 * 0.83) },
  { id: "scale", name: "Scale", monthlyPrice: 147, annualPrice: Math.round(147 * 12 * 0.83) },
];

type CheckoutStep = "email" | "payment" | "processing" | "success" | "pix";

const STORAGE_KEY = "checkout_state";
const PIX_EXPIRY_MINUTES = 30;

function loadCheckoutState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCheckoutState(state: Record<string, any>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get("plan") || "starter";
  const period = (searchParams.get("period") as "monthly" | "annual") || "monthly";
  const origin = useCheckoutOrigin();
  const backDestination = getBackDestination(origin);
  const { trackInitiateCheckout, trackAddPaymentInfo, trackPurchase } = useConversionTracking();

  const plan = plans.find((p) => p.id === planId);
  const basePrice = plan ? (period === "annual" ? plan.annualPrice : plan.monthlyPrice) : 0;
  const monthlyEquivalent = period === "annual" && plan ? Math.round(plan.annualPrice / 12) : null;

  const saved = loadCheckoutState();
  const [email, setEmail] = useState(() => saved?.email || "");
  const [step, setStep] = useState<CheckoutStep>(() => (saved?.email ? "payment" : "email"));
  const [mpReady, setMpReady] = useState(false);
  const [mpInitialized, setMpInitialized] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount_type: string; discount_percent: number; discount_amount: number; final_amount: number | null } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Pix polling
  const [pixTimer, setPixTimer] = useState(PIX_EXPIRY_MINUTES * 60);
  const pixIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pixTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finalPrice = couponApplied
    ? (couponApplied.final_amount !== null ? couponApplied.final_amount : 
       couponApplied.discount_type === "amount" 
         ? Math.max(0, Math.round((basePrice - couponApplied.discount_amount) * 100) / 100)
         : Math.round(basePrice * (1 - couponApplied.discount_percent / 100) * 100) / 100)
    : basePrice;
  const isFree = finalPrice <= 0;

  useEffect(() => {
    saveCheckoutState({ email, plan: planId, period, origin });
  }, [email, planId, period]);

  useEffect(() => {
    if (mpInitialized) return;
    const init = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("mp-public-key");
        if (error || !data?.public_key) {
          toast.error("Erro ao carregar checkout. Tente novamente.");
          return;
        }
        initMercadoPago(data.public_key, { locale: "pt-BR" });
        setMpInitialized(true);
      } catch {
        toast.error("Erro ao inicializar pagamento.");
      }
    };
    init();
  }, [mpInitialized]);

  // Pix polling effect
  useEffect(() => {
    if (step !== "pix" || !purchaseId) return;

    pixIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("check-pix-status", {
          body: { purchase_id: purchaseId },
        });
        if (data?.approved) {
          sessionStorage.removeItem(STORAGE_KEY);
          trackPurchase(planId, finalPrice, email);
          toast.success("Pagamento Pix confirmado!");
          setStep("success");
          setTimeout(() => navigate("/payment-success?purchase_id=" + purchaseId), 2000);
        }
      } catch {
        // silently retry
      }
    }, 5000);

    pixTimerRef.current = setInterval(() => {
      setPixTimer((prev) => {
        if (prev <= 1) {
          toast.error("Tempo do Pix expirado. Tente novamente.");
          setStep("payment");
          return PIX_EXPIRY_MINUTES * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (pixIntervalRef.current) clearInterval(pixIntervalRef.current);
      if (pixTimerRef.current) clearInterval(pixTimerRef.current);
    };
  }, [step, purchaseId]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { code: couponCode.trim(), plan: planId, billing_period: period },
      });
      if (error) throw error;
      if (data?.valid) {
        const discountLabel = data.discount_type === "amount" 
          ? `R$ ${data.discount_amount} de desconto`
          : `${data.discount_percent}% de desconto`;
        setCouponApplied({
          code: couponCode.trim().toUpperCase(),
          discount_type: data.discount_type,
          discount_percent: data.discount_percent,
          discount_amount: data.discount_amount,
          final_amount: data.final_amount,
        });
        toast.success(`Cupom aplicado! ${discountLabel}`);
      } else {
        toast.error(data?.reason || "Cupom inválido");
      }
    } catch {
      toast.error("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("E-mail inválido");
      return;
    }
    saveCheckoutState({ email, plan: planId, period, origin });
    setStep("payment");
    trackInitiateCheckout(planId, finalPrice);
  };

  const handleFreeCouponActivation = async () => {
    setStep("processing");
    try {
      const { data, error } = await supabase.functions.invoke("mp-process-payment", {
        body: {
          email: email.toLowerCase().trim(),
          plan: planId,
          billing_period: period,
          coupon_code: couponApplied?.code,
          free_coupon: true,
        },
      });
      if (error) throw error;
      if (data.status === "approved") {
        sessionStorage.removeItem(STORAGE_KEY);
        trackPurchase(planId, 0, email);
        setStep("success");
        toast.success("Plano ativado com sucesso!");
        setTimeout(() => navigate("/payment-success?purchase_id=" + data.purchase_id), 2000);
      } else {
        throw new Error("Erro ao ativar plano");
      }
    } catch (err: any) {
      toast.error("Erro ao ativar plano: " + (err.message || "Tente novamente"));
      setStep("payment");
    }
  };

  const handlePaymentSubmit = useCallback(
    async ({ selectedPaymentMethod, formData }: any) => {
      trackAddPaymentInfo(planId);
      setStep("processing");
      try {
        const { data, error } = await supabase.functions.invoke("mp-process-payment", {
          body: {
            formData,
            email: email.toLowerCase().trim(),
            plan: planId,
            billing_period: period,
            coupon_code: couponApplied?.code || null,
          },
        });

        if (error) throw error;

        if (data.status === "approved") {
          sessionStorage.removeItem(STORAGE_KEY);
          trackPurchase(planId, finalPrice, email);
          setStep("success");
          toast.success("Pagamento aprovado!");
          setTimeout(() => navigate("/payment-success?purchase_id=" + data.purchase_id), 2000);
        } else if (data.status === "pending" && data.point_of_interaction?.transaction_data) {
          setPurchaseId(data.purchase_id);
          setPixData(data.point_of_interaction.transaction_data);
          setPixTimer(PIX_EXPIRY_MINUTES * 60);
          setStep("pix");
        } else if (data.status === "rejected") {
          toast.error("Pagamento recusado. Tente outro método.");
          setStep("payment");
        } else {
          toast.info("Pagamento pendente. Você receberá a confirmação por e-mail.");
          navigate("/pricing?payment_pending=true");
        }
      } catch (err: any) {
        toast.error("Erro ao processar pagamento: " + (err.message || "Tente novamente"));
        setStep("payment");
      }
    },
    [email, planId, period, navigate, trackAddPaymentInfo, trackPurchase, finalPrice, couponApplied]
  );

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Plano não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backDestination)}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos planos
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Pagamento seguro
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Finalizar assinatura</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha seus dados para ativar o plano
              </p>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-3 text-sm">
              <div
                className={cn(
                  "flex items-center gap-1.5 font-medium transition-colors",
                  step === "email" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                    step === "email"
                      ? "gradient-primary text-primary-foreground glow-primary-sm"
                      : "bg-primary/20 text-primary"
                  )}
                >
                  {step !== "email" ? <Check className="h-3.5 w-3.5" /> : "1"}
                </span>
                E-mail
              </div>
              <div className="h-px w-8 bg-border" />
              <div
                className={cn(
                  "flex items-center gap-1.5 font-medium transition-colors",
                  step === "payment" || step === "processing"
                    ? "text-primary"
                    : step === "success" || step === "pix"
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                    step === "payment" || step === "processing"
                      ? "gradient-primary text-primary-foreground glow-primary-sm"
                      : step === "success" || step === "pix"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground/50"
                  )}
                >
                  {step === "success" ? <Check className="h-3.5 w-3.5" /> : "2"}
                </span>
                Pagamento
              </div>
            </div>

            {/* Step: Email */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
                <div className="glass-card p-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Seu melhor e-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-base"
                      autoFocus
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Este e-mail será usado para criar sua conta após o pagamento.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-primary hover:opacity-90 transition-all apple-ease"
                  >
                    Continuar para pagamento
                  </button>
                </div>
              </form>
            )}

            {/* Step: Payment Brick (or Free Coupon) */}
            {step === "payment" && mpInitialized && (
              <div className="glass-card p-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Pagando como <strong className="text-foreground">{email}</strong>
                  </p>
                  <button
                    className="text-xs text-primary hover:underline font-medium"
                    onClick={() => setStep("email")}
                  >
                    Alterar
                  </button>
                </div>

                {isFree ? (
                  <div className="space-y-4 text-center py-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
                      <Tag className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-foreground font-bold text-lg">Cupom de 100% aplicado!</p>
                    <p className="text-sm text-muted-foreground">Clique abaixo para ativar seu plano gratuitamente.</p>
                    <button
                      onClick={handleFreeCouponActivation}
                      className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-primary hover:opacity-90 transition-all apple-ease"
                    >
                      Ativar plano grátis
                    </button>
                  </div>
                ) : (
                  <Payment
                    initialization={{
                      amount: finalPrice,
                    }}
                    customization={{
                      paymentMethods: {
                        creditCard: "all",
                        bankTransfer: "all",
                        maxInstallments: period === "annual" ? 12 : 1,
                      },
                      visual: {
                        style: {
                          theme: "dark",
                        },
                      },
                    }}
                    onSubmit={handlePaymentSubmit}
                    onReady={() => setMpReady(true)}
                    onError={(error: any) => {
                      console.error("Payment Brick error:", error);
                      toast.error("Erro no formulário de pagamento.");
                    }}
                  />
                )}
              </div>
            )}

            {/* Step: Processing */}
            {step === "processing" && (
              <div className="glass-card p-12 flex flex-col items-center gap-4 animate-fade-in">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-foreground font-medium">Processando pagamento...</p>
                <p className="text-sm text-muted-foreground">Não feche esta página.</p>
              </div>
            )}

            {/* Step: Success */}
            {step === "success" && (
              <div className="glass-card p-12 flex flex-col items-center gap-4 animate-fade-in">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-7 w-7 text-primary" />
                </div>
                <p className="text-foreground font-bold text-lg">Pagamento aprovado!</p>
                <p className="text-sm text-muted-foreground">Redirecionando...</p>
              </div>
            )}

            {/* Step: Pix */}
            {step === "pix" && pixData && (
              <div className="glass-card p-6 space-y-4 text-center animate-fade-in">
                <p className="text-foreground font-bold text-lg">Pague com Pix</p>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código abaixo
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando pagamento • {formatTimer(pixTimer)}
                </div>
                {pixData.qr_code_base64 && (
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code Pix"
                    className="mx-auto w-48 h-48 rounded-lg"
                  />
                )}
                {pixData.qr_code && (
                  <div className="space-y-2">
                    <Input value={pixData.qr_code} readOnly className="text-xs" />
                    <button
                      className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-all apple-ease"
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.qr_code);
                        toast.success("Código Pix copiado!");
                      }}
                    >
                      Copiar código
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  O pagamento será detectado automaticamente. Não feche esta página.
                </p>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 space-y-4 sticky top-20">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Resumo do pedido
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">FlowSpecta {plan.name}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {period === "annual" ? "Anual" : "Mensal"}
                    </Badge>
                  </div>
                  <p className="font-bold text-foreground text-lg">
                    R${basePrice}
                  </p>
                </div>

                {monthlyEquivalent && !couponApplied && (
                  <p className="text-xs text-muted-foreground">
                    ≈ R${monthlyEquivalent}/mês
                  </p>
                )}

                {/* Coupon section */}
                {step !== "email" && (
                  <div className="space-y-2 pt-1">
                    {couponApplied ? (
                      <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium text-primary">
                            {couponApplied.code} ({couponApplied.discount_type === "amount" ? `-R$${couponApplied.discount_amount}` : `-${couponApplied.discount_percent}%`})
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Cupom de desconto"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="h-9 text-sm"
                          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="shrink-0"
                        >
                          {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aplicar"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {couponApplied && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-primary font-medium">
                      -R${(basePrice - finalPrice).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}

                <div className="h-px bg-border/50" />

                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Total</span>
                  <span className="text-lg">
                    {isFree ? (
                      <span className="text-primary">Grátis</span>
                    ) : (
                      <>
                        R${finalPrice.toFixed(2).replace('.', ',')}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          /{period === "annual" ? "ano" : "mês"}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Pagamento processado com segurança pelo Mercado Pago</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Acesso imediato após confirmação</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
