import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Account, DebtOrLoan } from '../types';
import { 
  Wallet, Plus, Edit2, ArrowDownLeft, ArrowUpRight, CheckCircle2, 
  Clock, User, Landmark, SlidersHorizontal, ShieldCheck, X, Check, Trash2
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

const ACCOUNT_ICONS = [
  'Landmark', 'Wallet', 'PiggyBank', 'CreditCard', 'Banknote', 'Coins',
  'DollarSign', 'Bitcoin', 'Smartphone', 'Building2', 'Briefcase', 'Gem',
  'TrendingUp', 'HandCoins', 'Receipt', 'ShoppingBag', 'ShoppingCart',
  'Car', 'Home', 'Plane', 'GraduationCap', 'Heart', 'Gift', 'Shield',
];

const ACCOUNT_COLORS = [
  '#10B981', '#0EA5E9', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F59E0B', '#EAB308', '#14B8A6', '#3B82F6', '#A855F7', '#64748B',
];


interface AssetsTabProps {
  accounts: Account[];
  debts: DebtOrLoan[];
  onEditAccount: (id: string, updates: Pick<Account, 'name' | 'type' | 'iconName' | 'color'>) => void;
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onAdjustBalance: (id: string, newBalance: number, reason: string) => void;
  onAddDebtOrLoan: (item: Omit<DebtOrLoan, 'id' | 'createdAt' | 'status' | 'remainingAmount'>) => void;
  onRecordPayment: (id: string, amount: number) => void;
  onDeleteAccount: (id: string) => void;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({
  accounts,
  debts,
  onAddAccount,
  onEditAccount,
  onAdjustBalance,
  onAddDebtOrLoan,
  onRecordPayment,
  onDeleteAccount,
}) => {
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState<'accounts' | 'debts' | 'loans'>('accounts');
  
  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Adjust balance state
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [newBalanceStr, setNewBalanceStr] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Add Account state
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<Account['type']>('bank');
  const [accBalanceStr, setAccBalanceStr] = useState('');
  const [accColor, setAccColor] = useState('#10B981');
  const [accIcon, setAccIcon] = useState('Landmark');

  // Add Debt/Loan state
  const [debtType, setDebtType] = useState<'debt' | 'loan'>('loan');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmountStr, setDebtAmountStr] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNote, setDebtNote] = useState('');
  const [debtAccountId, setDebtAccountId] = useState(accounts[0]?.id || '');

  // Payment state
  const [selectedDebt, setSelectedDebt] = useState<DebtOrLoan | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');

  const totalAssets = accounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  const totalDebts = debts.filter(d => d.type === 'debt' && d.status === 'active').reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalLoans = debts.filter(d => d.type === 'loan' && d.status === 'active').reduce((sum, d) => sum + d.remainingAmount, 0);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const balance = parseInt(newBalanceStr.replace(/\D/g, ''), 10) || 0;
    onAdjustBalance(selectedAccount.id, balance, adjustReason.trim() || t('ledgerBalance'));
    setIsAdjustModalOpen(false);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseInt(accBalanceStr.replace(/\D/g, ''), 10) || 0;
    if (!accName.trim()) return;

    if (editingAccountId) {
      onEditAccount(editingAccountId, { name: accName.trim(), type: accType, iconName: accIcon, color: accColor });
    } else onAddAccount({
      name: accName.trim(),
      type: accType,
      balance,
      currency: 'VND',
      iconName: accIcon,
      color: accColor,
    });

    setIsAccountModalOpen(false);
    setAccName('');
    setAccBalanceStr('');
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(debtAmountStr.replace(/\D/g, ''), 10) || 0;
    if (!debtPerson.trim() || amount <= 0) return;

    onAddDebtOrLoan({
      type: debtType,
      person: debtPerson.trim(),
      amount,
      accountId: debtAccountId,
      dueDate: debtDueDate || undefined,
      note: debtNote.trim() || undefined,
    });

    setIsDebtModalOpen(false);
    setDebtPerson('');
    setDebtAmountStr('');
    setDebtNote('');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    const amount = parseInt(payAmountStr.replace(/\D/g, ''), 10) || 0;
    if (amount > 0) {
      onRecordPayment(selectedDebt.id, amount);
      setIsPaymentModalOpen(false);
      setPayAmountStr('');
    }
  };

  return (
    <div className="space-y-4 pb-12 stagger">
      
      {/* Sub tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] sm:text-xs font-semibold">
          <button
            onClick={() => setSubTab('accounts')}
            className={`py-2 rounded-xl transition ${
              subTab === 'accounts' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
          {t('moneySourcesCount')} ({accounts.length})
        </button>
          <button
            onClick={() => setSubTab('loans')}
            className={`py-2 rounded-xl transition ${
              subTab === 'loans' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('loansCount')} ({debts.filter(d => d.type === 'loan').length})
          </button>
          <button
            onClick={() => setSubTab('debts')}
            className={`py-2 rounded-xl transition ${
              subTab === 'debts' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('debtsCount')} ({debts.filter(d => d.type === 'debt').length})
          </button>
      </div>

      {/* SubTab 1: ACCOUNTS */}
      {subTab === 'accounts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('totalAccountMoney')}: <strong className="text-slate-900 dark:text-white font-extrabold">{totalAssets.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => { setEditingAccountId(null); setAccName(''); setAccType('bank'); setAccIcon('Landmark'); setAccColor('#10B981'); setAccBalanceStr(''); setIsAccountModalOpen(true); }}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addAccount')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className="glass-card card-interactive p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="p-2.5 rounded-xl text-white shrink-0"
                      style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                    >
                      <DynamicIcon name={acc.iconName} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{acc.name}</h4>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 capitalize">
                        {acc.type === 'cash' ? t('cash') :
                         acc.type === 'bank' ? t('bank') :
                         acc.type === 'wallet' ? t('eWallet') :
                         acc.type === 'savings' ? t('savings') : t('credit')}
                      </span>
                    </div>
                  </div>

                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{t('currentBalance')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums break-all">
                      {acc.balance.toLocaleString('vi-VN')}₫
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(t('deleteAccountConfirm', { name: acc.name }))) {
                          onDeleteAccount(acc.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      aria-label={`${t('deleteAccount')}: ${acc.name}`}
                      title={t('deleteAccount')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-stretch gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                  <button
                    type="button"
                    aria-label={`${t('editAccount')}: ${acc.name}`}
                    title={t('editAccount')}
                    className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                    onClick={() => {
                      setEditingAccountId(acc.id); setAccName(acc.name); setAccType(acc.type);
                      setAccIcon(acc.iconName); setAccColor(acc.color); setIsAccountModalOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4 shrink-0" /><span>{t('editDetails')}</span>
                  </button>
                  <button
                    aria-label={`${t('adjustBalance')}: ${acc.name}`}
                    onClick={() => {
                      setSelectedAccount(acc);
                      setNewBalanceStr(acc.balance.toString());
                      setAdjustReason('');
                      setIsAdjustModalOpen(true);
                    }}
                      className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-500/10 px-2 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-500/20"
                    title={t('adjustBalance')}
                  >
                    <SlidersHorizontal className="w-4 h-4 shrink-0" /><span>{t('adjustBalance')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: LOANS (Cho vay - Người khác nợ mình) */}
      {subTab === 'loans' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('lending')}: <strong className="text-blue-600 dark:text-blue-400">{totalLoans.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => {
                setDebtType('loan');
                setIsDebtModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addLoan')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {debts.filter(d => d.type === 'loan').map(loan => (
              <div
                key={loan.id}
                className="glass-card card-interactive p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{loan.person}</h4>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {t('dueDate')}: {loan.dueDate || t('noDueDate')} {loan.note ? `• ${loan.note}` : ''}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    loan.status === 'settled'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {loan.status === 'settled' ? t('collectedFull') : t('notCollectedFull')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">{t('principal')}: {loan.amount.toLocaleString('vi-VN')}₫</span>
                    <span className="block font-bold text-blue-700 dark:text-blue-400">
                      {t('remaining')}: {loan.remainingAmount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  {loan.status === 'active' && (
                    <button
                      onClick={() => {
                        setSelectedDebt(loan);
                        setPayAmountStr(loan.remainingAmount.toString());
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition"
                    >
                      {t('collectDebt')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: DEBTS (Sổ nợ - Mình nợ người khác) */}
      {subTab === 'debts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('totalDebtPay')}: <strong className="text-rose-700 dark:text-rose-400">{totalDebts.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => {
                setDebtType('debt');
                setIsDebtModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addDebt')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {debts.filter(d => d.type === 'debt').map(debt => (
              <div
                key={debt.id}
                className="glass-card card-interactive p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{debt.person}</h4>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {t('term')}: {debt.dueDate || t('noDueDate')} {debt.note ? `• ${debt.note}` : ''}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    debt.status === 'settled'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {debt.status === 'settled' ? t('paidFull') : t('stillOwe')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">{t('total')}: {debt.amount.toLocaleString('vi-VN')}₫</span>
                    <span className="block font-bold text-rose-700 dark:text-rose-400">
                      {t('needToPay')}: {debt.remainingAmount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  {debt.status === 'active' && (
                    <button
                      onClick={() => {
                        setSelectedDebt(debt);
                        setPayAmountStr(debt.remainingAmount.toString());
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition"
                    >
                      {t('payDebt')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Adjust Balance */}
      {isAdjustModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('adjustLedgerTitle')}</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('account')}: <strong className="text-slate-900 dark:text-white">{selectedAccount.name}</strong></label>
                <div className="relative">
                  <input
                    type="text"
                    value={newBalanceStr ? parseInt(newBalanceStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                    onChange={e => setNewBalanceStr(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:border-emerald-500 tabular-nums"
                    required
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₫</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('adjustReason')}</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder={t('adjustReasonPlaceholder')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  {t('updateBalance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Account */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-pop-in max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t(editingAccountId ? 'editAccount' : 'addMoneySource')}</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('accountName')}</label>
                <input
                  type="text"
                  value={accName}
                  onChange={e => setAccName(e.target.value)}
                  placeholder={t('accountNamePlaceholder')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('accountType')}</label>
                <select
                  value={accType}
                  onChange={e => {
                    const type = e.target.value as Account['type'];
                    setAccType(type);
                    const suggested: Record<Account['type'], string> = {
                      cash: 'Banknote', bank: 'Landmark', wallet: 'Wallet',
                      savings: 'PiggyBank', credit: 'CreditCard',
                    };
                    setAccIcon(suggested[type]);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                >
                  <option value="cash">{t('cash')}</option>
                  <option value="bank">{t('bankAccount')}</option>
                  <option value="wallet">{t('eWallet')}</option>
                  <option value="savings">{t('savingsBook')}</option>
                  <option value="credit">{t('creditCard')}</option>
                </select>
              </div>

              {/* Icon picker */}
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('chooseIcon')}</label>
                <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {ACCOUNT_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setAccIcon(icon)}
                      className={`flex items-center justify-center aspect-square rounded-lg border transition ${
                        accIcon === icon
                          ? 'border-transparent text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      style={accIcon === icon ? { backgroundColor: accColor } : undefined}
                      title={icon}
                    >
                      <DynamicIcon name={icon} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('chooseColor')}</label>
                <div className="flex flex-wrap gap-2">
                  {ACCOUNT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccColor(color)}
                      className={`w-7 h-7 rounded-full transition active:scale-90 ${
                        accColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-slate-900 dark:ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${accColor}20`, color: accColor }}>
                  <DynamicIcon name={accIcon} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {accName.trim() || t('accountNamePlaceholder')}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('preview')}</span>
                </div>
              </div>

              {!editingAccountId && <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('initialBalance')}</label>
                <input
                  type="text"
                  value={accBalanceStr ? parseInt(accBalanceStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                  onChange={e => setAccBalanceStr(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold tabular-nums"
                />
              </div>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  {t(editingAccountId ? 'saveChanges' : 'createAccount')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Debt/Loan */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-pop-in max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {debtType === 'loan' ? t('addLoanTitle') : t('addDebtTitle')}
              </h3>
              <button onClick={() => setIsDebtModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('relatedPerson')}</label>
                <input
                  type="text"
                  value={debtPerson}
                  onChange={e => setDebtPerson(e.target.value)}
                  placeholder={t('relatedPersonPlaceholder')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('amountVnd')}</label>
                <input
                  type="text"
                  value={debtAmountStr ? parseInt(debtAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                  onChange={e => setDebtAmountStr(e.target.value.replace(/\D/g, ''))}
                  placeholder="1.000.000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('paymentDue')}</label>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={e => setDebtDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('note')}</label>
                <input
                  type="text"
                  value={debtNote}
                  onChange={e => setDebtNote(e.target.value)}
                  placeholder={t('loanReasonPlaceholder')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white font-semibold text-xs rounded-lg shadow-md ${
                    debtType === 'loan' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {t('saveRecord')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment Record */}
      {isPaymentModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-pop-in max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedDebt.type === 'loan' ? t('collectFrom') : t('payTo')} {selectedDebt.person}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('paymentAmount')}</label>
                <input
                  type="text"
                  value={payAmountStr ? parseInt(payAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                  onChange={e => setPayAmountStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-base font-bold tabular-nums"
                  required
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block tabular-nums">
                  {t('currentDebt')}: {selectedDebt.remainingAmount.toLocaleString('vi-VN')}₫
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  {t('confirmPayment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
