import { BarChart3, MessageSquare, Target, ArrowRight } from "lucide-react";
import { SiteContainer } from "./SiteContainer";
import { SiteSectionWrapper } from "./SiteSectionWrapper";
import { SectionReveal } from "./SectionReveal";

const scrollToPricing = () => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });

const pains = [
  {
    icon: Target,
    title: "Dados espalhados",
    text: "Leads no WhatsApp, planilhas no Drive, CRM desatualizado. Você não tem visão — tem caos.",
    color: "#7C3AED",
    badgeClass: "purple",
  },
  {
    icon: MessageSquare,
    title: "Sem previsibilidade",
    text: "Cada mês é surpresa. Sem funil real, sem dados confiáveis, sem como planejar crescimento.",
    color: "#3B82F6",
    badgeClass: "blue",
  },
  {
    icon: BarChart3,
    title: "Abordagens no achismo",
    text: "Scripts genéricos copiados e colados. Sem personalização, sem teste, sem evolução.",
    color: "#A855F7",
    badgeClass: "purple",
  },
];

export function SiteProblem() {
  return (
    <SiteSectionWrapper>
      <SiteContainer>
        <SectionReveal>
          <div className="section-glow-line" aria-hidden="true" />
          <div className="flex justify-center mb-4">
            <span className="site-eyebrow-pill">O Problema</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-center max-w-3xl mx-auto mb-16 leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            A prospecção manual está{" "}
            <span className="site-gradient-text">te custando caro</span>
          </h2>
        </SectionReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pains.map((p, i) => {
            const Icon = p.icon;
            return (
              <SectionReveal key={i} delay={i * 120}>
                <div className="liquid-glass h-full p-7 flex flex-col gap-5 cursor-default">
                  <div className="liquid-glass-shine" />

                  <div className={`site-icon-badge ${p.badgeClass}`}>
                    <Icon className="h-5 w-5 relative z-10" style={{ color: p.color }} strokeWidth={1.5} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                      {p.text}
                    </p>
                  </div>
                </div>
              </SectionReveal>
            );
          })}
        </div>
        </SiteContainer>

        {/* Strategic CTA */}
        <SectionReveal>
          <div className="flex justify-center mt-12">
            <button
              onClick={scrollToPricing}
              className="relative overflow-hidden text-sm font-semibold px-8 py-3.5 rounded-xl text-white flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                boxShadow: "0 0 30px -4px rgba(124,58,237,0.45)",
                minHeight: "52px",
                minWidth: "240px",
                transition: "transform 0.4s var(--site-ease-spring), box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "scale(1.04) translateY(-2px)";
                el.style.boxShadow = "0 12px 40px rgba(124,58,237,0.6)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "scale(1) translateY(0)";
                el.style.boxShadow = "0 0 30px -4px rgba(124,58,237,0.45)";
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04) translateY(-2px)"; }}
            >
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
                  borderRadius: "inherit",
                }}
              />
              Transformar Minha Prospecção
              <ArrowRight className="h-4 w-4 relative z-10" />
            </button>
          </div>
        </SectionReveal>
      </SiteSectionWrapper>
  );
}
