import { SectionReveal } from "./SectionReveal";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rafael Moura",
    role: "Head de Vendas",
    company: "TechBR Solutions",
    text: "Em 30 dias usando o FlowSpecta, triplicamos a taxa de resposta nos cold emails. O ORION reescreveu toda a nossa abordagem.",
    avatar: "RM",
    color: "#7C3AED",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  },
  {
    name: "Camila Ferreira",
    role: "SDR Manager",
    company: "ScaleHub",
    text: "Finalmente consigo ver o ROI real de cada campanha. O Kanban com histórico de cada lead mudou completamente como gerencio o time.",
    avatar: "CF",
    color: "#3B82F6",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
  },
  {
    name: "Lucas Andrade",
    role: "Founder",
    company: "Prospecto Digital",
    text: "Tentei 4 ferramentas diferentes antes do FlowSpecta. É o único que unifica tudo sem adicionar complexidade.",
    avatar: "LA",
    color: "#A855F7",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
  },
];

export function SiteTestimonials() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
      {testimonials.map((t, i) => (
        <SectionReveal key={i} delay={i * 100}>
          <div className="liquid-glass p-6 flex flex-col gap-4 h-full cursor-default">
            <div className="liquid-glass-shine" />

            {/* Stars */}
            <div className="flex gap-0.5 relative z-10">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} className="h-3.5 w-3.5 fill-current" style={{ color: "#FBBF24" }} />
              ))}
            </div>

            <p className="text-sm leading-relaxed flex-1 relative z-10" style={{ color: "#CBD5E1" }}>
              "{t.text}"
            </p>

            <div
              className="flex items-center gap-3 pt-2 border-t relative z-10"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <img
                src={t.photo}
                alt={t.name}
                className="w-9 h-9 rounded-full object-cover shrink-0"
                style={{ border: `2px solid ${t.color}` }}
                onError={(e) => {
                  // Fallback to initials
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                  el.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div
                className="w-9 h-9 rounded-full hidden items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: t.color }}
              >
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  {t.role} · {t.company}
                </p>
              </div>
            </div>
          </div>
        </SectionReveal>
      ))}
    </div>
  );
}
