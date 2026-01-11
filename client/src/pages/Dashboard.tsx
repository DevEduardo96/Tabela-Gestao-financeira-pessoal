import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronDown,
  LayoutDashboard,
  Receipt,
  Target,
  Settings,
  Bell,
  Search,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const monthlyData = [
  { name: "Jan", receitas: 8500, despesas: 6200 },
  { name: "Fev", receitas: 9200, despesas: 5800 },
  { name: "Mar", receitas: 8800, despesas: 7100 },
  { name: "Abr", receitas: 9500, despesas: 6400 },
  { name: "Mai", receitas: 10200, despesas: 7800 },
  { name: "Jun", receitas: 9800, despesas: 6900 },
  { name: "Jul", receitas: 11000, despesas: 7200 },
  { name: "Ago", receitas: 10500, despesas: 8100 },
  { name: "Set", receitas: 9900, despesas: 6600 },
  { name: "Out", receitas: 10800, despesas: 7400 },
  { name: "Nov", receitas: 11500, despesas: 8200 },
  { name: "Dez", receitas: 12000, despesas: 8800 },
];

const categoryData = [
  { name: "Moradia", value: 2500, color: "#FF6600" },
  { name: "Alimentação", value: 1800, color: "#FF8533" },
  { name: "Transporte", value: 800, color: "#FFB380" },
  { name: "Lazer", value: 600, color: "#666666" },
  { name: "Saúde", value: 400, color: "#444444" },
  { name: "Outros", value: 300, color: "#333333" },
];

const weeklyExpenses = [
  { day: "Seg", valor: 120 },
  { day: "Ter", valor: 280 },
  { day: "Qua", valor: 150 },
  { day: "Qui", valor: 420 },
  { day: "Sex", valor: 380 },
  { day: "Sáb", valor: 520 },
  { day: "Dom", valor: 180 },
];

const recentTransactions = [
  { id: 1, desc: "Supermercado Extra", category: "Alimentação", value: -245.80, date: "Hoje" },
  { id: 2, desc: "Salário", category: "Receita", value: 8500.00, date: "Ontem" },
  { id: 3, desc: "Uber", category: "Transporte", value: -32.50, date: "Ontem" },
  { id: 4, desc: "Netflix", category: "Lazer", value: -55.90, date: "10 Jan" },
  { id: 5, desc: "Farmácia", category: "Saúde", value: -89.90, date: "09 Jan" },
];

