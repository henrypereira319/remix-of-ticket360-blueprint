import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AccountAccess from "./pages/AccountAccess.tsx";
import AccountDashboard from "./pages/AccountDashboard.tsx";
import AdminEventBuilder from "./pages/AdminEventBuilder.tsx";
import EventCheckout from "./pages/EventCheckout.tsx";
import EventDetails from "./pages/EventDetails.tsx";
import EventSeatExperience from "./pages/EventSeatExperience.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/eventos/:slug" element={<EventDetails />} />
            <Route path="/eventos/:slug/assentos" element={<EventSeatExperience />} />
            <Route path="/eventos/:slug/checkout" element={<EventCheckout />} />
            <Route path="/conta/acesso" element={<AccountAccess />} />
            <Route path="/conta" element={<AccountDashboard />} />
            <Route path="/admin" element={<Navigate to="/admin/eventos/novo" replace />} />
            <Route path="/admin/eventos/novo" element={<AdminEventBuilder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
