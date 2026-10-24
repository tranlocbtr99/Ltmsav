/** Local calendar-only monthly dates: never advance by a fixed number of milliseconds. */
export function monthlyDate(month: string, day: number): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isInteger(day) || day < 1 || day > 31) throw new Error('Ngày định kỳ không hợp lệ.');
  const [year, m] = month.split('-').map(Number);
  const last = new Date(year, m, 0).getDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`;
}
export function followingMonth(date: string, day: number): string {
  const [year, month] = date.split('-').map(Number);
  return monthlyDate(`${year + (month === 12 ? 1 : 0)}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}`, day);
}
export function nextOnOrAfter(today: string, day: number): string {
  const current = monthlyDate(today.slice(0, 7), day);
  return current >= today ? current : followingMonth(current, day);
}
