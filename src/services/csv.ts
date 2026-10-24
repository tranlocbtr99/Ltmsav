import type { Account, Category, Transaction } from '../types';
// Quote every cell and prevent spreadsheet formula execution from user-provided text.
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function transactionsCsv(transactions: Transaction[], accounts: Account[], categories: Category[]): string {
  const rows: unknown[][] = [['Date','Type','Amount (VND)','Account','Target account','Category','Description','Note']];
  for (const tx of transactions) rows.push([tx.date, tx.type, tx.amount, accounts.find(a => a.id === tx.accountId)?.name ?? tx.accountId, accounts.find(a => a.id === tx.targetAccountId)?.name ?? '', categories.find(c => c.id === tx.categoryId)?.name ?? '', tx.description, tx.note]);
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadText(text: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
