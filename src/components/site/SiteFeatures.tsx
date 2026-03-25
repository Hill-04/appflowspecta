import { Layers, FileText, BarChart3, Check } from "lucide-react";
import { SiteContainer } from "./SiteContainer";
import { SiteSectionWrapper } from "./SiteSectionWrapper";
import { SectionReveal } from "./SectionReveal";
import { CampaignVisual, ScriptVisual, AnalyticsVisual } from "./FeatureVisuals";

const features = [
  {
    tag: "Campanhas",
    tagColor: "#7C3AED",
    badgeClass: "purple",
    title: "Organize tudo em campanhas inteligentes",
    description:
      "Cada campanha unifica público, funil, scripts e leads em uma visão completa da operação — do primeiro contato à conversão.",
    bullets: [
      "Funil personalizado por campanha",
      "Scripts conectados ao contexto",
      "Métricas de ROI em tempo real",
      "Gestão multi-campanha unificada",
    ],
    icon: Layers,
  },
  {
    tag: "Scripts + IA",
    tagColor: "#3B82F6",
    badgeClass: "blue",
    title: "Scripts estruturados por IA, prontos para usar",
    description:
      "Gere scripts completos com abertura, sondagem, oferta e fechamento — personalizados para cada público e objetivo.",
    bullets: [
      "Geração automática via ORION IA",
      "Abertura, sondagem, oferta e fechamento",
      "Biblioteca de objeções integrada",
      "Variações A/B testáveis",
    ],
    icon: FileText,
  },
  {
    tag: "ROI & Analytics",
    tagColor: "#A855F7",
    badgeClass: "purple",
    title: "Saiba exatamente quanto cada campanha retorna",
    description:
      "Métricas de ROAS, CPL, taxa de conversão e deal value em tempo real. Dados que justificam investimento.",
    bullets: [
      "ROAS, CPL e taxa de conversão",
      "Deal value por campanha",
      "Comparativo entre campanhas",
      "Exportação de relatórios",
    ],
    icon: BarChart3,
  },
];

export function SiteFeatures() {
  return (
    <SiteSectionWrapper id="features">
      <SiteContainer>
        <SectionReveal>
          <div className="section-glow-line" aria-hidden="true" />
          <div className="flex justify-center mb-4">
            <span className="site-eyebrow-pill">Funcionalidades</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-center max-w-3xl mx-auto mb-20 leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Cada peça da prospecção,{" "}
            <span className="site-gradient-text">num único lugar</span>
          </h2>
        </SectionReveal>

        <div className="space-y-24 md:space-y-28">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isReversed = i % 2 !== 0;

            return (
              <SectionReveal key={i} delay={80}>
                <div
                  className={`flex flex-col ${
                    isReversed ? "md:flex-row-reverse" : "md:flex-row"
                  } items-center gap-12 md:gap-16`}
                >
                  {/* Text side */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 mb-5">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase"
                        style={{
                          background: `${f.tagColor}18`,
                          border: `1px solid ${f.tagColor}35`,
                          color: f.tagColor,
                        }}
                      >
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3 w-3" strokeWidth={2} />
                          {f.tag}
                        </span>
                      </div>
                    </div>

                    <h3
                      className="text-2xl md:text-3xl font-bold mb-4 leading-snug text-white"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {f.title}
                    </h3>

                    <p className="text-base leading-relaxed mb-7 max-w-lg" style={{ color: "#94A3B8" }}>
                      {f.description}
                    </p>

                    <ul className="space-y-2.5 text-left inline-block">
                      {f.bullets.map((b, bi) => (
                        <li key={bi} className="flex items-center gap-3 text-sm">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: `${f.tagColor}20` }}
                          >
                            <Check className="h-3 w-3" style={{ color: f.tagColor }} strokeWidth={2.5} />
                          </div>
                          <span style={{ color: "#CBD5E1" }}>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual side — premium visual */}
                  <div className="flex-1 w-full">
                    {i === 0 && <CampaignVisual />}
                    {i === 1 && <ScriptVisual />}
                    {i === 2 && <AnalyticsVisual />}
                  </div>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </SiteContainer>
    </SiteSectionWrapper>
  );
}
