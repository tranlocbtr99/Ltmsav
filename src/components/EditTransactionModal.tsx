import React, { useState, useEffect } from 'react';
import { Transaction, Account, Category, TransactionType } from '../types';
import { X, Check, Trash2, ArrowRightLeft, Calendar, FileText, User, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updated: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  accounts,
  categories,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const { t } = useLanguage();

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState<string>(transaction?.amount.toString() ?? '');
  const [accountId, setAccountId] = useState<string>(transaction?.accountId ?? '');
  const [targetAccountId, setTargetAccountId] = useState<string>(transaction?.targetAccountId || accounts.find(a => a.id !== transaction?.accountId)?.id || '');
  const [categoryId, setCategoryId] = useState<string>(transaction?.categoryId ?? '');
  const [date, setDate] = useState<string>(transaction?.date ?? '');
  const [description, setDescription] = useState<string>(transaction?.description ?? '');
  const [note, setNote] = useState<string>(transaction?.note || '');
  const [person, setPerson] = useState<string>(transaction?.person || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setAccountId(transaction.accountId);
      setTargetAccountId(transaction?.targetAccountId || accounts.find(a => a.id !== transaction?.accountId)?.id || '');
      setCategoryId(transaction.categoryId);
      setDate(transaction.date);
      setDescription(transaction.description);
      setNote(transaction.note || '');
      setPerson(transaction.person || '');
      setShowDeleteConfirm(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const numAmount = Math.max(0, parseInt(amount.replace(/\D/g, ''), 10) || 0);

  const handleQuickAdd = (delta: number) => {
    setAmount((numAmount + delta).toString());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    onSave(transaction.id, {
      type,
      amount: numAmount,
      accountId,
      targetAccountId: type === 'transfer' ? targetAccountId : undefined,
      categoryId,
      date,
      description: description.trim() || t('transactions'),
      note: note.trim() || undefined,
      person: person.trim() || undefined,
    });
    onClose();
  };

  const currentAccount = accounts.find(a => a.id === accountId);
  const targetAccount = accounts.find(a => a.id === targetAccountId);
  const currentCategory = categories.find(c => c.id === categoryId);

  // Filter categories by type
  const availableCategories = categories.filter(c => {
    if (type === 'income') return c.type === 'income';
    return c.type === 'expense';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] animate-pop-in">
        
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
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t('editTransactionTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('editTransactionSubtitle')}</p>
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
        <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Type Selector Tabs */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              {t('transactionType')}
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setType('expense')}
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
                onClick={() => setType('income')}
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
                onClick={() => setType('transfer')}
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
                onClick={() => setType('lend')}
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
                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xl font-bold text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required
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
              <button
                type="button"
                onClick={() => setAmount('0')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 text-rose-400 hover:bg-slate-700 border border-slate-700/50 transition"
              >
                {t('clearAmount')}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              {t('contentDesc')}
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('contentDescPlaceholder')}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          {/* Account & Target Account */}
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
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {(type === 'lend' || type === 'debt_repay') && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  {t('relatedPersonLabel')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={person}
                    onChange={e => setPerson(e.target.value)}
                    placeholder={t('relatedPersonExample2')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              {t('extraNote')}
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('locationDetails2')}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Balance Reversal Information Box */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-slate-600 dark:text-slate-300 font-medium">{t('preserveLedger')}</p>
              <p className="tabular-nums break-all">
                {t('preserveLedgerDesc', { old: transaction.amount.toLocaleString('vi-VN'), new: numAmount.toLocaleString('vi-VN') })}
              </p>
            </div>
          </div>

          {/* Delete Confirmation Warning */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {t('confirmDeleteTx')}
              </div>
              <p className="tabular-nums break-all">
                {t('deleteTxDesc', { amount: transaction.amount.toLocaleString('vi-VN') })}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onDelete(transaction.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition"
                >
                  {t('deleteNow')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                >
                  {t('cancelAction')}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 flex items-center justify-between gap-3">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs sm:text-sm font-medium transition shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('delete')}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium rounded-xl transition"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>{t('saveChanges')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
