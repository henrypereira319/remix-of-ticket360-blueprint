import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
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
const OperationsDashboard = lazy(() => import("./pages/OperationsDashboard.tsx"));

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
              <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-white/75">
                Desenhando o mapa...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/eventos/:slug" element={<EventDetails />} />
              <Route path="/eventos/:slug/assentos" element={<EventSeatExperience />} />
              <Route path="/eventos/:slug/checkout" element={<EventCheckout />} />
              <Route path="/conta/acesso" element={<AccountAccess />} />
              <Route path="/conta" element={<AccountDashboard />} />
              <Route path="/operacao" element={<OperationsDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
