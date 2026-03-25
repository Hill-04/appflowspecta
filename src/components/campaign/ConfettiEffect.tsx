import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  dx: number;
  dy: number;
  delay: number;
}

const COLORS = [
  "hsl(205 90% 54%)",
  "hsl(152 60% 45%)",
  "hsl(37 90% 56%)",
  "hsl(270 60% 60%)",
  "hsl(0 72% 60%)",
];

export function ConfettiEffect({ onComplete }: { onComplete?: () => void }) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 40,
      y: 50,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 4,
      rotation: Math.random() * 360,
      dx: (Math.random() - 0.5) * 120,
      dy: -(40 + Math.random() * 60),
      delay: Math.random() * 0.3,
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall 1.2s ${p.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            opacity: 0,
            ["--dx" as any]: `${p.dx}px`,
            ["--dy" as any]: `${p.dy}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          50% { opacity: 1; transform: translate(var(--dx), var(--dy)) rotate(180deg); }
          100% { opacity: 0; transform: translate(calc(var(--dx) * 1.2), calc(var(--dy) * -0.5 + 80px)) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
