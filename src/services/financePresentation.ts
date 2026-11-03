import type { Transaction } from '../types';

/** Compare equal elapsed calendar days. Dates are local YYYY-MM-DD, not UTC. */
export function compareMonthToDate(transactions: Transaction[], now: Date) {
  const year = now.getFullYear(), month = now.getMonth(), day = now.getDate();
  const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const current = key(now), previous = key(new Date(year, month - 1, 1));
  const previousDays = new Date(year, month, 0).getDate();
  const sum = (type: 'income' | 'expense', period: string, lastDay: number) => transactions
    .filter(tx => tx.type === type && tx.date.slice(0, 7) === period && Number(tx.date.slice(8, 10)) <= lastDay)
    .reduce((total, tx) => total + tx.amount, 0);
  const percent = (type: 'income' | 'expense') => {
    const before = sum(type, previous, Math.min(day, previousDays));
    return before > 0 ? (sum(type, current, day) - before) / before * 100 : null;
  };
  return { income: percent('income'), expense: percent('expense') };
}
