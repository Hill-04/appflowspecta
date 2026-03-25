import { useNavigate } from "react-router-dom";
import { SiteSectionWrapper } from "./SiteSectionWrapper";
import { SiteContainer } from "./SiteContainer";
import { SectionReveal } from "./SectionReveal";

export function SiteCTA() {
  const navigate = useNavigate();
  const scrollToPricing = () => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });

  return (
    <SiteSectionWrapper className="py-24 md:py-36">
      <SiteContainer>
        <SectionReveal>
          <div
            className="relative rounded-3xl p-12 md:p-20 text-center overflow-hidden"
            style={{
              background: "rgba(124,58,237,0.10)",
              backdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(124,58,237,0.30)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 80px -20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)"
            }}>

            {/* Animated border */}
            <div
              className="absolute inset-[-1px] rounded-[25px] pointer-events-none"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #3B82F6, #06B6D4, #7C3AED)",
                backgroundSize: "300% 300%",
                animation: "siteBorderSpin 6s linear infinite",
                zIndex: -1,
                opacity: 0.3
              }} />


            {/* Decorative blobs */}
            <div
              className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(124,58,237,0.20) 0%, transparent 70%)",
                filter: "blur(40px)",
                transform: "translate(-30%, -30%)"
              }} />

            <div
              className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
                transform: "translate(30%, 30%)"
              }} />


            {/* Specular highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)",
                borderRadius: "24px 24px 0 0"
              }} />


            <div className="relative z-10">
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold max-w-2xl mx-auto mb-5 leading-tight text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

                Pronto para transformar sua prospecção?
              </h2>
              <p className="text-lg mb-10" style={{ color: "#94A3B8" }}>
                Resultado não vem do esforço. Vem da estrutura.
Você vai continuar improvisando ou vai estruturar o seu crescimento de verdade?
            


              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={scrollToPricing} className="relative overflow-hidden text-sm font-semibold px-8 py-4 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                  boxShadow: "0 0 30px -4px rgba(124,58,237,0.5)",
                  minWidth: "220px",
                  minHeight: "52px",
                  transition: "transform 0.4s var(--site-ease-spring), box-shadow 0.3s"
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "scale(1.04) translateY(-2px)";
                  el.style.boxShadow = "0 12px 45px rgba(124,58,237,0.65)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "scale(1) translateY(0)";
                  el.style.boxShadow = "0 0 30px -4px rgba(124,58,237,0.5)";
                }}
                onMouseDown={(e) => {(e.currentTarget as HTMLElement).style.transform = "scale(0.97)";}}>

                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
                      borderRadius: "inherit"
                    }} />

                  Transformar Minha Prospecção
                </button>

                

























              </div>
            </div>
          </div>
        </SectionReveal>
      </SiteContainer>
    </SiteSectionWrapper>);

}