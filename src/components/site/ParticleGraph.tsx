import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  radius: number; opacity: number; pulseOffset: number;
  type: 'node' | 'data';
}

export function ParticleGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const initParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 14000);
      for (let i = 0; i < count; i++) {
        const isNode = Math.random() < 0.3;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: isNode ? Math.random() * 2.5 + 2 : Math.random() * 1.2 + 0.8,
          opacity: Math.random() * 0.5 + 0.2,
          pulseOffset: Math.random() * Math.PI * 2,
          type: isNode ? 'node' : 'data',
        });
      }
    };
    initParticles();

    const colors = {
      purple: 'rgba(124, 58, 237,',
      blue: 'rgba(59, 130, 246,',
      teal: 'rgba(6, 182, 212,',
    };
    const MAX_DIST = 130;
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.008;

      // Move particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;
      });

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq >= MAX_DIST_SQ) continue;

          const dist = Math.sqrt(distSq);
          const proximity = 1 - dist / MAX_DIST;
          const bothNodes = particles[i].type === 'node' && particles[j].type === 'node';
          const baseOpacity = bothNodes ? 0.35 : 0.12;
          const pulse = Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5;
          const finalOpacity = proximity * baseOpacity * (0.6 + pulse * 0.4);

          const grad = ctx.createLinearGradient(
            particles[i].x, particles[i].y,
            particles[j].x, particles[j].y
          );
          grad.addColorStop(0, `${colors.purple}${finalOpacity})`);
          grad.addColorStop(0.5, `${colors.blue}${finalOpacity * 1.3})`);
          grad.addColorStop(1, `${colors.purple}${finalOpacity})`);

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = bothNodes ? 0.8 : 0.4;
          ctx.stroke();

          // Traveling particle on line
          if (bothNodes && Math.random() < 0.002) {
            const t = Math.sin(time * 3) * 0.5 + 0.5;
            const tx = particles[i].x + (particles[j].x - particles[i].x) * t;
            const ty = particles[i].y + (particles[j].y - particles[i].y) * t;
            ctx.beginPath();
            ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `${colors.blue}0.9)`;
            ctx.fill();
          }
        }
      }

      // Draw nodes and data points
      particles.forEach((p, i) => {
        const pulse = Math.sin(time * 1.5 + p.pulseOffset) * 0.3 + 0.7;
        const currentOpacity = p.opacity * pulse;
        const colorArr = [colors.purple, colors.blue, colors.teal];
        const color = colorArr[i % 3];

        if (p.type === 'node') {
          // Glow
          const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
          glowGrad.addColorStop(0, `${color}${currentOpacity * 0.4})`);
          glowGrad.addColorStop(1, `${color}0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
          // Core
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${color}${Math.min(currentOpacity * 1.5, 0.9)})`;
          ctx.fill();
          // Ring
          if (p.radius > 3) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = `${color}${currentOpacity * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${colors.purple}${currentOpacity * 0.6})`;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-graph-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
