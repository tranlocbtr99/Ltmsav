import React from 'react';
import { Account, Transaction, Category, Budget, DebtOrLoan } from '../types';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowRightLeft, Sparkles, Plus, 
  ArrowUpRight, ArrowDownLeft, AlertTriangle, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

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
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = monthIncome - monthExpense;

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
      category: cat?.name || 'Danh mục',
      icon: cat?.iconName || 'Tag',
      color: cat?.color || '#3B82F6',
      spent,
      limit: b.monthlyLimit,
      pct,
    };
  }).filter(b => b.pct >= 70);

  return (
    <div className="space-y-5 pb-6">
      
      {/* Net Worth Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-5 sm:p-6 text-white shadow-xl shadow-emerald-950/20 border border-emerald-500/20">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Tổng Tài Sản Ròng (Net Worth)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-medium border border-emerald-400/30">
            {accounts.length} nguồn tiền
          </span>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {netWorth.toLocaleString('vi-VN')} <span className="text-lg font-bold text-emerald-200">₫</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-emerald-200/80 block">Tổng tài sản:</span>
            <span className="font-bold text-white text-sm">
              {totalAssets.toLocaleString('vi-VN')}₫
            </span>
          </div>
          <div>
            <span className="text-emerald-200/80 block">Nợ cần trả:</span>
            <span className="font-bold text-rose-300 text-sm">
              {totalDebts > 0 ? `-${totalDebts.toLocaleString('vi-VN')}₫` : '0₫'}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Cashflow Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Thu nhập tháng</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              +{monthIncome.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Tháng hiện tại</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Chi tiêu tháng</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400">
              -{monthExpense.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Dư: {netSavings >= 0 ? '+' : ''}{netSavings.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>
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
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Ghi thu chi</span>
        </button>

        <button
          onClick={onOpenAi}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">LTMsav AI</span>
        </button>

        <button
          onClick={() => onNavigateTab('assets')}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Nguồn tiền</span>
        </button>

        <button
          onClick={() => onNavigateTab('budgets')}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition">
            <TrendingDown className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Ngân sách</span>
        </button>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Cảnh Báo Ngân Sách</span>
          </div>
          <div className="space-y-2">
            {budgetAlerts.map((b, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-600/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                    <DynamicIcon name={b.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{b.category}</span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-200/80">
                      Đã chi {b.spent.toLocaleString('vi-VN')}₫ / {b.limit.toLocaleString('vi-VN')}₫ ({Math.round(b.pct)}%)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('budgets')}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold px-2 py-1 rounded-lg"
                >
                  Xem
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
            Giao Dịch Gần Đây
          </h2>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>Tất cả</span>
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
                className="group flex items-center justify-between p-3.5 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition active:scale-[0.99]"
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
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Nhấn để sửa</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
