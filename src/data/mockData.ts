export interface Lead {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  status: "pending" | "contacted" | "interested" | "info_requested" | "not_interested" | "no_response";
  currentStep: number;
  lastContact?: string;
  notes?: string;
}

export interface FunnelStep {
  id: string;
  order: number;
  name: string;
  variations: { id: string; label: string; content: string }[];
}

export interface Campaign {
  id: string;
  name: string;
  audienceId: string;
  status: "active" | "paused" | "completed";
  createdAt: string;
  leads: Lead[];
  funnel: FunnelStep[];
  metrics: {
    totalLeads: number;
    contacted: number;
    interested: number;
    responseRate: number;
    conversionRate: number;
  };
}

export interface Audience {
  id: string;
  name: string;
  description: string;
  segment: string;
  size: number;
  criteria: string[];
}

export interface Script {
  id: string;
  name: string;
  type: "opening" | "follow_up" | "closing" | "objection_response";
  content: string;
  tags: string[];
}

export interface Objection {
  id: string;
  objection: string;
  response: string;
  category: string;
  frequency: number;
}

export interface StrategicProfile {
  product: string;
  differentials: string[];
  idealClient: string;
  proofs: string[];
  positioning: string;
}


export const mockAudiences: Audience[] = [
  {
    id: "aud-1",
    name: "CEOs de SaaS B2B",
    description: "CEOs e fundadores de empresas SaaS com 10-50 funcionários",
    segment: "Tecnologia",
    size: 245,
    criteria: ["SaaS B2B", "10-50 funcionários", "Série A ou Bootstrapped"],
  },
  {
    id: "aud-2",
    name: "Diretores de Marketing",
    description: "Diretores de marketing de médias empresas brasileiras",
    segment: "Marketing",
    size: 180,
    criteria: ["Marketing", "Empresa 50-200 funcionários", "Brasil"],
  },
  {
    id: "aud-3",
    name: "Gestores de Vendas",
    description: "Gestores e líderes de vendas em empresas de tecnologia",
    segment: "Vendas",
    size: 312,
    criteria: ["Vendas", "Tecnologia", "Liderança"],
  },
];

export const mockScripts: Script[] = [
  {
    id: "scr-1",
    name: "Abertura consultiva",
    type: "opening",
    content: "Oi {nome}, vi que você lidera {empresa} e queria trocar uma ideia sobre como outras empresas do seu segmento estão resolvendo {dor}. Faz sentido pra você?",
    tags: ["consultivo", "abordagem suave"],
  },
  {
    id: "scr-2",
    name: "Follow-up valor",
    type: "follow_up",
    content: "Oi {nome}, voltando aqui. Preparei um material rápido sobre como {benefício}. Posso compartilhar com você?",
    tags: ["follow-up", "valor"],
  },
  {
    id: "scr-3",
    name: "Abertura direta",
    type: "opening",
    content: "Oi {nome}, sou {seu_nome} da {sua_empresa}. Ajudamos empresas como a {empresa} a {benefício principal}. Posso te mostrar como em 5 minutos?",
    tags: ["direto", "objetivo"],
  },
  {
    id: "scr-4",
    name: "Follow-up social proof",
    type: "follow_up",
    content: "{nome}, a {empresa_referência} teve {resultado} usando nossa solução. Seria útil pra {empresa} também?",
    tags: ["social proof", "follow-up"],
  },
  {
    id: "scr-5",
    name: "Resposta objeção preço",
    type: "objection_response",
    content: "Entendo a preocupação com investimento. Na verdade, nossos clientes recuperam o valor em {tempo}. Posso te mostrar o cálculo?",
    tags: ["objeção", "preço"],
  },
];

export const mockObjections: Objection[] = [
  {
    id: "obj-1",
    objection: "Está caro para nós no momento",
    response: "Entendo perfeitamente. Na verdade, a maioria dos nossos clientes pensou o mesmo inicialmente. O retorno médio é de 3x em 90 dias. Posso te mostrar como calculamos isso?",
    category: "Preço",
    frequency: 42,
  },
  {
    id: "obj-2",
    objection: "Já temos uma solução",
    response: "Ótimo que já investem nisso! Muitos clientes nossos vieram de soluções similares. O diferencial que costuma pesar é {diferencial}. Faz sentido explorar?",
    category: "Concorrência",
    frequency: 35,
  },
  {
    id: "obj-3",
    objection: "Não tenho tempo agora",
    response: "Total, respeito seu tempo. Posso te mandar um resumo de 2 minutos por aqui mesmo? Aí você vê quando puder.",
    category: "Tempo",
    frequency: 28,
  },
  {
    id: "obj-4",
    objection: "Preciso falar com meu sócio",
    response: "Claro! Faz sentido envolver ele. Quer que eu prepare um material específico pra facilitar essa conversa?",
    category: "Decisão",
    frequency: 21,
  },
];

