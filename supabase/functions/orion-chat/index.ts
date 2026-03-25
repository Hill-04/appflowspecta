import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o ORION — assistente estratégico do FlowSpecta, uma plataforma de prospecção B2B.

Personalidade: Inspirado no J.A.R.V.I.S. — elegante, direto, sofisticado e estratégico. Nunca verborrágico. Respostas curtas e incisivas.

O FlowSpecta permite:
- Criar campanhas de prospecção com públicos-alvo, funis de mensagens e scripts
- Gerenciar leads em um Kanban por etapa do funil
- Construir listas de prospecção dentro de cada campanha
- Criar scripts de abordagem (abertura, follow-up, fechamento, objeções)
- Definir modelos de lead com campos personalizados
- Agendar eventos/follow-ups para cada lead
- Acompanhar métricas de conversão e performance

Regras:
- Responda sempre em português brasileiro
- Seja conciso (máximo 3 parágrafos)
- Se o usuário perguntar algo fora do escopo do FlowSpecta, redirecione educadamente
- Ofereça sugestões práticas quando possível
- Use linguagem profissional mas acessível`;

// ── helpers ──────────────────────────────────────────────────────────
function safe<T>(val: PromiseSettledResult<T>): T | null {
  return val.status === "fulfilled" ? val.value : null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// ── context builder ──────────────────────────────────────────────────
async function buildUserContext(userId: string): Promise<string> {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    const [profileRes, campaignsRes, leadsRes, stepsRes, goalsRes, progressRes] = await withTimeout(
      Promise.allSettled([
        supabaseAdmin.from("profiles").select("preferred_name, offer_type, target_audience_description, main_pain, differential, average_ticket, contact_channel, maturity_level, proof_results, positioning, strategic_notes").eq("id", userId).single(),
        supabaseAdmin.from("campaigns").select("id, name, status").eq("user_id", userId).eq("status", "active").limit(10),
        supabaseAdmin.from("campaign_leads").select("campaign_id, step_index, updated_at, archived_at, converted_at, current_step_id").eq("archived_at", null).gte("created_at", sevenDaysAgo),
        supabaseAdmin.from("message_steps").select("id, campaign_id, step_name, step_order, is_conversion"),
        supabaseAdmin.from("prospecting_goals").select("id, name, target, metric").eq("user_id", userId).eq("is_active", true),
        supabaseAdmin.from("prospecting_progress").select("goal_id, current_value").eq("user_id", userId).eq("date", today),
      ]),
      3000,
    );

    // ── profile ──
    const profile = safe(profileRes)?.data;
    let profileSection: string;
    if (profile) {
      profileSection = `PERFIL:
- Nome: ${profile.preferred_name || "usuário"}
- O que vende: ${profile.offer_type || "não informado"}
- Público-alvo: ${profile.target_audience_description || "não informado"}
- Dor principal do cliente: ${profile.main_pain || "não informado"}
- Diferencial: ${profile.differential || "não informado"}
- Ticket médio: ${profile.average_ticket || "não informado"}
- Canal de contato principal: ${profile.contact_channel || "não informado"}
- Nível de maturidade: ${profile.maturity_level || "não informado"}
- Provas e resultados: ${profile.proof_results || "não informado"}
- Posicionamento: ${profile.positioning || "não informado"}
- Notas estratégicas: ${profile.strategic_notes || "não informado"}`;
    } else {
      profileSection = "PERFIL: dados indisponíveis";
    }

    // ── campaigns + leads ──
    const campaigns = safe(campaignsRes)?.data ?? [];
    const allLeads = safe(leadsRes)?.data ?? [];
    const allSteps = safe(stepsRes)?.data ?? [];

    // Filter leads to only user's campaigns
    const campaignIds = new Set(campaigns.map((c: any) => c.id));
    const userLeads = allLeads.filter((l: any) => campaignIds.has(l.campaign_id));

    let campaignSection: string;
    let worstCampaign = "";
    if (campaigns.length > 0) {
      const lines: string[] = [];
      let worstRate = Infinity;
      for (const c of campaigns) {
        const cLeads = userLeads.filter((l: any) => l.campaign_id === c.id);
        const total = cLeads.length;
        const converted = cLeads.filter((l: any) => l.converted_at).length;
        const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
        lines.push(`- ${c.name}: ${total} leads | ${converted} convertidos | ${rate}% de conversão`);
        if (total > 0 && rate < worstRate) {
          worstRate = rate;
          worstCampaign = `${c.name} (${rate}% nos últimos 7 dias)`;
        }
      }
      campaignSection = `CAMPANHAS ATIVAS (${campaigns.length}):\n${lines.join("\n")}`;
    } else {
      campaignSection = "CAMPANHAS ATIVAS: Sem campanhas ativas no momento.";
    }

    // ── bottlenecks: top 3 stages with most stagnant leads ──
    let bottleneckSection: string;
    try {
      const stagnantCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const stagnant = userLeads.filter((l: any) => !l.converted_at && l.updated_at && l.updated_at < stagnantCutoff);

      const buckets: Record<string, { count: number; stepName: string; campaignName: string; avgDays: number }> = {};
      for (const l of stagnant) {
        const step = allSteps.find((s: any) => s.id === l.current_step_id);
        const campaign = campaigns.find((c: any) => c.id === l.campaign_id);
        const key = `${l.campaign_id}__${l.current_step_id ?? l.step_index}`;
        if (!buckets[key]) {
          buckets[key] = {
            count: 0,
            stepName: step?.step_name || `Etapa ${l.step_index + 1}`,
            campaignName: campaign?.name || "campanha",
            avgDays: 0,
          };
        }
        buckets[key].count++;
        const days = Math.round((Date.now() - new Date(l.updated_at).getTime()) / 86400000);
        buckets[key].avgDays = Math.max(buckets[key].avgDays, days);
      }

      const sorted = Object.values(buckets).sort((a, b) => b.count - a.count).slice(0, 3);
      if (sorted.length > 0) {
        bottleneckSection = `GARGALOS IDENTIFICADOS (últimos 7 dias):\n${sorted.map((b) => `- Etapa "${b.stepName}" na campanha "${b.campaignName}": ${b.count} leads parados há mais de ${b.avgDays} dias`).join("\n")}`;
      } else {
        bottleneckSection = "GARGALOS IDENTIFICADOS: Nenhum gargalo crítico identificado nos últimos 7 dias.";
      }
    } catch {
      bottleneckSection = "GARGALOS IDENTIFICADOS: dados indisponíveis";
    }

    // ── goals + IPP ──
    const goals = safe(goalsRes)?.data ?? [];
    const todayProgress = safe(progressRes)?.data ?? [];
    let performanceSection: string;
    try {
      if (goals.length > 0) {
        let totalPct = 0;
        const goalDetails: { name: string; current: number; target: number; pct: number }[] = [];
        for (const g of goals) {
          const p = todayProgress.find((pp: any) => pp.goal_id === g.id);
          const current = p?.current_value ?? 0;
          const pct = Math.min(Math.round((current / g.target) * 100), 100);
          totalPct += pct;
          goalDetails.push({ name: g.name, current, target: g.target, pct });
        }
        const ipp = Math.round(totalPct / goals.length);
        const ippLabel = ipp < 40 ? "Crítico" : ipp < 71 ? "Em risco" : ipp < 90 ? "No caminho" : "Elite";
        const urgent = goalDetails.filter((g) => g.pct < 100).sort((a, b) => a.pct - b.pct)[0];

        performanceSection = `PERFORMANCE HOJE:
