import { useState } from "react";
import { Plus } from "lucide-react";
import { SiteContainer } from "./SiteContainer";
import { SiteSectionWrapper } from "./SiteSectionWrapper";
import { SectionReveal } from "./SectionReveal";

const faqs = [
  {
    q: "Para quem o Flowspecta foi criado?",
    a: "Para empreendedores, times comerciais, gestores de tráfego e negócios que utilizam WhatsApp, Instagram ou outros canais de mensagens como principal canal de vendas e querem parar de operar no improviso. Se você depende de conversa para vender, a Flowspecta é para você.",
  },
  {
    q: "O Flowspecta é um CRM?",
    a: "Não. Ele não é um CRM tradicional focado em cadastro de clientes. O Flowspecta é uma plataforma focada em funil de mensagens, organização estratégica de campanhas e controle real de conversão dentro da jornada de conversa.",
  },
  {
    q: "O ORION está incluso em todos os planos?",
    a: "O assistente ORION está disponível em todos os planos. Nos planos Growth e Scale, o copilot IA tem funcionalidades avançadas e uso ilimitado.",
  },
  {
    q: "Como funciona o funil de mensagens?",
    a: "Você cria etapas personalizadas (ex: Novo Lead, Contato Iniciado, Proposta Enviada, Fechamento) e define qual delas representa a conversão. A partir disso, a plataforma calcula automaticamente sua taxa de conversão com base na etapa definida como métrica principal.",
  },
  {
    q: "Posso personalizar totalmente meu funil?",
    a: "Sim. Você pode: - Criar novas etapas - Editar nomes - Reordenar - Excluir - Definir qual etapa representa a conversão. Sempre mantendo uma etapa obrigatória como métrica de conversão.",
  },
  {
    q: "Como o Flowspecta ajuda a aumentar vendas?",
    a: "Ela resolve três problemas críticos: - Falta de organização no funil - Ausência de métrica real de conversão - Improviso nas mensagens. Com estrutura, dados e padronização, a tomada de decisão se torna estratégica e escalável.",
  },
];

export function SiteFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <SiteSectionWrapper id="faq">
      <SiteContainer className="max-w-3xl">
        <SectionReveal>
          <div className="section-glow-line" aria-hidden="true" />
          <div className="flex justify-center mb-6">
            <span className="site-eyebrow-pill">Ajuda</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Perguntas frequentes
          </h2>
        </SectionReveal>

        <SectionReveal delay={100}>
          <div className="liquid-glass overflow-hidden" style={{ borderRadius: "24px" }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  borderBottom: i < faqs.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left relative z-10"
                  style={{
                    background: open === i ? "rgba(124,58,237,0.08)" : "transparent",
                    color: open === i ? "#fff" : "#CBD5E1",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (open !== i) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (open !== i) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  <span className="text-base font-medium pr-8">{faq.q}</span>
                  <Plus
                    className="h-5 w-5 shrink-0 transition-transform duration-300"
                    style={{
                      color: open === i ? "#A855F7" : "#64748B",
                      transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                <div
                  className="overflow-hidden transition-all duration-400 relative z-10"
                  style={{ maxHeight: open === i ? "200px" : "0px", transition: "max-height 0.35s ease" }}
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionReveal>
      </SiteContainer>
    </SiteSectionWrapper>
  );
}
