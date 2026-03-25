import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Rocket, Play } from "lucide-react";
import { SiteContainer } from "./SiteContainer";
import { SectionReveal } from "./SectionReveal";
import { ParticleGraph } from "./ParticleGraph";

const avatars: {src: string;fallbackColor: string;}[] = [
{ src: "", fallbackColor: "#7C3AED" },
{ src: "", fallbackColor: "#3B82F6" },
{ src: "", fallbackColor: "#A855F7" },
{ src: "", fallbackColor: "#60A5FA" }];


export function SiteHero() {
  const navigate = useNavigate();
  const mockupRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);

  // Parallax on mouse move — desktop only
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const hero = heroRef.current;
    const mockup = mockupRef.current;
    const h1 = h1Ref.current;
    if (!hero || !mockup) return;

    const onMove = (e: MouseEvent) => {
      const { width, height, left, top } = hero.getBoundingClientRect();
      const mx = (e.clientX - left - width / 2) / (width / 2);
      const my = (e.clientY - top - height / 2) / (height / 2);
      mockup.style.transform = `perspective(1200px) rotateX(${5 - my * 3}deg) rotateY(${-1 + mx * 3}deg) translateY(${-my * 6}px)`;
      if (h1) h1.style.transform = `translate(${mx * 4}px, ${my * 2}px)`;
    };
    const onLeave = () => {
      mockup.style.transform = "perspective(1200px) rotateX(5deg) rotateY(-1deg) translateY(0)";
      if (h1) h1.style.transform = "translate(0,0)";
    };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="hero-section relative min-h-screen flex items-center overflow-hidden"
      style={{ paddingTop: "100px", paddingBottom: "80px" }}>

      {/* Particle graph — layer 0 */}
      <ParticleGraph />
      {/* Fade overlay to soften edges */}
      <div className="particle-fade-overlay" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "80px 80px"
        }} />


      <SiteContainer className="relative z-10 text-center w-full">
        {/* Eyebrow pill */}
        <SectionReveal>
          <div className="flex justify-center mb-8">
            <div className="site-eyebrow-pill">
              <Rocket className="h-3.5 w-3.5" />
              <span>— Método Científico Aplicado à Prospecção —</span>
            </div>
          </div>
        </SectionReveal>

        {/* Headline */}
        <SectionReveal delay={100}>
          <h1
            ref={h1Ref}
            className="font-extrabold leading-[1.08] tracking-[-0.03em] max-w-4xl mx-auto mb-6 transition-transform duration-300"
            style={{
              fontSize: "clamp(40px, 6vw, 76px)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: "#FFFFFF"
            }}>

            Onde Prospecção Deixa de Ser{" "}
            <br className="hidden sm:block" />
            Intuição e Passa a Ser{" "}
            <span className="site-gradient-text">Ciência Aplicada.</span>
          </h1>
        </SectionReveal>

        {/* Subtitle */}
        <SectionReveal delay={200}>
          <p
            className="text-lg leading-relaxed max-w-[560px] mx-auto mb-10"
            style={{ color: "#94A3B8", fontFamily: "'DM Sans', sans-serif" }}>

            Centralize seus dados, teste hipóteses, identifique gargalos e evolua
            sua prospecção com método e previsibilidade.
          </p>
        </SectionReveal>

        {/* CTAs */}
        <SectionReveal delay={300}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <button
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="relative overflow-hidden text-sm font-semibold px-7 py-3.5 rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                boxShadow: "0 0 30px -4px rgba(124,58,237,0.5)",
                minHeight: "52px",
                minWidth: "220px",
                transition: "transform 0.4s var(--site-ease-spring), box-shadow 0.3s var(--site-ease-gentle)"
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "scale(1.04) translateY(-2px)";
                el.style.boxShadow = "0 12px 40px rgba(124,58,237,0.6)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "scale(1) translateY(0)";
                el.style.boxShadow = "0 0 30px -4px rgba(124,58,237,0.5)";
              }}
              onMouseDown={(e) => {(e.currentTarget as HTMLElement).style.transform = "scale(0.97)";}}
              onMouseUp={(e) => {(e.currentTarget as HTMLElement).style.transform = "scale(1.04) translateY(-2px)";}}>

              {/* Shimmer sweep */}
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
                  borderRadius: "inherit"
                }} />

              Transformar Minha Prospecção
            </button>

            

























          </div>

          {/* Social proof avatars */}
          <div className="flex items-center justify-center gap-px">
          






















            <div className="text-sm" style={{ color: "#64748B" }}>
              <span style={{ color: "#FBBF24" }}></span>
              {" "}Mais de{" "}
              <span className="font-semibold text-white">480 pessoas</span>{" "}usando
            </div>
          </div>
        </SectionReveal>

        {/* Browser frame mockup */}
        <SectionReveal delay={500}>
          <div
            className="mt-16 md:mt-20 relative mx-auto"
            style={{ maxWidth: "900px", perspective: "1200px", perspectiveOrigin: "50% 40%" }}>

            {/* Mockup wrapper with parallax */}
            <div
              ref={mockupRef}
              className="site-mockup-frame"
              style={{
                transformStyle: "preserve-3d",
                transform: "perspective(1200px) rotateX(5deg) rotateY(-1deg) translateY(0)",
                transition: "transform 0.8s var(--site-ease-expo)",
                animation: "siteMockupFloat 7s ease-in-out infinite"
              }}>

              {/* Browser chrome */}
              <div
                style={{
                  background: "rgba(15,18,33,0.60)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderBottom: "none",
                  borderRadius: "14px 14px 0 0",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>

                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "#FEBC2E" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "#28C840" }} />
                </div>
                <div
                  className="flex-1 max-w-[300px] mx-auto rounded-md px-3 py-1 text-xs text-center"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#64748B", fontFamily: "monospace" }}>

                  app.flowspecta.com
                </div>
              </div>

              {/* Dashboard content */}
              <div
                className="relative overflow-hidden"
                style={{
                  background: "hsl(222 47% 6%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderTop: "none",
                  borderRadius: "0 0 16px 16px",
                  boxShadow: "0 80px 160px rgba(0,0,0,0.7), 0 0 100px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.05)"
                }}>

                <div className="aspect-[16/9] p-6">
                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                    { label: "Campanhas Ativas", value: "12", delta: "+3" },
                    { label: "Leads em Funil", value: "348", delta: "+47" },
                    { label: "ROAS Médio", value: "3.8x", delta: "+0.4x" }].
                    map((card, i) =>
                    <div
                      key={i}
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)"
                      }}>

                        <p className="text-xs mb-2" style={{ color: "#64748B" }}>{card.label}</p>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                        <p className="text-xs mt-1" style={{ color: "#4ADE80" }}>{card.delta} esta semana</p>
                      </div>
                    )}
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        minHeight: "120px"
                      }}>

                      <p className="text-xs font-semibold mb-3" style={{ color: "#64748B" }}>Funil de Conversão</p>
                      {[
                      { label: "Contato Inicial", pct: 85, color: "#7C3AED" },
                      { label: "Qualificação", pct: 60, color: "#3B82F6" },
                      { label: "Proposta", pct: 38, color: "#A855F7" },
                      { label: "Fechamento", pct: 22, color: "#60A5FA" }].
                      map((bar, i) =>
                      <div key={i} className="mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px]" style={{ color: "#94A3B8" }}>{bar.label}</span>
                            <span className="text-[10px] font-medium text-white">{bar.pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${bar.pct}%`, background: bar.color }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)"
                      }}>

                      <p className="text-xs font-semibold mb-3" style={{ color: "#64748B" }}>Leads Recentes</p>
                      {[
                      { name: "Empresa Alpha", status: "Qualificado", color: "#4ADE80" },
                      { name: "Beta Corp", status: "Em Proposta", color: "#FBBF24" },
                      { name: "Gama Tech", status: "Novo Lead", color: "#60A5FA" }].
                      map((lead, i) =>
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 border-b last:border-0"
                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>

                          <span className="text-[11px] text-white">{lead.name}</span>
                          <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${lead.color}20`, color: lead.color }}>

                            {lead.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom fade */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                  style={{ background: "linear-gradient(to bottom, transparent, #05071A)" }} />

              </div>
            </div>

            {/* Reflection glow under mockup */}
            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
              style={{
                width: "60%",
                height: "60px",
                background: "rgba(124,58,237,0.10)",
                filter: "blur(30px)",
                borderRadius: "50%"
              }} />

          </div>
        </SectionReveal>
      </SiteContainer>
    </section>);

}