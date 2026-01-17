import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { supabase } from "@/lib/supabase"; // Importe o cliente
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Páginas
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Extrato from "@/pages/Extrato";
import Metas from "@/pages/Metas";
import AuthPage from "@/pages/Auth"; // Nova página

function Router() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // 1. Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuta mudanças (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setLocation("/auth"); // Se deslogar, vai pro login
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  if (loading) return <div className="h-screen bg-[#0a0a0a]" />; // Tela preta enquanto carrega

  // Se não tiver sessão, mostra SÓ a tela de Auth
  if (!session) {
    return <AuthPage />;
  }

  // Se tiver sessão, mostra o app normal
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/extrato" component={Extrato} />
      <Route path="/metas" component={Metas} />
      <Route path="/auth">
        {/* Se tentar acessar /auth estando logado, volta pro dash */}
        {() => {
          setLocation("/");
          return null;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
