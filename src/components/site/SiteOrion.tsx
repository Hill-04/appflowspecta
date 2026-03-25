import { Sparkles, ArrowRight } from "lucide-react";
import { SiteContainer } from "./SiteContainer";
import { SiteSectionWrapper } from "./SiteSectionWrapper";
import { SectionReveal } from "./SectionReveal";

const scrollToPricing = () => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });

const prompts = [
  "\"Gere um script de abertura para CTOs de fintechs focado em redução de custos\"",
  "\"Analise o ROI da campanha Enterprise Q1 e sugira próximos passos\"",
  "\"Qual a melhor sequência de contato para leads que não responderam em 7 dias?\"",
];

export function SiteOrion() {
  return (
    <SiteSectionWrapper className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(8,12,42,0.5)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "700px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
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
        <div className="max-w-4xl mx-auto text-center">
          <SectionReveal>
            <div className="section-glow-line" aria-hidden="true" />
            <div className="flex justify-center mb-6">
              <div className="site-eyebrow-pill">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Inteligência Artificial Integrada</span>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={100}>
            <h2
              className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Conheça o{" "}
              <span className="site-gradient-text">ORION</span>
            </h2>
          </SectionReveal>

          <SectionReveal delay={200}>
            <p className="text-lg max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: "#94A3B8" }}>
              Seu assistente estratégico de prospecção. Gera scripts, analisa métricas,
              sugere próximos passos e guia sua operação — como ter um diretor comercial
              disponível 24/7.
            </p>
          </SectionReveal>

          <SectionReveal delay={300}>
            <div
              className="liquid-glass p-8 md:p-10 max-w-3xl mx-auto"
              style={{ borderRadius: "28px" }}
            >
              <div className="liquid-glass-shine" />
              <div className="space-y-3 relative z-10">
                {prompts.map((prompt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl px-5 py-4 text-left cursor-default"
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(124,58,237,0.3)";
                      el.style.background = "rgba(124,58,237,0.06)";
                      el.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.06)";
                      el.style.background = "rgba(255,255,255,0.02)";
                      el.style.transform = "translateX(0)";
                    }}
                  >
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#A855F7" }} />
                    <span className="text-sm leading-relaxed" style={{ color: "#CBD5E1" }}>
                      {prompt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={400}>
            <div className="flex justify-center mt-10">
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
        </div>
      </SiteContainer>
    </SiteSectionWrapper>
  );
}
