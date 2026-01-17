import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Importação das Páginas
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Extrato from "@/pages/Extrato"; // Certifique-se de que o arquivo existe neste caminho
import Metas from "@/pages/Metas"; // Certifique-se de que o arquivo existe neste caminho

function Router() {
  return (
    <Switch>
      {/* Rota Principal - Dashboard */}
      <Route path="/" component={Dashboard} />

      {/* Novas Rotas */}
      <Route path="/extrato" component={Extrato} />
      <Route path="/metas" component={Metas} />

      {/* Rota 404 - Caso não encontre nada */}
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
