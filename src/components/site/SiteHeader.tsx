import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import flowspectaLogo from "@/assets/flowspecta-logo.png";
import flowspectaIcon from "@/assets/flowspecta-icon.png";

const navLinks = [
  { label: "Início", id: "hero" },
  { label: "Soluções", id: "features" },
  { label: "Como Funciona", id: "como-funciona" },
  { label: "Planos", id: "pricing" },
  { label: "Ajuda", id: "faq" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className="!fixed top-0 left-0 right-0 !z-[100] transition-all duration-500"
        style={{
          background: scrolled ? "rgba(5,7,26,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        }}
      >
        <div
          className="max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between"
          style={{ height: "4.5rem" }}
        >
          {/* Logo */}
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2 shrink-0">
            <img src={flowspectaIcon} alt="FlowSpecta" className="h-8 w-8 md:hidden" />
            <img src={flowspectaLogo} alt="FlowSpecta" className="h-7 hidden md:block" />
          </button>

          {/* Nav links — desktop */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm transition-colors duration-200"
                style={{ color: "#94A3B8" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#94A3B8")}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTAs — desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-medium px-5 py-2 rounded-lg transition-all duration-200"
              style={{
                color: "#94A3B8",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                boxShadow: "0 0 20px -4px rgba(124,58,237,0.4)",
              }}
            >
              Começar agora
            </button>
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div data-site-overlay className="!fixed inset-0 !z-[200] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(5,7,26,0.85)", backdropFilter: "blur(8px)" }}
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className="absolute right-0 top-0 bottom-0 w-72 pt-6 px-6 flex flex-col gap-2"
            style={{
              background: "#080C2A",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Close button inside drawer */}
            <button
              onClick={() => setMenuOpen(false)}
              className="self-end mb-4 p-2 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-left py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ color: "#94A3B8" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                  (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {link.label}
              </button>
            ))}

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => navigate("/auth")}
                className="py-3 rounded-xl text-sm font-medium text-white/70 border transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Entrar
              </button>
              <button
                onClick={() => { scrollTo("pricing"); setMenuOpen(false); }}
                className="py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #7C3AED, #3B82F6)" }}
              >
                Começar agora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
