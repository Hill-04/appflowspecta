import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const body = await req.json();

    if (!body.campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership via service_role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: campaign } = await supabaseAdmin
      .from("campaigns")
      .select("user_id")
      .eq("id", body.campaign_id)
      .single();

    if (!campaign || campaign.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt
    const stepsText = (body.steps || [])
      .map((s: any) =>
        `- ${s.step_name}: ${s.leads_count} leads | ${s.conversion_rate}% conversão | média ${s.avg_days_in_step} dias nesta etapa`
      )
      .join("\n");

    const userPrompt = `Analise esta campanha de prospecção e retorne o diagnóstico em JSON:

Campanha: ${body.campaign_name || "sem nome"}
Negócio: ${body.user_profile?.offer_type || "não informado"}
Público: ${body.user_profile?.target_audience || "não informado"}
Canal: ${body.user_profile?.contact_channel || "não informado"}
Dias ativa: ${body.days_active || 0}
Total de leads: ${body.total_leads || 0}
Convertidos: ${body.converted || 0}
Taxa geral de conversão: ${body.overall_conversion_rate || 0}%

Etapas do funil (em ordem):
${stepsText || "Nenhuma etapa definida"}

Retorne APENAS este JSON (sem markdown, sem texto fora do JSON):
{
  "gargalo_principal": "nome exato da etapa com maior perda de leads",
  "motivo_provavel": "explicação em 1 frase curta e direta",
  "acao_recomendada": "o que fazer agora em 1 frase acionável",
  "score_funil": número de 0 a 100,
  "status": "critico" ou "atencao" ou "saudavel"
}

Critério de score:
- 0-39: critico (funil com problemas graves)
- 40-69: atencao (funil funcionando mas com oportunidades claras)
- 70-100: saudavel (funil performando bem)`;

    const systemPrompt = `Você é o ORION, especialista em análise de funis de prospecção.
Analise os dados da campanha fornecidos e retorne APENAS um JSON válido,
sem texto adicional, sem markdown, sem explicações fora do JSON.

Seu diagnóstico deve ser cirúrgico, específico e acionável.
Considere o perfil do negócio do usuário ao formular a ação recomendada.
Seja direto — o usuário precisa saber o que fazer agora, não teoria.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || "";

    let insight;
    try {
      const cleaned = rawContent.replace(/```json|```/g, "").trim();
      insight = JSON.parse(cleaned);
    } catch {
      insight = {
        gargalo_principal: "Dados insuficientes",
        motivo_provavel: "Não foi possível analisar o funil no momento.",
        acao_recomendada: "Adicione mais leads à campanha para análise precisa.",
        score_funil: 50,
        status: "atencao",
      };
    }

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("orion-campaign-insight error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
