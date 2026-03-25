import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SiteContainer } from "./SiteContainer";
import { SiteSectionWrapper } from "./SiteSectionWrapper";
import { SectionReveal } from "./SectionReveal";
import { SiteTestimonials } from "./SiteTestimonials";

const scrollToPricing = () => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });

function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target]);

  return (
    <span ref={ref}>
      {prefix}{value}{suffix}
    </span>
  );
}

const metrics = [
  { prefix: "", target: 3, suffix: "x", label: "mais reuniões agendadas" },
  { prefix: "", target: 48, suffix: "%", label: "redução no ciclo de vendas" },
  { prefix: "+", target: 500, suffix: "", label: "times ativos" },
  { prefix: "", target: 49, suffix: "★", label: "avaliação média (de 50)" },
];

export function SiteMetrics() {
  return (
    <SiteSectionWrapper>
      <SiteContainer>
        <SectionReveal>
          <div className="section-glow-line" aria-hidden="true" />
          <div className="flex justify-center mb-4">
            <span className="site-eyebrow-pill">Resultados</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-16 text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Números que falam por si
          </h2>
        </SectionReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {metrics.map((m, i) => (
            <SectionReveal key={i} delay={i * 100}>
              <div
                className="liquid-glass text-center py-8 px-4 cursor-default"
                style={{
                  background: "rgba(124,58,237,0.05)",
                  borderColor: "rgba(124,58,237,0.12)",
                }}
              >
                <div className="liquid-glass-shine" />
                <div
                  className="site-metric-number mb-2 relative z-10"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <AnimatedCounter
                    prefix={m.prefix}
                    target={m.target}
                    suffix={m.suffix}
                  />
                </div>
                <p className="text-xs leading-snug relative z-10" style={{ color: "#64748B" }}>
                  {m.label}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>


        <SiteTestimonials />

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
