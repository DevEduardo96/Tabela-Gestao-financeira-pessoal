import { useState, useMemo } from "react";
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
} from "recharts";

// --- Interfaces ---
interface Transaction {
  id: number;
  desc: string;
  category: string;
  value: number;
  date: string;
  goalId?: number; // Vínculo opcional com meta
}

interface Goal {
  id: number;
  name: string;
  current: number;
  target: number;
  color: string;
}

export default function Dashboard() {
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      desc: "Salário Mensal",
      category: "Receita",
      value: 8500.0,
      date: "2026-01-12",
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
      desc: "Reserva de Emergência",
      category: "Metas",
      value: 500.0,
      date: "2026-01-11",
      goalId: 2,
    },
  ]);

  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, name: "Viagem", current: 4500, target: 10000, color: "#FF6600" },
    { id: 2, name: "Reserva", current: 15500, target: 30000, color: "#FF8533" },
    { id: 3, name: "Carro", current: 8000, target: 50000, color: "#FFB380" },
  ]);

  // Cálculos dinâmicos
  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.value > 0)
      .reduce((acc, t) => acc + t.value, 0);
    const expenses = transactions
      .filter((t) => t.value < 0)
      .reduce((acc, t) => acc + Math.abs(t.value), 0);
    return { balance: income - expenses, income, expenses };
  }, [transactions]);

  const monthlyFlowData = useMemo(() => {
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
    const data = months.map((name) => ({ name, receitas: 0, despesas: 0 }));
    transactions.forEach((tx) => {
      const monthIdx = new Date(tx.date).getUTCMonth();
      if (tx.value > 0) data[monthIdx].receitas += tx.value;
      else data[monthIdx].despesas += Math.abs(tx.value);
    });
    return data;
  }, [transactions]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions
      .filter((t) => t.value < 0)
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + Math.abs(t.value);
      });
    const colors = ["#FF6600", "#FF8533", "#FFB380", "#444", "#666"];
    return Object.entries(cats).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [transactions]);

  const filteredTransactions = transactions.filter((t) =>
    t.desc.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Lógica principal solicitada: Adicionar Transação e atualizar Meta
  const addTransaction = (
    desc: string,
    val: number,
    cat: string,
    date: string,
    goalId?: number,
  ) => {
    const newTx: Transaction = {
      id: Date.now(),
      desc,
      value: val,
      category: cat,
      date,
      goalId,
    };
    setTransactions([newTx, ...transactions]);

    if (goalId) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, current: g.current + val } : g,
        ),
      );
    }
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {isTxModalOpen && (
        <TransactionModal
          goals={goals}
          onClose={() => setIsTxModalOpen(false)}
          onAdd={addTransaction}
        />
      )}
      {isGoalModalOpen && (
        <GoalModal onClose={() => setIsGoalModalOpen(false)} onAdd={addGoal} />
      )}

      <aside className="fixed left-0 top-0 h-full w-20 bg-[#121212] border-r border-white/5 flex flex-col items-center py-8 z-50">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center mb-10 font-bold text-white shadow-lg shadow-orange-600/20">
          F
        </div>
        <nav className="flex flex-col gap-6">
          <NavItem icon={<LayoutDashboard size={24} />} active />
          <NavItem icon={<Receipt size={24} />} />
          <NavItem icon={<Target size={24} />} />
        </nav>
      </aside>

      <div className="ml-20">
        <header className="p-8 flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
          <h1 className="text-3xl font-bold">Meu Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-64 h-11 pl-10 pr-4 rounded-xl bg-[#121212] border border-white/5 text-sm outline-none focus:ring-2 focus:ring-orange-600/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsTxModalOpen(true)}
              className="flex items-center gap-2 px-6 h-11 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-500 transition-all"
            >
              <Plus size={20} /> Nova Transação
            </button>
          </div>
        </header>

        <main className="p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Saldo Total"
              value={stats.balance}
              icon={<Wallet className="text-orange-500" />}
              change="+12.5%"
            />
            <StatCard
              title="Receitas"
              value={stats.income}
              icon={<TrendingUp className="text-emerald-500" />}
              change="+8.2%"
            />
            <StatCard
              title="Despesas"
              value={stats.expenses}
              icon={<TrendingDown className="text-red-500" />}
              change="-5.1%"
            />
            <StatCard
              title="Economia"
              value={stats.balance}
              icon={<PiggyBank className="text-orange-500" />}
              change="+15%"
            />
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-5 bg-[#121212] rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-bold mb-6">Fluxo Financeiro</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyFlowData}>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121212",
                      border: "1px solid #333",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receitas"
                    stroke="#ea580c"
                    fill="#ea580c"
                    fillOpacity={0.1}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-12 lg:col-span-3 bg-[#121212] rounded-2xl border border-white/5 p-6 text-center">
              <h3 className="text-lg font-bold mb-4">Categorias</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={
                      categoryData.length
                        ? categoryData
                        : [{ name: "Vazio", value: 1 }]
                    }
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-[#121212] rounded-2xl border border-white/5 p-6 h-[340px] flex flex-col">
              <h3 className="text-lg font-bold mb-4">Transações</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${tx.value > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                      >
                        {tx.value > 0 ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownRight size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-none flex items-center gap-2">
                          {tx.desc}
                          {tx.goalId && (
                            <span className="text-[9px] bg-orange-600/20 text-orange-500 px-1.5 py-0.5 rounded uppercase">
                              Meta
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          {new Date(tx.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-black ${tx.value > 0 ? "text-emerald-500" : ""}`}
                      >
                        {tx.value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#121212] rounded-2xl border border-white/5 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Minhas Metas</h3>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Plus size={16} /> Nova Meta
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {goals.map((goal) => {
                const percentage = Math.min(
                  (goal.current / goal.target) * 100,
                  100,
                );
                return (
                  <div
                    key={goal.id}
                    className="relative bg-[#0a0a0a] rounded-2xl p-6 border border-white/5 group hover:border-orange-600/30 transition-all"
                  >
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex justify-between items-center mb-4 pr-6">
                      <span className="font-bold text-sm">{goal.name}</span>
                      <span className="text-xs font-black text-orange-500">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-500 font-bold">
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
  onAdd,
  goals,
}: {
  onClose: () => void;
  onAdd: any;
  goals: Goal[];
}) {
  const [desc, setDesc] = useState("");
  const [val, setVal] = useState("");
  const [cat, setCat] = useState("Alimentação");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [goalId, setGoalId] = useState("");

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl text-white">
        <h2 className="text-2xl font-bold mb-6">Nova Movimentação</h2>
        <div className="space-y-4">
          <input
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-orange-600/50"
            placeholder="Ex: Investimento ou Aluguel"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none"
              placeholder="Valor (Ex: -50)"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
            <input
              type="date"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none text-sm"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option>Receita</option>
              <option>Alimentação</option>
              <option>Transporte</option>
              <option>Moradia</option>
              <option>Lazer</option>
              <option>Metas</option>
            </select>
            <select
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none text-sm"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
            >
              <option value="">Nenhuma Meta</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-zinc-500 italic">
            * Valores positivos somam à meta, negativos subtraem.
          </p>
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 font-bold text-sm hover:bg-white/5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (desc && val) {
                  onAdd(
                    desc,
                    parseFloat(val),
                    cat,
                    date,
                    goalId ? parseInt(goalId) : undefined,
                  );
                  onClose();
                }
              }}
              className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20"
            >
              Confirmar
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-white">
      <div className="bg-[#121212] border border-white/10 w-full max-w-sm rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Nova Meta</h2>
        <div className="space-y-4">
          <input
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none"
            placeholder="Ex: Aposentadoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 outline-none"
            placeholder="Valor Alvo"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <div className="flex items-center gap-4 p-1">
            <span className="text-sm text-zinc-400">Cor:</span>
            <input
              type="color"
              className="flex-1 h-10 bg-transparent border-none cursor-pointer"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 font-bold text-sm hover:bg-white/5 rounded-xl"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (name && target) {
                  onAdd(name, parseFloat(target), color);
                  onClose();
                }
              }}
              className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl"
            >
              Salvar Meta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, change }: any) {
  return (
    <div className="bg-[#121212] rounded-2xl border border-white/5 p-6 hover:border-orange-600/40 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full ${change.startsWith("+") ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
        >
          {change}
        </span>
      </div>
      <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">
        {title}
      </p>
      <p className="text-2xl font-bold mt-2">
        {value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>
    </div>
  );
}

function NavItem({
  icon,
  active,
}: {
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${active ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-zinc-500 hover:bg-white/5"}`}
    >
      {icon}
    </button>
  );
}
