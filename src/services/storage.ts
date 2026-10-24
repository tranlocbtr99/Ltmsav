import { localDate } from './date';
import { monthlyDate, followingMonth, nextOnOrAfter } from './recurrence';
import release from '../release.json';
import { Account, Category, Transaction, Budget, DebtOrLoan, AuditLog, AppSettings, RecurringTransaction, RecurringInput } from '../types';

const SCHEMA_VERSION = 8;

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
  RECURRING: 'ltmsav_recurring_v1',
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
        this.createAutomaticSnapshot(`Cập nhật ứng dụng lên phiên bản v${SCHEMA_VERSION}`);

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
            console.warn('Failed to patch settings during migration:', e);
          }
        }

        if (storedVersion < 7 && localStorage.getItem(STORAGE_KEYS.RECURRING) === null) this.set(STORAGE_KEYS.RECURRING, []);

        // Preserve all historical IDs and PINs. Demo IDs may contain real user data.

        localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION.toString());
      }
    } catch (e) {
      console.warn('Migration paused; existing data preserved:', e);
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
  public createAutomaticSnapshot(reason: string): void {
    try {
      const snapshots = this.getAutoSnapshots();
      const currentData = {
        timestamp: new Date().toISOString(),
        reason,
        data: {
          accounts: this.getAccounts(),
          transactions: this.getTransactions(),
          categories: this.getCategories(),
          budgets: this.getBudgets(),
          debts: this.getDebtsAndLoans(),
          settings: this.getSettings(),
          auditLogs: this.getAuditLogs(),
          recurringTransactions: this.getRecurringTransactions(),
        }
      };
      snapshots.unshift(currentData);
      // Keep up to 5 automatic snapshots for safety
      if (snapshots.length > 5) snapshots.pop();
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
    } catch (e) {
      throw new Error('Không thể tạo bản sao an toàn. Thao tác đã dừng để bảo vệ dữ liệu.');
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
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw new Error('Không thể lưu dữ liệu. Bộ nhớ có thể đã đầy; hãy xuất bản sao lưu.');
    }
  }

  private recoverPendingWrite(): void {
    const raw = localStorage.getItem('ltmsav_pending_write');
    if (!raw) return;
    const previous = JSON.parse(raw) as Record<string, string | null>;
    for (const [key, value] of Object.entries(previous)) {
      if (!Object.values(STORAGE_KEYS).includes(key)) throw new Error('Nhật ký dữ liệu không hợp lệ.');
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
    localStorage.removeItem('ltmsav_pending_write');
  }

  private atomicWrite(action: () => void): void {
    this.recoverPendingWrite();
    const previous = Object.fromEntries(Object.values(STORAGE_KEYS).filter(key => key !== STORAGE_KEYS.SNAPSHOTS).map(key => [key, localStorage.getItem(key)]));
    localStorage.setItem('ltmsav_pending_write', JSON.stringify(previous));
    try {
      action();
      localStorage.removeItem('ltmsav_pending_write');
    } catch (error) {
      this.recoverPendingWrite();
      throw error;
    }
  }

  private validateTransaction(tx: Transaction, accounts: Account[]): void {
    if (!['income', 'expense', 'transfer', 'lend', 'debt_repay'].includes(tx.type)) throw new Error('Loại giao dịch không hợp lệ.');
    if (!Number.isSafeInteger(tx.amount) || tx.amount <= 0) throw new Error('Số tiền phải là số nguyên dương hợp lệ.');
    if (!accounts.some(a => a.id === tx.accountId)) throw new Error('Hãy chọn tài khoản nguồn hợp lệ.');
    if (tx.type === 'transfer' && (tx.accountId === tx.targetAccountId || !accounts.some(a => a.id === tx.targetAccountId))) throw new Error('Hãy chọn tài khoản đích khác tài khoản nguồn.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date) || Number.isNaN(Date.parse(tx.date)) || new Date(tx.date).toISOString().slice(0, 10) !== tx.date) throw new Error('Ngày giao dịch không hợp lệ.');
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
    if (this.getRecurringTransactions().some(rule => rule.accountId === id)) throw new Error('Tài khoản đang được dùng trong lịch định kỳ. Hãy xóa hoặc đổi lịch trước.');
    if (this.getTransactions().some(t => t.accountId === id || t.targetAccountId === id) || this.getDebtsAndLoans().some(d => d.accountId === id)) throw new Error('Tài khoản có lịch sử giao dịch hoặc công nợ. Hãy giữ lại để bảo toàn sổ sách.');
    const filtered = accounts.filter(a => a.id !== id);
    this.saveAccounts(filtered);
    this.addAuditLog('DELETE', 'ACCOUNT', id, `Xóa tài khoản nguồn tiền: ${account.name}`);
    return true;
  }

  adjustAccountBalance(id: string, newBalance: number, reason: string): boolean {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === id);
    if (!account) return false;
    if (!Number.isSafeInteger(newBalance)) throw new Error('Số dư không hợp lệ.');
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
      id: 'cat_' + crypto.randomUUID(),
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  }

  deleteCategory(id: string): boolean {
    if (this.getRecurringTransactions().some(rule => rule.categoryId === id)) throw new Error('Danh mục đang được dùng trong lịch định kỳ.');
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
    const updated = accounts.map(account => ({ ...account }));
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

    const newTx: Transaction = {
      ...txData,
      id: 'tx_' + crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.validateTransaction(newTx, accounts);
    accounts = this.applyBalanceChange(accounts, newTx, 1);
    if (!this.getSettings().allowNegativeBalance && accounts.some(a => a.balance < 0 && a.balance < (this.getAccounts().find(old => old.id === a.id)?.balance ?? 0))) throw new Error('Số dư không đủ để thực hiện giao dịch.');
    transactions.unshift(newTx);
    this.atomicWrite(() => { this.saveAccounts(accounts); this.saveTransactions(transactions); });

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
    if (!this.getSettings().allowNegativeBalance && accounts.some(a => a.balance < 0 && a.balance < (this.getAccounts().find(old => old.id === a.id)?.balance ?? 0))) throw new Error('Số dư không đủ để sửa giao dịch.');
    transactions[index] = newTx;
    this.atomicWrite(() => { this.saveAccounts(accounts); this.saveTransactions(transactions); });

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
    this.atomicWrite(() => { this.saveAccounts(accounts); this.saveTransactions(filtered); });

    this.addAuditLog('DELETE', 'TRANSACTION', id, `Xóa giao dịch và đảo số dư: ${tx.description} (${tx.amount.toLocaleString('vi-VN')}₫)`);
    return true;
  }

  /** Undo only the exact newly-created record; never overwrite intervening edits. */
  undoCreatedTransaction(expected: Transaction): boolean {
    const current = this.getTransactions().find(tx => tx.id === expected.id);
    if (!current || JSON.stringify(current) !== JSON.stringify(expected) || current.recurringRuleId) throw new Error('UNDO_CHANGED');
    const before=this.getAccounts();
    const after=this.applyBalanceChange(before,current,-1);
    if(!this.getSettings().allowNegativeBalance && after.some(a=>a.balance<0 && a.balance<(before.find(b=>b.id===a.id)?.balance??0))) throw new Error('UNDO_SPENT');
    this.atomicWrite(()=>{this.saveAccounts(after);this.saveTransactions(this.getTransactions().filter(tx=>tx.id!==current.id));this.addAuditLog('DELETE','TRANSACTION',current.id,`Hoàn tác giao dịch: ${current.description}`);});
    return true;
  }

  // --- Monthly recurrence: definition, posting and cursor commit together ---
  getRecurringTransactions(): RecurringTransaction[] {
    return this.get<RecurringTransaction[]>(STORAGE_KEYS.RECURRING, []);
  }

  private validateRecurringRule(rule: RecurringTransaction): void {
    if (!rule || typeof rule.id !== 'string' || !rule.id || !['income', 'expense'].includes(rule.type) || !Number.isSafeInteger(rule.amount) || rule.amount <= 0 || typeof rule.accountId !== 'string' || typeof rule.categoryId !== 'string' || typeof rule.description !== 'string' || !rule.description.trim() || typeof rule.enabled !== 'boolean') throw new Error('Lịch giao dịch định kỳ không hợp lệ.');
    if (typeof rule.nextDueDate !== 'string' || monthlyDate(rule.nextDueDate.slice(0, 7), rule.dayOfMonth) !== rule.nextDueDate) throw new Error('Ngày đến hạn không hợp lệ.');
    if (rule.lastProcessedMonth !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(rule.lastProcessedMonth)) throw new Error('Kỳ đã xử lý không hợp lệ.');
  }

  upsertRecurringTransaction(input: RecurringInput, id?: string, today = localDate()): RecurringTransaction {
    if (Number(localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION) || 1) < 7) throw new Error('Chưa thể nâng cấp dữ liệu an toàn. Hãy giải phóng bộ nhớ và mở lại ứng dụng.');
    const rules = this.getRecurringTransactions();
    const existing = id ? rules.find(rule => rule.id === id) : undefined;
    if (id && !existing) throw new Error('Không tìm thấy lịch định kỳ.');
    const rule: RecurringTransaction = { ...input, description: input.description.trim(), id: existing?.id ?? 'rec_' + crypto.randomUUID(), lastProcessedMonth: existing?.lastProcessedMonth };
    this.validateRecurringRule(rule);
    if (rule.nextDueDate < today) throw new Error('Hãy chọn kỳ bắt đầu từ hôm nay trở đi.');
    if (!this.getAccounts().some(a => a.id === rule.accountId) || !this.getCategories().some(c => c.id === rule.categoryId && c.type === rule.type)) throw new Error('Tài khoản hoặc danh mục không phù hợp.');
    if (existing) rules[rules.findIndex(r => r.id === id)] = rule;
    else rules.push(rule);
    this.set(STORAGE_KEYS.RECURRING, rules);
    return rule;
  }

  toggleRecurringTransaction(id: string, today = localDate()): void {
    const rules = this.getRecurringTransactions();
    const rule = rules.find(rule => rule.id === id);
    if (!rule) throw new Error('Không tìm thấy lịch định kỳ.');
    rule.enabled = !rule.enabled;
    // Paused months are intentionally skipped, not charged in a lump when resumed.
    if (rule.enabled) rule.nextDueDate = nextOnOrAfter(today > rule.nextDueDate ? today : rule.nextDueDate, rule.dayOfMonth);
    this.set(STORAGE_KEYS.RECURRING, rules);
  }

  deleteRecurringTransaction(id: string): void {
    this.set(STORAGE_KEYS.RECURRING, this.getRecurringTransactions().filter(rule => rule.id !== id));
  }

  async processRecurringWithLock(today = localDate()): Promise<{ created: number; pending: number }> {
    const run = () => this.processRecurringTransactions(today);
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('ltmsav-recurring-posting', run);
    return run();
  }

  processRecurringTransactions(today = localDate()): { created: number; pending: number } {
    let created = 0, pending = 0;
    if (Number(localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION) || 1) < 7) return {created, pending};
    const ruleIds = this.getRecurringTransactions().filter(rule => rule.enabled).sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate) || (a.type === b.type ? a.id.localeCompare(b.id) : a.type === 'income' ? -1 : 1)).map(rule => rule.id);
    for (const id of ruleIds) {
      for (let iteration = 0; iteration < 120; iteration++) {
        const rules = this.getRecurringTransactions();
        const rule = rules.find(item => item.id === id);
        if (!rule || !rule.enabled || rule.nextDueDate > today) break;
        this.validateRecurringRule(rule);
        const month = rule.nextDueDate.slice(0, 7);
        const txId = `tx_recurring_${rule.id}_${month}`;
        const transactions = this.getTransactions();
        if ((rule.lastProcessedMonth && month <= rule.lastProcessedMonth) || transactions.some(tx => tx.id === txId || (tx.recurringRuleId === rule.id && tx.recurringMonth === month))) {
          rule.lastProcessedMonth = rule.lastProcessedMonth && rule.lastProcessedMonth > month ? rule.lastProcessedMonth : month;
          rule.nextDueDate = followingMonth(rule.nextDueDate, rule.dayOfMonth);
          this.set(STORAGE_KEYS.RECURRING, rules);
          continue;
        }
        const accounts = this.getAccounts();
        const account = accounts.find(a => a.id === rule.accountId);
        if (!account || !this.getCategories().some(c => c.id === rule.categoryId && c.type === rule.type) || (rule.type === 'expense' && !this.getSettings().allowNegativeBalance && account.balance < rule.amount)) { pending++; break; }
        const tx: Transaction = { id: txId, type: rule.type, amount: rule.amount, accountId: rule.accountId, categoryId: rule.categoryId, date: rule.nextDueDate, description: rule.description, recurringRuleId: rule.id, recurringMonth: month, createdAt: new Date().toISOString() };
        this.validateTransaction(tx, accounts);
        const balances = this.applyBalanceChange(accounts, tx, 1);
        transactions.unshift(tx);
        rule.lastProcessedMonth = month;
        rule.nextDueDate = followingMonth(rule.nextDueDate, rule.dayOfMonth);
        this.atomicWrite(() => {
          this.saveAccounts(balances);
          this.saveTransactions(transactions);
          this.set(STORAGE_KEYS.RECURRING, rules);
          this.addAuditLog('CREATE', 'TRANSACTION', tx.id, `Định kỳ ${month}: ${rule.description}`);
        });
        created++;
      }
    }
    return { created, pending };
  }

  // --- Budgets ---
  getBudgets(): Budget[] {
    return this.get<Budget[]>(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
  }

  saveBudgets(budgets: Budget[]): void {
    this.set(STORAGE_KEYS.BUDGETS, budgets);
  }

  setBudget(categoryId: string, monthlyLimit: number): Budget {
    if (!Number.isSafeInteger(monthlyLimit) || monthlyLimit <= 0) throw new Error('Hạn mức ngân sách không hợp lệ.');
    const budgets = this.getBudgets();
    const existing = budgets.find(b => b.categoryId === categoryId);
    if (existing) {
      existing.monthlyLimit = monthlyLimit;
      this.saveBudgets(budgets);
      return existing;
    } else {
      const newBudget: Budget = {
        id: 'b_' + crypto.randomUUID(),
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
    if (!Number.isSafeInteger(item.amount) || item.amount <= 0 || !this.getAccounts().some(a => a.id === item.accountId)) throw new Error('Số tiền hoặc tài khoản công nợ không hợp lệ.');
    const items = this.getDebtsAndLoans();
    const newItem: DebtOrLoan = {
      ...item,
      id: (item.type === 'loan' ? 'loan_' : 'debt_') + crypto.randomUUID(),
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

    if (!Number.isSafeInteger(paymentAmount) || paymentAmount <= 0 || paymentAmount > item.remainingAmount) throw new Error('Số tiền thanh toán phải lớn hơn 0 và không vượt quá dư nợ.');
    item.remainingAmount -= paymentAmount;
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
      schemaVersion: SCHEMA_VERSION,
      version: release.version,
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
        recurringTransactions: this.getRecurringTransactions(),
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  importBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !Array.isArray(parsed.data.accounts) || !Array.isArray(parsed.data.transactions)) {
        return { success: false, message: 'Tệp sao lưu không đúng định dạng LTMsav.' };
      }
      if (parsed.schemaVersion && (!Number.isInteger(parsed.schemaVersion) || parsed.schemaVersion > SCHEMA_VERSION)) throw new Error('Bản sao lưu thuộc phiên bản ứng dụng mới hơn. Hãy cập nhật ứng dụng trước.');
      const d = parsed.data;
      for (const key of ['accounts', 'transactions', 'categories', 'budgets', 'debts', 'auditLogs', 'recurringTransactions']) {
        if (d[key] !== undefined && (!Array.isArray(d[key]) || d[key].some((item: any) => !item || typeof item.id !== 'string') || new Set(d[key].map((item: any) => item.id)).size !== d[key].length)) throw new Error(`Dữ liệu ${key} không hợp lệ hoặc trùng ID.`);
      }
      for (const rule of d.recurringTransactions || []) this.validateRecurringRule(rule);
      if (d.accounts.some((a: any) => typeof a.name !== 'string' || !Number.isFinite(a.balance))) throw new Error('Số dư tài khoản không hợp lệ.');
      for (const tx of d.transactions) this.validateTransaction(tx, d.accounts);
      if (d.budgets?.some((b: any) => !Number.isFinite(b.monthlyLimit) || b.monthlyLimit <= 0 || typeof b.categoryId !== 'string')) throw new Error('Ngân sách không hợp lệ.');
      if (d.debts?.some((item: any) => !Number.isFinite(item.amount) || item.amount <= 0 || !Number.isFinite(item.remainingAmount) || item.remainingAmount < 0 || item.remainingAmount > item.amount || !['loan', 'debt'].includes(item.type) || !['active', 'settled'].includes(item.status) || typeof item.person !== 'string')) throw new Error('Công nợ không hợp lệ.');
      if (d.categories?.some((c: any) => typeof c.name !== 'string' || !['income','expense'].includes(c.type))) throw new Error('Danh mục không hợp lệ.');
      if (d.settings !== undefined && (!d.settings || typeof d.settings !== 'object' || Array.isArray(d.settings))) throw new Error('Cài đặt không hợp lệ.');
      if (d.settings && (['securityEnabled', 'biometricEnabled', 'allowNegativeBalance', 'autoConfirmAi'].some(key => d.settings[key] !== undefined && typeof d.settings[key] !== 'boolean') || (d.settings.pinCode !== undefined && (typeof d.settings.pinCode !== 'string' || !/^(|\d{4,6})$/.test(d.settings.pinCode))) || (d.settings.securityEnabled && !/^\d{4,6}$/.test(d.settings.pinCode)))) throw new Error('Thiết lập PIN hoặc bảo mật không hợp lệ.');
      if(d.settings?.completeMonths !== undefined && (!Array.isArray(d.settings.completeMonths) || d.settings.completeMonths.some((m:any)=>typeof m!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) || new Set(d.settings.completeMonths).size!==d.settings.completeMonths.length)) throw new Error('Danh sách tháng ghi sổ không hợp lệ.');
      if(d.settings?.recurringReminders !== undefined && typeof d.settings.recurringReminders!=='boolean') throw new Error('Cài đặt nhắc lịch không hợp lệ.');
      this.createAutomaticSnapshot('Sao lưu tự động trước khi khôi phục tệp JSON');
      this.atomicWrite(() => {
      this.saveAccounts(parsed.data.accounts);
      if (parsed.data.categories) this.saveCategories(parsed.data.categories);
      this.saveTransactions(parsed.data.transactions);
      if (parsed.data.budgets) this.saveBudgets(parsed.data.budgets);
      if (parsed.data.debts) this.saveDebtsAndLoans(parsed.data.debts);
      if (parsed.data.settings) this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.data.settings });
      if (parsed.data.auditLogs) this.set(STORAGE_KEYS.AUDIT_LOGS, parsed.data.auditLogs);
      // Legacy backups contain no schedules. Preserve local definitions but pause them
      // so restoring an older balance cannot silently trigger unrelated payments.
      this.set(STORAGE_KEYS.RECURRING, parsed.data.recurringTransactions ?? this.getRecurringTransactions().map(rule => ({ ...rule, enabled: false })));
      });
      return { success: true, message: 'Khôi phục toàn bộ dữ liệu thành công!' };
    } catch (e: any) {
      return { success: false, message: 'Lỗi đọc tệp JSON: ' + (e?.message || 'Tệp không hợp lệ') };
    }
  }

  resetToDefault(): void {
    this.createAutomaticSnapshot('Sao lưu tự động trước khi đặt lại mặc định');
    const legacyKeys = Object.values(STORAGE_KEYS).map(key => key.replace('ltmsav_', 'finflow_'));
    legacyKeys.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.DEBTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.RECURRING);
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
      localStorage.removeItem(STORAGE_KEYS.RECURRING);

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
