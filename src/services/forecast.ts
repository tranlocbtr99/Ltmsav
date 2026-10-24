import { RecurringTransaction, Transaction } from '../types';
import { localDate } from './date';
import { monthlyDate } from './recurrence';

export type ForecastPeriod = 'month' | 'quarter' | 'year';
const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;
export function forecastSpending(transactions: Transaction[], rules: RecurringTransaction[], period: ForecastPeriod, today = localDate()) {
  const [year, month] = today.split('-').map(Number);
  const current = today.slice(0, 7);
  const history = transactions.filter(tx => tx.date <= today && tx.type === 'expense' && Number.isFinite(tx.amount) && tx.amount > 0);
  const first = history.map(tx => tx.date.slice(0, 7)).sort()[0];
  const months: string[] = [];
  for (let offset = 6; offset >= 1; offset--) {
    const d = new Date(year, month - 1 - offset, 1);
    const key = monthKey(d.getFullYear(), d.getMonth() + 1);
    if (first && key >= first && key < current) months.push(key);
  }
  // Recurring postings are replaced by the current schedule, including paused/deleted rules.
  const totals = months.map(key => history.filter(tx => tx.date.startsWith(key) && !tx.recurringRuleId).reduce((s, tx) => s + tx.amount, 0));
  const mean = totals.length ? totals.reduce((a,b) => a+b, 0) / totals.length : 0;
  const deviation = totals.length ? totals.reduce((s,n) => s + Math.abs(n - mean), 0) / totals.length : 0;
  const supported = totals.length >= 2;
  const start = period === 'month' ? new Date(year, month, 1) : period === 'quarter' ? new Date(year, Math.floor((month-1)/3)*3+3, 1) : new Date(year+1,0,1);
  const count = period === 'month' ? 1 : period === 'quarter' ? 3 : 12;
  const projections = Array.from({length: count}, (_,i) => {
    const d = new Date(start.getFullYear(), start.getMonth()+i, 1);
    const key = monthKey(d.getFullYear(),d.getMonth()+1);
    const scheduled = rules.filter(r => r.enabled && r.type === 'expense' && monthlyDate(key,r.dayOfMonth) >= r.nextDueDate).reduce((s,r) => s+r.amount,0);
    const variable = supported ? Math.round(mean) : 0;
    const spread = supported ? Math.max(deviation, mean * .2) : 0;
    return { month: key, scheduled, variable, total: scheduled+variable, low: scheduled+Math.max(0,Math.round(mean-spread))*(supported?1:0), high: scheduled+Math.round(mean+spread)*(supported?1:0) };
  });
  return {period, months, supported, projections, total: projections.reduce((s,p)=>s+p.total,0), scheduled: projections.reduce((s,p)=>s+p.scheduled,0), low: projections.reduce((s,p)=>s+p.low,0), high: projections.reduce((s,p)=>s+p.high,0)};
}
