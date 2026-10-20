import React, { useState, useEffect } from 'react';
import { Transaction, Account, Category, TransactionType } from '../types';
import { X, Check, Trash2, ArrowRightLeft, Calendar, FileText, User, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

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
  if (!isOpen || !transaction) return null;

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState<string>(transaction.amount.toString());
  const [accountId, setAccountId] = useState<string>(transaction.accountId);
  const [targetAccountId, setTargetAccountId] = useState<string>(transaction.targetAccountId || accounts.find(a => a.id !== transaction.accountId)?.id || '');
  const [categoryId, setCategoryId] = useState<string>(transaction.categoryId);
  const [date, setDate] = useState<string>(transaction.date);
  const [description, setDescription] = useState<string>(transaction.description);
  const [note, setNote] = useState<string>(transaction.note || '');
  const [person, setPerson] = useState<string>(transaction.person || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setAccountId(transaction.accountId);
      setTargetAccountId(transaction.targetAccountId || accounts.find(a => a.id !== transaction.accountId)?.id || '');
      setCategoryId(transaction.categoryId);
      setDate(transaction.date);
      setDescription(transaction.description);
      setNote(transaction.note || '');
      setPerson(transaction.person || '');
      setShowDeleteConfirm(false);
    }
  }, [transaction]);

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
      description: description.trim() || 'Giao dịch',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              type === 'expense' ? 'bg-rose-500/15 text-rose-400' :
              type === 'income' ? 'bg-emerald-500/15 text-emerald-400' :
              type === 'transfer' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'
            }`}>
              {type === 'expense' ? <ArrowUpRight className="w-5 h-5" /> :
               type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> :
               <ArrowRightLeft className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Chỉnh Sửa Giao Dịch</h2>
              <p className="text-xs text-slate-400">Tự động đối soát và đảo bút toán số dư</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Type Selector Tabs */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Loại giao dịch
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Thu nhập
              </button>
              <button
                type="button"
                onClick={() => setType('transfer')}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  type === 'transfer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chuyển tiền
              </button>
              <button
                type="button"
                onClick={() => setType('lend')}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  type === 'lend'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cho vay
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Số tiền (VND)
            </label>
            <div className="relative">
              <input
                type="text"
                value={numAmount ? numAmount.toLocaleString('vi-VN') : ''}
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xl font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
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
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50 transition"
                >
                  +{val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('0')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 text-rose-400 hover:bg-slate-700 border border-slate-700/50 transition"
              >
                Xóa số
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Nội dung mô tả
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="VD: Cơm trưa, Xăng xe, Lương..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          {/* Account & Target Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                {type === 'transfer' ? 'Từ tài khoản' : 'Nguồn tiền'}
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance.toLocaleString('vi-VN')}₫)
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Đến tài khoản
                </label>
                <select
                  value={targetAccountId}
                  onChange={e => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {accounts
                    .filter(a => a.id !== accountId)
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.balance.toLocaleString('vi-VN')}₫)
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Danh mục
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Ngày giao dịch
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {(type === 'lend' || type === 'debt_repay') && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Người liên quan
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={person}
                    onChange={e => setPerson(e.target.value)}
                    placeholder="VD: Tuấn, Minh, VPBank..."
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Ghi chú thêm (tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Chi tiết địa điểm, người đi cùng..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Balance Reversal Information Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-300 font-medium">Bảo toàn sổ cái tài chính:</p>
              <p>
                Khi lưu, số dư cũ ({transaction.amount.toLocaleString('vi-VN')}₫) sẽ được hoàn lại tự động và số dư mới ({numAmount.toLocaleString('vi-VN')}₫) sẽ được áp dụng chính xác vào tài khoản liên quan.
              </p>
            </div>
          </div>

          {/* Delete Confirmation Warning */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-200">
                <AlertCircle className="w-4 h-4" />
                Xác nhận xóa giao dịch này?
              </div>
              <p>
                Giao dịch sẽ bị xóa vĩnh viễn và số tiền {transaction.amount.toLocaleString('vi-VN')}₫ sẽ được đảo bút toán để khôi phục số dư tài khoản về trạng thái ban đầu.
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
                  Xóa Ngay
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs sm:text-sm font-medium transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
