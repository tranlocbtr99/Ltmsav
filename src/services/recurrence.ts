import { RecurringRule, Transaction } from '../types';

export const localDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const localMonthKey = (d: Date) => localDateKey(d).slice(0,7);
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00');
  return !Number.isNaN(date.getTime()) && localDateKey(date) === value;
}
export function validRecurringRule(value: unknown): value is RecurringRule {
  const r = value as RecurringRule;
  const days = (v: unknown, min: number, max: number) => Array.isArray(v) && v.length > 0 && v.every(n => Number.isInteger(n) && n >= min && n <= max) && new Set(v).size === v.length;
  return !!r && typeof r === 'object' && typeof r.id === 'string' && !!r.id && typeof r.title === 'string' && !!r.title.trim()
    && ['expense','income'].includes(r.type) && Number.isSafeInteger(r.amount) && r.amount > 0
    && typeof r.accountId === 'string' && !!r.accountId && typeof r.categoryId === 'string' && !!r.categoryId
    && Number.isInteger(r.day) && r.day >= 1 && r.day <= 31
    && typeof r.startMonth === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(r.startMonth)
    && (r.frequency === undefined || ['monthly','weekly'].includes(r.frequency))
    && (r.daysOfMonth === undefined || days(r.daysOfMonth,1,31))
    && (r.daysOfWeek === undefined || days(r.daysOfWeek,0,6))
    && (r.frequency !== 'weekly' || days(r.daysOfWeek,0,6))
    && (r.time === undefined || /^([01]\d|2[0-3]):[0-5]\d$/.test(r.time))
    && (r.startDate === undefined || validDate(r.startDate))
    && (r.lastApplied === undefined || /^\d{4}-(0[1-9]|1[0-2])$/.test(r.lastApplied));
}
export function matchesSchedule(rule: RecurringRule, date: Date): boolean {
  const key = localDateKey(date);
  if (key < (rule.startDate || rule.startMonth + '-01')) return false;
  if (rule.frequency === 'weekly') return (rule.daysOfWeek || []).includes(date.getDay());
  const lastDay = new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
  return (rule.daysOfMonth || [rule.day]).some(day => Math.min(day,lastDay) === date.getDate());
}
export function periodDates(rule: RecurringRule, now: Date): string[] {
  const first = new Date(now.getFullYear(),now.getMonth(),1,12);
  let count = new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  if (rule.frequency === 'weekly') {
    first.setDate(now.getDate() - ((now.getDay()+6)%7)); count=7;
  }
  return Array.from({length:count},(_,i)=>new Date(first.getFullYear(),first.getMonth(),first.getDate()+i,12))
    .filter(d=>matchesSchedule(rule,d)).map(localDateKey);
}
export function occurrenceNote(rule: RecurringRule, date: string): string {
  return 'Giao dịch định kỳ: ' + rule.id + ' / ' + date;
}
export function isOccurrencePosted(rule: RecurringRule, date: string, txs: Transaction[]): boolean {
  const month=date.slice(0,7);
  if (rule.lastApplied === month) return true;
  const marker=occurrenceNote(rule,date);
  const legacy='Giao dịch định kỳ: ' + rule.id + ' / ' + month;
  return txs.some(tx => tx.recurringOccurrenceId === rule.id + '/' + date || tx.note === marker || tx.note === legacy);
}
export function isDue(rule: RecurringRule, date: string, now: Date): boolean {
  if (!validDate(date)) return false;
  const at=new Date(date+'T'+(rule.time || '00:00')+':00');
  return matchesSchedule(rule,at) && at.getTime()<=now.getTime();
}
export function dueDates(rule: RecurringRule, now: Date, txs: Transaction[]): string[] {
  return periodDates(rule,now).filter(date=>isDue(rule,date,now)&&!isOccurrencePosted(rule,date,txs));
}
export function nextOccurrence(rule: RecurringRule, now: Date, txs: Transaction[]): string | undefined {
  for(let i=0;i<400;i++) {
    const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,12);
    const key=localDateKey(d);
    if(matchesSchedule(rule,d)&&!isOccurrencePosted(rule,key,txs)) return key;
  }
}
