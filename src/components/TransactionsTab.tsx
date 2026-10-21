import React, { useState, useMemo } from 'react';
import { Transaction, Account, Category, TransactionType } from '../types';
import { 
  Search, Filter, Plus, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, 
  Calendar, Edit3, Trash2, SlidersHorizontal, X 
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface TransactionsTabProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAdd: () => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  accounts,
  categories,
  onSelectTransaction,
  onOpenAdd,
  onDeleteTransaction,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(query);
        const matchNote = tx.note?.toLowerCase().includes(query) || false;
        const matchPerson = tx.person?.toLowerCase().includes(query) || false;
        if (!matchDesc && !matchNote && !matchPerson) return false;
      }
      if (selectedType !== 'all' && tx.type !== selectedType) return false;
      if (selectedAccount !== 'all' && tx.accountId !== selectedAccount && tx.targetAccountId !== selectedAccount) return false;
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      return true;
    });
  }, [transactions, searchTerm, selectedType, selectedAccount, selectedCategory]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, { transactions: Transaction[]; incomeTotal: number; expenseTotal: number }> = {};

    filteredTransactions.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = { transactions: [], incomeTotal: 0, expenseTotal: 0 };
      }
      groups[tx.date].transactions.push(tx);
      if (tx.type === 'income') {
        groups[tx.date].incomeTotal += tx.amount;
      } else if (tx.type === 'expense' || tx.type === 'lend') {
        groups[tx.date].expenseTotal += tx.amount;
      }
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return t('today');
    if (dateStr === yesterday) return t('yesterday');

    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const hasActiveFilters = selectedType !== 'all' || selectedAccount !== 'all' || selectedCategory !== 'all' || searchTerm !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedAccount('all');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-4 pb-12 stagger">
      
      {/* Top Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition ${
              hasActiveFilters || showFilters
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white shadow-sm'
            }`}
            title={t('advancedFilter')}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAdd}
            className="flex items-center gap-1 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-md shadow-emerald-950/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('addNew')}</span>
          </button>
        </div>

        {/* Quick Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'all', label: t('all') },
            { id: 'expense', label: t('expense') },
            { id: 'income', label: t('income') },
            { id: 'transfer', label: t('transfer') },
            { id: 'lend', label: t('loan') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition font-medium ${
                selectedType === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('clearFilter')}</span>
            </button>
          )}
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="p-3.5 rounded-2xl glass-card space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">{t('filterBySource')}</label>
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">{t('allAccounts')}</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">{t('filterByCategory')}</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">{t('allCategories')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name} ({cat.type === 'expense' ? t('out') : t('in')})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Groups */}
      {groupedByDate.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('noTransactions')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {t('noTransactionsFilter')}
          </p>
          <button
            onClick={onOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addTransactionNow')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateKey, group]) => (
            <div key={dateKey} className="space-y-1.5">
              
              {/* Day Group Header */}
              <div className="flex items-center justify-between px-2 py-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 min-w-0 truncate">
                  {formatDateLabel(dateKey)} <span className="font-normal text-slate-500 dark:text-slate-400 text-[11px]">({dateKey})</span>
                </span>
                <div className="flex items-center gap-2 text-[11px] font-medium shrink-0">
                  {group.incomeTotal > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{group.incomeTotal.toLocaleString('vi-VN')}₫</span>
                  )}
                  {group.expenseTotal > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">-{group.expenseTotal.toLocaleString('vi-VN')}₫</span>
                  )}
                </div>
              </div>

              {/* Transactions in this day */}
              <div className="space-y-1.5">
                {group.transactions.map(tx => {
                  const acc = accounts.find(a => a.id === tx.accountId);
                  const targetAcc = tx.targetAccountId ? accounts.find(a => a.id === tx.targetAccountId) : null;
                  const cat = categories.find(c => c.id === tx.categoryId);

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="group flex items-center justify-between p-3.5 rounded-2xl glass-card card-interactive hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer"
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
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                              {tx.description}
                            </span>
                            {tx.updatedAt && (
                              <span className="px-1.5 py-0.2 text-[9px] bg-slate-200 dark:bg-slate-800 text-amber-600 dark:text-amber-400 rounded-md border border-slate-300 dark:border-slate-700 shrink-0">
                                {t('edited')}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                            {acc?.name} {targetAcc ? `→ ${targetAcc.name}` : ''} • {cat?.name}
                            {tx.person ? ` • ${tx.person}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <div className="text-right">
                          <span className={`text-xs sm:text-sm font-bold block ${
                            tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' :
                            tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                            tx.type === 'transfer' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                          }`}>
                            {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                            {tx.amount.toLocaleString('vi-VN')}₫
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                            {t('tapToEdit')}
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(tx);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition"
                          title={t('editTransaction')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
