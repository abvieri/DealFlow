import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import ProposalNew from "./pages/ProposalNew";
import ProposalSimulate from "./pages/ProposalSimulate";
import ProposalBuild from "./pages/ProposalBuild";
import ProposalView from "./pages/ProposalView";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/services" element={<Layout><Services /></Layout>} />
            <Route path="/proposal/new" element={<Layout><ProposalNew /></Layout>} />
            <Route path="/proposal/simulate" element={<Layout><ProposalSimulate /></Layout>} />
            <Route path="/proposal/:id/build" element={<Layout><ProposalBuild /></Layout>} />
            <Route path="/proposal/:id/edit" element={<Layout><ProposalBuild /></Layout>} />
            <Route path="/proposal/:id/view" element={<Layout><ProposalView /></Layout>} />
            <Route path="/users" element={<Layout><Users /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
