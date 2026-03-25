export const SCRIPT_BLOCKS = [
  { id: "abertura", label: "Abertura", description: "Primeira mensagem, quebra de gelo" },
  { id: "diferencial", label: "Diferencial", description: "O que você faz de diferente" },
  { id: "diagnostico", label: "Diagnóstico", description: "Perguntas para entender a dor" },
  { id: "prova_social", label: "Prova Social", description: "Resultados e depoimentos" },
  { id: "cta", label: "CTA", description: "Chamada para ação" },
] as const;

export type BlockId = (typeof SCRIPT_BLOCKS)[number]["id"];

export const SCRIPT_OBJECTIVES = [
  { value: "marcar_reuniao", label: "Marcar reunião", description: "Agendar uma conversa com o lead" },
  { value: "fechar_cliente", label: "Fechar cliente", description: "Enviar proposta e fechar negócio" },
  { value: "gerar_interesse", label: "Gerar interesse", description: "Despertar curiosidade sobre sua oferta" },
  { value: "qualificar_lead", label: "Qualificar lead", description: "Entender se faz sentido avançar" },
] as const;

export type ObjectiveValue = (typeof SCRIPT_OBJECTIVES)[number]["value"];

export const PLACEHOLDERS = [
  { key: "[NomeLead]", description: "Nome do lead" },
  { key: "[Empresa]", description: "Empresa do lead" },
  { key: "[DorPrincipal]", description: "Dor principal do perfil" },
  { key: "[Diferencial]", description: "Diferencial do perfil" },
  { key: "[CTA]", description: "Chamada para ação" },
] as const;

export const DRAFT_START = "<<<SCRIPT_DRAFT>>>";
export const DRAFT_END = "<<<END_DRAFT>>>";
export const BLOCK_TYPE_START = "<<<BLOCK_TYPE:";
export const BLOCK_TYPE_END = ">>>";

export const BLOCK_TYPE_MAP: Record<string, BlockId | "geral"> = {
  ABERTURA: "abertura",
  DIFERENCIAL: "diferencial",
  DIAGNOSTICO: "diagnostico",
  PROVA_SOCIAL: "prova_social",
  CTA: "cta",
  GERAL: "geral",
};

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  abertura: "Abertura",
  diferencial: "Diferencial",
  diagnostico: "Diagnóstico",
  prova_social: "Prova Social",
  cta: "CTA",
  geral: "Geral",
};

/**
 * Extract block type from draft content. Returns { blockType, cleanContent }.
 */
export function parseBlockType(draftContent: string): { blockType: string; cleanContent: string } {
  const idx = draftContent.indexOf(BLOCK_TYPE_START);
  if (idx === -1) return { blockType: "geral", cleanContent: draftContent.trim() };

  const endIdx = draftContent.indexOf(BLOCK_TYPE_END, idx + BLOCK_TYPE_START.length);
  if (endIdx === -1) return { blockType: "geral", cleanContent: draftContent.trim() };

  const rawType = draftContent.slice(idx + BLOCK_TYPE_START.length, endIdx).trim().toUpperCase();
  const blockType = BLOCK_TYPE_MAP[rawType] || "geral";
  const cleanContent = (draftContent.slice(0, idx) + draftContent.slice(endIdx + BLOCK_TYPE_END.length)).trim();
  return { blockType, cleanContent };
}

const VALID_PLACEHOLDER_KEYS = new Set(PLACEHOLDERS.map((p) => p.key.slice(1, -1)));

/**
 * Validate placeholders in content. Returns array of invalid placeholder strings.
 */
export function validatePlaceholders(content: string): string[] {
  const found = content.match(/\[(\w+)\]/g) || [];
  return found.filter((p) => !VALID_PLACEHOLDER_KEYS.has(p.slice(1, -1)));
}

/**
 * Replace placeholders with actual lead/profile data.
 */
export function replacePlaceholders(
  content: string,
  data: {
    lead?: { name?: string; company?: string };
    profile?: { mainPain?: string; differential?: string };
    cta?: string;
  }
): string {
  let result = content;
  if (data.lead?.name) result = result.split("[NomeLead]").join(data.lead.name);
  if (data.lead?.company) result = result.split("[Empresa]").join(data.lead.company);
  if (data.profile?.mainPain) result = result.split("[DorPrincipal]").join(data.profile.mainPain);
  if (data.profile?.differential) result = result.split("[Diferencial]").join(data.profile.differential);
  if (data.cta) result = result.split("[CTA]").join(data.cta);
  return result;
}

const BLOCK_SEPARATOR_PREFIX = "---BLOCO:";
const BLOCK_SEPARATOR_SUFFIX = "---";

export function parseBlocksFromContent(content: string): Record<string, string> {
  const blocks: Record<string, string> = {};
  if (!content) return blocks;

  const regex = new RegExp(`${BLOCK_SEPARATOR_PREFIX}(\\w+)${BLOCK_SEPARATOR_SUFFIX}`, "g");
  const parts = content.split(regex);

  // parts: [before, blockId, content, blockId, content, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const blockId = parts[i];
    const blockContent = (parts[i + 1] || "").trim();
    blocks[blockId] = blockContent;
  }

  return blocks;
}

export function combineBlocksToContent(blocks: Record<string, string>): string {
  return SCRIPT_BLOCKS
    .filter((b) => blocks[b.id]?.trim())
    .map((b) => `${BLOCK_SEPARATOR_PREFIX}${b.id}${BLOCK_SEPARATOR_SUFFIX}\n${blocks[b.id].trim()}`)
    .join("\n\n");
}
