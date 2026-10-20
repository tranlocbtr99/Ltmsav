import React, { useState, useMemo } from 'react';
import { Transaction, Category, Account } from '../types';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface ReportsTabProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  categories,
  accounts,
}) => {
  const [period, setPeriod] = useState<'thisMonth' | 'last30Days' | 'all'>('thisMonth');

  // Filter transactions by period
  const filteredTxs = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    if (period === 'thisMonth') {
      return transactions.filter(t => t.date.startsWith(currentMonth));
    } else if (period === 'last30Days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      return transactions.filter(t => t.date >= thirtyDaysAgo);
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
          name: cat?.name || 'Khác',
          color: cat?.color || '#3B82F6',
          iconName: cat?.iconName || 'Tag',
          amount,
          pct,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs, categories, totalExpense]);

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
    <div className="space-y-4 pb-12">
      
      {/* Period Filter Buttons */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setPeriod('thisMonth')}
          className={`py-2 rounded-xl transition ${
            period === 'thisMonth' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tháng này
        </button>
        <button
          onClick={() => setPeriod('last30Days')}
          className={`py-2 rounded-xl transition ${
            period === 'last30Days' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          30 ngày qua
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`py-2 rounded-xl transition ${
            period === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Toàn bộ
        </button>
      </div>

      {/* Cash Flow Summary Card */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Dòng Tiền Thực Tế</span>
          <span>{period === 'thisMonth' ? 'Tháng này' : period === 'last30Days' ? '30 ngày qua' : 'Tất cả'}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Thu vào</span>
            <span className="text-xs sm:text-base font-bold text-emerald-400">
              +{totalIncome.toLocaleString('vi-VN')}₫
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Chi ra</span>
            <span className="text-xs sm:text-base font-bold text-rose-400">
              -{totalExpense.toLocaleString('vi-VN')}₫
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Ròng (Net)</span>
            <span className={`text-xs sm:text-base font-bold ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netSavings >= 0 ? '+' : ''}{netSavings.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>
      </div>

      {/* Donut Chart and Category Share */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <span>Cơ Cấu Chi Tiêu Theo Danh Mục</span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Không có dữ liệu chi tiêu trong khoảng thời gian này.
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
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tổng chi</span>
                <span className="text-xs font-extrabold text-white">
                  {totalExpense.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Legend & Percentages */}
            <div className="w-full space-y-2 flex-1">
              {categoryBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <DynamicIcon name={item.iconName} className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-200">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">
                      {item.amount.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-[10px] text-slate-500">
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
