import { SiteContainer } from "./SiteContainer";
import { Github, Linkedin, Instagram } from "lucide-react";
import flowspectaLogo from "@/assets/flowspecta-logo.png";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

export function SiteFooter() {
  return (
    <footer style={{ background: "#03050F" }}>
      {/* Top gradient divider */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(59,130,246,0.3), transparent)" }} />


      <SiteContainer className="py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img src={flowspectaLogo} alt="FlowSpecta" className="h-6 mb-4" />
            <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
              Cockpit de prospecção B2B para equipes que buscam controle, método e resultado.
            </p>
            




































          </div>

          {/* Produto */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "#94A3B8" }}>
              Produto
            </h4>
            <ul className="space-y-3">
              {[
              { label: "Funcionalidades", id: "features" },
              { label: "Como Funciona", id: "como-funciona" },
              { label: "Planos", id: "pricing" },
              { label: "ORION IA", id: "orion" }].
              map((item) =>
              <li key={item.label}>
                  <button
                  onClick={() => scrollTo(item.id)}
                  className="text-sm transition-all duration-200"
                  style={{ color: "#64748B" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                    (e.currentTarget as HTMLElement).style.transform = "translateX(3px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#64748B";
                    (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                  }}>

                    {item.label}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "#94A3B8" }}>
              Empresa
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+5511981659878"
                  className="text-sm transition-all duration-200"
                  style={{ color: "#64748B" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#64748B";
                  }}
                >
                  Contato: (11) 98165-9878
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "#94A3B8" }}>
              Legal
            </h4>
            <ul className="space-y-3">
              {["Termos de Uso", "Política de Privacidade", "Cookies"].map((item) =>
              <li key={item}>
                  <span className="text-sm cursor-default" style={{ color: "#64748B" }}>
                    {item}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>

          <p className="text-xs" style={{ color: "#334155" }}>
            © {new Date().getFullYear()} FlowSpecta. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-5">
            {["Privacidade", "Termos", "Cookies"].map((item) =>
            <span key={item} className="text-xs cursor-default" style={{ color: "#334155" }}>
                {item}
              </span>
            )}
          </div>
        </div>
      </SiteContainer>
    </footer>);

}