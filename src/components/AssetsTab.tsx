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
  Building2, CreditCard, PiggyBank, Calendar, Percent, ShoppingBag, 
  AlertTriangle, AlertCircle, ArrowRight, Sparkles, Receipt
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

// Visual Chip & Contactless Icons for Cards
const EmvChipSvg = () => (
  <svg className="w-8 h-6 rounded shrink-0 shadow-sm" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="28" rx="4" fill="url(#goldChip)" />
    <rect x="2" y="2" width="32" height="24" rx="2" stroke="#B8860B" strokeWidth="0.8" fill="none" opacity="0.6"/>
    <line x1="2" y1="14" x2="34" y2="14" stroke="#996515" strokeWidth="0.8" />
    <line x1="12" y1="2" x2="12" y2="26" stroke="#996515" strokeWidth="0.8" />
    <line x1="24" y1="2" x2="24" y2="26" stroke="#996515" strokeWidth="0.8" />
    <rect x="13.5" y="8" width="9" height="12" rx="2" fill="#D4AF37" stroke="#7A5210" strokeWidth="0.8" />
    <defs>
      <linearGradient id="goldChip" x1="0" y1="0" x2="36" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F9E498" />
        <stop offset="0.5" stopColor="#E5C158" />
        <stop offset="1" stopColor="#B38728" />
      </linearGradient>
    </defs>
  </svg>
);

