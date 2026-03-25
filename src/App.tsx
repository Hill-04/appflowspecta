import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StoreProvider, useStore } from "@/hooks/useStore";
import { SubscriptionProvider, useSubscription } from "@/hooks/useSubscription";
import { DraftStoreProvider } from "@/hooks/useDraftStore";
import { useUserRole } from "@/hooks/useUserRole";
import Auth from "./pages/Auth";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import Audiences from "./pages/Audiences";
import ScriptSets from "./pages/ScriptSets";
import Objections from "./pages/Objections";
import Insights from "./pages/Insights";
import StrategicProfile from "./pages/StrategicProfile";
import Goals from "./pages/Goals";
import PersonalProfile from "./pages/PersonalProfile";

import Onboarding from "./pages/Onboarding";
import Leads from "./pages/Leads";
import LeadTemplates from "./pages/LeadTemplates";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import Site from "./pages/Site";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

function PersonalProfileGuard({ children }: { children: React.ReactNode }) {
  const { loading, personalProfileCompleted } = useStore();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }
  if (!personalProfileCompleted) return <Navigate to="/app/personal-profile" replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { loading, profileCompleted } = useStore();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }
  if (profileCompleted === false) return <Navigate to="/app/onboarding" replace />;
  return <>{children}</>;
}

function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { plan, loading } = useSubscription();
  const { isOwner, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }
  if (isOwner) return <>{children}</>;
  if (!plan) return <Navigate to="/app/pricing" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public site at root */}
      <Route path="/" element={<Site />} />
      <Route path="/auth" element={user ? <Navigate to="/app" replace /> : <Auth />} />
      <Route path="/auth/google-calendar/callback" element={<GoogleCalendarCallback />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      {/* App dashboard under /app */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <StoreProvider>
              <DraftStoreProvider>
                <SubscriptionProvider>
                  <Routes>
                    {/* Routes accessible WITHOUT an active plan */}
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/personal-profile" element={<PersonalProfileRoute />} />
                    <Route path="/onboarding" element={<OnboardingRoute />} />
                    
                    {/* Routes that REQUIRE an active plan */}
                    <Route
                      path="/*"
                      element={
                        <SubscriptionGuard>
                          <PersonalProfileGuard>
                            <OnboardingGuard>
                              <Layout>
                                <Routes>
                                  <Route path="/" element={<Campaigns />} />
                                  <Route path="/campaigns/new" element={<CreateCampaign />} />
                                  <Route path="/campaigns/:id" element={<CampaignDetail />} />
                                  <Route path="/audiences" element={<Audiences />} />
                                  <Route path="/scripts" element={<ScriptSets />} />
                                  <Route path="/script-sets" element={<ScriptSets />} />
                                  <Route path="/goals" element={<Goals />} />
                                  <Route path="/leads" element={<Leads />} />
                                  <Route path="/lead-templates" element={<LeadTemplates />} />
                                  <Route path="/objections" element={<Objections />} />
                                  <Route path="/insights" element={<Insights />} />
                                  <Route path="/profile" element={<StrategicProfile />} />
                                  <Route path="/pricing" element={<Pricing />} />
                                  <Route path="/admin" element={<Admin />} />
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </Layout>
                            </OnboardingGuard>
                          </PersonalProfileGuard>
                        </SubscriptionGuard>
                      }
                    />
                  </Routes>
                </SubscriptionProvider>
              </DraftStoreProvider>
            </StoreProvider>
          </ProtectedRoute>
        }
      />
      {/* Redirect old /site to root */}
      <Route path="/site" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function PersonalProfileRoute() {
  const { personalProfileCompleted, loading } = useStore();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }
  if (personalProfileCompleted) return <Navigate to="/app" replace />;
  return <PersonalProfile />;
}

function OnboardingRoute() {
  const { profileCompleted, loading } = useStore();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }
  if (profileCompleted === true) return <Navigate to="/app" replace />;
  return <Onboarding />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
