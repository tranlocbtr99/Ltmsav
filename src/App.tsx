import { CategoryManager } from './components/CategoryManager';
import { ConfirmationHost } from './components/Confirmation';
import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { Account, Category, Transaction, Budget, DebtOrLoan, AuditLog, AppSettings, RecurringRule } from './types';
import { TopHeader, BottomNavBar } from './components/Navigation';
import { useLanguage } from './contexts/LanguageContext';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { AiChatTab } from './components/AiChatTab';
import { BudgetsTab } from './components/BudgetsTab';
import { AssetsTab } from './components/AssetsTab';
import { ReportsTab } from './components/ReportsTab';
import { RecurringTab } from './components/RecurringTab';
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
  const [visitedTabs,setVisitedTabs] = useState<string[]>(['overview']);
  useEffect(()=>{setVisitedTabs(prev=>prev.includes(currentTab)?prev:[...prev,currentTab]);},[currentTab]);
  const [historyAccountId, setHistoryAccountId] = useState<string | undefined>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<DebtOrLoan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [showSplash, setShowSplash] = useState(true);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);

  // Presentation preference only; financial records and settings are untouched.
  const [assetsHidden, setAssetsHidden] = useState(() => {
    try { return localStorage.getItem('ltmsav_assets_hidden') === 'true'; }
    catch { return true; }
  });
  const toggleAssetsVisibility = () => {
    const next = !assetsHidden;
    setAssetsHidden(next);
    try { localStorage.setItem('ltmsav_assets_hidden', String(next)); }
    catch { /* Keep the toggle usable when device storage is unavailable. */ }
  };

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
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#0b1019' : '#f5f6f8');
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // Load data from storage
  const reloadData = () => {
    setAccounts(storage.getAccounts());
    setCategories(storage.getCategories());
    setRecurringRules(storage.getRecurringRules());
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
    const newTheme: 'dark' | 'light' = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    const updated: AppSettings = { ...settings, theme: newTheme };
    storage.saveSettings(updated);
    setSettings(updated);
    showToast(`${t('themeSwitched')} ${newTheme === 'dark' ? t('dark') : t('light')}`);
  };

  const categoryActions = {
    onCreateCategory: (category: Omit<Category,'id'>) => { const created=storage.addCategory(category); reloadData(); return created; },
    onUpdateCategory: (id: string, name: string) => { storage.updateCategory(id,name); reloadData(); },
    onDeleteCategory: (id: string) => { storage.deleteCategory(id); reloadData(); },
  };
  const handleSaveRecurring = (rules: RecurringRule[]) => { storage.saveRecurringRules(rules); setRecurringRules(rules); };

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

  const handleEditAccount = (id: string, updates: Pick<Account, 'name' | 'type' | 'iconName' | 'color'>) => {
    const account = storage.updateAccount(id, updates);
    if (!account) return;
    reloadData();
    showToast(t('toastAccountEdited'));
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
    <div className="silver-app min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#090d16] text-slate-900 dark:text-slate-50 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top App Bar with theme toggle */}
      <TopHeader
        currentTab={currentTab}
        isOnline={isOnline}
        onNavigateTab={(tab) => { setHistoryAccountId(undefined); setCurrentTab(tab); }}
        securityEnabled={settings.securityEnabled}
        onLockApp={() => setIsLocked(true)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="finance-main flex-1 w-full max-w-3xl mx-auto px-4">
        
        <div key={currentTab} className="silver-page-heading motion-heading"><h1>{t(currentTab === 'overview' ? 'overview' : currentTab === 'ai' ? 'assistantTitle' : currentTab === 'assets' ? 'assetsNav' : currentTab === 'budgets' || currentTab === 'recurring' ? 'planNav' : currentTab === 'settings' ? 'profileNav' : currentTab === 'reports' ? 'reports' : 'transactions')}</h1></div>
        {(currentTab === 'budgets' || currentTab === 'recurring') && <div className="silver-segments silver-plan-tabs" role="group" aria-label={t('planNav')}>
          <button type="button" aria-pressed={currentTab === 'budgets'} onClick={()=>setCurrentTab('budgets')}>{t('budget')}</button>
          <button type="button" aria-pressed={currentTab === 'recurring'} onClick={()=>setCurrentTab('recurring')}>{t('recurringTitle')}</button>
        </div>}
        {/* Tab views */}
        <div className="animate-fade-in">
          <section className="motion-tab" hidden={currentTab !== 'overview'}>{(currentTab === 'overview' || visitedTabs.includes('overview')) && (
            <OverviewTab
              assetsHidden={assetsHidden}
              onToggleAssetsVisibility={toggleAssetsVisibility}
              accounts={accounts}
              transactions={transactions}
              categories={categories}
              budgets={budgets}
              debts={debts}
              onOpenAdd={() => setIsAddModalOpen(true)}
              onOpenAi={() => setCurrentTab('ai')}
              onSelectTransaction={(tx) => setSelectedTxForEdit(tx)}
              onNavigateTab={(tab) => { setHistoryAccountId(undefined); setCurrentTab(tab); }}
            />
          )}</section>

          <section className="motion-tab" hidden={currentTab !== 'transactions'}>{(currentTab === 'transactions' || visitedTabs.includes('transactions')) && (
            <TransactionsTab
              initialAccountId={historyAccountId}
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              onSelectTransaction={(tx) => setSelectedTxForEdit(tx)}
              onOpenAdd={() => setIsAddModalOpen(true)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}</section>

          <section className="motion-tab" hidden={currentTab !== 'ai'}>{(currentTab === 'ai' || visitedTabs.includes('ai')) && (
            <AiChatTab
              accounts={accounts}
              categories={categories}
              settings={settings}
              onAddTransaction={handleAddTransaction}
              onNavigateTab={(tab) => { setHistoryAccountId(undefined); setCurrentTab(tab); }}
            />
          )}</section>

          <section className="motion-tab" hidden={currentTab !== 'budgets'}>{(currentTab === 'budgets' || visitedTabs.includes('budgets')) && (
            <BudgetsTab
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              onSetBudget={handleSetBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          )}</section>

          <section className="motion-tab" hidden={currentTab !== 'assets'}>{(currentTab === 'assets' || visitedTabs.includes('assets')) && (
            <AssetsTab
              onViewAccount={(id) => { setHistoryAccountId(id); setCurrentTab('transactions'); }}
              accounts={accounts}
              debts={debts}
              onEditAccount={handleEditAccount}
              onAddAccount={handleAddAccount}
              onAdjustBalance={handleAdjustBalance}
              onAddDebtOrLoan={handleAddDebtOrLoan}
              onRecordPayment={handleRecordPayment}
              onDeleteAccount={handleDeleteAccountSource}
            />
          )}</section>

          <section className="motion-tab" hidden={currentTab !== 'recurring'}>{(currentTab === 'recurring' || visitedTabs.includes('recurring')) && (
            <RecurringTab accounts={accounts} categories={categories} transactions={transactions} rules={recurringRules} onSaveRules={handleSaveRecurring} onAdd={handleAddTransaction} {...categoryActions} />
          )}</section>

          <section className="motion-tab" hidden={currentTab !== 'reports'}>{(currentTab === 'reports' || visitedTabs.includes('reports')) && (
            <ReportsTab
              transactions={transactions}
              categories={categories}
              accounts={accounts}
            />
          )}</section>

          <section className="motion-tab" hidden={currentTab !== 'settings'}>{(currentTab === 'settings' || visitedTabs.includes('settings')) && (
            <>
            <div className="silver-profile-card"><img src="/logo.png" alt="LTMsav"/><div><strong>LTMsav</strong><p>{t('appSubtitle')}</p></div></div>
            <details className="silver-settings-section silver-category-settings"><summary><span>{t('categoryManagerTitle')}</span><span aria-hidden="true">›</span></summary><CategoryManager categories={categories} {...categoryActions}/></details>
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
            </>
          )}</section>
        </div>
      </main>

      {/* Android Bottom Navigation */}
      <BottomNavBar
        currentTab={currentTab === 'recurring' ? 'budgets' : currentTab === 'reports' ? 'overview' : currentTab}
        onTabChange={(tab) => { setHistoryAccountId(undefined); setCurrentTab(tab); }}
        onOpenAdd={() => setCurrentTab('ai')}
        isOnline={isOnline}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        {...categoryActions}
        accounts={accounts}
        categories={categories}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTransaction}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        {...categoryActions}
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
        <div className="fixed bottom-0 left-0 right-0 z-[60] px-3 sm:px-4 pb-[var(--finance-nav-space)] pointer-events-none flex justify-center animate-fade-in-up">
          <div role="status" className="silver-toast w-full max-w-3xl flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-emerald-500/40 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1 min-w-0">{toastMessage}</span>
          </div>
        </div>
      )}

      <ConfirmationHost/>
    </div>
  );
};
