import { Account, Budget, Category, DebtOrLoan, Transaction } from '../types';
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
  availableBalance?: number,
  accounts?: Account[]
): AiAdvisoryItem[] {
  const items: AiAdvisoryItem[] = [];

  // 1. Cảnh báo vượt / sắp chạm ngân sách trong tháng hiện tại
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentDayOfMonth = now.getDate();

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

  // 2. Cảnh báo công nợ sắp đến hạn & trả góp định kỳ
  const next7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  for (const d of debts) {
    if (d.status === 'active' && d.remainingAmount > 0) {
      // 2a. Trả góp định kỳ hàng tháng sắp đến hạn trong 3 ngày tới
      if (d.isInstallment && d.monthlyInstallmentAmount && d.monthlyPaymentDay) {
        let daysUntil = d.monthlyPaymentDay - currentDayOfMonth;
        if (daysUntil < 0) {
          // Tháng sau hoặc đã qua trong tháng này
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          daysUntil += daysInMonth;
        }

        if (daysUntil >= 0 && daysUntil <= 3) {
          const lender = d.lenderName || d.person;
          items.push({
            id: `installment-due-${d.id}`,
            type: 'warning',
            title: `Kỳ trả góp sắp đến hạn`,
            message: `Khoản trả góp cho ${lender} (${new Intl.NumberFormat('vi-VN').format(d.monthlyInstallmentAmount)}đ) đến ngày thanh toán ${d.monthlyPaymentDay} (${daysUntil === 0 ? 'Hôm nay' : `còn ${daysUntil} ngày`}).`,
            actionLabel: 'Xem khoản nợ',
            actionTab: 'assets'
          });
        }
      }

      // 2b. Lãi suất cao cần ưu tiên trả
      if (d.type === 'debt' && d.interestRate && d.interestRate >= 18) {
        items.push({
          id: `debt-high-interest-${d.id}`,
          type: 'alert',
          title: `Cảnh báo nợ lãi suất cao`,
          message: `Khoản nợ [${d.lenderName || d.person}] có lãi suất ${d.interestRate}%/năm. Hãy ưu tiên trích dòng tiền tất toán sớm để giảm thiểu chi phí lãi.`,
          actionLabel: 'Quản lý nợ',
          actionTab: 'assets'
        });
      }

      // 2c. Khoản nợ đáo hạn trong 7 ngày tới
      if (d.dueDate) {
        const dueDate = new Date(d.dueDate);
        if (dueDate >= now && dueDate <= next7Days) {
          if (d.type === 'debt') {
            items.push({
              id: `debt-due-${d.id}`,
              type: 'warning',
              title: `Khoản nợ sắp đến hạn`,
              message: `Cần chuẩn bị ${new Intl.NumberFormat('vi-VN').format(d.remainingAmount)}đ trả cho ${d.lenderName || d.person} vào ngày ${d.dueDate}.`,
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
  }

  // 3. Cảnh báo tài khoản tiết kiệm / thẻ tín dụng
  if (accounts && accounts.length > 0) {
    for (const acc of accounts) {
      // 3a. Sổ tiết kiệm sắp đáo hạn
      if (acc.type === 'savings' && acc.maturityDate) {
        const matDate = new Date(acc.maturityDate);
        if (matDate >= now && matDate <= next7Days) {
          items.push({
            id: `savings-maturing-${acc.id}`,
            type: 'tip',
            title: `Sổ tiết kiệm sắp đáo hạn`,
            message: `Sổ [${acc.name}] tại ${acc.bankName || 'ngân hàng'} (${new Intl.NumberFormat('vi-VN').format(acc.balance)}đ) sẽ đáo hạn vào ngày ${acc.maturityDate}.`,
            actionLabel: 'Xem sổ tiết kiệm',
            actionTab: 'assets'
          });
        }
      }

      // 3b. Thẻ tín dụng vượt 80% hạn mức
      if (acc.type === 'credit' && acc.creditLimit && acc.creditLimit > 0) {
        const used = Math.abs(Math.min(0, acc.balance));
        const utilRate = Math.round((used / acc.creditLimit) * 100);
        if (utilRate >= 80) {
          items.push({
            id: `credit-limit-warning-${acc.id}`,
            type: 'warning',
            title: `Hạn mức thẻ tín dụng chạm ${utilRate}%`,
            message: `Thẻ [${acc.name}] đã dùng ${new Intl.NumberFormat('vi-VN').format(used)}đ / ${new Intl.NumberFormat('vi-VN').format(acc.creditLimit)}đ hạn mức.`,
            actionLabel: 'Xem thẻ',
            actionTab: 'assets'
          });
        }
      }
    }
  }

  // 4. Cảnh báo hụt dòng tiền từ bộ dự báo
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

  // 5. Mẹo tài chính tích cực nếu quỹ an toàn tốt
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