const savingsGoals = [
  { name: "Viagem", current: 4500, target: 10000, color: "#FF6600" },
  { name: "Reserva", current: 15000, target: 30000, color: "#FF8533" },
  { name: "Carro Novo", current: 8000, target: 50000, color: "#FFB380" },
];

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");

  return (
    <div className="min-h-screen bg-background noise-texture">
      <aside className="fixed left-0 top-0 h-full w-16 bg-card border-r border-border flex flex-col items-center py-6 z-50">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-8 animate-pulse-glow">
          <span className="font-display font-bold text-primary-foreground text-lg">F</span>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={20} />} active data-testid="nav-dashboard" />
          <NavItem icon={<Receipt size={20} />} data-testid="nav-transactions" />
          <NavItem icon={<Target size={20} />} data-testid="nav-goals" />
          <NavItem icon={<CreditCard size={20} />} data-testid="nav-cards" />
          <NavItem icon={<Settings size={20} />} data-testid="nav-settings" />
        </nav>
      </aside>

      <div className="ml-16">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground" data-testid="text-page-title">
                Controle Financeiro
              </h1>
              <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Buscar transações..."
                  className="w-64 h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  data-testid="input-search"
                />
              </div>
              
              <button className="relative p-2.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors" data-testid="button-notifications">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>

              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors" data-testid="button-period">
                <Calendar size={16} />
                <span className="text-sm font-medium">{selectedPeriod}</span>
                <ChevronDown size={14} />
              </button>

              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors" data-testid="button-add-transaction">
                <Plus size={18} />
                Nova Transação
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Saldo Total"
              value="R$ 45.231,89"
              change="+12.5%"
              trend="up"
              icon={<Wallet className="text-primary" size={22} />}
              data-testid="card-balance"
            />
            <StatCard
              title="Receitas (Mês)"
              value="R$ 12.000,00"
              change="+8.2%"
              trend="up"
              icon={<TrendingUp className="text-green-500" size={22} />}
              data-testid="card-income"
            />
            <StatCard
              title="Despesas (Mês)"
              value="R$ 8.800,00"
              change="+5.1%"
              trend="down"
              icon={<TrendingDown className="text-red-500" size={22} />}
              data-testid="card-expenses"
            />
            <StatCard
              title="Economizado"
              value="R$ 3.200,00"
              change="+15.3%"
              trend="up"
              icon={<PiggyBank className="text-primary" size={22} />}
              data-testid="card-savings"
            />
          </div>

          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-8 bg-card rounded-xl border border-border p-5 card-glow animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg" data-testid="text-chart-title">Fluxo Financeiro</h3>
                  <p className="text-sm text-muted-foreground">Receitas vs Despesas mensais</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Receitas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Despesas</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6600" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#666666" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#666666" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0 0% 8%)",
                      border: "1px solid hsl(0 0% 18%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                  />
                  <Area type="monotone" dataKey="receitas" stroke="#FF6600" strokeWidth={2} fill="url(#colorReceitas)" />
                  <Area type="monotone" dataKey="despesas" stroke="#666666" strokeWidth={2} fill="url(#colorDespesas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-4 bg-card rounded-xl border border-border p-5 card-glow animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h3 className="font-display font-semibold text-lg mb-1" data-testid="text-category-title">Despesas por Categoria</h3>
              <p className="text-sm text-muted-foreground mb-4">Distribuição mensal</p>
              <div className="flex justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0 0% 8%)",
                        border: "1px solid hsl(0 0% 18%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium">R$ {cat.value.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-5 bg-card rounded-xl border border-border p-5 card-glow animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <h3 className="font-display font-semibold text-lg mb-1" data-testid="text-weekly-title">Gastos da Semana</h3>
              <p className="text-sm text-muted-foreground mb-4">Últimos 7 dias</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0 0% 8%)",
                      border: "1px solid hsl(0 0% 18%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`R$ ${value}`, "Gasto"]}
                  />
                  <Bar dataKey="valor" fill="#FF6600" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-7 bg-card rounded-xl border border-border p-5 card-glow animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg" data-testid="text-transactions-title">Transações Recentes</h3>
                  <p className="text-sm text-muted-foreground">Últimas movimentações</p>
                </div>
                <button className="text-sm text-primary hover:underline" data-testid="button-view-all">Ver todas</button>
              </div>
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0" data-testid={`row-transaction-${tx.id}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.value > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        {tx.value > 0 ? (
                          <ArrowUpRight className="text-green-500" size={18} />
                        ) : (
                          <ArrowDownRight className="text-red-500" size={18} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.desc}</p>
                        <p className="text-xs text-muted-foreground">{tx.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${tx.value > 0 ? "text-green-500" : "text-foreground"}`}>
                        {tx.value > 0 ? "+" : ""}R$ {Math.abs(tx.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 card-glow animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-semibold text-lg" data-testid="text-goals-title">Metas de Economia</h3>
                <p className="text-sm text-muted-foreground">Acompanhe seu progresso</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors" data-testid="button-add-goal">
                <Plus size={16} />
                Nova Meta
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {savingsGoals.map((goal) => {
                const percentage = (goal.current / goal.target) * 100;
                return (
                  <div key={goal.name} className="bg-background rounded-lg p-4 border border-border" data-testid={`card-goal-${goal.name.toLowerCase()}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        R$ {goal.current.toLocaleString("pt-BR")}
                      </span>
                      <span className="font-medium">
                        R$ {goal.target.toLocaleString("pt-BR")}
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

function NavItem({ icon, active, ...props }: { icon: React.ReactNode; active?: boolean } & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      {...props}
    >
      {icon}
    </button>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  ...props
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 card-glow animate-slide-up" {...props}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-muted/50">{icon}</div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          }`}
        >
          {change}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}