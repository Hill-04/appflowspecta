import { useRef, useEffect, useState } from "react";
import { SiteContainer } from "./SiteContainer";

interface SiteTransitionProps {
  text: string;
}

export function SiteTransition({ text }: SiteTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <div ref={ref} className="py-20 md:py-28 relative overflow-hidden">
      {/* Horizontal glow line */}
      <div
        className="absolute top-1/2 left-0 right-0 h-px pointer-events-none transition-all duration-1000"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.25), rgba(59,130,246,0.2), transparent)",
          opacity: visible ? 1 : 0,
          transform: visible ? "scaleX(1)" : "scaleX(0.3)",
        }}
      />
      {/* Subtle glow behind text */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full transition-opacity duration-1000"
        style={{
          width: "400px",
          height: "120px",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.08), transparent 70%)",
          opacity: visible ? 1 : 0,
        }}
      />
      <SiteContainer>
        <p
          className="text-xl md:text-2xl lg:text-3xl text-center max-w-3xl mx-auto font-semibold leading-relaxed"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block transition-all"
              style={{
                color: visible ? "#E2E8F0" : "rgba(148,163,184,0)",
                transform: visible ? "translateY(0)" : "translateY(12px)",
                opacity: visible ? 1 : 0,
                transitionDelay: `${i * 60}ms`,
                transitionDuration: "600ms",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                marginRight: "0.3em",
              }}
            >
              {word}
            </span>
          ))}
        </p>
      </SiteContainer>
    </div>
  );
}
