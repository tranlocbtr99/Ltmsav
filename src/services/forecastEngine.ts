import { RecurringRule, DebtOrLoan } from '../types';

export interface UserFinancialProfile {
  monthlyAllowance?: number;
  incomeDayOfMonth?: number;
  partTimeIncome?: number;
}

export interface ForecastDay {
  date: string;
  projectedBalance: number;
  inflow: number;
  outflow: number;
  notes: string[];
  isShortage: boolean;
}

export interface ShortageAlert {
  date: string;
  estimatedShortage: number;
  reason: string;
  severity: 'HIGH' | 'MEDIUM';
  solutions: string[];
}

export interface CashflowForecast {
  daysCount: number;
  startBalance: number;
  endBalance: number;
  minBalance: number;
  totalInflow: number;
  totalOutflow: number;
  dailyForecasts: ForecastDay[];
  alerts: ShortageAlert[];
}

function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateCashflowForecast(
  startLiquidBalance: number,
  userProfile: UserFinancialProfile,
  recurringRules: RecurringRule[],
  debts: DebtOrLoan[],
  daysAhead: number = 30
): CashflowForecast {
  const today = new Date();
  const dailyList: ForecastDay[] = [];
  const alerts: ShortageAlert[] = [];

  let currentBalance = startLiquidBalance;
  let minBalance = startLiquidBalance;
  let totalInflow = 0;
  let totalOutflow = 0;

  const incomeDay = userProfile.incomeDayOfMonth || 5;
  const regularAllowance = userProfile.monthlyAllowance || 0;
  const partTimeIncome = userProfile.partTimeIncome || 0;

  for (let i = 0; i < daysAhead; i++) {
    const curDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const dateStr = formatDateStr(curDate);
    const dayOfMonth = curDate.getDate();
    const dayOfWeek = curDate.getDay(); // 0 is Sunday, 1 is Monday...

    let dayInflow = 0;
    let dayOutflow = 0;
    const notes: string[] = [];

    // 1. Thu nhập trợ cấp / lương định kỳ của UserProfile
    if (dayOfMonth === incomeDay && (regularAllowance > 0 || partTimeIncome > 0)) {
      const fixedIncome = regularAllowance + partTimeIncome;
      dayInflow += fixedIncome;
      notes.push(`Thu nhập cố định / Lương: +${new Intl.NumberFormat('vi-VN').format(fixedIncome)}đ`);
    }

    // 2. Chi phí & Thu nhập định kỳ từ RecurringRules
    for (const rule of recurringRules) {
      let isApplied = false;
      if (rule.frequency === 'weekly') {
        const targetDays = rule.daysOfWeek || [rule.day % 7];
        if (targetDays.includes(dayOfWeek)) isApplied = true;
      } else {
        // Monthly
        const targetDays = rule.daysOfMonth || [rule.day || 1];
        if (targetDays.includes(dayOfMonth)) isApplied = true;
      }

      if (isApplied) {
        if (rule.type === 'expense') {
          dayOutflow += rule.amount;
          notes.push(`Định kỳ [${rule.title}]: -${new Intl.NumberFormat('vi-VN').format(rule.amount)}đ`);
        } else if (rule.type === 'income') {
          dayInflow += rule.amount;
          notes.push(`Định kỳ [${rule.title}]: +${new Intl.NumberFormat('vi-VN').format(rule.amount)}đ`);
        }
      }
    }

    // 3. Công nợ / Khoản vay đến hạn trả trong ngày
    for (const debt of debts) {
      if (debt.status === 'active' && debt.remainingAmount > 0 && debt.dueDate === dateStr) {
        if (debt.type === 'debt') {
          // Mình nợ người khác đến hạn trả
          dayOutflow += debt.remainingAmount;
          notes.push(`Đến hạn trả nợ cho ${debt.person}: -${new Intl.NumberFormat('vi-VN').format(debt.remainingAmount)}đ`);
        } else if (debt.type === 'loan') {
          // Người khác nợ mình đến hạn trả
          dayInflow += debt.remainingAmount;
          notes.push(`Dự kiến thu hồi nợ từ ${debt.person}: +${new Intl.NumberFormat('vi-VN').format(debt.remainingAmount)}đ`);
        }
      }
    }

    currentBalance = currentBalance + dayInflow - dayOutflow;
    if (currentBalance < minBalance) {
      minBalance = currentBalance;
    }
    totalInflow += dayInflow;
    totalOutflow += dayOutflow;

    const isShortage = currentBalance < 0;
    if (isShortage) {
      notes.push('CẢNH BÁO: Số dư dự kiến bị âm tiền!');
      alerts.push({
        date: dateStr,
        estimatedShortage: Math.abs(currentBalance),
        reason: `Dòng tiền bị âm vào ngày ${dateStr} do chi tiêu & nợ vượt quá số dư`,
        severity: 'HIGH',
        solutions: [
          'Tạm hoãn các khoản chi tiêu không bắt buộc',
          'Rút một phần từ quỹ tiết kiệm dự phòng',
          'Thương lượng gia hạn thời gian thanh toán công nợ'
        ]
      });
    }

    dailyList.push({
      date: dateStr,
      projectedBalance: currentBalance,
      inflow: dayInflow,
      outflow: dayOutflow,
      notes,
      isShortage
    });
  }

  return {
    daysCount: daysAhead,
    startBalance: startLiquidBalance,
    endBalance: currentBalance,
    minBalance,
    totalInflow,
    totalOutflow,
    dailyForecasts: dailyList,
    alerts
  };
}

