import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { plans } from "@/data/plans";
import { SiteContainer } from "./SiteContainer";
import { SiteSectionWrapper } from "./SiteSectionWrapper";
import { SectionReveal } from "./SectionReveal";

function PricingToggle({
  period,
  onChange,
}: {
  period: "monthly" | "annual";
  onChange: (p: "monthly" | "annual") => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full p-1"
      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
    >
      {(["monthly", "annual"] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="rounded-full px-5 py-2 text-sm font-medium transition-all duration-300"
          style={
            period === opt
              ? {
                  background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                  color: "#fff",
                  boxShadow: "0 0 15px -3px rgba(124,58,237,0.4)",
                }
              : { color: "#94A3B8" }
          }
        >
          {opt === "monthly" ? "Mensal" : (
            <span className="flex items-center gap-2">
              Anual
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                -17%
              </span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SitePricing() {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const navigate = useNavigate();

  return (
    <SiteSectionWrapper id="pricing">
      <SiteContainer>
        <SectionReveal>
          <div className="section-glow-line" aria-hidden="true" />
          <div className="flex justify-center mb-4">
            <span className="site-eyebrow-pill">Planos</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-8 text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Escolha seu cockpit
          </h2>
          <div className="flex justify-center mb-16">
            <PricingToggle period={period} onChange={setPeriod} />
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isGrowth = plan.id === "growth";
            const price = period === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const monthlyEq = period === "annual" ? Math.round(plan.annualPrice / 12) : null;

            return (
              <SectionReveal key={plan.id} delay={i * 100}>
                <div
                  className={cn(
                    "rounded-2xl p-8 flex flex-col transition-all duration-500 relative",
                    isGrowth ? "md:scale-[1.04]" : "liquid-glass"
                  )}
                  style={
                    isGrowth
                      ? {
                          background: "rgba(124,58,237,0.08)",
                          backdropFilter: "blur(40px) saturate(180%)",
                          border: "1px solid rgba(124,58,237,0.20)",
                          boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)",
                        }
                      : {}
                  }
                  onMouseEnter={(e) => {
                    if (!isGrowth) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(124,58,237,0.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isGrowth) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "";
                    }
                  }}
                >
                  {!isGrowth && <div className="liquid-glass-shine" />}

                  {/* Badge for featured */}
                  {isGrowth && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className="text-[11px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap"
                        style={{
                          background: "rgba(124,58,237,0.15)",
                          border: "1px solid rgba(124,58,237,0.30)",
                          color: "#A855F7",
                        }}
                      >
                        Mais Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2 relative z-10 mt-2">
                    <Icon
                      className="h-5 w-5"
                      style={{ color: isGrowth ? "#A855F7" : "#64748B" }}
                      strokeWidth={1.5}
                    />
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>

                  <p className="text-sm mb-6 relative z-10" style={{ color: "#64748B" }}>
                    {plan.description}
                  </p>

                  <div className="mb-6 relative z-10">
                    <span
                      className="text-4xl font-extrabold"
                      style={{
                        color: isGrowth ? "transparent" : "#fff",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        ...(isGrowth ? {
                          background: "linear-gradient(135deg, #A855F7, #60A5FA)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                        } : {}),
                      }}
                    >
                      R${price}
                    </span>
                    <span className="text-sm ml-1" style={{ color: "#64748B" }}>
                      /{period === "annual" ? "ano" : "mês"}
                    </span>
                    {monthlyEq && (
                      <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                        ≈ R${monthlyEq}/mês · economia de 2 meses
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1 relative z-10">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: isGrowth ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                          }}
                        >
                          <Check
                            className="h-2.5 w-2.5"
                            style={{ color: isGrowth ? "#A855F7" : "#64748B" }}
                            strokeWidth={3}
                          />
                        </div>
                        <span style={{ color: "#CBD5E1" }}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate(`/checkout?plan=${plan.id}&period=${period}&origin=site`)}
                    className="w-full py-3 rounded-xl font-semibold text-sm min-h-12 relative overflow-hidden"
                    style={
                      isGrowth
                        ? {
                            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                            color: "#fff",
                            boxShadow: "0 0 24px rgba(124,58,237,0.4)",
                            transition: "transform 0.4s var(--site-ease-spring), box-shadow 0.3s",
                          }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#CBD5E1",
                            transition: "all 0.3s var(--site-ease-spring)",
                          }
                    }
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      if (isGrowth) {
                        el.style.transform = "scale(1.03) translateY(-1px)";
                        el.style.boxShadow = "0 8px 32px rgba(124,58,237,0.6)";
                      } else {
                        el.style.background = "rgba(255,255,255,0.08)";
                        el.style.borderColor = "rgba(255,255,255,0.18)";
                        el.style.transform = "scale(1.02)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      if (isGrowth) {
                        el.style.transform = "scale(1) translateY(0)";
                        el.style.boxShadow = "0 0 24px rgba(124,58,237,0.4)";
                      } else {
                        el.style.background = "rgba(255,255,255,0.04)";
                        el.style.borderColor = "rgba(255,255,255,0.1)";
                        el.style.transform = "scale(1)";
                      }
                    }}
                    onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
                  >
                    {isGrowth && (
                      <span
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
                          borderRadius: "inherit",
                        }}
                      />
                    )}
                    Assinar {plan.name}
                  </button>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </SiteContainer>
    </SiteSectionWrapper>
  );
}
