import { useEffect, useRef } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteHero } from "@/components/site/SiteHero";
import { SiteLogoStrip } from "@/components/site/SiteLogoStrip";
import { SiteProblem } from "@/components/site/SiteProblem";
import { SiteTransition } from "@/components/site/SiteTransition";
import { SiteFeatures } from "@/components/site/SiteFeatures";
import { SiteOrion } from "@/components/site/SiteOrion";
import { SiteSteps } from "@/components/site/SiteSteps";
import { SiteMetrics } from "@/components/site/SiteMetrics";
import { SitePricing } from "@/components/site/SitePricing";
import { SiteFAQ } from "@/components/site/SiteFAQ";
import { SiteCTA } from "@/components/site/SiteCTA";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function Site() {
  // Google Analytics 4 — only on public site
  useEffect(() => {
    if ((window as any).gtag) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-Z9PDJQG7QG";
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-Z9PDJQG7QG');
    `;
    document.head.appendChild(inline);

    return () => {
      script.remove();
      inline.remove();
    };
  }, []);

  // Meta Pixel — only on public site
  useEffect(() => {
    if ((window as any).fbq) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.textContent = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
      n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','983325189635225');
      fbq('track','PageView');
    `;
    document.head.appendChild(inline);

    const ns = document.createElement("noscript");
    ns.innerHTML = '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=983325189635225&ev=PageView&noscript=1"/>';
    document.body.appendChild(ns);

    return () => {
      script.remove();
      inline.remove();
      ns.remove();
    };
  }, []);

  // Custom cursor — desktop only
  useEffect(() => {
    if (window.innerWidth < 768) return;

    const dot = document.createElement("div");
    dot.id = "site-cursor-dot";
    dot.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(124,58,237,0.35);
      transform: translate(-50%, -50%);
      transition: left 0.08s ease, top 0.08s ease, width 0.2s ease, height 0.2s ease, opacity 0.3s ease;
      opacity: 0;
    `;
    document.body.appendChild(dot);

    const move = (e: MouseEvent) => {
      dot.style.left = e.clientX + "px";
      dot.style.top = e.clientY + "px";
      dot.style.opacity = "1";
    };
    const hide = () => { dot.style.opacity = "0"; };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", hide);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", hide);
      dot.remove();
    };
  }, []);

  // Section glow line IntersectionObserver
  useEffect(() => {
    const timer = setTimeout(() => {
      const lines = document.querySelectorAll('.section-glow-line');
      if (!lines.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('is-visible');
            }, 150);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      lines.forEach(line => observer.observe(line));
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Liquid Glass mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest(".liquid-glass") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      {/* Google Fonts — scoped */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <div
        className="site-wrapper min-h-screen overflow-x-hidden"
        style={{ background: "#05071A", color: "#FFFFFF" }}
      >
        {/* Animated background blobs */}
        <div className="site-bg-blobs">
          <div className="site-blob site-blob-1" />
          <div className="site-blob site-blob-2" />
          <div className="site-blob site-blob-3" />
        </div>

        <SiteHeader />
        <main>
          <SiteHero />
          <SiteLogoStrip />
          <SiteProblem />
          <SiteTransition text="E se toda sua operação de prospecção vivesse em um único cockpit?" />
          <SiteFeatures />
          <SiteOrion />
          <SiteSteps />
          <SiteMetrics />
          <SiteTransition text="Planos pensados para cada estágio da sua operação." />
          <SitePricing />
          <SiteFAQ />
          <SiteCTA />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