- IPP Score: ${ipp}/100 (${ippLabel})
- Metas ativas: ${goals.length}`;
        if (urgent) {
          performanceSection += `\n- Meta mais urgente: ${urgent.name} — ${urgent.current}/${urgent.target} (${urgent.pct}%)`;
        }
      } else {
        performanceSection = "PERFORMANCE HOJE:\n- IPP: sem metas configuradas. Orientar o usuário a criar metas no widget IPP da home.";
      }
    } catch {
      performanceSection = "PERFORMANCE HOJE: dados indisponíveis";
    }

    // ── attention ──
    const attentionItems: string[] = [];
    if (worstCampaign) attentionItems.push(`- Campanha com pior conversão: ${worstCampaign}`);
    const incomplete = profile && (!profile.offer_type || !profile.target_audience_description || !profile.main_pain);
    if (incomplete) attentionItems.push("- Perfil estratégico incompleto — orientar o usuário a preencher em Perfil Estratégico para análises mais precisas.");
    const attentionSection = attentionItems.length > 0 ? `ATENÇÃO NECESSÁRIA:\n${attentionItems.join("\n")}` : "";

    // ── assemble ──
    const contextBlock = `CONTEXTO REAL DO USUÁRIO (atualizado agora):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${profileSection}

${performanceSection}

${campaignSection}

${bottleneckSection}
${attentionSection ? "\n" + attentionSection : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUÇÕES DE COMPORTAMENTO DO ORION:
Você tem acesso aos dados reais do negócio do usuário acima. Use SEMPRE esses dados nas suas respostas.

REGRAS:
1. Nunca dê respostas genéricas quando houver dados reais disponíveis.
2. Quando perguntado "como estou indo?", responda com IPP, meta urgente e o gargalo principal.
3. Quando sugerir ação, baseie-se nos dados reais: qual campanha, qual etapa, qual script.
4. Se algum dado estiver como "não informado", sugira ao usuário preencher o Perfil Estratégico.
5. Seja direto, consultivo e específico. Máximo 3 parágrafos por resposta salvo solicitação.
6. Tom: especialista em prospecção que conhece o negócio do usuário de dentro para fora.`;

    return contextBlock;
  } catch (err) {
    console.error("Failed to build user context:", err);
    return ""; // fallback: no context
  }
}

// ── main handler ─────────────────────────────────────────────────────
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
    const { messages } = await req.json();

    // Build enriched context in parallel with nothing else blocking
    const userContext = await buildUserContext(userId);

    const fullSystemPrompt = userContext ? `${userContext}\n\n${SYSTEM_PROMPT}` : SYSTEM_PROMPT;

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
        messages: [{ role: "system", content: fullSystemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("orion-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
