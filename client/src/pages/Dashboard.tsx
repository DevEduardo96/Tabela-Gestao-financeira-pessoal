import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  LayoutDashboard,
  Receipt,
  Target,
  Search,
  Trash2,
  Menu,
  X,
  Calendar,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Home, // Adicionado ícone Home se desejar usar no lugar do LayoutDashboard
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from "recharts";

// --- Interfaces ---
interface Transaction {
  id: number;
  description: string;
  category: string;
  value: number;
  date: string;
  goal_id?: number | null;
}

interface Goal {
  id: number;
  name: string;
  current: number;
  target: number;
  color: string;
}

export default function Dashboard() {
  const [location] = useLocation();
  const { toast } = useToast();

  // Estados de Dados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Carregar Dados ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      if (txError) throw txError;

      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: true });
      if (goalsError) throw goalsError;

      setTransactions(txData || []);
      setGoals(goalsData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Lógica de Data ---
  const handleMonthChange = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  // --- Cálculos ---
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      const tMonth = tDate.getUTCMonth();
      const tYear = tDate.getUTCFullYear();
      return (
        tMonth === currentDate.getMonth() && tYear === currentDate.getFullYear()
      );
    });
  }, [transactions, currentDate]);

  const filteredTransactions = useMemo(() => {
    return currentMonthTransactions
      .filter((t) =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentMonthTransactions, searchTerm]);

  const stats = useMemo(() => {
    const totalBalance = transactions.reduce((acc, t) => acc + t.value, 0);
    const monthlyIncome = currentMonthTransactions
      .filter((t) => t.value > 0)
      .reduce((acc, t) => acc + t.value, 0);
    const monthlyExpenses = currentMonthTransactions
      .filter((t) => t.value < 0)
      .reduce((acc, t) => acc + Math.abs(t.value), 0);
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    return { totalBalance, monthlyIncome, monthlyExpenses, monthlyBalance };
  }, [transactions, currentMonthTransactions]);

  const yearlyFlowData = useMemo(() => {
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const yearData = months.map((name) => ({ name, receitas: 0, despesas: 0 }));
    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getUTCFullYear() === currentDate.getFullYear()) {
        const idx = txDate.getUTCMonth();
        if (tx.value > 0) yearData[idx].receitas += tx.value;
        else yearData[idx].despesas += Math.abs(tx.value);
      }
    });
    return yearData;
  }, [transactions, currentDate]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    currentMonthTransactions
      .filter((t) => t.value < 0)
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + Math.abs(t.value);
      });
    const colors = [
      "#FF6600",
      "#FF8533",
      "#FFB380",
      "#EAB308",
      "#EF4444",
      "#666",
    ];
    return Object.entries(cats).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [currentMonthTransactions]);

  // --- Ações ---
  const handleSaveTransaction = async (tx: any, id?: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const transactionPayload = {
        description: tx.description,
        value: tx.value,
        category: tx.category,
        date: tx.date,
        goal_id: tx.goal_id || null,
        user_id: user.id,
      };

      if (id) {
        const { error } = await supabase
          .from("transactions")
          .update(transactionPayload)
          .eq("id", id);
        if (error) throw error;
        toast({ title: "Transação atualizada!" });
      } else {
        const { error } = await supabase
          .from("transactions")
          .insert([transactionPayload]);
        if (error) throw error;
        if (tx.goal_id) {
          const goal = goals.find((g) => g.id === tx.goal_id);
          if (goal) {
            await supabase
              .from("goals")
              .update({ current: goal.current + tx.value })
              .eq("id", goal.id);
          }
        }
        toast({ title: "Transação criada!" });
      }
      await fetchData();
      setEditingTx(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Transação removida" });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    }
  };

  const addGoal = async (name: string, target: number, color: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");
      const { error } = await supabase
        .from("goals")
        .insert([{ name, target, color, current: 0, user_id: user.id }]);
      if (error) throw error;
      toast({ title: "Meta criada!" });
      await fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar meta",
        description: error.message,
      });
    }
  };

  const removeGoal = async (id: number) => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast({ title: "Meta removida" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover meta",
        description: error.message,
      });
    }
  };

  if (isLoading && transactions.length === 0 && goals.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Modais */}
      {isTxModalOpen && (
        <TransactionModal
          goals={goals}
          initialData={editingTx}
          onClose={() => {
            setIsTxModalOpen(false);
            setEditingTx(null);
          }}
          onSave={handleSaveTransaction}
        />
      )}
      {isGoalModalOpen && (
        <GoalModal onClose={() => setIsGoalModalOpen(false)} onAdd={addGoal} />
      )}

      {/* Sidebar Mobile Overlay (Quando aberto pelo menu do nav) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside
        className={`
        fixed lg:static top-0 left-0 h-full w-64 lg:w-20 bg-[#121212]/90 backdrop-blur-xl border-r border-white/5
        flex flex-col items-center py-8 z-[70] transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-10 font-bold text-white shadow-lg shadow-orange-600/20 shrink-0">
          F
        </div>

        <nav className="flex flex-col gap-6 w-full px-4 items-center">
          <Link href="/">
            <div
              className="w-full lg:w-auto cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            >
              <NavItem
                icon={<LayoutDashboard size={24} />}
                label="Dash"
                active={location === "/"}
              />
            </div>
          </Link>
          <Link href="/extrato">
            <div
              className="w-full lg:w-auto cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            >
              <NavItem
                icon={<Receipt size={24} />}
                label="Extrato"
                active={location === "/extrato"}
              />
            </div>
          </Link>
          <Link href="/metas">
            <div
              className="w-full lg:w-auto cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            >
              <NavItem
                icon={<Target size={24} />}
                label="Metas"
                active={location === "/metas"}
              />
            </div>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header */}
        <header className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 z-40">
          <div className="flex items-center w-full md:w-auto gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
            </div>

            <div className="flex items-center bg-[#121212] rounded-xl border border-white/5 p-1 ml-auto md:ml-2">
              <button
                onClick={() => handleMonthChange("prev")}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 px-2 sm:px-4 min-w-[100px] justify-center font-semibold text-xs sm:text-sm">
                <Calendar
                  size={14}
                  className="text-orange-500 hidden sm:block"
                />
                <span className="capitalize">
                  {formatMonthYear(currentDate)}
                </span>
              </div>
              <button
                onClick={() => handleMonthChange("next")}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full md:w-64 h-10 pl-10 pr-4 rounded-xl bg-[#121212] border border-white/5 text-sm outline-none focus:ring-2 focus:ring-orange-600/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Botão Desktop - Escondido no Mobile */}
            <button
              onClick={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              className="hidden md:flex items-center gap-2 px-4 h-10 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-500 transition-all text-sm shadow-lg shadow-orange-600/20 whitespace-nowrap"
            >
              <Plus size={18} /> <span>Nova Transação</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content - Padding extra no final para o menu flutuante não cobrir nada */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar pb-32 lg:pb-8">
          {/* KPI Cards (Scroll Horizontal Mobile) */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-hide">
            {/* Cards... usei min-w-[85%] para aparecerem quase inteiros no mobile */}
            <div className="min-w-[85%] sm:min-w-0 snap-center">
              <StatCard
                title="Saldo Geral"
                subtitle="Acumulado"
                value={stats.totalBalance}
                icon={<Wallet className="text-orange-500" />}
                isTotal
              />
            </div>
            <div className="min-w-[85%] sm:min-w-0 snap-center">
              <StatCard
                title="Receitas"
                subtitle={formatMonthYear(currentDate)}
                value={stats.monthlyIncome}
                icon={<TrendingUp className="text-emerald-500" />}
                change="Mensal"
              />
            </div>
            <div className="min-w-[85%] sm:min-w-0 snap-center">
              <StatCard
                title="Despesas"
                subtitle={formatMonthYear(currentDate)}
                value={stats.monthlyExpenses}
                icon={<TrendingDown className="text-red-500" />}
                change="Mensal"
              />
            </div>
            <div className="min-w-[85%] sm:min-w-0 snap-center">
              <StatCard
                title="Balanço"
                subtitle={formatMonthYear(currentDate)}
                value={stats.monthlyBalance}
                icon={<PiggyBank className="text-orange-500" />}
                change={stats.monthlyBalance >= 0 ? "Positivo" : "Negativo"}
                isTotal
              />
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-[#121212] rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-bold mb-6">
                Fluxo Anual ({currentDate.getFullYear()})
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yearlyFlowData}>
                    <defs>
                      <linearGradient
                        id="colorReceitas"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorDespesas"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `R$${value / 1000}k`}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value: number) =>
                        value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="receitas"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorReceitas)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="despesas"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorDespesas)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-[#121212] rounded-2xl border border-white/5 p-6 flex flex-col">
              <h3 className="text-lg font-bold mb-2">Categorias</h3>
              <p className="text-xs text-zinc-500 mb-4">
                {formatMonthYear(currentDate)}
              </p>
              <div className="flex-1 min-h-[200px]">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="rgba(0,0,0,0)"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                    Sem gastos
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transações */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-[#121212] rounded-2xl border border-white/5 p-6 flex flex-col max-h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Transações</h3>
                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">
                  {filteredTransactions.length} regs.
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between group p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 cursor-pointer"
                    onClick={() => {
                      setEditingTx(tx);
                      setIsTxModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${tx.value > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                      >
                        {tx.value > 0 ? (
                          <ArrowUpRight size={18} />
                        ) : (
                          <ArrowDownRight size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {tx.description}
                        </p>
                        <span className="text-[10px] text-zinc-400">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-sm whitespace-nowrap ${tx.value > 0 ? "text-emerald-500" : "text-white"}`}
                    >
                      {tx.value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metas */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[#121212] rounded-2xl border border-white/5 p-6 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Metas</h3>
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="p-2 hover:bg-white/10 text-orange-500 rounded-lg transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {goals.map((goal) => {
                    const percentage = Math.min(
                      (goal.current / goal.target) * 100,
                      100,
                    );
                    return (
                      <div
                        key={goal.id}
                        className="relative bg-[#0a0a0a] rounded-xl p-5 border border-white/5"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm text-zinc-200">
                            {goal.name}
                          </span>
                          <span
                            className="text-xs font-black"
                            style={{ color: goal.color }}
                          >
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full transition-all duration-700 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: goal.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* --- MENU INFERIOR AJUSTADO (Mobile Only) --- */}
      {/* Correções:
          1. left-1/2 + -translate-x-1/2: Centraliza perfeitamente independente da tela.
          2. max-w-[400px]: Impede que fique muito largo em celulares deitados ou tablets.
          3. w-[90%]: Mantém margem lateral em telas muito pequenas.
          4. grid-cols-5: Garante espaçamento simétrico.
          5. bottom-6: Sobe um pouco para evitar safe-area do iPhone.
      */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50 lg:hidden">
        <nav className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-2xl h-16 shadow-2xl shadow-black/60 relative">
          <div className="grid grid-cols-5 h-full items-center">
            {/* Botão 1 */}
            <Link href="/">
              <button
                className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-l-2xl transition-colors ${location === "/" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <LayoutDashboard
                  size={22}
                  strokeWidth={location === "/" ? 2.5 : 2}
                />
                {/* Indicador de ativo opcional */}
                {location === "/" && (
                  <div className="w-1 h-1 bg-orange-500 rounded-full absolute bottom-2" />
                )}
              </button>
            </Link>

            {/* Botão 2 */}
            <Link href="/extrato">
              <button
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${location === "/extrato" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Receipt
                  size={22}
                  strokeWidth={location === "/extrato" ? 2.5 : 2}
                />
              </button>
            </Link>

            {/* Espaço Vazio para o Botão Central */}
            <div className="flex justify-center items-center pointer-events-none">
              {/* O botão real está posicionado absolutamente abaixo para sair do container */}
            </div>

            {/* Botão 4 */}
            <Link href="/metas">
              <button
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${location === "/metas" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Target
                  size={22}
                  strokeWidth={location === "/metas" ? 2.5 : 2}
                />
              </button>
            </Link>

            {/* Botão 5 (Menu Lateral) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-r-2xl transition-colors ${isSidebarOpen ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Menu size={22} />
            </button>
          </div>

          {/* Botão Central Flutuante (Posicionado Absolutamente para "sair" do menu) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button
              onClick={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              className="bg-gradient-to-b from-orange-500 to-orange-600 text-white w-14 h-14 rounded-full shadow-lg shadow-orange-600/40 flex items-center justify-center border-4 border-[#0a0a0a] active:scale-95 transition-transform"
            >
              <Plus size={28} />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

// Componentes auxiliares (Modais) permanecem os mesmos...
function TransactionModal({ onClose, onSave, goals, initialData }: any) {
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [val, setVal] = useState(initialData?.value.toString() || "");
  const [cat, setCat] = useState(initialData?.category || "Alimentação");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0],
  );
  const [goalId, setGoalId] = useState(initialData?.goal_id?.toString() || "");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div
        className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {initialData ? "Editar" : "Nova"} Transação
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-zinc-500" />
          </button>
        </div>
        {/* Form simplificado para brevidade */}
        <div className="space-y-4">
          <input
            className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl"
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              className="bg-zinc-900 border border-white/10 p-3 rounded-xl"
              placeholder="Valor"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
            <input
              type="date"
              className="bg-zinc-900 border border-white/10 p-3 rounded-xl text-zinc-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <select
            className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            <option>Alimentação</option>
            <option>Transporte</option>
            <option>Metas</option>
            <option>Educação</option>
            <option>Despesa</option>
            <option>Receita</option>
          </select>
          <button
            onClick={() => {
              onSave(
                {
                  description,
                  value: parseFloat(val),
                  category: cat,
                  date,
                  goal_id: goalId ? parseInt(goalId) : null,
                },
                initialData?.id,
              );
              onClose();
            }}
            className="w-full bg-orange-600 py-3 rounded-xl font-bold mt-2"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalModal({ onClose, onAdd }: any) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        className="bg-[#121212] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nova Meta</h2>
          <button onClick={onClose}>
            <X size={20} className="text-zinc-500" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl"
            placeholder="Alvo"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <button
            onClick={() => {
              onAdd(name, parseFloat(target), "#ea580c");
              onClose();
            }}
            className="w-full bg-orange-600 py-3 rounded-xl font-bold mt-2"
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-[#121212] rounded-2xl border border-white/5 p-5">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
      </div>
      <p className="text-xs text-zinc-500 uppercase">{title}</p>
      <p className="text-xl font-bold">
        {value?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>
    </div>
  );
}

function NavItem({ icon, active, label }: any) {
  return (
    <button
      className={`w-full lg:w-12 h-12 rounded-xl flex items-center justify-start lg:justify-center gap-4 lg:gap-0 px-4 lg:px-0 transition-all ${active ? "bg-orange-600 text-white" : "text-zinc-500 hover:bg-white/5"}`}
    >
      {icon} <span className="lg:hidden font-bold text-sm">{label}</span>
    </button>
  );
}
