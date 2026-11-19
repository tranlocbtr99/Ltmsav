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

export type DebtCategory = 
  | 'credit_card'       // Thẻ tín dụng
  | 'installment'       // Trả góp mua hàng / tiêu dùng
  | 'bank_loan'         // Vay ngân hàng
  | 'personal_debt'     // Vay mượn cá nhân / người thân
  | 'other';

export interface DebtOrLoan {
  id: string;
  type: 'loan' | 'debt'; // 'loan' = Cho người khác vay (Tài sản); 'debt' = Khoản nợ phải trả (Nghĩa vụ nợ)
  person: string; // Tên người mượn (khi loan) hoặc Bên cho vay / Người liên quan (khi debt)
  amount: number; // Tổng số tiền vay ban đầu hoặc Giá trị món hàng
  remainingAmount: number; // Dư nợ còn lại cần trả hoặc Số tiền chưa thu hồi được
  accountId: string;
  dueDate?: string; // Ngày hẹn trả / Ngày đáo hạn
  note?: string;
  status: 'active' | 'settled';
  createdAt: string;

  // Chi tiết đặc tính khoản nợ (cho type === 'debt')
  debtCategory?: DebtCategory;
  lenderName?: string; // Tên ngân hàng / Tổ chức cho vay / Công ty tài chính
  interestRate?: number; // Lãi suất %/năm
  termMonths?: number; // Thời hạn vay (tháng)
  isInstallment?: boolean; // Có hình thức trả góp định kỳ không

  // Chi tiết Thẻ tín dụng
  creditLimit?: number; // Hạn mức thẻ tín dụng
  cardNumberLast4?: string; // 4 số cuối thẻ
  statementDay?: number; // Ngày chốt sao kê hàng tháng (1 - 31)
  paymentDueDay?: number; // Ngày đến hạn thanh toán sao kê (1 - 31)

  // Chi tiết Mua trả góp
  itemName?: string; // Tên sản phẩm trả góp (VD: iPhone, Xe máy...)
  downPayment?: number; // Tiền trả trước
  totalInstallments?: number; // Tổng số kỳ trả góp (tháng)
  paidInstallments?: number; // Số kỳ đã thanh toán
  monthlyInstallmentAmount?: number; // Tiền đóng định kỳ hàng tháng
  monthlyPaymentDay?: number; // Ngày đóng tiền cố định hàng tháng (1 - 31)
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
