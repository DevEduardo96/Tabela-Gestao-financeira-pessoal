import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Plus,
  Target,
  Trophy,
  TrendingUp,
  X,
  Check,
  Trash2, // <--- Adicionado (Correção do erro)
  ArrowLeft, // <--- Adicionado (Botão voltar)
} from "lucide-react";

// --- Interfaces ---
interface Goal {
  id: number;
  name: string;
  current: number;
  target: number;
  color: string;
}

interface Transaction {
  id: number;
  desc: string;
  category: string;
  value: number;
  date: string;
  goalId?: number;
}

// --- Hook Reuse ---
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

export default function Metas() {
  const [goals, setGoals] = useStickyState<Goal[]>([], "finance-goals");
  const [transactions, setTransactions] = useStickyState<Transaction[]>(
    [],
    "finance-transactions",
  );

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [depositValue, setDepositValue] = useState("");

  // Handler para adicionar valor a uma meta
  const handleDeposit = () => {
    if (!selectedGoal || !depositValue) return;

    const val = parseFloat(depositValue);
    if (isNaN(val) || val <= 0) return;

    // 1. Atualiza a meta
    setGoals(
      goals.map((g) =>
        g.id === selectedGoal.id ? { ...g, current: g.current + val } : g,
      ),
    );

    // 2. Cria a transação de despesa/investimento correspondente
    const newTx: Transaction = {
      id: Date.now(),
      desc: `Depósito: ${selectedGoal.name}`,
      category: "Investimento",
      value: -val, // Sai do saldo da conta
      date: new Date().toISOString().split("T")[0],
      goalId: selectedGoal.id,
    };
    setTransactions([newTx, ...transactions]);

    setIsDepositModalOpen(false);
    setDepositValue("");
    setSelectedGoal(null);
  };

  const deleteGoal = (id: number) => {
    if (
      confirm(
        "Deseja excluir esta meta? O histórico de transações será mantido, mas desvinculado.",
      )
    ) {
      setGoals(goals.filter((g) => g.id !== id));
    }
  };

  const totalTarget = goals.reduce((acc, g) => acc + g.target, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.current, 0);
  const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 flex flex-col gap-8">
      {/* Depósito Modal */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Investir na Meta</h3>
              <button onClick={() => setIsDepositModalOpen(false)}>
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
            <div className="text-center mb-6">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: selectedGoal.color + "20" }}
              >
                <Target size={24} style={{ color: selectedGoal.color }} />
              </div>
              <p className="font-bold text-xl">{selectedGoal.name}</p>
              <p className="text-xs text-zinc-500">
                Falta{" "}
                {(selectedGoal.target - selectedGoal.current).toLocaleString(
                  "pt-BR",
                  { style: "currency", currency: "BRL" },
                )}
              </p>
            </div>
            <input
              type="number"
              autoFocus
              placeholder="Valor do aporte (R$)"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-center text-lg outline-none focus:border-orange-600 mb-4"
              value={depositValue}
              onChange={(e) => setDepositValue(e.target.value)}
            />
            <button
              onClick={handleDeposit}
              className="w-full py-4 bg-orange-600 rounded-xl font-bold hover:bg-orange-500 transition-all"
            >
              Confirmar Investimento
            </button>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-4">
        {/* Botão Voltar */}
        <Link href="/">
          <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors self-start px-3 py-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft size={20} />
            <span className="font-medium text-sm">Voltar ao Início</span>
          </button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Meus Objetivos <Trophy className="text-yellow-500" />
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Gerencie seus sonhos e acompanhe o progresso.
          </p>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="bg-gradient-to-r from-orange-900/20 to-zinc-900 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-zinc-400 font-medium">Patrimônio em Metas</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {totalSaved.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>
          <p className="text-sm text-zinc-500">
            de{" "}
            {totalTarget.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}{" "}
            totais planejados
          </p>
        </div>

        <div className="w-full md:w-1/3 space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
            <span>Progresso Global</span>
            <span>{totalProgress.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-yellow-500 transition-all duration-1000"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100);
          const isCompleted = percentage >= 100;

          return (
            <div
              key={goal.id}
              className="bg-[#121212] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all flex flex-col group relative overflow-hidden"
            >
              {isCompleted && (
                <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-bl-2xl text-xs font-bold flex items-center gap-1">
                  <Check size={12} /> Concluída
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl bg-[#0a0a0a] border border-white/5">
                  <Target size={24} style={{ color: goal.color }} />
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="text-xl font-bold mb-1">{goal.name}</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-2xl font-bold text-zinc-200">
                  {goal.current.toLocaleString("pt-BR", {
                    style: "decimal",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-sm text-zinc-500 mb-1">
                  /{" "}
                  {goal.target.toLocaleString("pt-BR", {
                    style: "decimal",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>

              <div className="mt-auto space-y-4">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    setIsDepositModalOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={16} /> Adicionar Valor
                </button>
              </div>
            </div>
          );
        })}

        {/* Card Criar Nova (Placeholder visual) */}
        <button
          onClick={() =>
            alert(
              "Para criar uma nova meta, use o botão '+' no Dashboard principal.",
            )
          }
          className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 group transition-all text-zinc-500 hover:text-zinc-300"
        >
          <div className="p-4 bg-zinc-900 rounded-full group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="font-semibold">Criar Nova Meta (Via Dashboard)</span>
        </button>
      </div>
    </div>
  );
}
