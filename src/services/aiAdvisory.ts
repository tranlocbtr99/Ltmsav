import { Budget, Category, DebtOrLoan, Transaction } from '../types';
import { CashflowForecast } from './forecastEngine';

export interface AiAdvisoryItem {
  id: string;
  type: 'alert' | 'warning' | 'tip' | 'success';
  title: string;
  message: string;
  actionLabel?: string;
  actionTab?: string;
}

export function scanProactiveAdvisory(
  budgets: Budget[],
  categories: Category[],
  debts: DebtOrLoan[],
  transactions: Transaction[],
  forecast?: CashflowForecast | null,
  availableBalance?: number
): AiAdvisoryItem[] {
  const items: AiAdvisoryItem[] = [];

  // 1. Cảnh báo vượt / sắp chạm ngân sách trong tháng hiện tại
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (const b of budgets) {
    if (b.monthlyLimit <= 0) continue;

    // Tính tổng chi tiêu của category này trong tháng
    const categorySpent = transactions
      .filter(tx => tx.type === 'expense' && tx.categoryId === b.categoryId && tx.date.startsWith(currentYearMonth))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const catName = categories.find(c => c.id === b.categoryId)?.name || 'Danh mục';
    const usagePercent = Math.round((categorySpent / b.monthlyLimit) * 100);

    if (usagePercent >= 100) {
      items.push({
        id: `budget-over-${b.id}`,
        type: 'alert',
        title: `Vượt ngân sách [${catName}]`,
        message: `Đã chi ${new Intl.NumberFormat('vi-VN').format(categorySpent)}đ / ${new Intl.NumberFormat('vi-VN').format(b.monthlyLimit)}đ (${usagePercent}%). Cần kiểm soát chi tiêu danh mục này ngay.`,
        actionLabel: 'Xem ngân sách',
        actionTab: 'budgets'
      });
    } else if (usagePercent >= 80) {
      items.push({
        id: `budget-near-${b.id}`,
        type: 'warning',
        title: `Sắp chạm hạn mức [${catName}]`,
        message: `Đã dùng ${usagePercent}% ngân sách. Bạn chỉ còn ${new Intl.NumberFormat('vi-VN').format(b.monthlyLimit - categorySpent)}đ khả dụng cho tháng này.`,
        actionLabel: 'Xem ngân sách',
        actionTab: 'budgets'
      });
    }
  }

  // 2. Cảnh báo công nợ sắp đến hạn trong vòng 7 ngày
  const next7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  for (const d of debts) {
    if (d.status === 'active' && d.remainingAmount > 0 && d.dueDate) {
      const dueDate = new Date(d.dueDate);
      if (dueDate >= now && dueDate <= next7Days) {
        if (d.type === 'debt') {
          items.push({
            id: `debt-due-${d.id}`,
            type: 'warning',
            title: `Khoản nợ sắp đến hạn`,
            message: `Cần chuẩn bị ${new Intl.NumberFormat('vi-VN').format(d.remainingAmount)}đ trả cho ${d.person} vào ngày ${d.dueDate}.`,
            actionLabel: 'Quản lý tài sản & nợ',
            actionTab: 'assets'
          });
        } else {
          items.push({
            id: `loan-due-${d.id}`,
            type: 'tip',
            title: `Nhắc thu hồi khoản vay`,
            message: `Khoản cho ${d.person} vay (${new Intl.NumberFormat('vi-VN').format(d.remainingAmount)}đ) đến hạn thu vào ngày ${d.dueDate}.`,
            actionLabel: 'Xem khoản vay',
            actionTab: 'assets'
          });
        }
      }
    }
  }

  // 3. Cảnh báo hụt dòng tiền từ bộ dự báo
  if (forecast && forecast.alerts.length > 0) {
    const firstAlert = forecast.alerts[0];
    items.push({
      id: `forecast-alert-${firstAlert.date}`,
      type: 'alert',
      title: 'Nguy cơ thâm hụt dòng tiền',
      message: `Dự báo ngày ${firstAlert.date} số dư có thể bị âm ${new Intl.NumberFormat('vi-VN').format(firstAlert.estimatedShortage)}đ. Nên chuẩn bị phương án dự phòng.`,
      actionLabel: 'Xem dự báo 30 ngày',
      actionTab: 'plans'
    });
  }

  // 4. Mẹo tài chính tích cực nếu quỹ an toàn tốt
  if (availableBalance !== undefined && availableBalance > 5000000 && items.length === 0) {
    items.push({
      id: 'tip-healthy-savings',
      type: 'success',
      title: 'Tài chính khỏe mạnh',
      message: 'Dòng tiền khả dụng hiện tại rất an toàn. Hãy cân nhắc trích một phần vào tài khoản Tiết kiệm để tối ưu sinh lời.',
      actionLabel: 'Tạo quỹ tiết kiệm',
      actionTab: 'assets'
    });
  }

  return items;
}
