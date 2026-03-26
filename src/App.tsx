import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/auth-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AccountAccess from "./pages/AccountAccess.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const AccountDashboard = lazy(() => import("./pages/AccountDashboard.tsx"));
const EventCheckout = lazy(() => import("./pages/EventCheckout.tsx"));
const EventDetails = lazy(() => import("./pages/EventDetails.tsx"));
const EventSeatExperience = lazy(() => import("./pages/EventSeatExperience.tsx"));
const OrganizerEventsDashboard = lazy(() => import("./pages/OrganizerEventsDashboard.tsx"));
const OperationsDashboard = lazy(() => import("./pages/OperationsDashboard.tsx"));
const PulseIndex = lazy(() => import("./pages/PulseIndex.tsx"));

// Social mobile experience
const SocialShell = lazy(() => import("./components/social/SocialShell.tsx"));
const SocialHome = lazy(() => import("./pages/social/SocialHome.tsx"));
const FriendsPage = lazy(() => import("./pages/social/FriendsPage.tsx"));
const TicketsPage = lazy(() => import("./pages/social/TicketsPage.tsx"));
const MapPage = lazy(() => import("./pages/social/MapPage.tsx"));
const ProfilePage = lazy(() => import("./pages/social/ProfilePage.tsx"));
const BarPage = lazy(() => import("./pages/social/BarPage.tsx"));
const SplitsPage = lazy(() => import("./pages/social/SplitsPage.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-foreground/75">
                Carregando...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pulse" element={<PulseIndex />} />
              <Route path="/eventos/:slug" element={<EventDetails />} />
              <Route path="/eventos/:slug/assentos" element={<EventSeatExperience />} />
              <Route path="/eventos/:slug/checkout" element={<EventCheckout />} />
              <Route path="/conta/acesso" element={<AccountAccess />} />
              <Route path="/conta" element={<AccountDashboard />} />
              <Route path="/organizador/meus-eventos" element={<OrganizerEventsDashboard />} />
              <Route path="/produtor/meus-eventos" element={<OrganizerEventsDashboard />} />
              <Route path="/operacao" element={<OperationsDashboard />} />

              {/* Social mobile experience */}
              <Route path="/app" element={<SocialShell />}>
                <Route index element={<SocialHome />} />
                <Route path="amigos" element={<FriendsPage />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="mapa" element={<MapPage />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="bar" element={<BarPage />} />
                <Route path="divisoes" element={<SplitsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
