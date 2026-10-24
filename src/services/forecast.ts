import { RecurringTransaction, Transaction } from '../types';
import { localDate } from './date';
import { monthlyDate } from './recurrence';

export type ForecastPeriod = 'month' | 'quarter' | 'year';
type Observation = {month: string; value: number};
type Model = 'mean' | 'trend' | 'seasonal';
const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2,'0')}`;
const index = (key:string) => {const [y,m]=key.split('-').map(Number);return y*12+m-1;};
const average = (values:number[])=>values.reduce((a,b)=>a+b,0)/Math.max(1,values.length);
function estimate(history:Observation[], target:string, model:Model): number | null {
  const recent=history.slice(-6), mean=average(recent.map(p=>p.value));
  if(model==='mean') return mean;
  if(model==='seasonal') {
    const same=history.filter(p=>p.month.slice(5)===target.slice(5));
    return same.length>=2?average(same.map(p=>p.value)):null;
  }
  if(recent.length<6 || index(recent[5].month)-index(recent[0].month)!==5) return null;
  const slope=recent.reduce((s,p,i)=>s+(i-2.5)*(p.value-mean),0)/17.5;
  // Damped, bounded extrapolation: long horizons do not compound a short trend.
  const bounded=Math.max(-mean*.1,Math.min(mean*.1,slope));
  return Math.max(0,mean+bounded*(2.5+Math.min(3,index(target)-index(recent[5].month))));
}
export function forecastSpending(transactions:Transaction[], rules:RecurringTransaction[], period:ForecastPeriod, today=localDate(), completeMonths:string[] = []) {
  const [year,month]=today.split('-').map(Number);
  const candidates=Array.from({length:36},(_,i)=>{const d=new Date(year,month-37+i,1);return monthKey(d.getFullYear(),d.getMonth()+1);});
  const confirmed=new Set(completeMonths);
  const history:Observation[]=candidates.filter(key=>confirmed.has(key)).map(key=>({month:key,value:transactions.filter(tx=>tx.type==='expense'&&!tx.recurringRuleId&&tx.date.startsWith(key)&&tx.date<=today&&Number.isSafeInteger(tx.amount)&&tx.amount>0).reduce((s,tx)=>s+tx.amount,0)}));
  const months=history.map(p=>p.month), supported=history.length>=2;
  const scores=Object.fromEntries((['mean','trend','seasonal'] as Model[]).map(model=>{
    const errors:number[]=[], baseline:number[]=[];
    for(let i=Math.max(3,history.length-6);i<history.length;i++) {
      const training=history.slice(0,i), predicted=estimate(training,history[i].month,model);
      if(predicted!==null) {errors.push(Math.abs(predicted-history[i].value));baseline.push(Math.abs(estimate(training,history[i].month,'mean')!-history[i].value));}
    }
    return [model,{mae:errors.length?average(errors):null,count:errors.length,baseline:average(baseline)}];
  })) as Record<Model,{mae:number|null;count:number;baseline:number}>;
  let model:Model='mean';
  for(const candidate of ['trend','seasonal'] as Model[]) {
    const score=scores[candidate];
    if(score.count>=3 && score.mae!==null && score.mae<score.baseline*.9 && (model==='mean'||score.mae<scores[model].mae!)) model=candidate;
  }
  const mean=average(history.slice(-6).map(p=>p.value));
  const deviation=average(history.slice(-6).map(p=>Math.abs(p.value-mean)));
  const start=period==='month'?new Date(year,month,1):period==='quarter'?new Date(year,Math.floor((month-1)/3)*3+3,1):new Date(year+1,0,1);
  const count=period==='month'?1:period==='quarter'?3:12;
  const projections=Array.from({length:count},(_,i)=>{
    const d=new Date(start.getFullYear(),start.getMonth()+i,1), key=monthKey(d.getFullYear(),d.getMonth()+1);
    const scheduled=rules.filter(r=>r.enabled&&r.type==='expense'&&monthlyDate(key,r.dayOfMonth)>=r.nextDueDate).reduce((s,r)=>s+r.amount,0);
    const variable=supported?Math.round(estimate(history,key,model)??mean):0;
    const spread=supported?Math.max(deviation,scores[model].mae??0,variable*.2):0;
    return {month:key,scheduled,variable,total:scheduled+variable,low:scheduled+Math.max(0,Math.round(variable-spread)),high:scheduled+Math.round(variable+spread)};
  });
  return {period,months,supported,model,backtestCount:scores[model].count,mae:scores[model].mae,unconfirmedCount:candidates.slice(-6).filter(m=>!confirmed.has(m)).length,projections,total:projections.reduce((s,p)=>s+p.total,0),scheduled:projections.reduce((s,p)=>s+p.scheduled,0),low:projections.reduce((s,p)=>s+p.low,0),high:projections.reduce((s,p)=>s+p.high,0)};
}
