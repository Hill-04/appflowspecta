import { ArrowRight } from "lucide-react";
import { SiteContainer } from "./SiteContainer";
import { SiteSectionWrapper } from "./SiteSectionWrapper";
import { SectionReveal } from "./SectionReveal";

const scrollToPricing = () => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });

const steps = [
  {
    num: "01",
    title: "Crie sua campanha",
    desc: "Configure público, funil e scripts em minutos. Tudo conectado desde o início.",
  },
  {
    num: "02",
    title: "Defina seu público",
    desc: "Segmente com precisão. Cada campanha fala com quem deve falar.",
  },
  {
    num: "03",
    title: "Execute com scripts",
    desc: "Abordagens estruturadas pela IA. Consistência em cada conversa.",
  },
  {
    num: "04",
    title: "Analise e escale",
    desc: "Métricas em tempo real. Identifique o que funciona e duplique.",
  },
];

export function SiteSteps() {
  return (
    <SiteSectionWrapper id="como-funciona" className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(8,12,42,0.6)" }}
      />
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)" }}
      />
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)" }}
      />

      <SiteContainer className="relative z-10">
        <SectionReveal>
          <div className="section-glow-line" aria-hidden="true" />
          <div className="flex justify-center mb-4">
            <span className="site-eyebrow-pill">Como Funciona</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-16 leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Quatro passos para
            <span className="site-gradient-text"> transformar sua operação</span>
          </h2>
        </SectionReveal>

        {/* Steps grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
          {/* Connector line — desktop only */}
          <div
            className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 20%, rgba(59,130,246,0.5) 50%, rgba(124,58,237,0.5) 80%, transparent)",
            }}
          />

          {steps.map((step, i) => (
            <SectionReveal key={i} delay={i * 120}>
              <div className="flex flex-col items-center md:items-start text-center md:text-left relative">
                {/* Number dot */}
                <div
                  className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center mb-5 text-sm font-extrabold cursor-default"
                  style={{
                    background: "rgba(124,58,237,0.12)",
                    border: "1px solid rgba(124,58,237,0.35)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0 20px rgba(124,58,237,0.15)",
                    transition: "all 0.4s var(--site-ease-spring)",
                    color: "#A855F7",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "scale(1.15)";
                    el.style.background = "rgba(124,58,237,0.25)";
                    el.style.boxShadow = "0 0 40px rgba(124,58,237,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "scale(1)";
                    el.style.background = "rgba(124,58,237,0.12)";
                    el.style.boxShadow = "0 0 20px rgba(124,58,237,0.15)";
                  }}
                >
                  <span className="site-gradient-text">{step.num}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                  {step.desc}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>
        {/* Strategic CTA */}
        <SectionReveal>
          <div className="flex justify-center mt-14">
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
      </SiteContainer>
    </SiteSectionWrapper>
  );
}
