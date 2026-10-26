import React, { useState, useEffect } from 'react';
import { Account, Category, TransactionType, Transaction } from '../types';
import { X, Check, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AddTransactionModalProps {
  accounts: Account[];
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  accounts,
  categories,
  isOpen,
  onClose,
  onAdd,
}) => {
  const { t } = useLanguage();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState<string>(categories.find(c => c.type === 'expense')?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [person, setPerson] = useState<string>('');
  const [submitError, setSubmitError] = useState('');
  useEffect(() => {
    if (isOpen) {
      setAccountId(accounts[0]?.id || '');
      setTargetAccountId(accounts[1]?.id || '');
      setSubmitError('');
    }
  }, [isOpen]);
  if (!isOpen) return null;

  const numAmount = Math.max(0, parseInt(amount.replace(/\D/g, ''), 10) || 0);

  const handleQuickAdd = (delta: number) => {
    setAmount((numAmount + delta).toString());
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      const incomeCat = categories.find(c => c.type === 'income');
      if (incomeCat) setCategoryId(incomeCat.id);
    } else {
      const expCat = categories.find(c => c.type === 'expense');
      if (expCat) setCategoryId(expCat.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    try {
    onAdd({
      type,
      amount: numAmount,
      accountId,
      targetAccountId: type === 'transfer' ? targetAccountId : undefined,
      categoryId,
      date,
      description: description.trim() || (type === 'transfer' ? t('transfer') : type === 'income' ? t('newIncome') : t('newExpense')),
      note: note.trim() || undefined,
      person: person.trim() || undefined,
    });

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
      return;
    }
    onClose();
    // reset form
    setAmount('');
    setDescription('');
    setNote('');
    setPerson('');
  };

  const availableCategories = categories.filter(c => {
    if (type === 'income') return c.type === 'income';
    return c.type === 'expense';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 animate-fade-in">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#f7fcff] to-[#eaf6ff] dark:bg-slate-900 border border-white/90 dark:border-slate-800 rounded-[28px] shadow-[0_25px_80px_rgba(24,112,209,.25)] overflow-hidden flex flex-col max-h-[92dvh] animate-pop-in">
        
        {submitError && <p role="alert" className="p-4 text-rose-700 dark:text-rose-300">{submitError}</p>}
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl ${
              type === 'expense' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' :
              type === 'income' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
              type === 'transfer' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
            } shrink-0`}>
              {type === 'expense' ? <ArrowUpRight className="w-5 h-5" /> :
               type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> :
               <ArrowRightLeft className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t('addTransactionTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('addTransactionSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Type Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              {t('transactionType')}
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#eaf3fb] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('expense')}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('income')}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  type === 'transfer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('transfer')}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('lend')}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  type === 'lend'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('loan')}
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              {t('amountVnd')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={numAmount ? numAmount.toLocaleString('vi-VN') : ''}
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-bold text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">
                ₫
              </span>
            </div>
            {/* Quick shortcuts */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50000, 100000, 200000, 500000, 1000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/50 transition"
                >
                  +{val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              {t('transactionDesc')}
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('transactionDescPlaceholder')}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          {/* Account & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                {type === 'transfer' ? t('fromAccount') : t('moneySourcesCount')}
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="tabular-nums break-all">
                    {acc.name} ({acc.balance.toLocaleString('vi-VN')}₫)
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  {t('toAccountLabel')}
                </label>
                <select
                  value={targetAccountId}
                  onChange={e => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {accounts
                    .filter(a => a.id !== accountId)
                    .map(acc => (
                      <option key={acc.id} value={acc.id} className="tabular-nums break-all">
                        {acc.name} ({acc.balance.toLocaleString('vi-VN')}₫)
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  {t('category')}
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                {t('transactionDate')}
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {(type === 'lend' || type === 'debt_repay') && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  {t('relatedPersonLabel')}
                </label>
                <input
                  type="text"
                  value={person}
                  onChange={e => setPerson(e.target.value)}
                  placeholder={t('relatedPersonExample')}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              {t('extraNote')}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('locationDetails')}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium rounded-xl transition"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={numAmount <= 0}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-gradient-to-r from-sky-400 to-blue-600 hover:brightness-105 disabled:opacity-50 disabled:pointer-events-none text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-lg shadow-blue-500/20 transition flex-1"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addTransactionBtn')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
