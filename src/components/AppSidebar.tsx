import { NavLink, useLocation } from "react-router-dom";
import {
  Rocket,
  Users,
  Contact,
  FileText,
  Shield,
  BarChart3,
  UserCircle,
  ChevronLeft,
  LogOut,
  LayoutTemplate,
  CreditCard,
  Crown,
  Menu,
  X,
  Lock,
  Target } from
"lucide-react";
import flowspectaIcon from "@/assets/flowspecta-icon.png";
import flowspectaLogo from "@/assets/flowspecta-logo.png";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
{ label: "Campanhas", path: "/app", icon: Rocket },
{ label: "Metas", path: "/app/goals", icon: Target },
{ label: "Meus Leads", path: "/app/leads", icon: Contact },
{ type: "divider" as const, label: "Bibliotecas" },
{ label: "Públicos", path: "/app/audiences", icon: Users },
{ label: "Scripts", path: "/app/script-sets", icon: FileText },
{ label: "Lead Templates", path: "/app/lead-templates", icon: LayoutTemplate },
{ label: "Objeções", path: "/app/objections", icon: Shield, feature: "objection_library" },
{ type: "divider" as const, label: "Análise" },
{ label: "Insights", path: "/app/insights", icon: BarChart3, feature: "cross_campaign_insights" },
{ type: "divider" as const, label: "Configuração" },
{ label: "Perfil Estratégico", path: "/app/profile", icon: UserCircle },
{ label: "Planos", path: "/app/pricing", icon: CreditCard }];


export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { plan, loading: subLoading, isFeatureEnabled, isOwner: subIsOwner } = useSubscription();
  const { isOwner } = useUserRole();
  const isMobile = useIsMobile();

  const allNavItems = [
  ...navItems,
  ...(isOwner ? [{ label: "Admin", path: "/app/admin", icon: Shield }] : [])];


  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : null;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const renderNavItem = (item: any, i: number) => {
    if ("type" in item && item.type === "divider") {
      return (
        <div key={i} className="pt-5 pb-1 px-2">
          {!isMobile && collapsed ?
          <div className="border-t border-white/[0.04] mx-1" /> :

          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
              {item.label}
            </span>
          }
        </div>);

    }
    const nav = item as {label: string;path: string;icon: any; feature?: string;};
    const Icon = nav.icon;
    const isActive = location.pathname === nav.path;
    const isLocked = nav.feature && !subIsOwner && !isFeatureEnabled(nav.feature);
    return (
      <NavLink
        key={nav.path}
        to={nav.path}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 apple-ease",
          isActive ?
          "bg-white/[0.06] text-foreground" :
          "text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground"
        )}>

        {/* Active indicator bar */}
        {isActive &&
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full gradient-blue glow-blue-sm" />
        }
        <Icon className={cn(
          "h-4 w-4 shrink-0 transition-all duration-200",
          isActive ? "text-primary" : "opacity-50 group-hover:opacity-80"
        )} />
        {(isMobile || !collapsed) && (
          <span className="flex items-center gap-2">
            {nav.label}
            {isLocked && <Lock className="h-3 w-3 text-muted-foreground/60" />}
          </span>
        )}
      </NavLink>);

  };

  // Mobile: hamburger button + overlay drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile header bar */}
        <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-sidebar/80 backdrop-blur-xl px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/[0.06] transition-all duration-200 apple-ease">

            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <img src={flowspectaLogo} alt="FlowSpecta" className="h-7 object-contain" />
          </div>
        </div>

        {/* Overlay */}
        {mobileOpen &&
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />

        }

        {/* Drawer */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-[60] flex h-screen w-72 flex-col bg-sidebar/90 backdrop-blur-2xl border-r border-white/[0.06] transition-transform duration-300 apple-ease",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}>

          <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
            <div className="flex items-center gap-2">
              <img src={flowspectaLogo} alt="FlowSpecta" className="h-8 object-contain" />
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200">

              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {allNavItems.map(renderNavItem)}
          </nav>

          <div className="border-t border-white/[0.06] p-3 space-y-2">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 backdrop-blur-sm">
              {planLabel ?
              <>
                  <div className="flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-medium text-foreground">Plano {planLabel}</p>
                  </div>
                  {plan !== "scale" &&
                <NavLink to="/app/pricing" className="text-xs text-primary font-medium hover:underline">
                      Fazer upgrade →
                    </NavLink>
                }
                </> :

              <>
                  <p className="text-xs text-muted-foreground">Sem plano ativo</p>
                  <NavLink to="/app/pricing" className="text-xs text-primary font-medium hover:underline">
                    Ver planos →
                  </NavLink>
                </>
              }
            </div>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 apple-ease">

              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </aside>
      </>);

  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] bg-sidebar/80 backdrop-blur-2xl transition-all duration-300 apple-ease",
        collapsed ? "w-16" : "w-60"
      )}>

      <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-4">
        <img src={flowspectaIcon} alt="FlowSpecta" className="h-8 w-8 rounded-lg shrink-0" />
        {!collapsed &&
        <img alt="FlowSpecta" className="h-7 object-contain" src="/lovable-uploads/9bbbcbc2-37af-491c-bf0c-5e8970e74f1a.png" />
        }
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200",
            collapsed && "ml-0"
          )}>

          <ChevronLeft
            className={cn("h-4 w-4 transition-transform duration-300 apple-ease", collapsed && "rotate-180")} />

        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {allNavItems.map(renderNavItem)}
      </nav>

      <div className="border-t border-white/[0.06] p-3 space-y-2">
        {!collapsed &&
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 backdrop-blur-sm">
            {planLabel ?
          <>
                <div className="flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-medium text-foreground">Plano {planLabel}</p>
                </div>
                {plan !== "scale" &&
            <NavLink to="/app/pricing" className="text-xs text-primary font-medium hover:underline">
                    Fazer upgrade →
                  </NavLink>
            }
              </> :

          <>
                <p className="text-xs text-muted-foreground">Sem plano ativo</p>
                <NavLink to="/app/pricing" className="text-xs text-primary font-medium hover:underline">
                  Ver planos →
                </NavLink>
              </>
          }
          </div>
        }
        <button
          onClick={() => signOut()}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 apple-ease",
            collapsed && "justify-center"
          )}>

          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>);

}