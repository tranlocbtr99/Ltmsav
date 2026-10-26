import release from '../../release.json';
import { Account, Category, Transaction, Budget, DebtOrLoan, AuditLog, AppSettings } from '../types';

const SCHEMA_VERSION = 6;

const STORAGE_KEYS = {
  SCHEMA_VERSION: 'ltmsav_schema_version',
  ACCOUNTS: 'ltmsav_accounts_v1',
  CATEGORIES: 'ltmsav_categories_v1',
  TRANSACTIONS: 'ltmsav_transactions_v1',
  BUDGETS: 'ltmsav_budgets_v1',
  DEBTS: 'ltmsav_debts_v1',
  AUDIT_LOGS: 'ltmsav_audit_logs_v1',
  SETTINGS: 'ltmsav_settings_v1',
  SNAPSHOTS: 'ltmsav_auto_snapshots_v1',
};

// Initial default data seed — empty for new users
const DEFAULT_ACCOUNTS: Account[] = [];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Ăn uống', type: 'expense', iconName: 'Utensils', color: '#F59E0B', isDefault: true },
  { id: 'cat_transport', name: 'Di chuyển', type: 'expense', iconName: 'Car', color: '#3B82F6', isDefault: true },
  { id: 'cat_shopping', name: 'Mua sắm', type: 'expense', iconName: 'ShoppingBag', color: '#EC4899', isDefault: true },
  { id: 'cat_bills', name: 'Hóa đơn & Tiện ích', type: 'expense', iconName: 'FileText', color: '#EF4444', isDefault: true },
  { id: 'cat_housing', name: 'Nhà cửa', type: 'expense', iconName: 'Home', color: '#8B5CF6', isDefault: true },
  { id: 'cat_entertainment', name: 'Giải trí', type: 'expense', iconName: 'Tv', color: '#06B6D4', isDefault: true },
  { id: 'cat_health', name: 'Sức khỏe', type: 'expense', iconName: 'HeartPulse', color: '#10B981', isDefault: true },
  { id: 'cat_education', name: 'Giáo dục', type: 'expense', iconName: 'GraduationCap', color: '#6366F1', isDefault: true },
  { id: 'cat_salary', name: 'Lương', type: 'income', iconName: 'Briefcase', color: '#10B981', isDefault: true },
  { id: 'cat_bonus', name: 'Thưởng', type: 'income', iconName: 'Award', color: '#F59E0B', isDefault: true },
  { id: 'cat_investment', name: 'Đầu tư & Sinh lời', type: 'income', iconName: 'TrendingUp', color: '#06B6D4', isDefault: true },
  { id: 'cat_other_income', name: 'Thu nhập khác', type: 'income', iconName: 'Coins', color: '#8B5CF6', isDefault: true },
];

const DEFAULT_BUDGETS: Budget[] = [];

const DEFAULT_DEBTS: DebtOrLoan[] = [];

const DEFAULT_SETTINGS: AppSettings = {
  currency: '₫',
  allowNegativeBalance: false,
  autoConfirmAi: false,
  securityEnabled: false,
  pinCode: '',
  biometricEnabled: false,
  theme: 'dark',
  autoBackupOnUpdate: true,
  geminiApiKey: '',
  customServerUrl: '',
};

function getInitialTransactions(): Transaction[] {
  return [];
}

class StorageManager {
  constructor() {
    this.recoverPendingWrite();
    this.runDataMigration();
    this.requestPersistentStorage();
  }

  // --- AUTOMATIC DATA PROTECTION & MIGRATION ENGINE ---
  private runDataMigration(): void {
    try {
      const storedVersion = parseInt(localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION) || '1', 10);

      // Check legacy finflow keys and migrate seamlessly without data loss
      const legacyKeys = [
        ['finflow_accounts_v1', STORAGE_KEYS.ACCOUNTS],
        ['finflow_categories_v1', STORAGE_KEYS.CATEGORIES],
        ['finflow_transactions_v1', STORAGE_KEYS.TRANSACTIONS],
        ['finflow_budgets_v1', STORAGE_KEYS.BUDGETS],
        ['finflow_debts_v1', STORAGE_KEYS.DEBTS],
        ['finflow_audit_logs_v1', STORAGE_KEYS.AUDIT_LOGS],
        ['finflow_settings_v1', STORAGE_KEYS.SETTINGS],
      ];

      if (storedVersion < SCHEMA_VERSION && !this.createAutomaticSnapshot('Trước khi cập nhật dữ liệu')) {
        throw new Error('Không thể sao lưu dữ liệu trước khi cập nhật.');
      }

      for (const [oldKey, newKey] of legacyKeys) {
        if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) {
          const oldData = localStorage.getItem(oldKey);
          if (oldData) {
            localStorage.setItem(newKey, oldData);
          }
        }
      }

