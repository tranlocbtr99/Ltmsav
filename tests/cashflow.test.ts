import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scheduledCashflow} from '../src/services/cashflow';
import {Account,RecurringTransaction} from '../src/types';
const accounts:Account[]=[{id:'a',name:'Cash',balance:100,type:'cash',currency:'VND',iconName:'Wallet',color:'#000'},{id:'b',name:'Bank',balance:1000,type:'bank',currency:'VND',iconName:'Bank',color:'#000'}];
const rule:RecurringTransaction={id:'rent',type:'expense',amount:200,accountId:'a',categoryId:'rent',description:'rent',dayOfMonth:31,nextDueDate:'2026-01-31',enabled:true};
test('cashflow isolates accounts, clamps dates, includes overdue and never mutates input',()=>{
 const before=JSON.stringify(accounts),r=scheduledCashflow(accounts,[rule],'2026-02-01',30);
 assert.equal(r[0].endingBalance,-300);assert.equal(r[0].shortfallDate,'2026-02-01');assert.equal(r[1].endingBalance,1000);assert.equal(JSON.stringify(accounts),before);
 assert.equal(scheduledCashflow(accounts,[{...rule,enabled:false}],'2026-02-01',30)[0].endingBalance,100);
});
test('same-day expenses precede scheduled income and outside-horizon rules are excluded',()=>{
 const r=scheduledCashflow(accounts,[{...rule,nextDueDate:'2026-01-31'},{...rule,id:'salary',type:'income',amount:500}], '2026-01-30',2);
 assert.equal(r[0].minimumBalance,-100);assert.equal(r[0].endingBalance,400);
 assert.equal(scheduledCashflow(accounts,[{...rule,nextDueDate:'2027-01-31'}],'2026-01-01',90)[0].endingBalance,100);
});
