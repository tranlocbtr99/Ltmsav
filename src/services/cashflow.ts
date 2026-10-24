import {Account,RecurringTransaction} from '../types';
import {localDate} from './date';
import {followingMonth} from './recurrence';
/** Scheduled cashflow only: forecasts never change balances or assume bank transfers. */
export function scheduledCashflow(accounts:Account[],rules:RecurringTransaction[],today=localDate(),days=90) {
  const [y,m,d]=today.split('-').map(Number), end=localDate(new Date(y,m-1,d+days));
  const events:{date:string;type:'income'|'expense';amount:number;accountId:string;id:string}[]=[];
  for(const rule of rules.filter(r=>r.enabled&&accounts.some(a=>a.id===r.accountId))) {
    let due=rule.nextDueDate;
    for(let n=0;n<2400&&due<=end;n++,due=followingMonth(due,rule.dayOfMonth)) events.push({date:due<today?today:due,type:rule.type,amount:rule.amount,accountId:rule.accountId,id:rule.id});
  }
  events.sort((a,b)=>a.date.localeCompare(b.date)||(a.type===b.type?0:a.type==='expense'?-1:1)||a.id.localeCompare(b.id));
  return accounts.map(account=>{
    let balance=account.balance, minimum=balance, shortfallDate:string|null=balance<0?today:null;
    for(const event of events.filter(e=>e.accountId===account.id)) {
      balance+=event.type==='income'?event.amount:-event.amount;
      minimum=Math.min(minimum,balance);
      if(balance<0&&!shortfallDate)shortfallDate=event.date;
    }
    return {accountId:account.id,name:account.name,endingBalance:balance,minimumBalance:minimum,shortfallDate};
  });
}
