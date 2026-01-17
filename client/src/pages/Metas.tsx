import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Target,
  Trophy,
  X,
  LayoutDashboard,
  Receipt,
  Menu,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: number;
  name: string;
  current: number;
  target: number;
  color: string;
}

export default function Metas() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const loadGoals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao carregar metas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex relative overflow-hidden">
      {/* Sidebar Desktop */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 lg:w-20 bg-[#121212]/90 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-8 z-[70] transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-10 font-bold shadow-lg shadow-orange-600/20 shrink-0">
          F
        </div>
        <nav className="flex flex-col gap-6 w-full px-4 items-center">
          <Link href="/">
            <div className="w-full lg:w-auto">
              <NavItem
                icon={<LayoutDashboard size={24} />}
                label="Dash"
                active={location === "/"}
              />
            </div>
          </Link>
          <Link href="/extrato">
            <div className="w-full lg:w-auto">
              <NavItem
                icon={<Receipt size={24} />}
                label="Extrato"
                active={location === "/extrato"}
              />
            </div>
          </Link>
          <Link href="/metas">
            <div className="w-full lg:w-auto">
              <NavItem
                icon={<Target size={24} />}
                label="Metas"
                active={location === "/metas"}
              />
            </div>
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="px-6 py-4 flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-zinc-400"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold">Minhas Metas</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 lg:pb-8">
          {loading ? (
            <div className="flex justify-center mt-10">
              <Loader2 className="animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Loop de Metas Original */}
              {goals.map((goal) => {
                const percentage = Math.min(
                  (goal.current / goal.target) * 100,
                  100,
                );
                return (
                  <div
                    key={goal.id}
                    className="bg-[#121212] p-6 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/5 rounded-2xl text-orange-500">
                        <Trophy size={20} />
                      </div>
                      <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded text-zinc-400">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg">{goal.name}</h3>
                      <p className="text-zinc-500 text-sm">
                        {goal.current.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}{" "}
                        /
                        {goal.target.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>

                    <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Botão de Adicionar Nova Meta (Visual Original) */}
              <button className="min-h-[200px] border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 group transition-all text-zinc-500 hover:text-orange-500">
                <div className="p-4 bg-zinc-900 rounded-full group-hover:bg-orange-500/10 transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-medium">Criar Nova Meta</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Menu Mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121212]/90 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-3xl flex items-center gap-8 z-[60] lg:hidden shadow-2xl shadow-black/50">
        <Link href="/">
          <button
            className={`p-3 rounded-2xl transition-all ${location === "/" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-zinc-500"}`}
          >
            <LayoutDashboard size={24} />
          </button>
        </Link>
        <Link href="/extrato">
          <button
            className={`p-3 rounded-2xl transition-all ${location === "/extrato" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-zinc-500"}`}
          >
            <Receipt size={24} />
          </button>
        </Link>
        <Link href="/metas">
          <button
            className={`p-3 rounded-2xl transition-all ${location === "/metas" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-zinc-500"}`}
          >
            <Target size={24} />
          </button>
        </Link>
      </div>
    </div>
  );
}

function NavItem({ icon, active, label }: any) {
  return (
    <div
      className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${active ? "text-orange-500" : "text-zinc-500 hover:text-white"}`}
    >
      <div
        className={`p-3 rounded-2xl transition-all ${active ? "bg-orange-600/10" : "group-hover:bg-white/5"}`}
      >
        {icon}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider lg:hidden">
        {label}
      </span>
    </div>
  );
}
