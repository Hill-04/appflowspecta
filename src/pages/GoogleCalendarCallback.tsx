import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMsg("Autorização negada pelo Google.");
      return;
    }

    if (!code || !session) {
      setStatus("error");
      setErrorMsg("Código de autorização não encontrado.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "google-calendar-auth?action=connect",
          {
            body: {
              code,
              redirect_uri: `${window.location.origin}/auth/google-calendar/callback`,
            },
          }
        );

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        setStatus("success");
        setTimeout(() => navigate("/app/profile", { replace: true }), 2000);
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setErrorMsg(err.message || "Erro ao conectar com Google Calendar.");
      }
    };

    exchangeCode();
  }, [searchParams, session, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md p-8">
        {status === "processing" && (
          <>
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Conectando Google Calendar...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-4xl">✅</div>
            <p className="text-foreground font-semibold">Google Calendar conectado!</p>
            <p className="text-muted-foreground text-sm">Redirecionando...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl">❌</div>
            <p className="text-foreground font-semibold">Erro na conexão</p>
            <p className="text-muted-foreground text-sm">{errorMsg}</p>
            <button
              onClick={() => navigate("/app", { replace: true })}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Voltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
