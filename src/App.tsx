import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { Account, Category, Transaction, Budget, DebtOrLoan, AuditLog, AppSettings } from './types';
import { TopHeader, BottomNavBar } from './components/Navigation';
import { useLanguage } from './contexts/LanguageContext';
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
import { SplashScreen } from './components/SplashScreen';
import { useOnlineStatus } from './hooks/usePWA';
import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const { t } = useLanguage();
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
  const [showSplash, setShowSplash] = useState(true);

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
    showToast(`${t('themeSwitched')} ${newTheme === 'dark' ? t('dark') : t('light')}`);
  };

  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = storage.addTransaction(txData);
    reloadData();
    showToast(`${t('toastTxAdded')}: ${created.description}`);
  };

  const handleEditTransaction = (id: string, updated: Partial<Transaction>) => {
    const res = storage.editTransaction(id, updated);
    if (res) {
      reloadData();
      showToast(t('toastTxEdited'));
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const success = storage.deleteTransaction(id);
    if (success) {
      reloadData();
      showToast(t('toastTxDeleted'));
    }
  };

  const handleSetBudget = (categoryId: string, limit: number) => {
    storage.setBudget(categoryId, limit);
    reloadData();
    showToast(t('toastBudgetUpdated'));
  };

  const handleDeleteBudget = (id: string) => {
    storage.deleteBudget(id);
    reloadData();
    showToast(t('toastBudgetDeleted'));
  };

  const handleAddAccount = (acc: Omit<Account, 'id'>) => {
    storage.addAccount(acc);
    reloadData();
    showToast(`${t('toastAccountAdded')}: ${acc.name}`);
  };

  const handleAdjustBalance = (id: string, newBalance: number, reason: string) => {
    storage.adjustAccountBalance(id, newBalance, reason);
    reloadData();
    showToast(t('toastBalanceAdjusted'));
  };

  const handleDeleteAccountSource = (id: string) => {
    const res = storage.deleteAccount(id);
    if (res) {
      reloadData();
      showToast(t('toastAccountDeleted'));
    }
  };

  const handleAddDebtOrLoan = (item: Omit<DebtOrLoan, 'id' | 'createdAt' | 'status' | 'remainingAmount'>) => {
    storage.addDebtOrLoan(item);
    reloadData();
    showToast(`${t('toastRecorded')}: ${item.person}`);
  };

  const handleRecordPayment = (id: string, amount: number) => {
    storage.recordDebtPayment(id, amount);
    reloadData();
    showToast(t('toastPaymentSuccess'));
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
    showToast(t('toastBackupExported'));
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
    showToast(t('toastDataRestored'));
  };

  // If application is locked with PIN / Biometrics
  if (isLocked) {
    return (
      <SecurityLockScreen
        correctPin={settings.pinCode || '1234'}
        biometricEnabled={settings.biometricEnabled}
        onUnlock={() => {
          setIsLocked(false);
          showToast(t('toastUnlocked'));
        }}
      />
    );
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#090d16] text-slate-900 dark:text-slate-50 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top App Bar with theme toggle */}
      <TopHeader
        isOnline={isOnline}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        securityEnabled={settings.securityEnabled}
        onLockApp={() => setIsLocked(true)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">
        
        {/* Tab views */}
        <div key={currentTab} className="animate-fade-in">
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
              onDeleteAccount={handleDeleteAccountSource}
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
                showToast(t('toastSettingsSaved'));
              }}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetData={handleResetData}
              onLockAppNow={() => setIsLocked(true)}
            />
          )}
        </div>
      </main>

      {/* Android Bottom Navigation */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenAdd={() => setCurrentTab('ai')}
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

      {/* Notification Toast — appears in the current view, just above the bottom nav */}
      {toastMessage && (
        <div className="fixed left-0 right-0 z-[60] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom,0px)+84px)] pointer-events-none flex justify-center animate-fade-in-up">
          <div className="w-full max-w-3xl flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-emerald-500/40 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1 min-w-0">{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
};
