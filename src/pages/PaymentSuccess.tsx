import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "success" | "password" | "logging-in";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const purchaseId = searchParams.get("purchase_id");

  const [step, setStep] = useState<Step>("success");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = () => {
    setStep("password");
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      // Set the password via edge function
      const response = await supabase.functions.invoke("set-initial-password", {
        body: { purchase_id: purchaseId, password },
      });

      // Handle edge function errors properly
      if (response.error) {
        // Try to extract the real error message from the response
        let errorMsg = "Erro ao definir senha. Tente novamente.";
        try {
          if (response.error.context) {
            const body = await response.error.context.json();
            if (body?.error) errorMsg = body.error;
          }
        } catch {}
        throw new Error(errorMsg);
      }

      const data = response.data;
      if (data?.error) throw new Error(data.error);

      const email = data.email;
      toast.success("Senha definida com sucesso!");

      // Auto-login
      setStep("logging-in");
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        toast.error("Erro ao fazer login. Tente manualmente.");
        navigate("/auth");

        return;
      }

      toast.success("Bem-vindo ao FlowSpecta!");
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Erro ao definir senha. Tente novamente.");
      setLoading(false);
    }
  };

  if (!purchaseId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Compra não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        {/* Step: Success */}
        {step === "success" && (
          <>
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Pagamento confirmado!
              </h1>
              <p className="text-muted-foreground">
                Sua assinatura do FlowSpecta foi ativada com sucesso. Agora vamos
                criar sua conta para você acessar a plataforma.
              </p>
            </div>

            <button
              onClick={handleCreateAccount}
              className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-primary hover:opacity-90 transition-all apple-ease flex items-center justify-center gap-2"
            >
              Criar minha conta
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Step: Set Password */}
        {step === "password" && (
          <>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Lock className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Defina sua senha
              </h1>
              <p className="text-sm text-muted-foreground">
                Crie uma senha para acessar sua conta no FlowSpecta
              </p>
            </div>

            <form onSubmit={handleSetPassword} className="glass-card p-6 space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                    autoFocus
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-primary hover:opacity-90 transition-all apple-ease flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    Acessar FlowSpecta
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Step: Logging in */}
        {step === "logging-in" && (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">
                Entrando na plataforma...
              </h1>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto configuramos tudo para você.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