const ContactlessWaveSvg = ({ className = "w-4 h-4 text-white/80" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M14 4a11 11 0 0 1 0 16" opacity="0.4" />
    <path d="M10.5 7.5a6.5 6.5 0 0 1 0 9" opacity="0.7" />
    <path d="M7 11a2.5 2.5 0 0 1 0 2" />
  </svg>
);

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
  const [debtModalType, setDebtModalType] = useState<'debt' | 'loan'>('debt');
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
  
  // Installment specifics
  const [debtItemName, setDebtItemName] = useState('');
  const [debtDownPaymentStr, setDebtDownPaymentStr] = useState('');
  const [debtTotalInstallmentsStr, setDebtTotalInstallmentsStr] = useState('6');
  const [debtMonthlyInstallmentStr, setDebtMonthlyInstallmentStr] = useState('');
  const [debtMonthlyPaymentDayStr, setDebtMonthlyPaymentDayStr] = useState('15');

  // Credit Card specifics
  const [debtCreditLimitStr, setDebtCreditLimitStr] = useState('');
  const [debtCardLast4, setDebtCardLast4] = useState('');
  const [debtStatementDayStr, setDebtStatementDayStr] = useState('20');
  const [debtPaymentDueDayStr, setDebtPaymentDueDayStr] = useState('5');

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
    setDebtItemName('');
    setDebtDownPaymentStr('');
    setDebtTotalInstallmentsStr('6');
    setDebtMonthlyInstallmentStr('');
    setDebtMonthlyPaymentDayStr('15');
    setDebtCreditLimitStr('');
    setDebtCardLast4('');
    setDebtStatementDayStr('20');
    setDebtPaymentDueDayStr('5');
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
    if (amount <= 0) return;

    const interestRate = parseFloat(debtInterestRateStr) || undefined;
    const termMonths = parseInt(debtTermMonthsStr, 10) || undefined;
    const isInstallment = debtCategory === 'installment';

    const downPayment = parseInt(debtDownPaymentStr.replace(/\D/g, ''), 10) || undefined;
    const totalInstallments = parseInt(debtTotalInstallmentsStr, 10) || undefined;
    const monthlyInstallmentAmount = parseInt(debtMonthlyInstallmentStr.replace(/\D/g, ''), 10) || undefined;
    const monthlyPaymentDay = parseInt(debtMonthlyPaymentDayStr, 10) || undefined;

    const creditLimit = parseInt(debtCreditLimitStr.replace(/\D/g, ''), 10) || undefined;
    const statementDay = parseInt(debtStatementDayStr, 10) || undefined;
    const paymentDueDay = parseInt(debtPaymentDueDayStr, 10) || undefined;

    const personName = debtModalType === 'loan' 
      ? debtPerson.trim() 
      : debtCategory === 'installment'
        ? (debtItemName.trim() || 'Trả góp')
        : debtCategory === 'credit_card'
          ? (debtLenderName.trim() || 'Thẻ tín dụng')
          : (debtPerson.trim() || debtLenderName.trim() || 'Khoản nợ');

    onAddDebtOrLoan({
      type: debtModalType,
      person: personName,
      amount,
      accountId: debtAccountId || accounts[0]?.id || '',
      dueDate: debtDueDate || undefined,
      note: debtNote.trim() || undefined,
      debtCategory: debtModalType === 'debt' ? debtCategory : undefined,
      lenderName: debtLenderName.trim() || undefined,
      interestRate,
      termMonths,
      isInstallment,
      itemName: isInstallment ? (debtItemName.trim() || undefined) : undefined,
      downPayment,
      totalInstallments: isInstallment ? (totalInstallments || 6) : undefined,
      paidInstallments: isInstallment ? 0 : undefined,
      monthlyInstallmentAmount,
      monthlyPaymentDay,
      creditLimit: debtCategory === 'credit_card' ? creditLimit : undefined,
      cardNumberLast4: debtCategory === 'credit_card' ? debtCardLast4.trim() : undefined,
      statementDay: debtCategory === 'credit_card' ? statementDay : undefined,
      paymentDueDay: debtCategory === 'credit_card' ? paymentDueDay : undefined,
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
      
      {/* 3 Main Sub-tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] sm:text-xs font-bold">
        <button
          onClick={() => setSubTab('accounts')}
          className={`py-2 px-1 rounded-xl transition whitespace-nowrap truncate ${
            subTab === 'accounts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('moneySourcesCount')} ({accounts.length})
        </button>
        <button
          onClick={() => setSubTab('loans')}
          className={`py-2 px-1 rounded-xl transition whitespace-nowrap truncate ${
            subTab === 'loans' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('loansCount')} ({debts.filter(d => d.type === 'loan').length})
        </button>
        <button
          onClick={() => setSubTab('debts')}
          className={`py-2 px-1 rounded-xl transition whitespace-nowrap truncate ${
            subTab === 'debts' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('debtsCount')} ({debts.filter(d => d.type === 'debt').length})
        </button>
      </div>

      {/* SubTab 1: ACCOUNTS (Tài khoản & Nguồn tiền) */}
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

          {accounts.some(a => a.balance > 0) && (
            <div className="glass-card p-4 space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold">{t('assetAllocation')}</h3>
              <div className="flex h-2 rounded-full overflow-hidden" aria-hidden="true">
                {accounts.filter(a => a.balance > 0).map(acc => (
                  <div key={acc.id} style={{width: `${acc.balance / accounts.reduce((sum,a) => sum + Math.max(0,a.balance),0) * 100}%`, backgroundColor: acc.color}}/>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
                {accounts.filter(a => a.balance > 0).map(acc => (
                  <span key={acc.id} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor:acc.color}}/>
                    {acc.name} {Math.round(acc.balance / accounts.reduce((sum,a) => sum + Math.max(0,a.balance),0) * 100)}%
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="finance-list space-y-2.5">
            {accounts.map(acc => (
              <details key={acc.id} className="account-details glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <summary className="asset-row cursor-pointer list-none p-3.5 flex items-center justify-between" aria-label={`${t('openAccountActions')}: ${acc.name}`}>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="p-2.5 rounded-xl shrink-0" style={{backgroundColor:`${acc.color}20`,color:acc.color}}>
                      <DynamicIcon name={acc.iconName} className="w-5 h-5"/>
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm break-words text-slate-900 dark:text-white">{acc.name}</strong>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200/80 dark:bg-slate-800">
                          {t(acc.type === 'wallet' ? 'eWallet' : acc.type)}
                        </span>
                        {acc.bankName && <span className="font-semibold text-slate-700 dark:text-slate-300">• {acc.bankName}</span>}
                        {acc.accountNumber && <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">({acc.accountNumber})</span>}
                      </div>
                      {acc.type === 'savings' && (acc.interestRate || acc.maturityDate) && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                          {acc.interestRate ? `${acc.interestRate}%/năm` : ''} {acc.maturityDate ? `• Đáo hạn: ${acc.maturityDate}` : ''}
                        </div>
                      )}
                      {acc.type === 'credit' && acc.creditLimit && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                          Hạn mức: {acc.creditLimit.toLocaleString('vi-VN')}₫
                        </div>
                      )}
                    </span>
                  </span>
                  <strong className="text-sm tabular-nums text-right whitespace-nowrap shrink-0 ml-2 text-slate-900 dark:text-white font-extrabold">
                    {acc.balance.toLocaleString('vi-VN')} ₫
                  </strong>
                </summary>
                
                <div className="asset-actions p-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`${t('editAccount')}: ${acc.name}`}
                    title={t('editAccount')}
                    className="flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
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
                    <Edit2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('editDetails')}</span>
                  </button>
                  <button
                    aria-label={`${t('adjustBalance')}: ${acc.name}`}
                    onClick={() => {
                      setSelectedAccount(acc);
                      setNewBalanceStr(acc.balance.toString());
                      setAdjustReason('');
                      setIsAdjustModalOpen(true);
                    }}
                    className="flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-500/10 px-2 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 transition"
                    title={t('adjustBalance')}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('adjustBalance')}</span>
                  </button>

                  {onViewAccount && (
                    <button 
                      type="button" 
                      onClick={() => onViewAccount(acc.id)} 
                      className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                    >
                      {t('seeHistory')}
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition" 
                    aria-label={`${t('deleteAccount')}: ${acc.name}`} 
                    onClick={async () => { 
                      if (await confirmAction(t('deleteAccountConfirm', {name:acc.name}), {destructive:true})) onDeleteAccount(acc.id); 
                    }}
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: LOANS (Cho vay - Tài sản phải thu / Người khác mượn tiền mình) */}
      {subTab === 'loans' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('lending')}: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{totalLoans.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => {
                resetDebtForm();
                setDebtModalType('loan');
                setIsDebtModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addLoan')}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {debts.filter(d => d.type === 'loan').length === 0 ? (
              <div className="glass-card p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                <div className="w-28 h-24 mx-auto flex items-center justify-center">
                  <img src="/illustrations/empty-debts.svg" alt="Chưa có khoản cho vay" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Chưa có khoản cho vay nào</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Khi bạn cho bạn bè, người thân mượn tiền, hãy ghi chép ở đây để theo dõi và thu hồi đầy đủ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDebtModalType('loan');
                    resetDebtForm();
                    setIsDebtModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="whitespace-nowrap">{t('addLoan')}</span>
                </button>
              </div>
            ) : (
              debts.filter(d => d.type === 'loan').map(loan => (
                <div
                  key={loan.id}
                  className="glass-card card-interactive p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/10 space-y-3 bg-gradient-to-br from-emerald-500/5 to-transparent"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{loan.person}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Khoản cho vay (Phải thu)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap gap-x-2">
                          {loan.dueDate && (
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                              <Calendar className="w-3 h-3 text-emerald-500" />
                              {t('dueDate')}: {loan.dueDate}
                            </span>
                          )}
                          {loan.interestRate ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Lãi: {loan.interestRate}%/năm
                            </span>
                          ) : null}
                          {loan.note && <span className="text-slate-500">• {loan.note}</span>}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                      loan.status === 'settled'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {loan.status === 'settled' ? t('collectedFull') : t('notCollectedFull')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">{t('principal')}: {loan.amount.toLocaleString('vi-VN')}₫</span>
                      <span className="block font-black text-emerald-700 dark:text-emerald-400 text-sm">
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
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-sm"
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
              ))
            )}
          </div>
        </div>
      )}

      {/* SubTab 3: DEBTS (Nghĩa vụ nợ - Thẻ tín dụng, Trả góp, Vay ngân hàng, Vay cá nhân) */}
      {subTab === 'debts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('totalDebtPay')}: <strong className="text-rose-700 dark:text-rose-400 font-extrabold">{totalDebts.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => {
                resetDebtForm();
                setDebtModalType('debt');
                setIsDebtModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addDebt')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {debts.filter(d => d.type === 'debt').length === 0 ? (
              <div className="glass-card p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                <div className="w-28 h-24 mx-auto flex items-center justify-center">
                  <img src="/illustrations/empty-debts.svg" alt="Không có khoản nợ nào" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Tuyệt vời! Bạn không có khoản nợ nào</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Thêm thẻ tín dụng hoặc các khoản trả góp khi phát sinh để theo dõi hạn thanh toán và tránh phát sinh phí phạt.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDebtModalType('debt');
                    resetDebtForm();
                    setIsDebtModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="whitespace-nowrap">{t('addDebt')}</span>
                </button>
              </div>
            ) : (
              debts.filter(d => d.type === 'debt').map(debt => {
                const isCreditCard = debt.debtCategory === 'credit_card';
                const isInstallment = debt.debtCategory === 'installment' || debt.isInstallment;

                // 1. GIAO DIỆN THẺ TÍN DỤNG SINH ĐỘNG
                if (isCreditCard) {
                  const limit = debt.creditLimit || debt.amount || 1;
                  const used = debt.remainingAmount;
                  const available = Math.max(0, limit - used);
                  const utilPercent = Math.min(100, Math.round((used / limit) * 100));

                  return (
                    <div
                      key={debt.id}
                      className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl transition border border-white/10"
                      style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #1e1b4b 100%)'
                      }}
                    >
                      {/* Decorative Background elements */}
                      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
                      <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

                      {/* Card Header: Chip, Contactless, Bank Name */}
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <EmvChipSvg />
                          <ContactlessWaveSvg className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black tracking-widest uppercase text-slate-200 block">
                            {debt.lenderName || debt.person || 'THẺ TÍN DỤNG'}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400">CREDIT CARD</span>
                        </div>
                      </div>

                      {/* Card Number dập nổi */}
                      <div className="font-mono text-sm tracking-widest text-slate-300 font-bold mb-3">
                        •••• •••• •••• {debt.cardNumberLast4 || '8888'}
                      </div>

                      {/* Credit Limit & Utilization Bar */}
                      <div className="space-y-1.5 mb-3 bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="text-slate-400 text-[11px]">Dư nợ hiện tại:</span>
                          <span className="font-black text-rose-400 text-sm">{used.toLocaleString('vi-VN')}₫</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              utilPercent > 80 ? 'bg-rose-500' : utilPercent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${utilPercent}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Hạn mức: {limit.toLocaleString('vi-VN')}₫</span>
                          <span>Khả dụng: {available.toLocaleString('vi-VN')}₫ ({100 - utilPercent}%)</span>
                        </div>
                      </div>

                      {/* Statement and Due Date Badges */}
                      <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-white/10 pt-3">
                        <div className="flex items-center gap-3">
                          {debt.statementDay && (
                            <span>Sao kê: <strong className="text-white">Ngày {debt.statementDay}</strong></span>
                          )}
                          {debt.paymentDueDay && (
                            <span className="text-amber-300 font-semibold">
                              Hạn TT: <strong className="text-amber-200">Ngày {debt.paymentDueDay}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {debt.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedDebt(debt);
                                setPayAmountStr(debt.remainingAmount.toString());
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs transition shadow-md"
                            >
                              Thanh toán nợ thẻ
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
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                              title={t('delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // 2. GIAO DIỆN KHOẢN MUA TRẢ GÓP SINH ĐỘNG
                if (isInstallment) {
                  const total = debt.totalInstallments || 6;
                  const paid = debt.paidInstallments || 0;
                  const percentPaid = Math.min(100, Math.round((paid / total) * 100));

                  return (
                    <div
                      key={debt.id}
                      className="glass-card card-interactive p-4 rounded-3xl border border-amber-500/20 dark:border-amber-500/10 space-y-3 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {debt.itemName || debt.person}
                              </h4>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {t('installmentBadge')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                              {debt.lenderName && <span>Đối tác: <strong className="text-slate-700 dark:text-slate-300">{debt.lenderName}</strong></span>}
                              {debt.monthlyPaymentDay && (
                                <span>Đóng ngày: <strong className="text-amber-600 dark:text-amber-400">{debt.monthlyPaymentDay} hàng tháng</strong></span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                          debt.status === 'settled'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {debt.status === 'settled' ? 'Hoàn tất' : `Kỳ ${paid}/${total}`}
                        </span>
                      </div>

                      {/* Tiến độ các kỳ trả góp */}
                      <div className="space-y-1.5 bg-slate-100/60 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tiến độ trả góp:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Đã đóng {paid}/{total} kỳ ({percentPaid}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-baseline pt-1 text-xs">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Góp mỗi tháng: <strong className="text-amber-600 dark:text-amber-400 font-bold">{debt.monthlyInstallmentAmount?.toLocaleString('vi-VN') || 0}₫</strong>
                          </span>
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Còn nợ: {debt.remainingAmount.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Tổng giá trị: {debt.amount.toLocaleString('vi-VN')}₫
                        </span>

                        <div className="flex items-center gap-2">
                          {debt.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedDebt(debt);
                                const defaultPay = debt.monthlyInstallmentAmount || debt.remainingAmount;
                                setPayAmountStr(Math.min(defaultPay, debt.remainingAmount).toString());
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-sm"
                            >
                              Đóng tiền kỳ này
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
                  );
                }

                // 3. GIAO DIỆN KHOẢN VAY NGÂN HÀNG HOẶC VAY CÁ NHÂN
                return (
                  <div
                    key={debt.id}
                    className="glass-card card-interactive p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                          {debt.debtCategory === 'bank_loan' ? <Landmark className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{debt.person}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {t(debt.debtCategory === 'bank_loan' ? 'bankLoan' : debt.debtCategory === 'personal_debt' ? 'personalDebt' : 'otherDebt')}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                            {debt.lenderName && <span>Tổ chức: <strong>{debt.lenderName}</strong></span>}
                            {debt.interestRate ? <span className="text-rose-600 dark:text-rose-400 font-semibold">{t('interestRateBadge')}: {debt.interestRate}%/năm</span> : null}
                            {debt.dueDate && <span>{t('term')}: {debt.dueDate}</span>}
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
                );
              })
            )}
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

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
              <div className="silver-asset-fields">
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

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div className="silver-asset-fields space-y-3">
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

                {/* Balance input */}
                {!editingAccountId && (
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('initialBalance')}</label>
                    <input
                      type="text"
                      value={accBalanceStr ? parseInt(accBalanceStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                      onChange={e => setAccBalanceStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold tabular-nums"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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

      {/* Modal: Add Debt or Loan */}
      {isDebtModalOpen && (
        <AssetSheet 
          title={debtModalType === 'loan' ? 'Ghi nhận Khoản cho vay (Phải thu)' : 'Ghi nhận Khoản nợ / Thẻ / Trả góp'} 
          onClose={() => { setIsDebtModalOpen(false); resetDebtForm(); }}
        >
          <div className="silver-asset-panel max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {debtModalType === 'loan' ? 'Ghi nhận Khoản Cho Vay (Tài sản phải thu)' : 'Ghi nhận Khoản Nợ / Nghĩa vụ trả'}
              </h3>
              <button aria-label={t('close')} onClick={() => { setIsDebtModalOpen(false); resetDebtForm(); }} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3.5 pt-1">
              <div className="silver-asset-fields space-y-3">
                
                {/* Khi là Khoản Cho Vay (LOAN) */}
                {debtModalType === 'loan' ? (
                  <>
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Sổ Cho Vay (Tài sản của bạn)</span>
                      </div>
                      <p className="text-[11px] opacity-90">
                        Số tiền này là tài sản phải thu. Dòng tiền dự báo sẽ tính khoản thu này vào ngày đáo hạn.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Người mượn tiền *</label>
                      <input
                        type="text"
                        value={debtPerson}
                        onChange={e => setDebtPerson(e.target.value)}
                        placeholder="VD: Tuấn, Đồng nghiệp A, Em trai..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Số tiền cho mượn (VND) *</label>
                      <input
                        type="text"
                        value={debtAmountStr ? parseInt(debtAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                        onChange={e => setDebtAmountStr(e.target.value.replace(/\D/g, ''))}
                        placeholder="5.000.000"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm font-bold tabular-nums"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Ngày hẹn trả</label>
                        <DateField
                          type="date"
                          value={debtDueDate}
                          onChange={e => setDebtDueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Lãi suất thỏa thuận (%/năm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={debtInterestRateStr}
                          onChange={e => setDebtInterestRateStr(e.target.value)}
                          placeholder="0 hoặc 6.5"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Ghi chú lý do cho vay</label>
                      <input
                        type="text"
                        value={debtNote}
                        onChange={e => setDebtNote(e.target.value)}
                        placeholder="VD: Cho mượn đóng tiền phòng trọ..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </>
                ) : (
                  /* Khi là Khoản Nợ (DEBT) */
                  <>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Hình thức nợ *</label>
                      <IOSSelect
                        label={t('debtCategoryLabel')}
                        value={debtCategory}
                        onChange={e => setDebtCategory(e.target.value as DebtCategory)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
                      >
                        <option value="credit_card">💳 Thẻ tín dụng (Credit Card)</option>
                        <option value="installment">🛍️ Mua hàng trả góp (Installment)</option>
                        <option value="bank_loan">🏦 Vay ngân hàng (Bank Loan)</option>
                        <option value="personal_debt">🤝 Vay cá nhân / Người thân</option>
                        <option value="other">📋 Khoản nợ khác</option>
                      </IOSSelect>
                    </div>

                    {/* Form chi tiết cho Thẻ tín dụng */}
                    {debtCategory === 'credit_card' && (
                      <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                          <CreditCard className="w-4 h-4" />
                          <span>Chi tiết Thẻ tín dụng</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Ngân hàng phát hành *</label>
                            <input
                              type="text"
                              value={debtLenderName}
                              onChange={e => setDebtLenderName(e.target.value)}
                              placeholder="VD: Techcombank Visa"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-semibold"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">4 số cuối thẻ</label>
                            <input
                              type="text"
                              maxLength={4}
                              value={debtCardLast4}
                              onChange={e => setDebtCardLast4(e.target.value.replace(/\D/g, ''))}
                              placeholder="VD: 6868"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Dư nợ đang nợ (VND) *</label>
                            <input
                              type="text"
                              value={debtAmountStr ? parseInt(debtAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                              onChange={e => setDebtAmountStr(e.target.value.replace(/\D/g, ''))}
                              placeholder="12.000.000"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold text-rose-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Hạn mức thẻ tín dụng</label>
                            <input
                              type="text"
                              value={debtCreditLimitStr ? parseInt(debtCreditLimitStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                              onChange={e => setDebtCreditLimitStr(e.target.value.replace(/\D/g, ''))}
                              placeholder="30.000.000"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Ngày chốt sao kê (1-31)</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={debtStatementDayStr}
                              onChange={e => setDebtStatementDayStr(e.target.value)}
                              placeholder="20"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Hạn thanh toán hàng tháng (1-31)</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={debtPaymentDueDayStr}
                              onChange={e => setDebtPaymentDueDayStr(e.target.value)}
                              placeholder="5"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold text-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form chi tiết cho Mua trả góp */}
                    {debtCategory === 'installment' && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                          <ShoppingBag className="w-4 h-4" />
                          <span>Chi tiết Món hàng Mua Trả Góp</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Tên sản phẩm *</label>
                            <input
                              type="text"
                              value={debtItemName}
                              onChange={e => setDebtItemName(e.target.value)}
                              placeholder="VD: iPhone 16 Pro Max"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-semibold"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Đơn vị tài chính / Cửa hàng</label>
                            <input
                              type="text"
                              value={debtLenderName}
                              onChange={e => setDebtLenderName(e.target.value)}
                              placeholder="VD: Home Credit / FE / TopZone"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Tổng số tiền trả góp (VND) *</label>
                            <input
                              type="text"
                              value={debtAmountStr ? parseInt(debtAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                              onChange={e => setDebtAmountStr(e.target.value.replace(/\D/g, ''))}
                              placeholder="24.000.000"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold text-rose-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Số tiền đã trả trước (nếu có)</label>
                            <input
                              type="text"
                              value={debtDownPaymentStr ? parseInt(debtDownPaymentStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                              onChange={e => setDebtDownPaymentStr(e.target.value.replace(/\D/g, ''))}
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Số kỳ (tháng)</label>
                            <input
                              type="number"
                              min="1"
                              max="48"
                              value={debtTotalInstallmentsStr}
                              onChange={e => setDebtTotalInstallmentsStr(e.target.value)}
                              placeholder="12"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Góp/tháng (VND)</label>
                            <input
                              type="text"
                              value={debtMonthlyInstallmentStr ? parseInt(debtMonthlyInstallmentStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                              onChange={e => setDebtMonthlyInstallmentStr(e.target.value.replace(/\D/g, ''))}
                              placeholder="2.000.000"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold text-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Ngày đóng</label>
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
                      </div>
                    )}

                    {/* Form chi tiết cho Vay ngân hàng / Vay cá nhân */}
                    {debtCategory !== 'credit_card' && debtCategory !== 'installment' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Bên cho vay / Người liên quan *</label>
                            <input
                              type="text"
                              value={debtPerson}
                              onChange={e => setDebtPerson(e.target.value)}
                              placeholder="VD: Ngân hàng ACB, Bạn Nam..."
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-semibold"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Số tiền vay (VND) *</label>
                            <input
                              type="text"
                              value={debtAmountStr ? parseInt(debtAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                              onChange={e => setDebtAmountStr(e.target.value.replace(/\D/g, ''))}
                              placeholder="20.000.000"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold text-rose-500 tabular-nums"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Lãi suất (%/năm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={debtInterestRateStr}
                              onChange={e => setDebtInterestRateStr(e.target.value)}
                              placeholder="VD: 10.5"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Hạn thanh toán</label>
                            <DateField
                              type="date"
                              value={debtDueDate}
                              onChange={e => setDebtDueDate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Ghi chú thêm</label>
                      <input
                        type="text"
                        value={debtNote}
                        onChange={e => setDebtNote(e.target.value)}
                        placeholder="VD: Mua xe máy, vay sửa nhà..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </>
                )}

              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsDebtModalOpen(false); resetDebtForm(); }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white font-bold text-xs rounded-lg shadow-md transition ${
                    debtModalType === 'loan' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
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
        <AssetSheet 
          title={
            selectedDebt.type === 'loan' 
              ? `Thu hồi tiền từ ${selectedDebt.person}` 
              : selectedDebt.debtCategory === 'credit_card'
                ? `Thanh toán nợ thẻ ${selectedDebt.person}`
                : selectedDebt.debtCategory === 'installment'
                  ? `Đóng tiền trả góp ${selectedDebt.person}`
                  : `Trả nợ cho ${selectedDebt.person}`
          } 
          onClose={() => setIsPaymentModalOpen(false)}
        >
          <div className="silver-asset-panel">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedDebt.type === 'loan' ? 'Thu nợ từ' : 'Thanh toán cho'} {selectedDebt.person}
              </h3>
              <button aria-label={t('close')} onClick={() => setIsPaymentModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5 pt-1">
              <div className="silver-asset-fields space-y-2">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('paymentAmount')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={payAmountStr ? parseInt(payAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                      onChange={e => setPayAmountStr(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-base font-bold tabular-nums focus:outline-none focus:border-blue-500"
                      required
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₫</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{t('currentDebt')}: <strong>{selectedDebt.remainingAmount.toLocaleString('vi-VN')}₫</strong></span>
                    {selectedDebt.monthlyInstallmentAmount && (
                      <button
                        type="button"
                        onClick={() => setPayAmountStr(selectedDebt.monthlyInstallmentAmount!.toString())}
                        className="text-blue-600 dark:text-blue-400 underline font-semibold"
                      >
                        Chọn 1 kỳ ({selectedDebt.monthlyInstallmentAmount.toLocaleString('vi-VN')}₫)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 font-bold text-xs rounded-lg shadow-md text-white transition ${
                    selectedDebt.type === 'loan' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
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
