import React, { useState } from 'react';
import { Budget, Category, Transaction } from '../types';
import { Target, Plus, AlertTriangle, CheckCircle2, Edit3, Trash2, X } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface BudgetsTabProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onSetBudget: (categoryId: string, limit: number) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetsTab: React.FC<BudgetsTabProps> = ({
  budgets,
  categories,
  transactions,
  onSetBudget,
  onDeleteBudget,
}) => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>(categories.find(c => c.type === 'expense')?.id || '');
  const [limitStr, setLimitStr] = useState<string>('');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Calculate spending per budget
  const budgetStats = budgets.map(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    const spent = transactions
      .filter(t => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const remaining = b.monthlyLimit - spent;
    const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;

    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: cat?.name || t('untitled'),
      iconName: cat?.iconName || 'Tag',
      color: cat?.color || '#3B82F6',
      limit: b.monthlyLimit,
      spent,
      remaining,
      pct,
    };
  });

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpentInBudgets = budgetStats.reduce((sum, b) => sum + b.spent, 0);
  const overallPct = totalBudgeted > 0 ? (totalSpentInBudgets / totalBudgeted) * 100 : 0;

  const handleOpenEdit = (categoryId: string, currentLimit: number) => {
    setSelectedCatId(categoryId);
    setLimitStr(currentLimit.toString());
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseInt(limitStr.replace(/\D/g, ''), 10) || 0;
    if (limit > 0 && selectedCatId) {
      onSetBudget(selectedCatId, limit);
      setIsModalOpen(false);
      setLimitStr('');
    }
  };

  return (
    <div className="space-y-4 pb-12 stagger">
      
      {/* Overview Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">{t('monthlyBudget')}</h2>
              <p className="text-xs text-slate-400">{t('monthPeriod')} {new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedCatId(expenseCategories[0]?.id || '');
              setLimitStr('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addLimit')}</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>{t('spentLabel')}: <strong className="text-white">{totalSpentInBudgets.toLocaleString('vi-VN')}₫</strong></span>
            <span>{t('limitLabel')}: <strong className="text-white">{totalBudgeted.toLocaleString('vi-VN')}₫</strong></span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPct >= 100 ? 'bg-rose-500' :
                overallPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>{Math.round(overallPct)} {t('percentUsed')}</span>
            <span>{t('remainingLabel')}: {(totalBudgeted - totalSpentInBudgets).toLocaleString('vi-VN')}₫</span>
          </div>
        </div>
      </div>

      {/* Budget Category Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          {t('limitsByCategory')}
        </h3>

        {budgetStats.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center space-y-2">
            <Target className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">{t('noBudgets')}</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              {t('createLimitNow')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgetStats.map(b => (
              <div
                key={b.id}
                className="glass-card card-interactive p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="p-2 rounded-xl text-white shrink-0"
                      style={{ backgroundColor: `${b.color}25`, color: b.color }}
                    >
                      <DynamicIcon name={b.iconName} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{b.categoryName}</h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {b.spent.toLocaleString('vi-VN')}₫ / {b.limit.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(b.categoryId, b.limit)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={t('editLimit')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title={t('deleteLimit')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        b.pct >= 100 ? 'bg-rose-500' :
                        b.pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(b.pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1.5">
                    <span className={`font-semibold ${
                      b.pct >= 100 ? 'text-rose-400' : b.pct >= 75 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {Math.round(b.pct)}%
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {b.remaining >= 0 ? `${t('leftOver')} ${b.remaining.toLocaleString('vi-VN')}₫` : `${t('over')} ${Math.abs(b.remaining).toLocaleString('vi-VN')}₫`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('setupBudget')}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">{t('expenseCategory')}</label>
                <select
                  value={selectedCatId}
                  onChange={e => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                >
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">{t('monthlyLimitVnd')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={limitStr ? parseInt(limitStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                    onChange={e => setLimitStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="3.000.000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
                    required
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₫</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  {t('saveLimit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
