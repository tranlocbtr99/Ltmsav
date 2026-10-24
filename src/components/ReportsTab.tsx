import { forecastSpending, ForecastPeriod } from '../services/forecast';
import { localDate } from '../services/date';
import React, { useState, useMemo } from 'react';
import { Transaction, Category, Account, RecurringTransaction } from '../types';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface ReportsTabProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  recurring?: RecurringTransaction[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  categories,
  accounts,
  recurring = [],
}) => {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'thisMonth' | 'last30Days' | 'all'>('thisMonth');

  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>('month');
  const forecast = forecastSpending(transactions, recurring, forecastPeriod);

  // Filter transactions by period
  const filteredTxs = useMemo(() => {
    const now = new Date();
    const currentMonth = localDate(now).slice(0, 7);

    if (period === 'thisMonth') {
      return transactions.filter(t => t.date.startsWith(currentMonth) && t.date <= localDate(now));
    } else if (period === 'last30Days') {
      const thirtyDaysAgo = localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
      return transactions.filter(t => t.date >= thirtyDaysAgo && t.date <= localDate(now));
    }
    return transactions;
  }, [transactions, period]);

  const totalIncome = filteredTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  // Breakdown by expense category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });

    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        return {
          catId,
          name: cat?.name || t('other'),
          color: cat?.color || '#3B82F6',
          iconName: cat?.iconName || 'Tag',
          amount,
          pct,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs, categories, totalExpense, t]);

  // Compute SVG Donut Chart Paths
  const donutSlices = useMemo(() => {
    let cumulative = 0;
    return categoryBreakdown.map(item => {
      const startAngle = (cumulative / 100) * 360;
      cumulative += item.pct;
      const endAngle = (cumulative / 100) * 360;
      return {
        ...item,
        startAngle,
        endAngle,
      };
    });
  }, [categoryBreakdown]);

  // Polar to cartesian for SVG arc
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const toRadians = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const start = {
      x: x + radius * Math.cos(toRadians(endAngle)),
      y: y + radius * Math.sin(toRadians(endAngle)),
    };
    const end = {
      x: x + radius * Math.cos(toRadians(startAngle)),
      y: y + radius * Math.sin(toRadians(startAngle)),
    };
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  return (
    <div className="space-y-4 pb-12 stagger">
      

      <section className="glass-panel p-5 rounded-3xl space-y-3 text-slate-900 dark:text-white">
        <h2 className="font-bold">{t('forecastTitle')}</h2>
        <div className="flex flex-wrap gap-2">
          {(['month','quarter','year'] as const).map(p => <button key={p} aria-pressed={forecastPeriod===p} onClick={()=>setForecastPeriod(p)} className={`rounded-full px-3 py-2 text-xs ${forecastPeriod===p?'bg-blue-600 text-white':'bg-slate-100 dark:bg-slate-800'}`}>{t('forecast'+p)}</button>)}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{forecast.projections[0].month} → {forecast.projections.at(-1)!.month}</p>
        <p className="text-2xl font-bold break-words">{forecast.total.toLocaleString('vi-VN')}₫</p>
        <p className="text-xs">{t('forecastRange')}: {forecast.low.toLocaleString('vi-VN')}–{forecast.high.toLocaleString('vi-VN')}₫</p>
        <p className="text-xs">{t('forecastScheduled')}: {forecast.scheduled.toLocaleString('vi-VN')}₫</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t(forecast.supported?'forecastMethod':'forecastInsufficient', {count:forecast.months.length})}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('forecastCaution')}</p>
        <div className="space-y-1">{forecast.projections.map(p=><div key={p.month} className="flex justify-between gap-2 text-xs"><span>{p.month}</span><span>{p.total.toLocaleString('vi-VN')}₫</span></div>)}</div>
      </section>

      {/* Period Filter Buttons */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setPeriod('thisMonth')}
          className={`py-2 rounded-xl transition ${
            period === 'thisMonth' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('periodThisMonth')}
        </button>
        <button
          onClick={() => setPeriod('last30Days')}
          className={`py-2 rounded-xl transition ${
            period === 'last30Days' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('period30Days')}
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`py-2 rounded-xl transition ${
            period === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('periodAll')}
        </button>
      </div>

      {/* Cash Flow Summary Card */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>{t('realCashFlow')}</span>
          <span>{period === 'thisMonth' ? t('periodThisMonth') : period === 'last30Days' ? t('period30Days') : t('periodAll')}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('cashIn')}</span>
            <span className="text-[11px] sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums break-all">
              +{totalIncome.toLocaleString('vi-VN')}₫
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('cashOut')}</span>
            <span className="text-[11px] sm:text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums break-all">
              -{totalExpense.toLocaleString('vi-VN')}₫
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('net')}</span>
            <span className={`text-[11px] sm:text-base font-bold tabular-nums break-all ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netSavings >= 0 ? '+' : ''}{netSavings.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>
      </div>

      {/* Donut Chart and Category Share */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('expenseByCategory')}</span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
            {t('noExpenseData')}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center pt-2">
            
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {donutSlices.map((slice, i) => {
                  const d = describeArc(50, 50, 38, slice.startAngle, slice.endAngle);
                  return (
                    <path
                      key={i}
                      d={d}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="14"
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">{t('totalExpense')}</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {totalExpense.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Legend & Percentages */}
            <div className="w-full space-y-2 flex-1">
              {categoryBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <DynamicIcon name={item.iconName} className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white block tabular-nums">
                      {item.amount.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {Math.round(item.pct)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
