import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Assumindo que você tem o shadcn/ui toast

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (!isLogin) {
        toast({
          title: "Sucesso!",
          description: "Verifique seu email para confirmar o cadastro.",
        });
      } else {
        setLocation("/"); // Redireciona para o Dashboard
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-orange-600/20">
            F
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
          </h1>
          <p className="text-zinc-500 text-sm">
            Gerencie suas finanças com inteligência.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 ml-1">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input
                type="email"
                required
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-600/50 transition-all text-sm"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 ml-1">
              Senha
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input
                type="password"
                required
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-600/50 transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isLogin ? "Entrar" : "Cadastrar"} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            {isLogin
              ? "Não tem uma conta? Cadastre-se"
              : "Já tem conta? Faça login"}
          </button>
        </div>
      </div>
    </div>
  );
}
