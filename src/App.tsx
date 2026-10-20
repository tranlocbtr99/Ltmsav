import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { Account, Category, Transaction, Budget, DebtOrLoan, AuditLog, AppSettings } from './types';
import { TopHeader, BottomNavBar } from './components/Navigation';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { AiChatTab } from './components/AiChatTab';
import { BudgetsTab } from './components/BudgetsTab';
import { AssetsTab } from './components/AssetsTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { EditTransactionModal } from './components/EditTransactionModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SecurityLockScreen } from './components/SecurityLockScreen';
import { useOnlineStatus } from './hooks/usePWA';
import { BarChart3, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const isOnline = useOnlineStatus();

  // Storage data state
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<DebtOrLoan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());

  // Security Lock Screen State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const s = storage.getSettings();
    return !!s.securityEnabled;
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync theme with document element
  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#090d16');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }
  }, [settings.theme]);

  // Load data from storage
  const reloadData = () => {
    setAccounts(storage.getAccounts());
    setCategories(storage.getCategories());
    setTransactions(storage.getTransactions());
    setBudgets(storage.getBudgets());
    setDebts(storage.getDebtsAndLoans());
    setAuditLogs(storage.getAuditLogs());
    const s = storage.getSettings();
    setSettings(s);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Handlers
  const handleToggleTheme = () => {
    const newTheme: 'dark' | 'light' = settings.theme === 'dark' ? 'light' : 'dark';
    const updated: AppSettings = { ...settings, theme: newTheme };
    storage.saveSettings(updated);
    setSettings(updated);
    showToast(`Đã chuyển sang giao diện ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`);
  };

  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = storage.addTransaction(txData);
    reloadData();
    showToast(`Đã thêm giao dịch: ${created.description}`);
  };

  const handleEditTransaction = (id: string, updated: Partial<Transaction>) => {
    const res = storage.editTransaction(id, updated);
    if (res) {
      reloadData();
      showToast('Đã lưu chỉnh sửa giao dịch & cập nhật số dư!');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const success = storage.deleteTransaction(id);
    if (success) {
      reloadData();
      showToast('Đã xóa giao dịch và đảo số dư an toàn!');
    }
  };

  const handleSetBudget = (categoryId: string, limit: number) => {
    storage.setBudget(categoryId, limit);
    reloadData();
    showToast('Đã cập nhật hạn mức ngân sách!');
  };

  const handleDeleteBudget = (id: string) => {
    storage.deleteBudget(id);
    reloadData();
    showToast('Đã xóa hạn mức ngân sách.');
  };

  const handleAddAccount = (acc: Omit<Account, 'id'>) => {
    storage.addAccount(acc);
    reloadData();
    showToast(`Đã thêm nguồn tiền: ${acc.name}`);
  };

  const handleAdjustBalance = (id: string, newBalance: number, reason: string) => {
    storage.adjustAccountBalance(id, newBalance, reason);
    reloadData();
    showToast('Đã điều chỉnh số dư tài khoản!');
  };

  const handleAddDebtOrLoan = (item: Omit<DebtOrLoan, 'id' | 'createdAt' | 'status' | 'remainingAmount'>) => {
    storage.addDebtOrLoan(item);
    reloadData();
    showToast(`Đã ghi sổ: ${item.person}`);
  };

  const handleRecordPayment = (id: string, amount: number) => {
    storage.recordDebtPayment(id, amount);
    reloadData();
    showToast('Đã ghi nhận thanh toán thành công!');
  };

  const handleExportBackup = () => {
    const json = storage.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LTMsav_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file sao lưu JSON an toàn!');
  };

  const handleImportBackup = (json: string) => {
    const res = storage.importBackup(json);
    if (res.success) {
      reloadData();
      showToast(res.message);
    }
    return res;
  };

  const handleResetData = () => {
    storage.resetToDefault();
    reloadData();
    showToast('Đã khôi phục dữ liệu ban đầu!');
  };

  // If application is locked with PIN / Biometrics
  if (isLocked) {
    return (
      <SecurityLockScreen
        correctPin={settings.pinCode || '1234'}
        biometricEnabled={settings.biometricEnabled}
        onUnlock={() => {
          setIsLocked(false);
          showToast('Mở khóa thành công!');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top App Bar with theme toggle */}
      <TopHeader
        onOpenAdd={() => setIsAddModalOpen(true)}
        isOnline={isOnline}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        securityEnabled={settings.securityEnabled}
        onLockApp={() => setIsLocked(true)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-3 sm:p-4 pb-20">
        
        {/* Floating Reports Shortcut pill */}
        {(currentTab === 'overview' || currentTab === 'transactions') && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setCurrentTab('reports')}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-full transition shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Xem Báo Cáo Chi Tiêu & Biểu Đồ</span>
            </button>
          </div>
        )}

        {/* Tab views */}
        {currentTab === 'overview' && (
          <OverviewTab
            accounts={accounts}
            transactions={transactions}
            categories={categories}
            budgets={budgets}
            debts={debts}
            onOpenAdd={() => setIsAddModalOpen(true)}
            onOpenAi={() => setCurrentTab('ai')}
            onSelectTransaction={(tx) => setSelectedTxForEdit(tx)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onSelectTransaction={(tx) => setSelectedTxForEdit(tx)}
            onOpenAdd={() => setIsAddModalOpen(true)}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {currentTab === 'ai' && (
          <AiChatTab
            accounts={accounts}
            categories={categories}
            settings={settings}
            onAddTransaction={handleAddTransaction}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'budgets' && (
          <BudgetsTab
            budgets={budgets}
            categories={categories}
            transactions={transactions}
            onSetBudget={handleSetBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        )}

        {currentTab === 'assets' && (
          <AssetsTab
            accounts={accounts}
            debts={debts}
            onAddAccount={handleAddAccount}
            onAdjustBalance={handleAdjustBalance}
            onAddDebtOrLoan={handleAddDebtOrLoan}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsTab
            transactions={transactions}
            categories={categories}
            accounts={accounts}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsTab
            settings={settings}
            auditLogs={auditLogs}
            onUpdateSettings={(s) => {
              storage.saveSettings(s);
              setSettings(s);
              showToast('Đã lưu cấu hình cài đặt.');
            }}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetData={handleResetData}
            onLockAppNow={() => setIsLocked(true)}
          />
        )}
      </main>

      {/* Android Bottom Navigation */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenAdd={() => setIsAddModalOpen(true)}
        isOnline={isOnline}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        accounts={accounts}
        categories={categories}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTransaction}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={selectedTxForEdit}
        accounts={accounts}
        categories={categories}
        isOpen={!!selectedTxForEdit}
        onClose={() => setSelectedTxForEdit(null)}
        onSave={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-emerald-500/40 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
