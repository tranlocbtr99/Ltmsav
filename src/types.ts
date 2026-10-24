export type AccountType = 'cash' | 'bank' | 'wallet' | 'savings' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  iconName: string;
  color: string;
}

export type CategoryType = 'expense' | 'income';

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
  recurringRuleId?: string;
  recurringMonth?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
}

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
  completeMonths?: string[];
  recurringReminders?: boolean;
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
}

export interface AiParsedCommand {
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

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  accountId: string;
  categoryId: string;
  description: string;
  dayOfMonth: number;
  nextDueDate: string;
  enabled: boolean;
  lastProcessedMonth?: string;
}
export type RecurringInput = Omit<RecurringTransaction, 'id' | 'lastProcessedMonth'>;
