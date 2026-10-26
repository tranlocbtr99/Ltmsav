import React, { useMemo, useState } from 'react';
import { Account, Transaction, Category, Budget, DebtOrLoan } from '../types';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowRightLeft, Sparkles, Plus, 
  ArrowUpRight, ArrowDownLeft, AlertTriangle, ShieldCheck, ChevronRight,
  BarChart3, PieChart
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface OverviewTabProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  debts: DebtOrLoan[];
  onOpenAdd: () => void;
  onOpenAi: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  accounts,
  transactions,
  categories,
  budgets,
  debts,
  onOpenAdd,
  onOpenAi,
  onSelectTransaction,
  onNavigateTab,
}) => {
  const { t } = useLanguage();
  // Calculations
  const totalAssets = accounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  const totalDebts = debts
    .filter(d => d.type === 'debt' && d.status === 'active')
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalLoans = debts
    .filter(d => d.type === 'loan' && d.status === 'active')
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  const netWorth = totalAssets + totalLoans - totalDebts;

  // Monthly statistics
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = monthIncome - monthExpense;

  // ---- Chart period selection ----
  type ChartPeriod = 'week' | 'month' | 'quarter' | 'sixMonths' | 'year';
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('month');

  // Build day-of-month key helper
  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  // ---- Period-driven buckets for the paired bar chart + pie ----
  const chartData = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; income: number; expense: number }[] = [];
    const match: Record<string, number> = {};
    let rangeStart: string; // YYYY-MM-DD inclusive
    let rangeEnd: string;

    if (chartPeriod === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        buckets.push({ key: dayKey(d), label: String(d.getDate()), income: 0, expense: 0 });
      }
      rangeStart = buckets[0].key;
      rangeEnd = buckets[buckets.length - 1].key;
    } else if (chartPeriod === 'month') {
      const y = now.getFullYear(), m = now.getMonth();
      const days = new Date(y, m + 1, 0).getDate();
      for (let day = 1; day <= days; day++) {
        const d = new Date(y, m, day);
        buckets.push({ key: dayKey(d), label: String(day), income: 0, expense: 0 });
      }
      rangeStart = dayKey(new Date(y, m, 1));
      rangeEnd = dayKey(new Date(y, m, days));
    } else {
      const count = chartPeriod === 'quarter' ? 3 : chartPeriod === 'sixMonths' ? 6 : now.getMonth() + 1;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const lbl = chartPeriod === 'year' ? `T${d.getMonth() + 1}` : `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
        buckets.push({ key: monthKey(d), label: lbl, income: 0, expense: 0 });
      }
      rangeStart = `${buckets[0].key}-01`;
      rangeEnd = dayKey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }

    buckets.forEach((b, i) => { match[b.key] = i; });
    const granularityIsMonth = chartPeriod === 'quarter' || chartPeriod === 'sixMonths' || chartPeriod === 'year';

    const inRangeTxs = transactions.filter(t => {
      if (!t.date) return false;
      if (t.date < rangeStart || t.date > rangeEnd) return false;
      return true;
    });

    inRangeTxs.forEach(t => {
      const k = granularityIsMonth ? t.date.slice(0, 7) : t.date.slice(0, 10);
      const i = match[k];
      if (i === undefined) return;
      if (t.type === 'income') buckets[i].income += t.amount;
      else if (t.type === 'expense') buckets[i].expense += t.amount;
    });

    const barMax = Math.max(1, ...buckets.flatMap(b => [b.income, b.expense]));

    const totalIncome = buckets.reduce((s, b) => s + b.income, 0);
    const totalExpense = buckets.reduce((s, b) => s + b.expense, 0);

    // Pie: expense breakdown by category within the selected range
    const map: Record<string, number> = {};
    inRangeTxs.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    const items = Object.entries(map).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        catId,
        name: cat?.name || t('other'),
        color: cat?.color || '#3B82F6',
        iconName: cat?.iconName || 'Tag',
        amount,
        pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    }).sort((a, b) => b.amount - a.amount);

    let cumulative = 0;
    const slices = items.map(it => {
      const start = (cumulative / 100) * 360;
      cumulative += it.pct;
      return { ...it, startAngle: start, endAngle: (cumulative / 100) * 360 };
    });

    return { buckets, barMax, totalIncome, totalExpense, slices };
  }, [transactions, categories, chartPeriod, t]);

  // ---- Next-month expense forecast (weighted recent-months average) ----
  const forecast = useMemo(() => {
    const now = new Date();
    const monthly: number[] = [];
    for (let i = 3; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const spent = transactions
        .filter(t => t.type === 'expense' && t.date.slice(0, 7) === key)
        .reduce((s, t) => s + t.amount, 0);
      monthly.push(spent);
    }
    const nonZero = monthly.filter(v => v > 0);
    // Weighted toward the most recent month (1,2,3 → weight recent more)
    const weights = [1, 2, 3];
    let wSum = 0, vSum = 0;
    monthly.forEach((v, i) => { if (v > 0) { wSum += weights[i]; vSum += v * weights[i]; } });
    const base = wSum > 0 ? vSum / wSum : 0;
    const avg = nonZero.length > 0 ? nonZero.reduce((s, v) => s + v, 0) / nonZero.length : 0;
    // simple trend from last two months
    const last = monthly[2] || 0, prev = monthly[1] || 0;
    const trendPct = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    const predicted = Math.max(0, Math.round(base || avg));
    const delta = predicted - last;
    return {
      predicted,
      lastMonth: last,
      delta,
      trendPct,
      hasData: nonZero.length >= 1,
    };
  }, [transactions]);

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const start = { x: x + radius * Math.cos(toRad(endAngle)), y: y + radius * Math.sin(toRad(endAngle)) };
    const end = { x: x + radius * Math.cos(toRad(startAngle)), y: y + radius * Math.sin(toRad(startAngle)) };
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArc, 0, end.x, end.y].join(' ');
  };

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Budget warnings
  const budgetAlerts = budgets.map(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    const spent = monthTransactions
      .filter(t => t.type === 'expense' && t.categoryId === b.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    return {
      category: cat?.name || t('categories'),
      icon: cat?.iconName || 'Tag',
      color: cat?.color || '#3B82F6',
      spent,
      limit: b.monthlyLimit,
      pct,
    };
  }).filter(b => b.pct >= 70);

  return (
    <div className="space-y-5 pb-6 stagger">
      
      {/* Net Worth Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-5 sm:p-6 text-white shadow-xl shadow-emerald-950/20 border border-emerald-500/20">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('netWorth')}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-medium border border-emerald-400/30">
            {accounts.length} {t('moneySources')}
          </span>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight tabular-nums break-all">
            {netWorth.toLocaleString('vi-VN')} <span className="text-lg font-bold text-emerald-200">₫</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-emerald-200/80 block">{t('totalAssets')}:</span>
            <span className="font-bold text-white text-sm tabular-nums break-all">
              {totalAssets.toLocaleString('vi-VN')}₫
            </span>
          </div>
          <div>
            <span className="text-emerald-200/80 block">{t('totalDebtToPay')}:</span>
            <span className="font-bold text-rose-300 text-sm tabular-nums break-all">
              {totalDebts > 0 ? `-${totalDebts.toLocaleString('vi-VN')}₫` : '0₫'}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Cashflow Overview */}
      <div className="grid grid-cols-2 gap-3 stagger">
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>{t('incomeThisMonth')}</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-sm sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums break-all">
              +{monthIncome.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{t('thisMonth')}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>{t('expenseThisMonth')}</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-sm sm:text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums break-all">
              -{monthExpense.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {t('surplus')}: {netSavings >= 0 ? '+' : ''}{netSavings.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>
      </div>

      {/* Income vs Expense — paired bar chart with period selector */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('incomeVsExpense')}</span>
          </h2>
          <div className="flex items-center gap-3 text-[10px] font-semibold shrink-0">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />{t('cashIn')}
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />{t('cashOut')}
            </span>
          </div>
        </div>

        {/* Period selector */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-semibold">
          {([
            ['week', 'periodWeek'],
            ['month', 'periodMonth'],
            ['quarter', 'periodQuarter'],
            ['sixMonths', 'period6Months'],
            ['year', 'periodYear'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setChartPeriod(key)}
              className={`py-1.5 rounded-xl transition truncate ${
                chartPeriod === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>

        <div className="flex items-end justify-between gap-1 h-36 pt-1">
          {chartData.buckets.map((b, i) => {
            const many = chartData.buckets.length > 12;
            const showLabel = !many || i % 5 === 0 || i === chartData.buckets.length - 1;
            return (
              <div key={b.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0 h-full">
                <div className="flex-1 w-full flex items-end justify-center gap-px">
                  <div
                    className="w-1/2 max-w-[14px] rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
                    style={{ height: `${Math.max(2, (b.income / chartData.barMax) * 100)}%` }}
                    title={`${t('cashIn')}: ${b.income.toLocaleString('vi-VN')}₫`}
                  />
                  <div
                    className="w-1/2 max-w-[14px] rounded-t-sm bg-gradient-to-t from-rose-600 to-rose-400 transition-all duration-500"
                    style={{ height: `${Math.max(2, (b.expense / chartData.barMax) * 100)}%` }}
                    title={`${t('cashOut')}: ${b.expense.toLocaleString('vi-VN')}₫`}
                  />
                </div>
                <span className={`text-[9px] text-slate-500 dark:text-slate-400 font-medium h-3 ${showLabel ? '' : 'invisible'}`}>
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between px-1">
            <span className="text-slate-500 dark:text-slate-400">{t('cashIn')}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{chartData.totalIncome.toLocaleString('vi-VN')}₫
            </span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-slate-500 dark:text-slate-400">{t('cashOut')}</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              -{chartData.totalExpense.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>
      </div>

      {/* Next-month expense forecast */}
      {forecast.hasData && (
        <div className="rounded-3xl p-5 border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('forecastTitle')}</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
              {t('forecastBadge')}
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums break-all">
              ~{forecast.predicted.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-1">{t('forecastNextMonth')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
            <span>
              {t('forecastLastMonth')}: <strong className="text-slate-900 dark:text-white tabular-nums">{forecast.lastMonth.toLocaleString('vi-VN')}₫</strong>
            </span>
            <span className={forecast.delta > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {forecast.delta > 0 ? '▲' : '▼'} {Math.abs(forecast.delta).toLocaleString('vi-VN')}₫
              {forecast.trendPct !== 0 && ` (${forecast.trendPct > 0 ? '+' : ''}${Math.round(forecast.trendPct)}%)`}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{t('forecastNote')}</p>
        </div>
      )}

      {/* Category share — pie/donut chart (selected period) */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
          <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>{t('expenseByCategory')}</span>
        </h2>

        {chartData.slices.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
            {t('noExpenseData')}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {chartData.slices.map((s, i) => (
                  <path
                    key={i}
                    d={describeArc(50, 50, 38, s.startAngle, s.endAngle)}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="14"
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold">{t('totalExpense')}</span>
                <span className="text-[11px] font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {chartData.totalExpense.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            <div className="w-full space-y-1.5 flex-1 max-h-44 overflow-y-auto no-scrollbar">
              {chartData.slices.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <DynamicIcon name={item.iconName} className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white block tabular-nums">
                      {item.amount.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{Math.round(item.pct)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onOpenAdd}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight text-center line-clamp-2 text-slate-700 dark:text-slate-300">{t('addIncomeExpense')}</span>
        </button>

        <button
          onClick={onOpenAi}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight text-center line-clamp-2 text-slate-700 dark:text-slate-300">{t('aiAssistant')}</span>
        </button>

        <button
          onClick={() => onNavigateTab('assets')}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight text-center line-clamp-2 text-slate-700 dark:text-slate-300">{t('moneySourcesCount')}</span>
        </button>

        <button
          onClick={() => onNavigateTab('budgets')}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition">
            <TrendingDown className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight text-center line-clamp-2 text-slate-700 dark:text-slate-300">{t('budget')}</span>
        </button>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>{t('budgetWarnings')}</span>
          </div>
          <div className="space-y-2">
            {budgetAlerts.map((b, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-600/30 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 shrink-0">
                    <DynamicIcon name={b.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{b.category}</span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-200/80 block truncate">
                      {t('spent')} {b.spent.toLocaleString('vi-VN')}₫ / {b.limit.toLocaleString('vi-VN')}₫ ({Math.round(b.pct)}%)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('budgets')}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold px-2 py-1 rounded-lg"
                >
                  {t('view')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
            {t('recentTransactions')}
          </h2>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>{t('all')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {recentTransactions.map(tx => {
            const acc = accounts.find(a => a.id === tx.accountId);
            const targetAcc = tx.targetAccountId ? accounts.find(a => a.id === tx.targetAccountId) : null;
            const cat = categories.find(c => c.id === tx.categoryId);

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="group flex items-center justify-between p-3.5 rounded-2xl glass-card card-interactive hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    tx.type === 'expense' ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400' :
                    tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                    tx.type === 'transfer' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                  }`}>
                    <DynamicIcon name={cat?.iconName || 'CircleDollarSign'} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {tx.description}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                      {acc?.name} {targetAcc ? `→ ${targetAcc.name}` : ''} • {cat?.name} • {tx.date}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className={`text-xs sm:text-sm font-bold block ${
                    tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' :
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                    tx.type === 'transfer' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                    {tx.amount.toLocaleString('vi-VN')}₫
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{t('tapToEdit')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
