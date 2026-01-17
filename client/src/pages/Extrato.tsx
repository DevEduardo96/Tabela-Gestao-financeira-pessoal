import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Menu,
  X,
  ArrowLeft, // <--- Botão Voltar
} from "lucide-react";

// --- Interfaces (Mesmas do Dashboard para consistência) ---
interface Transaction {
  id: number;
  desc: string;
  category: string;
  value: number;
  date: string;
  goalId?: number;
}

// --- Hook de Persistência ---
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

export default function Extrato() {
  const [transactions, setTransactions] = useStickyState<Transaction[]>(
    [],
    "finance-transactions",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Filtros ---
  const categories = [
    "Todas",
    ...Array.from(new Set(transactions.map((t) => t.category))),
  ];

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        const matchMonth =
          tDate.getUTCMonth() === currentDate.getMonth() &&
          tDate.getUTCFullYear() === currentDate.getFullYear();
        const matchSearch = t.desc
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchCat =
          selectedCategory === "Todas" || t.category === selectedCategory;

        return matchMonth && matchSearch && matchCat;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, selectedCategory, currentDate]);

  const handleMonthChange = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const deleteTransaction = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  // Totais do filtro atual
  const totalIn = filteredTransactions
    .filter((t) => t.value > 0)
    .reduce((acc, t) => acc + t.value, 0);
  const totalOut = filteredTransactions
    .filter((t) => t.value < 0)
    .reduce((acc, t) => acc + Math.abs(t.value), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4">
        {/* Botão Voltar */}
        <Link href="/">
          <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors self-start px-3 py-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft size={20} />
            <span className="font-medium text-sm">Voltar ao Início</span>
          </button>
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Extrato</h1>
            <p className="text-zinc-500 text-sm">
              Visualize todas as suas movimentações detalhadas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Seletor Data */}
            <div className="flex items-center bg-[#121212] rounded-xl border border-white/10 p-1">
              <button
                onClick={() => handleMonthChange("prev")}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-4 font-semibold text-sm capitalize min-w-[120px] text-center">
                {currentDate.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => handleMonthChange("next")}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              className="p-3 bg-[#121212] border border-white/10 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
              title="Exportar CSV"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Barra de Ferramentas */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#121212] p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nome..."
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-600/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-48">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={18}
          />
          <select
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm appearance-none focus:outline-none focus:border-orange-600/50 cursor-pointer"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumo Rápido do Extrato */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col items-center justify-center">
          <span className="text-xs text-emerald-500 uppercase font-bold">
            Entradas
          </span>
          <span className="text-lg font-bold text-emerald-400">
            {totalIn.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex flex-col items-center justify-center">
          <span className="text-xs text-red-500 uppercase font-bold">
            Saídas
          </span>
          <span className="text-lg font-bold text-red-400">
            {totalOut.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Nenhuma transação encontrada para este período.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 text-zinc-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${tx.value > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                        >
                          {tx.value > 0 ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <ArrowDownRight size={14} />
                          )}
                        </div>
                        {tx.desc}
                        {tx.goalId && (
                          <span className="text-[9px] border border-orange-500/30 text-orange-500 px-1 rounded uppercase">
                            Meta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-white/5 text-xs text-zinc-300">
                        {tx.category}
                      </span>
                    </td>
                    <td
                      className={`p-4 text-right font-bold ${tx.value > 0 ? "text-emerald-500" : "text-zinc-200"}`}
                    >
                      {tx.value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-2 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
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
  );
}