      // If version is updated, take an automatic safety snapshot first
      if (storedVersion < SCHEMA_VERSION) {


        // Ensure new settings fields don't get lost in migration
        if (storedVersion < 5) {
          try {
            const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (rawSettings) {
              const s = JSON.parse(rawSettings);
              if (!('geminiApiKey' in s)) s.geminiApiKey = '';
              if (!('customServerUrl' in s)) s.customServerUrl = '';
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
            }
          } catch (e) {
            throw e;
          }
        }

        // Historical IDs and PINs may belong to real users. Never remove them.

        localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION.toString());
      }
    } catch (e) {
      console.warn('Migration check error:', e);
    }
  }

  // Request browser not to evict local data even if disk is low
  public async requestPersistentStorage(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          const granted = await navigator.storage.persist();
          console.log('[LTMsav] Storage persistence granted:', granted);
          return granted;
        }
        return true;
      }
    } catch (e) {
      console.warn('Persistent storage request:', e);
    }
    return false;
  }

  // Auto snapshot before any major operation or app upgrade
  public createAutomaticSnapshot(reason: string): boolean {
    try {
      const snapshots = this.getAutoSnapshots();
      const currentData = {
        timestamp: new Date().toISOString(),
        reason,
        // Preserve exact bytes, unknown future fields, legacy keys and PINs.
        raw: Object.fromEntries(Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!)
          .filter(key => key !== STORAGE_KEYS.SNAPSHOTS)
          .map(key => [key, localStorage.getItem(key)])),
        data: {
          accounts: this.getAccounts(),
          transactions: this.getTransactions(),
          categories: this.getCategories(),
          budgets: this.getBudgets(),
          debts: this.getDebtsAndLoans(),
          settings: this.getSettings(),
        }
      };
      snapshots.unshift(currentData);
      // Keep up to 5 automatic snapshots for safety
      if (snapshots.length > 5) snapshots.pop();
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
      return true;
    } catch (e) {
      console.warn('Auto snapshot failed:', e);
      return false;
    }
  }

  public getAutoSnapshots(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      const legacyKey = key.replace('ltmsav_', 'finflow_');
      const legacyData = localStorage.getItem(legacyKey);
      return legacyData ? JSON.parse(legacyData) : structuredClone(defaultValue);
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage:`, e);
      throw new Error(`Không thể đọc dữ liệu ${key}. Hãy khôi phục từ bản sao lưu.`, { cause: e });
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw e;
    }
  }

  private recoverPendingWrite(): void {
    const raw = localStorage.getItem('ltmsav_pending_write');
    if (!raw) return;
    const previous = JSON.parse(raw);
    if (!previous || Array.isArray(previous) || typeof previous !== 'object') throw new Error('Nhật ký dữ liệu không hợp lệ.');
    for (const [key, value] of Object.entries(previous)) {
      if (!(Object.values(STORAGE_KEYS) as string[]).includes(key) || (value !== null && typeof value !== 'string')) {
        throw new Error('Nhật ký dữ liệu không hợp lệ.');
      }
    }
    for (const [key, value] of Object.entries(previous)) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value as string);
    }
    localStorage.removeItem('ltmsav_pending_write');
  }

  private atomicWrite(write: () => void): void {
    this.recoverPendingWrite();
    const previous = Object.fromEntries(Object.values(STORAGE_KEYS)
      .filter(key => key !== STORAGE_KEYS.SNAPSHOTS)
      .map(key => [key, localStorage.getItem(key)]));
    localStorage.setItem('ltmsav_pending_write', JSON.stringify(previous));
    try {
      write();
      localStorage.removeItem('ltmsav_pending_write');
    } catch (error) {
      this.recoverPendingWrite();
      throw error;
    }
  }

  private validateBalances(accounts: Account[]): void {
    const previous = this.getAccounts();
    if (!this.getSettings().allowNegativeBalance && accounts.some(account =>
      account.balance < 0 && account.balance < (previous.find(old => old.id === account.id)?.balance ?? 0))) {
      throw new Error('Số dư không đủ để thực hiện giao dịch.');
    }
  }

  private validateTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>, accounts: Account[]): void {
    if (!['income', 'expense', 'transfer', 'lend', 'debt_repay'].includes(tx.type)
      || !Number.isSafeInteger(tx.amount) || tx.amount <= 0) throw new Error('Giao dịch không hợp lệ.');
    if (!accounts.some(account => account.id === tx.accountId)) throw new Error('Tài khoản nguồn không hợp lệ.');
    if (tx.type === 'transfer' && (tx.accountId === tx.targetAccountId || !accounts.some(account => account.id === tx.targetAccountId))) {
      throw new Error('Tài khoản đích phải khác tài khoản nguồn.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date) || Number.isNaN(Date.parse(tx.date))
      || new Date(tx.date).toISOString().slice(0, 10) !== tx.date) throw new Error('Ngày giao dịch không hợp lệ.');
  }

  // --- Accounts ---
  getAccounts(): Account[] {
    return this.get<Account[]>(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
  }

  saveAccounts(accounts: Account[]): void {
    this.set(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  addAccount(account: Omit<Account, 'id'>): Account {
    const accounts = this.getAccounts();
    const newAccount: Account = {
      ...account,
      id: 'acc_' + crypto.randomUUID(),
    };
    accounts.push(newAccount);
    this.saveAccounts(accounts);
    this.addAuditLog('CREATE', 'ACCOUNT', newAccount.id, `Tạo tài khoản nguồn tiền: ${newAccount.name}`);
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) return null;
    const old = accounts[index];
    accounts[index] = { ...old, ...updates };
    this.saveAccounts(accounts);
    return accounts[index];
  }

  deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === id);
    if (!account) return false;
    const filtered = accounts.filter(a => a.id !== id);
    this.saveAccounts(filtered);
    this.addAuditLog('DELETE', 'ACCOUNT', id, `Xóa tài khoản nguồn tiền: ${account.name}`);
    return true;
  }

  adjustAccountBalance(id: string, newBalance: number, reason: string): boolean {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === id);
    if (!account) return false;
    const oldBalance = account.balance;
    account.balance = newBalance;
    this.saveAccounts(accounts);
    this.addAuditLog('ADJUST_BALANCE', 'ACCOUNT', id, `Điều chỉnh số dư ${account.name} từ ${oldBalance.toLocaleString('vi-VN')}₫ thành ${newBalance.toLocaleString('vi-VN')}₫. Lý do: ${reason}`);
    return true;
  }

  // --- Categories ---
  getCategories(): Category[] {
    return this.get<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  saveCategories(categories: Category[]): void {
    this.set(STORAGE_KEYS.CATEGORIES, categories);
  }

  addCategory(cat: Omit<Category, 'id'>): Category {
    const categories = this.getCategories();
    const newCategory: Category = {
      ...cat,
      id: 'cat_' + Date.now(),
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  }

  deleteCategory(id: string): boolean {
    let categories = this.getCategories();
    categories = categories.filter(c => c.id !== id);
    this.saveCategories(categories);
    return true;
  }

  // --- Transactions ---
  getTransactions(): Transaction[] {
    return this.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, getInitialTransactions());
  }

  saveTransactions(transactions: Transaction[]): void {
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  private applyBalanceChange(accounts: Account[], tx: Transaction, factor: 1 | -1): Account[] {
    const updated = [...accounts];
    const sourceAcc = updated.find(a => a.id === tx.accountId);
    const targetAcc = tx.targetAccountId ? updated.find(a => a.id === tx.targetAccountId) : null;

    if (tx.type === 'expense') {
      if (sourceAcc) sourceAcc.balance -= tx.amount * factor;
    } else if (tx.type === 'income') {
      if (sourceAcc) sourceAcc.balance += tx.amount * factor;
    } else if (tx.type === 'transfer') {
      if (sourceAcc) sourceAcc.balance -= tx.amount * factor;
      if (targetAcc) targetAcc.balance += tx.amount * factor;
    } else if (tx.type === 'lend') {
      if (sourceAcc) sourceAcc.balance -= tx.amount * factor;
    } else if (tx.type === 'debt_repay') {
      if (sourceAcc) sourceAcc.balance -= tx.amount * factor;
    }

    return updated;
  }

  addTransaction(txData: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transactions = this.getTransactions();
    let accounts = this.getAccounts();

    this.validateTransaction(txData, accounts);
    const newTx: Transaction = {
      ...txData,
      id: 'tx_' + crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    accounts = this.applyBalanceChange(accounts, newTx, 1);
    this.validateBalances(accounts);
    transactions.unshift(newTx);
    this.atomicWrite(() => {
      this.saveAccounts(accounts);
      this.saveTransactions(transactions);
    });

    this.addAuditLog('CREATE', 'TRANSACTION', newTx.id, `Ghi giao dịch [${newTx.type}]: ${newTx.description} (${newTx.amount.toLocaleString('vi-VN')}₫)`);
    return newTx;
  }

  editTransaction(id: string, updatedData: Partial<Transaction>): Transaction | null {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    const oldTx = transactions[index];
    let accounts = this.getAccounts();

    accounts = this.applyBalanceChange(accounts, oldTx, -1);

    const newTx: Transaction = {
      ...oldTx,
      ...updatedData,
      id: oldTx.id,
      createdAt: oldTx.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.validateTransaction(newTx, accounts);
    accounts = this.applyBalanceChange(accounts, newTx, 1);
    this.validateBalances(accounts);
    transactions[index] = newTx;
    this.atomicWrite(() => {
      this.saveAccounts(accounts);
      this.saveTransactions(transactions);
    });

    this.addAuditLog(
      'UPDATE',
      'TRANSACTION',
      id,
      `Chỉnh sửa giao dịch "${oldTx.description}" (${oldTx.amount.toLocaleString('vi-VN')}₫) thành "${newTx.description}" (${newTx.amount.toLocaleString('vi-VN')}₫)`
    );

    return newTx;
  }

  deleteTransaction(id: string): boolean {
    const transactions = this.getTransactions();
    const tx = transactions.find(t => t.id === id);
    if (!tx) return false;

    let accounts = this.getAccounts();
    accounts = this.applyBalanceChange(accounts, tx, -1);
    const filtered = transactions.filter(t => t.id !== id);
    this.atomicWrite(() => {
      this.saveAccounts(accounts);
      this.saveTransactions(filtered);
    });

    this.addAuditLog('DELETE', 'TRANSACTION', id, `Xóa giao dịch và đảo số dư: ${tx.description} (${tx.amount.toLocaleString('vi-VN')}₫)`);
    return true;
  }

  // --- Budgets ---
  getBudgets(): Budget[] {
    return this.get<Budget[]>(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
  }

  saveBudgets(budgets: Budget[]): void {
    this.set(STORAGE_KEYS.BUDGETS, budgets);
  }

  setBudget(categoryId: string, monthlyLimit: number): Budget {
    const budgets = this.getBudgets();
    const existing = budgets.find(b => b.categoryId === categoryId);
    if (existing) {
      existing.monthlyLimit = monthlyLimit;
      this.saveBudgets(budgets);
      return existing;
    } else {
      const newBudget: Budget = {
        id: 'b_' + Date.now(),
        categoryId,
        monthlyLimit,
      };
      budgets.push(newBudget);
      this.saveBudgets(budgets);
      return newBudget;
    }
  }

  deleteBudget(id: string): void {
    const budgets = this.getBudgets().filter(b => b.id !== id);
    this.saveBudgets(budgets);
  }

  // --- Debts & Loans ---
  getDebtsAndLoans(): DebtOrLoan[] {
    return this.get<DebtOrLoan[]>(STORAGE_KEYS.DEBTS, DEFAULT_DEBTS);
  }

  saveDebtsAndLoans(items: DebtOrLoan[]): void {
    this.set(STORAGE_KEYS.DEBTS, items);
  }

  addDebtOrLoan(item: Omit<DebtOrLoan, 'id' | 'createdAt' | 'status' | 'remainingAmount'>): DebtOrLoan {
    const items = this.getDebtsAndLoans();
    const newItem: DebtOrLoan = {
      ...item,
      id: (item.type === 'loan' ? 'loan_' : 'debt_') + Date.now(),
      remainingAmount: item.amount,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    this.saveDebtsAndLoans(items);
    return newItem;
  }

  recordDebtPayment(id: string, paymentAmount: number): boolean {
    const items = this.getDebtsAndLoans();
    const item = items.find(i => i.id === id);
    if (!item) return false;

    item.remainingAmount = Math.max(0, item.remainingAmount - paymentAmount);
    if (item.remainingAmount === 0) {
      item.status = 'settled';
    }
    this.saveDebtsAndLoans(items);
    this.addAuditLog('UPDATE', 'ACCOUNT', id, `Thanh toán ${item.type === 'loan' ? 'thu nợ từ' : 'trả nợ cho'} ${item.person}: ${paymentAmount.toLocaleString('vi-VN')}₫`);
    return true;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  addAuditLog(action: AuditLog['action'], targetType: AuditLog['targetType'], targetId: string, summary: string, details?: Record<string, any>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      targetType,
      targetId,
      summary,
      details,
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // --- Settings with Merging (Prevents data loss on new versions) ---
  getSettings(): AppSettings {
    const saved = this.get<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, {});
    return { ...DEFAULT_SETTINGS, ...saved };
  }

  saveSettings(settings: AppSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // --- Backup & Restore ---
  exportBackup(): string {
    const payload = {
      version: release.versionName,
      app: 'LTMsav',
      exportedAt: new Date().toISOString(),
      data: {
        accounts: this.getAccounts(),
        categories: this.getCategories(),
        transactions: this.getTransactions(),
        budgets: this.getBudgets(),
        debts: this.getDebtsAndLoans(),
        settings: this.getSettings(),
        auditLogs: this.getAuditLogs(),
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  importBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !parsed.data.accounts || !parsed.data.transactions) {
        return { success: false, message: 'Tệp sao lưu không đúng định dạng LTMsav.' };
      }
      for (const key of ['accounts', 'transactions', 'categories', 'budgets', 'debts', 'auditLogs']) {
        if (key in parsed.data && !Array.isArray(parsed.data[key])) throw new Error('Dữ liệu phải là danh sách: ' + key);
      }
      if (!this.createAutomaticSnapshot('Sao lưu tự động trước khi khôi phục tệp JSON')) {
        throw new Error('Không thể tạo bản sao an toàn.');
      }
      this.atomicWrite(() => {
      this.saveAccounts(parsed.data.accounts);
      if (parsed.data.categories) this.saveCategories(parsed.data.categories);
      this.saveTransactions(parsed.data.transactions);
      if (parsed.data.budgets) this.saveBudgets(parsed.data.budgets);
      if (parsed.data.debts) this.saveDebtsAndLoans(parsed.data.debts);
      if (parsed.data.settings) this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.data.settings });
      if (parsed.data.auditLogs) this.set(STORAGE_KEYS.AUDIT_LOGS, parsed.data.auditLogs);
      });
      return { success: true, message: 'Khôi phục toàn bộ dữ liệu thành công!' };
    } catch (e: any) {
      return { success: false, message: 'Lỗi đọc tệp JSON: ' + (e?.message || 'Tệp không hợp lệ') };
    }
  }

  resetToDefault(): void {
    this.createAutomaticSnapshot('Sao lưu tự động trước khi đặt lại mặc định');
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.DEBTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }

  // Permanently delete every trace of local data (account erasure, GDPR-style)
  public async deleteAccountAndAllData(): Promise<boolean> {
    try {
      await this.clearCachesAndServiceWorkers();
    } catch (e) {
      console.warn('Cache clearing failed:', e);
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.SCHEMA_VERSION);
      localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.BUDGETS);
      localStorage.removeItem(STORAGE_KEYS.DEBTS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);

      const legacyKeys = [
        'finflow_accounts_v1', 'finflow_categories_v1', 'finflow_transactions_v1',
        'finflow_budgets_v1', 'finflow_debts_v1', 'finflow_audit_logs_v1', 'finflow_settings_v1'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));

      try {
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
          await navigator.storage.persisted();
        }
        localStorage.clear();
      } catch (_) {}

      return true;
    } catch (e) {
      console.error('Account deletion failed:', e);
      return false;
    }
  }

  private async clearCachesAndServiceWorkers(): Promise<void> {
    if (typeof window === 'undefined') return;
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }
  }
}

export const storage = new StorageManager();
