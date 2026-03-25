// Pure functions for generating onboarding content from partial profile data

export interface OnboardingProfile {
  offerType?: string | null;
  targetAudienceDescription?: string | null;
  mainPain?: string | null;
  differential?: string | null;
  maturityLevel?: string | null;
  contactChannel?: string | null;
  averageTicket?: string | null;
}

export interface GeneratedAudience {
  name: string;
  description: string;
  segment: string;
  criteria: string[];
  size: number;
}

export interface GeneratedScript {
  name: string;
  type: "opening" | "follow_up";
  content: string;
  tags: string[];
}

export interface GeneratedCampaign {
  name: string;
  steps: { name: string; variationA: string; variationB: string }[];
}

// --- Approach labels ---

export function getApproachLabel(offerType: string | null | undefined): string | null {
  if (!offerType) return null;
  const map: Record<string, string> = {
    "servico": "Abordagem consultiva de serviço",
    "produto_fisico": "Abordagem direta de produto",
    "produto_digital": "Abordagem de valor digital",
    "contratos": "Abordagem de relacionamento recorrente",
    "personalizado": "Abordagem sob medida",
  };
  return map[offerType] || null;
}

export function getApproachLevel(averageTicket: string | null | undefined): string | null {
  if (!averageTicket) return null;
  const map: Record<string, string> = {
    "ate_500": "Abordagem direta — foco em volume e agilidade",
    "500_2000": "Abordagem consultiva — equilíbrio entre volume e personalização",
    "2000_5000": "Abordagem estratégica — personalização e construção de confiança",
    "acima_5000": "Abordagem premium — alto toque, relacionamento e prova de valor",
  };
  return map[averageTicket] || null;
}

export function getChannelAdaptation(channel: string | null | undefined): { label: string; description: string } | null {
  if (!channel) return null;
  const map: Record<string, { label: string; description: string }> = {
    "whatsapp": { label: "WhatsApp", description: "Mensagens curtas, tom conversacional, áudios quando relevante" },
    "instagram": { label: "Instagram", description: "DMs visuais, stories como gatilho, conteúdo como prova" },
    "reuniao": { label: "Reunião online", description: "Abordagem para agendar, script de qualificação antes da call" },
    "ligacao": { label: "Ligação", description: "Script objetivo, pitch de 30 segundos, foco em próximo passo" },
    "presencial": { label: "Presencial", description: "Preparação pré-visita, material de apoio, follow-up estruturado" },
  };
  return map[channel] || null;
}

// --- Audience generation ---

export function generateAudiences(profile: OnboardingProfile): GeneratedAudience[] | null {
  const { targetAudienceDescription, offerType } = profile;
  if (!targetAudienceDescription || targetAudienceDescription.trim().length < 3) return null;

  const audience = targetAudienceDescription.trim();
  const isService = offerType === "servico" || offerType === "personalizado";

  return [
    {
      name: `${audience} — Pequeno porte`,
      description: `${audience} em fase inicial ou com equipe reduzida`,
      segment: isService ? "Serviços" : "Geral",
      criteria: ["Pequeno porte", "Até 10 funcionários", "Decisor acessível"],
      size: 150,
    },
    {
      name: `${audience} — Médio porte`,
      description: `${audience} em crescimento, com processos em formação`,
      segment: isService ? "Serviços" : "Geral",
      criteria: ["Médio porte", "10-50 funcionários", "Busca otimização"],
      size: 200,
    },
    {
      name: `${audience} — Alto potencial`,
      description: `${audience} com maior ticket e necessidade comprovada`,
      segment: isService ? "Serviços" : "Geral",
      criteria: ["Alto potencial", "Orçamento disponível", "Dor urgente"],
      size: 100,
    },
  ];
}

// --- Script generation ---

export function generateScripts(profile: OnboardingProfile): GeneratedScript[] | null {
  const { mainPain, differential, contactChannel } = profile;
  if (!mainPain || mainPain.trim().length < 3) return null;

  const pain = mainPain.trim();
  const diff = differential?.trim() || "uma abordagem diferenciada";
  const isWhatsApp = contactChannel === "whatsapp";
  const isCall = contactChannel === "ligacao";

  const openingContent = isWhatsApp
    ? `Oi {nome}, tudo bem? Vi que você trabalha com {empresa} e queria trocar uma ideia rápida. Muitos profissionais do seu segmento enfrentam o problema de ${pain}. A gente resolve isso com ${diff}. Posso te explicar em 2 minutos?`
    : isCall
    ? `Olá {nome}, aqui é {seu_nome}. Trabalho ajudando empresas como a {empresa} que enfrentam ${pain}. Nosso diferencial é ${diff}. Teria 5 minutos para uma conversa rápida?`
    : `Olá {nome}, vi que você lidera a {empresa} e queria compartilhar algo relevante. Muitas empresas do seu segmento enfrentam ${pain}, e ajudamos a resolver isso com ${diff}. Faz sentido conversarmos?`;

  const followUpContent = `Oi {nome}, voltando aqui. Preparei um resumo rápido sobre como resolver ${pain} de forma prática. Posso compartilhar com você?`;

  return [
    {
      name: "Abertura personalizada",
      type: "opening",
      content: openingContent,
      tags: ["onboarding", "abertura", contactChannel || "geral"],
    },
    {
      name: "Follow-up de valor",
      type: "follow_up",
      content: followUpContent,
      tags: ["onboarding", "follow-up"],
    },
  ];
}

// --- Campaign generation ---

export function generateCampaignConfig(profile: OnboardingProfile): GeneratedCampaign | null {
  const { targetAudienceDescription, mainPain, differential } = profile;
  if (!targetAudienceDescription || !mainPain) return null;

  const audience = targetAudienceDescription.trim();
  const pain = mainPain.trim();
  const diff = differential?.trim() || "abordagem diferenciada";

  return {
    name: `Prospecção ${audience} — Semana 1`,
    steps: [
      {
        name: "Primeira abordagem",
        variationA: `Oi {nome}, vi que você trabalha com {empresa}. Muitos profissionais do seu segmento enfrentam ${pain}. Posso te mostrar como resolvemos isso com ${diff}?`,
        variationB: `Oi {nome}, sou especialista em ajudar ${audience} a superar ${pain}. Posso te mostrar como em 5 min?`,
      },
      {
        name: "Follow-up",
        variationA: `Oi {nome}, voltando aqui. Preparei um material rápido sobre como resolver ${pain}. Posso compartilhar?`,
        variationB: "",
      },
      {
        name: "Última tentativa",
        variationA: `{nome}, última mensagem. Caso mude de ideia sobre resolver ${pain}, estou por aqui.`,
        variationB: "",
      },
    ],
  };
}

// --- Script focus summary (for preview) ---

export function getScriptFocus(mainPain: string | null | undefined): string | null {
  if (!mainPain || mainPain.trim().length < 3) return null;
  return mainPain.trim();
}

export function getMainArgument(differential: string | null | undefined): string | null {
  if (!differential || differential.trim().length < 3) return null;
  return differential.trim();
}
