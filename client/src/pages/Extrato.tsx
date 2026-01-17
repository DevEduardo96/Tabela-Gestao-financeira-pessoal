import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Trash2,
  Loader2,
  LayoutDashboard,
  Receipt,
  Target,
  Menu,
  X,
} from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  category: string;
  value: number;
  date: string;
  goal_id?: number | null;
}

export default function Extrato() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate] = useState(new Date());

  // Novo estado para o layout
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLocation("/auth");
        return;
      }

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split("T")[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setTransactions(transactions.filter((t) => t.id !== id));
      toast({ title: "Transação removida" });
    } catch (error) {
      toast({ title: "Erro ao deletar", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentDate]);

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
            <h1 className="text-xl font-bold">Extrato</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 lg:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Barra de Pesquisa Original */}
            <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-[#121212] border border-white/5 rounded-2xl flex items-center px-4 h-12 focus-within:border-orange-500/50 transition-colors">
                <Search className="text-zinc-500 mr-3" size={20} />
                <input
                  type="text"
                  placeholder="Buscar transação..."
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="w-12 h-12 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                <Filter size={20} />
              </button>
            </div>

            {/* Tabela Original */}
            <div className="bg-[#121212] rounded-3xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase">
                      <th className="p-5 font-medium">Descrição</th>
                      <th className="p-5 font-medium">Categoria</th>
                      <th className="p-5 font-medium text-right">Valor</th>
                      <th className="p-5 font-medium text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center">
                          <Loader2 className="animate-spin mx-auto text-orange-500" />
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-zinc-500"
                        >
                          Nenhuma transação encontrada.
                        </td>
                      </tr>
                    ) : (
                      transactions
                        .filter((t) =>
                          t.description
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        )
                        .map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                          >
                            <td className="p-5">
                              <div className="font-medium">
                                {tx.description}
                              </div>
                              <div className="text-xs text-zinc-500 md:hidden">
                                {new Date(tx.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-5">
                              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-zinc-300 border border-white/5">
                                {tx.category}
                              </span>
                            </td>
                            <td
                              className={`p-5 text-right font-bold ${tx.value > 0 ? "text-emerald-500" : "text-zinc-200"}`}
                            >
                              {tx.value.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            <td className="p-5 text-center">
                              <button
                                onClick={() => deleteTransaction(tx.id)}
                                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
