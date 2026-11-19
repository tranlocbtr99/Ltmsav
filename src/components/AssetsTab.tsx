import { AssetSheet } from './AssetSheet';
import { confirmAction } from './Confirmation';
import { DateField } from './DateField';
import { IOSSelect } from './IOSSelect';
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Account, DebtOrLoan, DebtCategory } from '../types';
import { 
  Wallet, Plus, Edit2, ArrowDownLeft, ArrowUpRight, CheckCircle2, 
  Clock, User, Landmark, SlidersHorizontal, ShieldCheck, X, Check, Trash2,
  Building2, CreditCard, PiggyBank, Calendar, Percent
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

const COMMON_BANKS = [
  'Vietcombank', 'MB Bank', 'Techcombank', 'VPBank', 'ACB', 'BIDV', 'VietinBank', 'TPBank', 'VIB', 'Sacombank', 'HDBank', 'OCB'
];

const COMMON_WALLETS = [
  'Momo', 'ZaloPay', 'Viettel Money', 'VNPay', 'ShopeePay'
];

interface AssetsTabProps {
  onViewAccount?: (id: string) => void;
  accounts: Account[];
  debts: DebtOrLoan[];
  onEditAccount: (id: string, updates: Partial<Account>) => void;
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onAdjustBalance: (id: string, newBalance: number, reason: string) => void;
  onAddDebtOrLoan: (item: Omit<DebtOrLoan, 'id' | 'createdAt' | 'status' | 'remainingAmount'>) => void;
  onRecordPayment: (id: string, amount: number) => void;
  onDeleteAccount: (id: string) => void;
  onDeleteDebtOrLoan?: (id: string) => void;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({
  accounts,
  onViewAccount,
  debts,
  onAddAccount,
  onEditAccount,
  onAdjustBalance,
  onAddDebtOrLoan,
  onRecordPayment,
  onDeleteAccount,
  onDeleteDebtOrLoan,
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

  // Detailed Account fields
  const [accBankName, setAccBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [accHolder, setAccHolder] = useState('');
  const [accBranch, setAccBranch] = useState('');
  const [accInterestRateStr, setAccInterestRateStr] = useState('');
  const [accTermMonthsStr, setAccTermMonthsStr] = useState('');
  const [accDepositDate, setAccDepositDate] = useState('');
  const [accMaturityDate, setAccMaturityDate] = useState('');
  const [accCreditLimitStr, setAccCreditLimitStr] = useState('');
  const [accStatementDayStr, setAccStatementDayStr] = useState('');
  const [accDueDayStr, setAccDueDayStr] = useState('');

  // Add Debt/Loan state
  const [debtType, setDebtType] = useState<'debt' | 'loan'>('debt');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmountStr, setDebtAmountStr] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNote, setDebtNote] = useState('');
  const [debtAccountId, setDebtAccountId] = useState(accounts[0]?.id || '');

  // Detailed Debt fields
  const [debtCategory, setDebtCategory] = useState<DebtCategory>('personal_debt');
  const [debtLenderName, setDebtLenderName] = useState('');
  const [debtInterestRateStr, setDebtInterestRateStr] = useState('');
  const [debtTermMonthsStr, setDebtTermMonthsStr] = useState('');
  const [debtIsInstallment, setDebtIsInstallment] = useState(false);
  const [debtMonthlyInstallmentStr, setDebtMonthlyInstallmentStr] = useState('');
  const [debtMonthlyPaymentDayStr, setDebtMonthlyPaymentDayStr] = useState('15');

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setAccName('');
    setAccType('bank');
    setAccBalanceStr('');
    setAccColor('#10B981');
    setAccIcon('Landmark');
    setAccBankName('');
    setAccNumber('');
    setAccHolder('');
    setAccBranch('');
    setAccInterestRateStr('');
    setAccTermMonthsStr('');
    setAccDepositDate('');
    setAccMaturityDate('');
    setAccCreditLimitStr('');
    setAccStatementDayStr('');
    setAccDueDayStr('');
  };

  const resetDebtForm = () => {
    setDebtPerson('');
    setDebtAmountStr('');
    setDebtDueDate('');
    setDebtNote('');
    setDebtCategory('personal_debt');
    setDebtLenderName('');
    setDebtInterestRateStr('');
    setDebtTermMonthsStr('');
    setDebtIsInstallment(false);
    setDebtMonthlyInstallmentStr('');
    setDebtMonthlyPaymentDayStr('15');
  };

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

    const interestRate = parseFloat(accInterestRateStr) || undefined;
    const termMonths = parseInt(accTermMonthsStr, 10) || undefined;
    const creditLimit = parseInt(accCreditLimitStr.replace(/\D/g, ''), 10) || undefined;
    const statementDay = parseInt(accStatementDayStr, 10) || undefined;
    const paymentDueDay = parseInt(accDueDayStr, 10) || undefined;

    const accountData: Omit<Account, 'id'> = {
      name: accName.trim(),
      type: accType,
      balance,
      currency: 'VND',
      iconName: accIcon,
      color: accColor,
      bankName: accBankName.trim() || undefined,
      accountNumber: accNumber.trim() || undefined,
      accountHolder: accHolder.trim() || undefined,
      branch: accBranch.trim() || undefined,
      interestRate,
      termMonths,
      depositDate: accDepositDate || undefined,
      maturityDate: accMaturityDate || undefined,
      creditLimit,
      statementDay,
      paymentDueDay,
    };

    if (editingAccountId) {
      onEditAccount(editingAccountId, accountData);
    } else {
      onAddAccount(accountData);
    }

    setIsAccountModalOpen(false);
    resetAccountForm();
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(debtAmountStr.replace(/\D/g, ''), 10) || 0;
    if (!debtPerson.trim() || amount <= 0) return;

    const interestRate = parseFloat(debtInterestRateStr) || undefined;
    const termMonths = parseInt(debtTermMonthsStr, 10) || undefined;
    const monthlyInstallmentAmount = parseInt(debtMonthlyInstallmentStr.replace(/\D/g, ''), 10) || undefined;
    const monthlyPaymentDay = parseInt(debtMonthlyPaymentDayStr, 10) || undefined;

    onAddDebtOrLoan({
      type: debtType,
      person: debtPerson.trim(),
      amount,
      accountId: debtAccountId,
      dueDate: debtDueDate || undefined,
      note: debtNote.trim() || undefined,
      debtCategory,
      lenderName: debtLenderName.trim() || undefined,
      interestRate,
      termMonths,
      isInstallment: debtIsInstallment,
      monthlyInstallmentAmount,
      monthlyPaymentDay,
    });

    setIsDebtModalOpen(false);
    resetDebtForm();
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
    <div className="finance-screen silver-assets space-y-4 pb-6">
      
      {/* Sub tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] sm:text-xs font-semibold">
          <button
            onClick={() => setSubTab('accounts')}
            className={`py-2 rounded-xl transition ${
              subTab === 'accounts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
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
              <span className="silver-total-label">{t('totalAccountMoney')}</span><strong className="silver-total-amount text-slate-900 dark:text-white font-extrabold">{totalAssets.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => { setEditingAccountId(null); setAccName(''); setAccType('bank'); setAccIcon('Landmark'); setAccColor('#10B981'); setAccBalanceStr(''); setIsAccountModalOpen(true); }}
              className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-200"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addAccount')}</span>
            </button>
          </div>

          {accounts.some(a => a.balance > 0) && <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">{t('assetAllocation')}</h3>
            <div className="flex h-2 rounded-full overflow-hidden" aria-hidden="true">{accounts.filter(a => a.balance > 0).map(acc => <div key={acc.id} style={{width: `${acc.balance / accounts.reduce((sum,a) => sum + Math.max(0,a.balance),0) * 100}%`, backgroundColor: acc.color}}/>)}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300">{accounts.filter(a => a.balance > 0).map(acc => <span key={acc.id} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor:acc.color}}/>{acc.name} {Math.round(acc.balance / accounts.reduce((sum,a) => sum + Math.max(0,a.balance),0) * 100)}%</span>)}</div>
          </div>}
          <div className="finance-list">
            {accounts.map(acc => <details key={acc.id} className="account-details">
              <summary className="asset-row cursor-pointer list-none" aria-label={`${t('openAccountActions')}: ${acc.name}`}>
                <span className="flex items-center gap-3 min-w-0">
                  <span className="p-2.5 rounded-xl shrink-0" style={{backgroundColor:`${acc.color}20`,color:acc.color}}><DynamicIcon name={acc.iconName} className="w-5 h-5"/></span>
                  <span className="min-w-0">
                    <strong className="block text-sm break-words">{acc.name}</strong>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{t(acc.type === 'wallet' ? 'eWallet' : acc.type)}</span>
                      {acc.bankName && <span className="font-medium text-slate-700 dark:text-slate-300">• {acc.bankName}</span>}
                      {acc.accountNumber && <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">({acc.accountNumber})</span>}
                    </div>
                    {acc.type === 'savings' && (acc.interestRate || acc.maturityDate) && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {acc.interestRate ? `${acc.interestRate}%/năm` : ''} {acc.maturityDate ? `• Đáo hạn: ${acc.maturityDate}` : ''}
                      </div>
                    )}
                    {acc.type === 'credit' && acc.creditLimit && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        Hạn mức: {acc.creditLimit.toLocaleString('vi-VN')}₫
                      </div>
                    )}
                  </span>
                </span>
                <strong className="text-sm tabular-nums text-right break-all max-w-[150px]">{acc.balance.toLocaleString('vi-VN')} ₫</strong>
              </summary>
              <div className="asset-actions p-3">
                  <button
                    type="button"
                    aria-label={`${t('editAccount')}: ${acc.name}`}
                    title={t('editAccount')}
                    className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-blue-700/20"
                    onClick={() => {
                      setEditingAccountId(acc.id);
                      setAccName(acc.name);
                      setAccType(acc.type);
                      setAccIcon(acc.iconName);
                      setAccColor(acc.color);
                      setAccBalanceStr(acc.balance.toString());
                      setAccBankName(acc.bankName || '');
                      setAccNumber(acc.accountNumber || '');
                      setAccHolder(acc.accountHolder || '');
                      setAccBranch(acc.branch || '');
                      setAccInterestRateStr(acc.interestRate ? acc.interestRate.toString() : '');
                      setAccTermMonthsStr(acc.termMonths ? acc.termMonths.toString() : '');
                      setAccDepositDate(acc.depositDate || '');
                      setAccMaturityDate(acc.maturityDate || '');
                      setAccCreditLimitStr(acc.creditLimit ? acc.creditLimit.toString() : '');
                      setAccStatementDayStr(acc.statementDay ? acc.statementDay.toString() : '');
                      setAccDueDayStr(acc.paymentDueDay ? acc.paymentDueDay.toString() : '');
                      setIsAccountModalOpen(true);
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

                {onViewAccount && <button type="button" onClick={() => onViewAccount(acc.id)} className="text-blue-700 dark:text-blue-300">{t('seeHistory')}</button>}
                <button type="button" className="text-rose-700 dark:text-rose-300" aria-label={`${t('deleteAccount')}: ${acc.name}`} onClick={async () => { if (await confirmAction(t('deleteAccountConfirm', {name:acc.name}), {destructive:true})) onDeleteAccount(acc.id); }}><Trash2 className="inline w-4 h-4 mr-1"/>{t('delete')}</button>
              </div>
            </details>)}
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
                resetDebtForm();
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{loan.person}</h4>
                        {loan.debtCategory && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {t(loan.debtCategory === 'bank_loan' ? 'bankLoan' : loan.debtCategory === 'credit_card' ? 'creditCardDebt' : loan.debtCategory === 'installment' ? 'installmentDebt' : loan.debtCategory === 'personal_debt' ? 'personalDebt' : 'otherDebt')}
                          </span>
                        )}
                        {loan.isInstallment && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {t('installmentBadge')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                        {loan.lenderName && <span>{loan.lenderName}</span>}
                        {loan.interestRate ? <span className="text-blue-600 dark:text-blue-400 font-medium">{t('interestRateBadge')}: {loan.interestRate}%/năm</span> : null}
                        {loan.isInstallment && loan.monthlyInstallmentAmount ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {t('installmentBadge')}: {loan.monthlyInstallmentAmount.toLocaleString('vi-VN')}₫ (ngày {loan.monthlyPaymentDay || 15})
                          </span>
                        ) : null}
                        <span>{t('dueDate')}: {loan.dueDate || t('noDueDate')}</span>
                        {loan.note ? <span>• {loan.note}</span> : null}
                      </div>
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

                  <div className="flex items-center gap-2">
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
                    {onDeleteDebtOrLoan && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (await confirmAction(t('deleteDebtConfirm'), { destructive: true })) {
                            onDeleteDebtOrLoan(loan.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
                resetDebtForm();
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{debt.person}</h4>
                        {debt.debtCategory && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {t(debt.debtCategory === 'bank_loan' ? 'bankLoan' : debt.debtCategory === 'credit_card' ? 'creditCardDebt' : debt.debtCategory === 'installment' ? 'installmentDebt' : debt.debtCategory === 'personal_debt' ? 'personalDebt' : 'otherDebt')}
                          </span>
                        )}
                        {debt.isInstallment && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {t('installmentBadge')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                        {debt.lenderName && <span>{debt.lenderName}</span>}
                        {debt.interestRate ? <span className="text-rose-600 dark:text-rose-400 font-medium">{t('interestRateBadge')}: {debt.interestRate}%/năm</span> : null}
                        {debt.isInstallment && debt.monthlyInstallmentAmount ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {t('installmentBadge')}: {debt.monthlyInstallmentAmount.toLocaleString('vi-VN')}₫ (ngày {debt.monthlyPaymentDay || 15})
                          </span>
                        ) : null}
                        <span>{t('term')}: {debt.dueDate || t('noDueDate')}</span>
                        {debt.note ? <span>• {debt.note}</span> : null}
                      </div>
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

                  <div className="flex items-center gap-2">
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
                    {onDeleteDebtOrLoan && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (await confirmAction(t('deleteDebtConfirm'), { destructive: true })) {
                            onDeleteDebtOrLoan(debt.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Adjust Balance */}
      {isAdjustModalOpen && selectedAccount && (
        <AssetSheet title={t('adjustLedgerTitle')} onClose={() => setIsAdjustModalOpen(false)}>
          <div className="silver-asset-panel">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('adjustLedgerTitle')}</h3>
              <button aria-label={t('close')} onClick={() => setIsAdjustModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5"><div className="silver-asset-fields">
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

              </div><div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 shadow-md"
                >
                  {t('updateBalance')}
                </button>
              </div>
            </form>
          </div>
        </AssetSheet>
      )}

      {/* Modal: Add Account */}
      {isAccountModalOpen && (
        <AssetSheet title={t(editingAccountId ? 'editAccount' : 'addMoneySource')} onClose={() => { setIsAccountModalOpen(false); resetAccountForm(); }}>
          <div className="silver-asset-panel max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t(editingAccountId ? 'editAccount' : 'addMoneySource')}</h3>
              <button aria-label={t('close')} onClick={() => { setIsAccountModalOpen(false); resetAccountForm(); }} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5"><div className="silver-asset-fields space-y-3">
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
                <IOSSelect
                  label={t('accountType')} value={accType}
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
                  <option value="cash" data-icon="Banknote">{t('cash')}</option>
                  <option value="bank" data-icon="Landmark">{t('bankAccount')}</option>
                  <option value="wallet" data-icon="Wallet">{t('eWallet')}</option>
                  <option value="savings" data-icon="PiggyBank">{t('savingsBook')}</option>
                  <option value="credit" data-icon="CreditCard">{t('creditCard')}</option>
                </IOSSelect>
              </div>

              {/* Chi tiết cho Tài khoản Ngân hàng */}
              {accType === 'bank' && (
                <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Thông tin Ngân hàng</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('bankNameLabel')}</label>
                    <input
                      type="text"
                      value={accBankName}
                      onChange={e => setAccBankName(e.target.value)}
                      placeholder={t('bankNamePlaceholder')}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {COMMON_BANKS.slice(0, 6).map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => { setAccBankName(b); if (!accName) setAccName(b); }}
                          className="px-2 py-0.5 text-[10px] rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('accountNumberLabel')}</label>
                      <input
                        type="text"
                        value={accNumber}
                        onChange={e => setAccNumber(e.target.value)}
                        placeholder="VD: 1029384756"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('accountHolderLabel')}</label>
                      <input
                        type="text"
                        value={accHolder}
                        onChange={e => setAccHolder(e.target.value)}
                        placeholder="NGUYEN VAN A"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Chi tiết cho Ví điện tử */}
              {accType === 'wallet' && (
                <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Wallet className="w-3.5 h-3.5 text-pink-500" />
                    <span>Thông tin Ví điện tử</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('bankNameLabel')}</label>
                    <input
                      type="text"
                      value={accBankName}
                      onChange={e => setAccBankName(e.target.value)}
                      placeholder="VD: Momo, ZaloPay..."
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {COMMON_WALLETS.map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => { setAccBankName(w); if (!accName) setAccName(w); }}
                          className="px-2 py-0.5 text-[10px] rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-pink-500 hover:text-white transition"
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Số điện thoại ví</label>
                    <input
                      type="text"
                      value={accNumber}
                      onChange={e => setAccNumber(e.target.value)}
                      placeholder="VD: 0912345678"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Chi tiết cho Sổ tiết kiệm */}
              {accType === 'savings' && (
                <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <PiggyBank className="w-3.5 h-3.5" />
                    <span>Đặc tính Sổ tiết kiệm</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('bankNameLabel')}</label>
                      <input
                        type="text"
                        value={accBankName}
                        onChange={e => setAccBankName(e.target.value)}
                        placeholder="VD: Vietcombank"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('interestRatePercent')}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={accInterestRateStr}
                        onChange={e => setAccInterestRateStr(e.target.value)}
                        placeholder="5.5"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('depositDateLabel')}</label>
                      <DateField
                        type="date"
                        value={accDepositDate}
                        onChange={e => setAccDepositDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('maturityDateLabel')}</label>
                      <DateField
                        type="date"
                        value={accMaturityDate}
                        onChange={e => setAccMaturityDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Chi tiết cho Thẻ tín dụng */}
              {accType === 'credit' && (
                <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Đặc tính Thẻ tín dụng</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('creditLimitLabel')}</label>
                    <input
                      type="text"
                      value={accCreditLimitStr ? parseInt(accCreditLimitStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                      onChange={e => setAccCreditLimitStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="20.000.000"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('statementDayLabel')}</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={accStatementDayStr}
                        onChange={e => setAccStatementDayStr(e.target.value)}
                        placeholder="20"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('paymentDueDayLabel')}</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={accDueDayStr}
                        onChange={e => setAccDueDayStr(e.target.value)}
                        placeholder="5"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

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

              </div><div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsAccountModalOpen(false); resetAccountForm(); }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 shadow-md"
                >
                  {t(editingAccountId ? 'saveChanges' : 'createAccount')}
                </button>
              </div>
            </form>
          </div>
        </AssetSheet>
      )}

      {/* Modal: Add Debt/Loan */}
      {isDebtModalOpen && (
        <AssetSheet title={(debtType === 'loan' ? t('addLoanTitle') : t('addDebtTitle'))} onClose={() => { setIsDebtModalOpen(false); resetDebtForm(); }}>
          <div className="silver-asset-panel max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {debtType === 'loan' ? t('addLoanTitle') : t('addDebtTitle')}
              </h3>
              <button aria-label={t('close')} onClick={() => { setIsDebtModalOpen(false); resetDebtForm(); }} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3"><div className="silver-asset-fields space-y-3">
              {/* Phân loại khoản nợ */}
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('debtCategoryLabel')}</label>
                <IOSSelect
                  label={t('debtCategoryLabel')}
                  value={debtCategory}
                  onChange={e => setDebtCategory(e.target.value as DebtCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-semibold"
                >
                  <option value="personal_debt">{t('personalDebt')}</option>
                  <option value="bank_loan">{t('bankLoan')}</option>
                  <option value="credit_card">{t('creditCardDebt')}</option>
                  <option value="installment">{t('installmentDebt')}</option>
                  <option value="other">{t('otherDebt')}</option>
                </IOSSelect>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('relatedPerson')}</label>
                  <input
                    type="text"
                    value={debtPerson}
                    onChange={e => setDebtPerson(e.target.value)}
                    placeholder="VD: Tuấn, Ngân hàng..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('lenderNameLabel')}</label>
                  <input
                    type="text"
                    value={debtLenderName}
                    onChange={e => setDebtLenderName(e.target.value)}
                    placeholder={t('lenderNamePlaceholder')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('amountVnd')}</label>
                  <input
                    type="text"
                    value={debtAmountStr ? parseInt(debtAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                    onChange={e => setDebtAmountStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="10.000.000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold tabular-nums"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('interestRateDebtLabel')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={debtInterestRateStr}
                    onChange={e => setDebtInterestRateStr(e.target.value)}
                    placeholder="12.5"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Tùy chọn trả góp định kỳ hàng tháng */}
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={debtIsInstallment}
                    onChange={e => setDebtIsInstallment(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{t('isInstallmentLabel')}</span>
                </label>

                {debtIsInstallment && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('monthlyInstallmentAmountLabel')}</label>
                      <input
                        type="text"
                        value={debtMonthlyInstallmentStr ? parseInt(debtMonthlyInstallmentStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                        onChange={e => setDebtMonthlyInstallmentStr(e.target.value.replace(/\D/g, ''))}
                        placeholder="2.000.000"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('monthlyPaymentDayLabel')}</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={debtMonthlyPaymentDayStr}
                        onChange={e => setDebtMonthlyPaymentDayStr(e.target.value)}
                        placeholder="15"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('paymentDue')}</label>
                  <DateField
                    type="date"
                    value={debtDueDate}
                    onChange={e => setDebtDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('termMonthsDebtLabel')}</label>
                  <input
                    type="number"
                    min="1"
                    value={debtTermMonthsStr}
                    onChange={e => setDebtTermMonthsStr(e.target.value)}
                    placeholder="12"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>
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

              </div><div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsDebtModalOpen(false); resetDebtForm(); }}
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
        </AssetSheet>
      )}

      {/* Modal: Payment Record */}
      {isPaymentModalOpen && selectedDebt && (
        <AssetSheet title={(selectedDebt.type === 'loan' ? t('collectFrom') : t('payTo')) + ' ' + selectedDebt.person} onClose={() => setIsPaymentModalOpen(false)}>
          <div className="silver-asset-panel">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedDebt.type === 'loan' ? t('collectFrom') : t('payTo')} {selectedDebt.person}
              </h3>
              <button aria-label={t('close')} onClick={() => setIsPaymentModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5"><div className="silver-asset-fields">
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

              </div><div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 shadow-md"
                >
                  {t('confirmPayment')}
                </button>
              </div>
            </form>
          </div>
        </AssetSheet>
      )}

    </div>
  );
};
