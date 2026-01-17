import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase"; // Conexão com Supabase
import { useToast } from "@/hooks/use-toast"; // Feedback visual
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

// --- Interfaces (Alinhadas com o Banco de Dados) ---
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

  // --- Carregar Dados do Supabase ---
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // 1. Buscar Transações
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (txError) throw txError;

      // 2. Buscar Metas
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

  // --- Cálculos Dinâmicos ---
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      // Ajuste simples para fuso horário UTC (data vinda do banco é YYYY-MM-DD)
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
    const yearData = months.map((name) => ({
      name,
      receitas: 0,
      despesas: 0,
      saldo: 0,
    }));

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

  // --- Ações (CRUD com Supabase) ---

  const handleSaveTransaction = async (tx: any, id?: number) => {
    try {
      // Obter usuário logado para garantir o user_id
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
        // Atualizar
        const { error } = await supabase
          .from("transactions")
          .update(transactionPayload)
          .eq("id", id);

        if (error) throw error;
        toast({ title: "Transação atualizada!" });
      } else {
        // Criar
        const { error } = await supabase
          .from("transactions")
          .insert([transactionPayload]);

        if (error) throw error;

        // Se tiver meta vinculada, atualizar o valor da meta (Opcional: Lógica simplificada)
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

      await fetchData(); // Recarregar dados
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

      const { error } = await supabase.from("goals").insert([
        {
          name,
          target,
          color,
          current: 0,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast({ title: "Meta criada com sucesso!" });
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

  // Loading Screen Inicial
  if (isLoading && transactions.length === 0 && goals.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex relative overflow-hidden">
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

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static top-0 left-0 h-full w-64 lg:w-20 bg-[#121212] border-r border-white/5
        flex flex-col items-center py-8 z-50 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center mb-10 font-bold text-white shadow-lg shadow-orange-600/20 shrink-0">
          F
        </div>

        <nav className="flex flex-col gap-6 w-full px-4 items-center">
          <Link href="/">
            <div className="w-full lg:w-auto cursor-pointer">
              <NavItem
                icon={<LayoutDashboard size={24} />}
                label="Dash"
                active={location === "/"}
              />
            </div>
          </Link>

          <Link href="/extrato">
            <div className="w-full lg:w-auto cursor-pointer">
              <NavItem
                icon={<Receipt size={24} />}
                label="Extrato"
                active={location === "/extrato"}
              />
            </div>
          </Link>

          <Link href="/metas">
            <div className="w-full lg:w-auto cursor-pointer">
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 z-40">
          <div className="flex items-center w-full md:w-auto gap-4">
            <button
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold hidden md:block">Dashboard</h1>

            <div className="flex items-center bg-[#121212] rounded-xl border border-white/5 p-1 ml-2">
              <button
                onClick={() => handleMonthChange("prev")}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 px-4 min-w-[140px] justify-center font-semibold text-sm">
                <Calendar size={14} className="text-orange-500" />
                <span className="capitalize">
                  {formatMonthYear(currentDate)}
                </span>
              </div>
              <button
                onClick={() => handleMonthChange("next")}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white"
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
            <button
              onClick={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 h-10 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-500 transition-all text-sm shadow-lg shadow-orange-600/20 whitespace-nowrap"
            >
              <Plus size={18} />{" "}
              <span className="hidden sm:inline">Nova Transação</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Saldo Geral"
              subtitle="Acumulado"
              value={stats.totalBalance}
              icon={<Wallet className="text-orange-500" />}
              isTotal
            />
            <StatCard
              title="Receitas"
              subtitle={formatMonthYear(currentDate)}
              value={stats.monthlyIncome}
              icon={<TrendingUp className="text-emerald-500" />}
              change="Mensal"
            />
            <StatCard
              title="Despesas"
              subtitle={formatMonthYear(currentDate)}
              value={stats.monthlyExpenses}
              icon={<TrendingDown className="text-red-500" />}
              change="Mensal"
            />
            <StatCard
              title="Balanço"
              subtitle={formatMonthYear(currentDate)}
              value={stats.monthlyBalance}
              icon={<PiggyBank className="text-orange-500" />}
              change={stats.monthlyBalance >= 0 ? "Positivo" : "Negativo"}
              isTotal
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-[#121212] rounded-2xl border border-white/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">
                  Fluxo Anual ({currentDate.getFullYear()})
                </h3>
              </div>
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
                      name="Receitas"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorReceitas)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="despesas"
                      name="Despesas"
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
              <h3 className="text-lg font-bold mb-2">Gastos por Categoria</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Referente a {formatMonthYear(currentDate)}
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
                      <Tooltip
                        formatter={(value: number) =>
                          value.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        }
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #333",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                    Sem gastos neste mês
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.slice(0, 4).map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-2 text-xs text-zinc-400"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-[#121212] rounded-2xl border border-white/5 p-6 flex flex-col max-h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Transações Recentes</h3>
                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">
                  {filteredTransactions.length} registros
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {filteredTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-2">
                    <Receipt size={32} className="opacity-20" />
                    <p className="text-sm">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between group p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 cursor-pointer"
                      onClick={() => {
                        setEditingTx(tx);
                        setIsTxModalOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2.5 rounded-xl ${tx.value > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                        >
                          {tx.value > 0 ? (
                            <ArrowUpRight size={18} />
                          ) : (
                            <ArrowDownRight size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-none flex items-center gap-2">
                            {tx.description}
                            {tx.goal_id && (
                              <span className="text-[9px] bg-orange-600/20 text-orange-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                Meta
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">
                              {tx.category}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(tx.date).toLocaleDateString("pt-BR", {
                                timeZone: "UTC",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`font-bold text-sm ${tx.value > 0 ? "text-emerald-500" : "text-white"}`}
                        >
                          {tx.value.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTransaction(tx.id);
                          }}
                          className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Goals Column */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[#121212] rounded-2xl border border-white/5 p-6 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Minhas Metas</h3>
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
                        className="relative bg-[#0a0a0a] rounded-xl p-5 border border-white/5 hover:border-orange-600/30 transition-all group"
                      >
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
                        >
                          <X size={14} />
                        </button>
                        <div className="flex justify-between items-center mb-3">
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
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                          <div
                            className="h-full transition-all duration-700 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: goal.color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                          <span>
                            {goal.current.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                          <span>
                            {goal.target.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && (
                    <div className="text-center py-8 text-zinc-600 text-xs">
                      Nenhuma meta cadastrada
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Componentes de Apoio (Modais) ---

function TransactionModal({
  onClose,
  onSave,
  goals,
  initialData,
}: {
  onClose: () => void;
  onSave: any;
  goals: Goal[];
  initialData: Transaction | null;
}) {
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [val, setVal] = useState(initialData?.value.toString() || "");
  const [cat, setCat] = useState(initialData?.category || "Alimentação");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0],
  );
  const [goalId, setGoalId] = useState(initialData?.goal_id?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (description && val) {
      setIsSaving(true);
      await onSave(
        {
          description,
          value: parseFloat(val),
          category: cat,
          date,
          goal_id: goalId ? parseInt(goalId) : undefined,
        },
        initialData?.id,
      );
      setIsSaving(false);
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl text-white scale-100"
        onClick={handleContentClick}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {initialData ? "Editar Movimentação" : "Nova Movimentação"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 ml-1 mb-1 block">
              Descrição
            </label>
            <input
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-orange-600/50 transition-all text-sm"
              placeholder="Ex: Salário, Mercado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 ml-1 mb-1 block">
                Valor
              </label>
              <input
                type="number"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none text-sm"
                placeholder="Ex: -50"
                value={val}
                onChange={(e) => setVal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 ml-1 mb-1 block">
                Data
              </label>
              <input
                type="date"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none text-sm text-zinc-300"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 ml-1 mb-1 block">
                Categoria
              </label>
              <select
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none text-sm appearance-none"
                value={cat}
                onChange={(e) => setCat(e.target.value)}
              >
                <option>Receita</option>
                <option>Alimentação</option>
                <option>Transporte</option>
                <option>Moradia</option>
                <option>Lazer</option>
                <option>Educação</option>
                <option>Saúde</option>
                <option>Investimento</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-500 ml-1 mb-1 block">
                Vincular a Meta (Opcional)
              </label>
              <select
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none text-sm appearance-none"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
              >
                <option value="">Nenhuma</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={isSaving}
              onClick={handleSave}
              className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Pencil size={18} />{" "}
                  {initialData ? "Atualizar Transação" : "Confirmar Transação"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalModal({ onClose, onAdd }: { onClose: () => void; onAdd: any }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [color, setColor] = useState("#ea580c");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (name && target) {
      setIsSaving(true);
      await onAdd(name, parseFloat(target), color);
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-white animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#121212] border border-white/10 w-full max-w-sm rounded-3xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Nova Meta</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <input
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-orange-600/50 transition-all"
            placeholder="Nome (Ex: Carro Novo)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            type="number"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-orange-600/50 transition-all"
            placeholder="Valor Alvo (Ex: 50000)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <div className="flex items-center gap-4 p-2 bg-[#0a0a0a] border border-white/10 rounded-xl">
            <span className="text-sm text-zinc-400 pl-2">Cor da Tag:</span>
            <input
              type="color"
              className="flex-1 h-8 bg-transparent border-none cursor-pointer"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <button
            disabled={isSaving}
            onClick={handleSave}
            className="w-full py-4 mt-2 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : "Criar Meta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, change, subtitle, isTotal }: any) {
  return (
    <div className="bg-[#121212] rounded-2xl border border-white/5 p-6 hover:border-orange-600/40 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full ${isTotal ? "bg-zinc-800 text-zinc-400" : "bg-white/5 text-zinc-400"}`}
        >
          {change}
        </span>
      </div>
      <div>
        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight">
          {value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
        {subtitle && (
          <p className="text-[10px] text-zinc-600 mt-1 capitalize">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function NavItem({
  icon,
  active,
  label,
}: {
  icon: React.ReactNode;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      className={`w-full lg:w-12 h-12 rounded-xl flex items-center justify-start lg:justify-center gap-4 lg:gap-0 px-4 lg:px-0 transition-all ${active ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-zinc-500 hover:bg-white/5 hover:text-white"}`}
    >
      {icon}
      <span className="lg:hidden font-bold text-sm">{label}</span>
    </button>
  );
}
