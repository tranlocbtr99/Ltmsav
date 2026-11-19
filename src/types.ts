export type AccountType = 'cash' | 'bank' | 'wallet' | 'savings' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  iconName: string;
  color: string;

  // Chi tiết tài sản ngân hàng / ví / tiết kiệm / thẻ tín dụng
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  branch?: string;

  // Sổ tiết kiệm
  interestRate?: number;
  termMonths?: number;
  depositDate?: string;
  maturityDate?: string;

  // Thẻ tín dụng
  creditLimit?: number;
  statementDay?: number;
  paymentDueDay?: number;
}

export type CategoryType = 'expense' | 'income' | 'lend';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  iconName: string;
  color: string;
  isDefault?: boolean;
}

export type TransactionType = 'expense' | 'income' | 'transfer' | 'lend' | 'debt_repay';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  targetAccountId?: string;
  categoryId: string;
  date: string;
  description: string;
  note?: string;
  person?: string;
  createdAt: string;
  updatedAt?: string;
  recurringOccurrenceId?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
}

export type DebtCategory = 'bank_loan' | 'credit_card' | 'installment' | 'personal_debt' | 'other';

export interface DebtOrLoan {
  id: string;
  type: 'loan' | 'debt';
  person: string;
  amount: number;
  remainingAmount: number;
  accountId: string;
  dueDate?: string;
  note?: string;
  status: 'active' | 'settled';
  createdAt: string;

  // Chi tiết đặc tính khoản nợ / cho vay
  debtCategory?: DebtCategory;
  lenderName?: string;
  interestRate?: number; // % / năm
  termMonths?: number; // Kỳ hạn (tháng)
  isInstallment?: boolean; // Trả góp định kỳ
  monthlyInstallmentAmount?: number; // Tiền trả định kỳ hàng tháng
  monthlyPaymentDay?: number; // Ngày trả cố định trong tháng (1 - 31)
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ADJUST_BALANCE';
  targetType: 'TRANSACTION' | 'ACCOUNT' | 'BUDGET';
  targetId: string;
  summary: string;
  details?: Record<string, any>;
}

export interface AppSettings {
  currency: string;
  allowNegativeBalance: boolean;
  autoConfirmAi: boolean;
  securityEnabled: boolean;
  pinCode: string;
  biometricEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  autoBackupOnUpdate?: boolean;
  storagePersistent?: boolean;
  lastBackupDate?: string;
  customServerUrl?: string;
  geminiApiKey?: string;
  userProfile?: {
    displayName?: string;
    universityOrJob?: string;
    monthlyAllowance?: number;
    incomeDayOfMonth?: number;
    partTimeIncome?: number;
    financialGoal?: string;
    targetGoalAmount?: number;
  };
}

export interface AiParsedCommand {
  /** Transient draft bindings, never stored as financial schema fields. */
  account_id?: string;
  account_to_id?: string;
  category_id?: string;
  kind: 'expense' | 'income' | 'transfer' | 'lend' | 'debt_repay';
  amount: number;
  currency: string;
  account: string;
  account_to?: string | null;
  category: string;
  date: string;
  description: string;
  note?: string | null;
  person?: string | null;
}

export interface AiChatResponse {
  intent: string;
  needs_confirmation: boolean;
  clarification_question?: string | null;
  clarification_options?: string[];
  analysis: string;
  answer?: string | null;
  commands?: AiParsedCommand[];
}

/** Optional scheduling fields preserve compatibility with monthly rules from schema 6. */
export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  accountId: string;
  categoryId: string;
  day: number;
  startMonth: string;
  lastApplied?: string;
  frequency?: 'monthly' | 'weekly';
  daysOfMonth?: number[];
  daysOfWeek?: number[];
  time?: string;
  startDate?: string;
}
export interface CategoryActions {
  onCreateCategory?: (category: Omit<Category, 'id'>) => Category;
  onUpdateCategory?: (id: string, name: string) => void;
  onDeleteCategory?: (id: string) => void;
}
