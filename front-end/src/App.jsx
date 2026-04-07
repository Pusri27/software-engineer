import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import ChatBotPage from "./pages/ChatBotPage";
import Admin from "./pages/Admin/Admin";
import WorkLog from "./pages/WorkLog/WorkLog";
import WorkLogVersion from "./pages/WorkLogVersion";
import Profile from "./pages/Profile";
import BlogEditor from "./pages/BlogEditor";
import BlogPost from "./pages/BlogPost";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import NewPassword from "./pages/NewPassword/NewPassword";
import NotFound from "./pages/NotFound";
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { validateAndCleanupToken } from './utils/authUtils';
import Login from "./pages/Login/Login";
import MyStats from "./pages/MyStats";


const queryClient = new QueryClient();

const App = () => {
  // Validate token on app load
  useEffect(() => {
    validateAndCleanupToken();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<Login />} />
            
            {/* PROTECTED ROUTES */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/chatbot" element={<ProtectedRoute><ChatBotPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/worklog" element={<ProtectedRoute><WorkLog /></ProtectedRoute>} />
            <Route path="/worklogs/:id/versions" element={<ProtectedRoute><WorkLogVersion /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/blog-editor" element={<ProtectedRoute><BlogEditor /></ProtectedRoute>} />
            <Route path="/blog-post" element={<ProtectedRoute><BlogPost /></ProtectedRoute>} />
            <Route path="/my-stats" element={<ProtectedRoute><MyStats /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/new-password/:token" element={<NewPassword />} />
            
            {/* CATCH-ALL ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

