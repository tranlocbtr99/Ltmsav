import test from 'node:test';
import assert from 'node:assert/strict';
import { RecurringRule, Transaction } from '../src/types';
import { dueDates, isDue, isOccurrencePosted, localDateKey, matchesSchedule, occurrenceNote, periodDates, validRecurringRule } from '../src/services/recurrence';

const monthly:RecurringRule={id:'r1',title:'Rent',amount:1000,type:'expense',accountId:'a',categoryId:'c',day:5,startMonth:'2026-01'};
const tx=(note:string)=>({note} as Transaction);
test('legacy monthly rules retain end-of-month behavior and old posting receipts',()=>{
  const rule={...monthly,day:31};
  assert.equal(validRecurringRule(rule),true);
  assert.deepEqual(periodDates(rule,new Date(2026,1,28)),['2026-02-28']);
  assert.equal(isOccurrencePosted(rule,'2026-02-28',[tx('Giao dịch định kỳ: r1 / 2026-02')]),true);
  assert.equal(isOccurrencePosted({...rule,lastApplied:'2026-02'},'2026-02-28',[]),true);
});
test('multiple monthly days are sorted by date and clamped dates deduplicated in short months',()=>{
  const rule={...monthly,frequency:'monthly' as const,daysOfMonth:[31,1,15,30,29]};
  assert.deepEqual(periodDates(rule,new Date(2026,1,28)),['2026-02-01','2026-02-15','2026-02-28']);
  assert.deepEqual(periodDates(rule,new Date(2028,1,29)),['2028-02-01','2028-02-15','2028-02-29']);
});
test('weekly days cross month and year boundaries without UTC date slicing',()=>{
  const rule={...monthly,frequency:'weekly' as const,daysOfWeek:[1,3,0]};
  assert.deepEqual(periodDates(rule,new Date(2026,11,31)),['2026-12-28','2026-12-30','2027-01-03']);
});
test('exact local time gates posting; starting date excludes earlier days',()=>{
  const rule={...monthly,frequency:'weekly' as const,daysOfWeek:[1,2,3],time:'08:30',startDate:'2026-11-03'};
  assert.equal(isDue(rule,'2026-11-03',new Date(2026,10,3,8,29)),false);
  assert.equal(isDue(rule,'2026-11-03',new Date(2026,10,3,8,30)),true);
  assert.equal(matchesSchedule(rule,new Date(2026,10,2)),false);
  assert.deepEqual(periodDates(rule,new Date(2026,10,3)),['2026-11-03','2026-11-04']);
});
test('receipt for one monthly occurrence does not hide other selected days',()=>{
  const rule={...monthly,frequency:'monthly' as const,daysOfMonth:[1,5,10],time:'08:00'};
  const transactions=[tx(occurrenceNote(rule,'2026-11-01'))];
  assert.deepEqual(dueDates(rule,new Date(2026,10,10,9),transactions),['2026-11-05','2026-11-10']);
  assert.equal(isOccurrencePosted(rule,'2026-11-10',[tx(occurrenceNote({...rule,id:'other'},'2026-11-10'))]),false);
});
test('weekdays, month dates, real start dates, times and amounts are validated',()=>{
  const invalid:unknown[]=[
    {...monthly,frequency:'weekly',daysOfWeek:[]},
    {...monthly,frequency:'weekly',daysOfWeek:[7]},
    {...monthly,daysOfMonth:[0]},
    {...monthly,daysOfMonth:[5,5]},
    {...monthly,time:'24:00'},
    {...monthly,time:'08:60'},
    {...monthly,startDate:'2026-02-30'},
    {...monthly,startMonth:'2026-13'},
    {...monthly,amount:1.5},
  ];
  invalid.forEach(rule=>assert.equal(validRecurringRule(rule),false));
  assert.equal(validRecurringRule({...monthly,frequency:'weekly',daysOfWeek:[0,6],time:'23:59'}),true);
});
test('localDateKey uses the supplied local date components',()=>{
  const date=new Date(2026,10,3,0,5);
  assert.equal(localDateKey(date),'2026-11-03');
});

test('posting receipt survives editing the displayed transaction note',()=>{
  const rule={...monthly,frequency:'monthly' as const,daysOfMonth:[3]};
  assert.equal(isOccurrencePosted(rule,'2026-11-03',[{note:'Changed',recurringOccurrenceId:'r1/2026-11-03'} as Transaction]),true);
});