const createLeads = (): Lead[] => [
  { id: "lead-1", name: "Ricardo Mendes", company: "TechFlow", role: "CEO", phone: "(11) 99999-0001", email: "ricardo@techflow.com", status: "pending", currentStep: 0 },
  { id: "lead-2", name: "Ana Souza", company: "DataPro", role: "CTO", phone: "(11) 99999-0002", email: "ana@datapro.com", status: "contacted", currentStep: 1, lastContact: "2026-02-08" },
  { id: "lead-3", name: "Carlos Lima", company: "SalesHub", role: "Diretor Comercial", phone: "(11) 99999-0003", email: "carlos@saleshub.com", status: "interested", currentStep: 2, lastContact: "2026-02-09" },
  { id: "lead-4", name: "Mariana Costa", company: "GrowthLab", role: "CEO", phone: "(11) 99999-0004", email: "mariana@growthlab.com", status: "info_requested", currentStep: 1, lastContact: "2026-02-07" },
  { id: "lead-5", name: "Pedro Alves", company: "CloudBase", role: "VP Vendas", phone: "(11) 99999-0005", email: "pedro@cloudbase.com", status: "no_response", currentStep: 0 },
  { id: "lead-6", name: "Juliana Ferreira", company: "MetricaAI", role: "Head de Growth", phone: "(11) 99999-0006", email: "juliana@metricaai.com", status: "pending", currentStep: 0 },
  { id: "lead-7", name: "Fernando Santos", company: "PipelinePro", role: "CEO", phone: "(11) 99999-0007", email: "fernando@pipelinepro.com", status: "not_interested", currentStep: 1, lastContact: "2026-02-06" },
  { id: "lead-8", name: "Beatriz Oliveira", company: "ScaleTech", role: "COO", phone: "(11) 99999-0008", email: "beatriz@scaletech.com", status: "contacted", currentStep: 1, lastContact: "2026-02-09" },
];

export const mockCampaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Prospecção CEOs SaaS Q1",
    audienceId: "aud-1",
    status: "active",
    createdAt: "2026-01-15",
    leads: createLeads().slice(0, 5),
    funnel: [
      { id: "step-1", order: 1, name: "Primeira abordagem", variations: [
        { id: "var-1a", label: "Variação A", content: "Oi {nome}, vi que você lidera a {empresa}..." },
        { id: "var-1b", label: "Variação B", content: "Oi {nome}, sou especialista em ajudar SaaS como a {empresa}..." },
      ]},
      { id: "step-2", order: 2, name: "Follow-up", variations: [
        { id: "var-2a", label: "Variação A", content: "Oi {nome}, voltando aqui. Vi que {empresa} está crescendo..." },
      ]},
      { id: "step-3", order: 3, name: "Última tentativa", variations: [
        { id: "var-3a", label: "Variação A", content: "{nome}, última mensagem. Caso mude de ideia, estou por aqui." },
      ]},
    ],
    metrics: { totalLeads: 5, contacted: 3, interested: 1, responseRate: 60, conversionRate: 20 },
  },
  {
    id: "camp-2",
    name: "Diretores de Marketing - Fev",
    audienceId: "aud-2",
    status: "active",
    createdAt: "2026-02-01",
    leads: createLeads().slice(2, 6),
    funnel: [
      { id: "step-4", order: 1, name: "Primeira abordagem", variations: [
        { id: "var-4a", label: "Variação A", content: "Oi {nome}, queria conversar sobre estratégias de marketing..." },
      ]},
      { id: "step-5", order: 2, name: "Follow-up com case", variations: [
        { id: "var-5a", label: "Variação A", content: "Oi {nome}, preparei um case relevante para {empresa}..." },
        { id: "var-5b", label: "Variação B", content: "{nome}, vi que empresas do seu segmento estão..." },
      ]},
    ],
    metrics: { totalLeads: 4, contacted: 2, interested: 1, responseRate: 50, conversionRate: 25 },
  },
  {
    id: "camp-3",
    name: "Gestores de Vendas Tech",
    audienceId: "aud-3",
    status: "paused",
    createdAt: "2026-01-20",
    leads: createLeads().slice(5, 8),
    funnel: [
      { id: "step-6", order: 1, name: "Abertura direta", variations: [
        { id: "var-6a", label: "Variação A", content: "Oi {nome}, ajudo times de vendas como o da {empresa}..." },
      ]},
    ],
    metrics: { totalLeads: 3, contacted: 1, interested: 0, responseRate: 33, conversionRate: 0 },
  },
];

export const mockProfile: StrategicProfile = {
  product: "Plataforma de automação de prospecção outbound",
  differentials: [
    "IA que personaliza mensagens em escala",
    "Integração nativa com WhatsApp e LinkedIn",
    "Dashboard de performance em tempo real",
    "Suporte consultivo incluso",
  ],
  idealClient: "Empresas B2B de tecnologia com time comercial de 3-15 pessoas que fazem prospecção ativa",
  proofs: [
    "150+ empresas atendidas",
    "Aumento médio de 40% na taxa de resposta",
    "NPS 72",
    "Case TechFlow: 3x mais reuniões em 60 dias",
  ],
  positioning: "A plataforma mais inteligente para times de vendas que prospectam ativamente e querem escalar com qualidade, não com spam.",
};


export const statusLabels: Record<Lead["status"], string> = {
  pending: "Pendente",
  contacted: "Contatado",
  interested: "Interessado",
  info_requested: "Pediu info",
  not_interested: "Não interessado",
  no_response: "Sem resposta",
};

export const statusColors: Record<Lead["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  contacted: "bg-primary/20 text-primary",
  interested: "bg-success/20 text-success",
  info_requested: "bg-warning/20 text-warning",
  not_interested: "bg-destructive/20 text-destructive",
  no_response: "bg-muted text-muted-foreground",
};
