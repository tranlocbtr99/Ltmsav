import {test} from 'node:test';
import assert from 'node:assert/strict';
import {forecastSpending as forecast} from '../src/services/forecast';
import {Transaction, RecurringTransaction} from '../src/types';
const tx=(date:string, amount:number, extra:Partial<Transaction>={}):Transaction=>({id:date,type:'expense',amount,accountId:'a',categoryId:'c',date,description:'test',createdAt:date,...extra});
const rule:RecurringTransaction={id:'r',type:'expense',amount:100,accountId:'a',categoryId:'c',description:'rent',dayOfMonth:31,nextDueDate:'2026-10-31',enabled:true};
test('forecast excludes current/future months, transfers and recurring postings; includes zero months',()=>{
 const f=forecast([tx('2026-07-01',300),tx('2026-09-01',300),tx('2026-09-03',100,{recurringRuleId:'r'}),tx('2026-09-04',999,{type:'transfer'}),tx('2026-10-01',999),tx('2026-11-01',999)], [rule], 'month','2026-10-24');
 assert.equal(f.months.length,3);assert.equal(f.total,300);assert.equal(f.scheduled,100);assert.equal(f.projections[0].month,'2026-11');assert.ok(f.low<=f.total&&f.high>=f.total);
});
test('insufficient history returns schedules only; no mutation',()=>{
 const txs=[tx('2026-10-01',900)],rules=[rule];const before=JSON.stringify({txs,rules});
 const f=forecast(txs,rules,'year','2026-10-24');assert.equal(f.supported,false);assert.equal(f.total,1200);assert.equal(JSON.stringify({txs,rules}),before);
 assert.equal(forecast([],[],'month','2026-10-24').total,0);
});
test('calendar quarter/year boundaries and future/paused rules',()=>{
 const f=forecast([], [rule,{...rule,id:'later',nextDueDate:'2027-02-28'},{...rule,id:'pause',enabled:false}], 'quarter','2026-12-31');
 assert.deepEqual(f.projections.map(p=>p.month),['2027-01','2027-02','2027-03']);assert.equal(f.scheduled,500);
 assert.equal(forecast([],[],'year','2026-12-31').projections.at(-1)?.month,'2027-12');
});
