import React, { useState } from 'react';
import { Account, DebtOrLoan } from '../types';
import { 
  Wallet, Plus, Edit2, ArrowDownLeft, ArrowUpRight, CheckCircle2, 
  Clock, User, Landmark, ShieldCheck, X, Check 
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface AssetsTabProps {
  accounts: Account[];
  debts: DebtOrLoan[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onAdjustBalance: (id: string, newBalance: number, reason: string) => void;
  onAddDebtOrLoan: (item: Omit<DebtOrLoan, 'id' | 'createdAt' | 'status' | 'remainingAmount'>) => void;
  onRecordPayment: (id: string, amount: number) => void;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({
  accounts,
  debts,
  onAddAccount,
  onAdjustBalance,
  onAddDebtOrLoan,
  onRecordPayment,
}) => {
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
    onAdjustBalance(selectedAccount.id, balance, adjustReason.trim() || 'Cân đối số dư sổ cái');
    setIsAdjustModalOpen(false);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseInt(accBalanceStr.replace(/\D/g, ''), 10) || 0;
    if (!accName.trim()) return;

    onAddAccount({
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
    <div className="space-y-4 pb-12">
      
      {/* Sub tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setSubTab('accounts')}
          className={`py-2 rounded-xl transition ${
            subTab === 'accounts' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Nguồn tiền ({accounts.length})
        </button>
        <button
          onClick={() => setSubTab('loans')}
          className={`py-2 rounded-xl transition ${
            subTab === 'loans' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Cho vay ({debts.filter(d => d.type === 'loan').length})
        </button>
        <button
          onClick={() => setSubTab('debts')}
          className={`py-2 rounded-xl transition ${
            subTab === 'debts' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sổ nợ ({debts.filter(d => d.type === 'debt').length})
        </button>
      </div>

      {/* SubTab 1: ACCOUNTS */}
      {subTab === 'accounts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tổng tiền tài khoản: <strong className="text-white font-extrabold">{totalAssets.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm tài khoản</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl text-white"
                      style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                    >
                      <DynamicIcon name={acc.iconName} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{acc.name}</h4>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {acc.type === 'cash' ? 'Tiền mặt' :
                         acc.type === 'bank' ? 'Ngân hàng' :
                         acc.type === 'wallet' ? 'Ví điện tử' :
                         acc.type === 'savings' ? 'Tiết kiệm' : 'Tín dụng'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAccount(acc);
                      setNewBalanceStr(acc.balance.toString());
                      setAdjustReason('');
                      setIsAdjustModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Điều chỉnh số dư"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Số dư hiện tại</span>
                  <span className="text-base font-extrabold text-white">
                    {acc.balance.toLocaleString('vi-VN')}₫
                  </span>
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đang cho vay: <strong className="text-blue-400">{totalLoans.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => {
                setDebtType('loan');
                setIsDebtModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi khoản cho vay</span>
            </button>
          </div>

          <div className="space-y-2">
            {debts.filter(d => d.type === 'loan').map(loan => (
              <div
                key={loan.id}
                className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{loan.person}</h4>
                      <span className="text-[11px] text-slate-400">
                        Hạn trả: {loan.dueDate || 'Chưa định ngày'} {loan.note ? `• ${loan.note}` : ''}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    loan.status === 'settled'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {loan.status === 'settled' ? 'Đã thu hồi đủ' : 'Chưa thu hồi hết'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Gốc: {loan.amount.toLocaleString('vi-VN')}₫</span>
                    <span className="block font-bold text-blue-400">
                      Còn lại: {loan.remainingAmount.toLocaleString('vi-VN')}₫
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
                      Thu Nợ
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tổng số nợ cần trả: <strong className="text-rose-400">{totalDebts.toLocaleString('vi-VN')}₫</strong>
            </span>
            <button
              onClick={() => {
                setDebtType('debt');
                setIsDebtModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi khoản nợ</span>
            </button>
          </div>

          <div className="space-y-2">
            {debts.filter(d => d.type === 'debt').map(debt => (
              <div
                key={debt.id}
                className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{debt.person}</h4>
                      <span className="text-[11px] text-slate-400">
                        Kỳ hạn: {debt.dueDate || 'Chưa định ngày'} {debt.note ? `• ${debt.note}` : ''}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    debt.status === 'settled'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {debt.status === 'settled' ? 'Đã trả xong' : 'Còn nợ'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Tổng: {debt.amount.toLocaleString('vi-VN')}₫</span>
                    <span className="block font-bold text-rose-400">
                      Cần trả: {debt.remainingAmount.toLocaleString('vi-VN')}₫
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
                      Trả Nợ
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Điều Chỉnh Số Dư Sổ Cái</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tài khoản: <strong className="text-white">{selectedAccount.name}</strong></label>
                <div className="relative">
                  <input
                    type="text"
                    value={newBalanceStr ? parseInt(newBalanceStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                    onChange={e => setNewBalanceStr(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-base font-bold focus:outline-none focus:border-emerald-500"
                    required
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₫</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Lý do điều chỉnh (Kiểm toán)</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="VD: Kiểm đếm tiền mặt cuối tháng, chênh lệch phí..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  Cập nhật số dư
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Account */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Thêm Nguồn Tiền Mới</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tên tài khoản / nguồn tiền</label>
                <input
                  type="text"
                  value={accName}
                  onChange={e => setAccName(e.target.value)}
                  placeholder="VD: MB Bank, Tiền mặt phụ, ViettelPay..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Loại tài khoản</label>
                <select
                  value={accType}
                  onChange={e => setAccType(e.target.value as Account['type'])}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Tài khoản Ngân hàng</option>
                  <option value="wallet">Ví điện tử</option>
                  <option value="savings">Sổ tiết kiệm</option>
                  <option value="credit">Thẻ tín dụng</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Số dư ban đầu</label>
                <input
                  type="text"
                  value={accBalanceStr ? parseInt(accBalanceStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                  onChange={e => setAccBalanceStr(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Debt/Loan */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {debtType === 'loan' ? 'Ghi Khoản Cho Vay' : 'Ghi Khoản Đi Vay / Nợ'}
              </h3>
              <button onClick={() => setIsDebtModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Người liên quan / Tổ chức</label>
                <input
                  type="text"
                  value={debtPerson}
                  onChange={e => setDebtPerson(e.target.value)}
                  placeholder="VD: Tuấn, Anh Hùng, Thẻ tín dụng..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Số tiền (VND)</label>
                <input
                  type="text"
                  value={debtAmountStr ? parseInt(debtAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                  onChange={e => setDebtAmountStr(e.target.value.replace(/\D/g, ''))}
                  placeholder="1.000.000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Hạn thanh toán</label>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={e => setDebtDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={debtNote}
                  onChange={e => setDebtNote(e.target.value)}
                  placeholder="Lý do vay / mượn..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white font-semibold text-xs rounded-lg shadow-md ${
                    debtType === 'loan' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Lưu bản ghi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment Record */}
      {isPaymentModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {selectedDebt.type === 'loan' ? 'Thu Nợ Từ ' : 'Trả Nợ Cho '} {selectedDebt.person}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Số tiền thanh toán</label>
                <input
                  type="text"
                  value={payAmountStr ? parseInt(payAmountStr.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                  onChange={e => setPayAmountStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-base font-bold"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Còn nợ hiện tại: {selectedDebt.remainingAmount.toLocaleString('vi-VN')}₫
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  Xác nhận thanh toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
