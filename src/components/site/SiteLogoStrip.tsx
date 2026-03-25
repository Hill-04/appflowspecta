const cards = [
  "Diagnóstico de Gargalos",
  "Coleta Estruturada",
  "Testes Controlados",
  "Otimização Contínua",
  "Crescimento Previsível",
  "Validação de Abordagens",
  "Padrões Comportamentais",
];

export function SiteLogoStrip() {
  return (
    <div
      className="py-16 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="relative overflow-hidden">
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #05071A, transparent)" }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #05071A, transparent)" }}
        />

        <div className="site-marquee-track flex gap-6 items-center">
          {[...cards, ...cards].map((card, i) => (
            <div
              key={i}
              className="shrink-0 px-6 py-3 rounded-xl text-sm font-medium select-none cursor-default transition-all duration-300 hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 0 20px rgba(124,58,237,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = "rgba(124,58,237,0.1)";
                el.style.borderColor = "rgba(124,58,237,0.3)";
                el.style.color = "rgba(255,255,255,0.9)";
                el.style.boxShadow = "0 0 30px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = "rgba(255,255,255,0.04)";
                el.style.borderColor = "rgba(255,255,255,0.08)";
                el.style.color = "rgba(255,255,255,0.55)";
                el.style.boxShadow = "0 0 20px rgba(124,58,237,0.06), inset 0 1px 0 rgba(255,255,255,0.05)";
              }}
            >
              {card}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
