import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BorrowerDashboard from "./pages/BorrowerDashboard";
import LoanApply from "./pages/LoanApply";
import KYC from "./pages/KYC";
import Marketplace from "./pages/Marketplace";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import WalletPage from "./pages/Wallet";
import ContractView from "./pages/ContractView";
import ContractsList from "./pages/ContractsList";
import ContractVerify from "./pages/ContractVerify";
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
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/borrower" element={<ProtectedRoute allowedRoles={['borrower']}><BorrowerDashboard /></ProtectedRoute>} />
            <Route path="/borrower/loan-apply" element={<ProtectedRoute allowedRoles={['borrower']}><LoanApply /></ProtectedRoute>} />
            <Route path="/borrower/collateral-submit" element={<ProtectedRoute allowedRoles={['borrower']}><LoanApply /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute allowedRoles={['lender']}><Marketplace /></ProtectedRoute>} />
            <Route path="/agent" element={<ProtectedRoute allowedRoles={['agent']}><AgentDashboard /></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><ContractsList /></ProtectedRoute>} />
            <Route path="/contracts/verify" element={<ContractVerify />} />
            <Route path="/contract/:loanId" element={<ProtectedRoute><ContractView /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
