import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter"; // [!code ++] Importação do wouter
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
  desc: string;
  category: string;
  value: number;
  date: string;
  goalId?: number;
}

interface Goal {
  id: number;
  name: string;
  current: number;
  target: number;
  color: string;
}

// --- Hooks para LocalStorage ---
function useStickyState<T>(
  defaultValue: T,
  key: string,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (err) {
      return defaultValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export default function Dashboard() {
  // [!code ++] Hook de localização para saber a rota atual
  const [location] = useLocation();

  // Estado UI
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Estado de Data (Filtro Mensal)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Dados Persistentes
  const [transactions, setTransactions] = useStickyState<Transaction[]>(
    [
      {
        id: 1,
        desc: "Salário Mensal",
        category: "Receita",
        value: 8500.0,
        date: "2026-01-05",
      },
      {
        id: 2,
        desc: "Supermercado",
        category: "Alimentação",
        value: -450.0,
        date: "2026-01-10",
      },
      {
        id: 3,
        desc: "Aluguel",
        category: "Moradia",
        value: -2200.0,
        date: "2026-01-02",
      },
    ],
    "finance-transactions",
  );

  const [goals, setGoals] = useStickyState<Goal[]>(
    [
      { id: 1, name: "Viagem", current: 4500, target: 10000, color: "#FF6600" },
      {
        id: 2,
        name: "Reserva",
        current: 15500,
        target: 30000,
        color: "#FF8533",
      },
    ],
    "finance-goals",
  );

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

  // 1. Filtra transações pelo Mês/Ano selecionado
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

  // 2. Transações filtradas por Busca
  const filteredTransactions = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.desc.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentMonthTransactions, searchTerm]);

  // 3. Estatísticas
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

  // 4. Dados para o Gráfico de Área
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

  // 5. Dados Categorias
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

  const handleSaveTransaction = (tx: Omit<Transaction, "id">, id?: number) => {
    if (id) {
      const oldTx = transactions.find((t) => t.id === id);
      const diff = tx.value - (oldTx?.value || 0);

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...tx, id } : t)),
      );

      if (tx.goalId) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === tx.goalId ? { ...g, current: g.current + diff } : g,
          ),
        );
      }
    } else {
      const newTx = { ...tx, id: Date.now() };
      setTransactions([newTx, ...transactions]);
      if (tx.goalId) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === tx.goalId ? { ...g, current: g.current + tx.value } : g,
          ),
        );
      }
    }
    setEditingTx(null);
  };

  const deleteTransaction = (id: number) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (txToDelete?.goalId) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === txToDelete.goalId
            ? { ...g, current: g.current - txToDelete.value }
            : g,
        ),
      );
    }
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const addGoal = (name: string, target: number, color: string) => {
    setGoals([...goals, { id: Date.now(), name, current: 0, target, color }]);
  };

  const removeGoal = (id: number) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

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

      {/* Sidebar - Atualizada com Links */}
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

        {/* Navegação com wouter */}
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
          {/* Mobile Menu Button & Title */}
          <div className="flex items-center w-full md:w-auto gap-4">
            <button
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold hidden md:block">Dashboard</h1>

            {/* Seletor de Data */}
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

          {/* Search & Action */}
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
                            {tx.desc}
                            {tx.goalId && (
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

// --- Componentes de Apoio ---

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
  const [desc, setDesc] = useState(initialData?.desc || "");
  const [val, setVal] = useState(initialData?.value.toString() || "");
  const [cat, setCat] = useState(initialData?.category || "Alimentação");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0],
  );
  const [goalId, setGoalId] = useState(initialData?.goalId?.toString() || "");

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
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
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
              onClick={() => {
                if (desc && val) {
                  onSave(
                    {
                      desc,
                      value: parseFloat(val),
                      category: cat,
                      date,
                      goalId: goalId ? parseInt(goalId) : undefined,
                    },
                    initialData?.id,
                  );
                  onClose();
                }
              }}
              className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all flex justify-center items-center gap-2"
            >
              <Pencil size={18} />{" "}
              {initialData ? "Atualizar Transação" : "Confirmar Transação"}
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
            onClick={() => {
              if (name && target) {
                onAdd(name, parseFloat(target), color);
                onClose();
              }
            }}
            className="w-full py-4 mt-2 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20"
          >
            Criar Meta
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
