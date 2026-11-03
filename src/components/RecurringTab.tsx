import { confirmAction } from './Confirmation';
import { DateField } from './DateField';
import { IOSSelect } from './IOSSelect';
import React, { useEffect, useRef, useState } from 'react';
import { Account, Category, CategoryActions, RecurringRule, Transaction } from '../types';
import { CalendarDays, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { CategoryPicker } from './CategoryPicker';
import { useLanguage } from '../contexts/LanguageContext';
import { dueDates, isDue, isOccurrencePosted, localDateKey, localMonthKey, nextOccurrence, occurrenceNote, periodDates, validRecurringRule } from '../services/recurrence';

interface Props extends CategoryActions {
  accounts: Account[]; categories: Category[]; transactions: Transaction[];
  rules: RecurringRule[];
  onSaveRules: (rules: RecurringRule[]) => void;
  onAdd: (tx: Omit<Transaction,'id'|'createdAt'>) => void;
}
export const RecurringTab: React.FC<Props> = ({accounts,categories,transactions,rules,onSaveRules,onAdd,...categoryActions}) => {
  const {t,language}=useLanguage();
  const [now,setNow]=useState(()=>new Date());
  const [editing,setEditing]=useState<string|null>(null);
  const [title,setTitle]=useState('');
  const [amount,setAmount]=useState('');
  const [type,setType]=useState<'expense'|'income'>('expense');
  const [accountId,setAccountId]=useState(accounts[0]?.id||'');
  const [categoryId,setCategoryId]=useState('');
  const [frequency,setFrequency]=useState<'monthly'|'weekly'>('monthly');
  const [monthDays,setMonthDays]=useState<number[]>([1]);
  const [weekDays,setWeekDays]=useState<number[]>([new Date().getDay()]);
  const [time,setTime]=useState('08:00');
  const [startDate,setStartDate]=useState(localDateKey(new Date()));
  const [error,setError]=useState('');
  const submitted=useRef(new Set<string>());
  const form=useRef<HTMLFormElement>(null);
  const cats=categories.filter(c=>c.type===type);
  const dayOrder=[1,2,3,4,5,6,0];
  const dayName=(day:number)=>t('weekday'+day);
  const displayDate=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString(language==='vi'?'vi-VN':'en-GB');
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{if(!accounts.some(a=>a.id===accountId))setAccountId(accounts[0]?.id||'');},[accounts,accountId]);
  useEffect(()=>{if(!cats.some(c=>c.id===categoryId))setCategoryId(cats[0]?.id||'');},[categories,type,categoryId]);
  const toggle=(value:number,days:number[],set:(v:number[])=>void)=>set(days.includes(value)?days.filter(d=>d!==value):[...days,value].sort((a,b)=>a-b));
  const reset=()=>{setEditing(null);setTitle('');setAmount('');setError('');setFrequency('monthly');setMonthDays([1]);setWeekDays([new Date().getDay()]);setTime('08:00');setStartDate(localDateKey(new Date()));};
  const save=(e:React.FormEvent)=>{
    e.preventDefault();
    const previous=rules.find(r=>r.id===editing);
    const rule:RecurringRule={...previous,id:editing||crypto.randomUUID(),title:title.trim(),amount:Number(amount),type,accountId,categoryId,
      day:monthDays[0]||1,startMonth:previous?.startMonth||startDate.slice(0,7),frequency,
      daysOfMonth:frequency==='monthly'?monthDays:undefined,daysOfWeek:frequency==='weekly'?weekDays:undefined,time,startDate};
    if(!validRecurringRule(rule)||!accounts.some(a=>a.id===accountId)||!cats.some(c=>c.id===categoryId)||(frequency==='monthly'&&!monthDays.length)) {
      setError(t('recurringInvalid'));return;
    }
    try {onSaveRules(editing?rules.map(r=>r.id===editing?rule:r):[...rules,rule]);reset();}
    catch(e){setError(e instanceof Error?e.message:String(e));}
  };
  const edit=(rule:RecurringRule)=>{
    setEditing(rule.id);setTitle(rule.title);setAmount(String(rule.amount));setType(rule.type);setAccountId(rule.accountId);setCategoryId(rule.categoryId);
    setFrequency(rule.frequency||'monthly');setMonthDays(rule.daysOfMonth||[rule.day]);setWeekDays(rule.daysOfWeek||[new Date().getDay()]);
    setTime(rule.time||'00:00');setStartDate(rule.startDate||rule.startMonth+'-01');setError('');
    form.current?.scrollIntoView({behavior:'smooth',block:'start'});
  };
  const apply=(rule:RecurringRule,date:string)=>{
    const key=occurrenceNote(rule,date);const actualNow=new Date();
    if(submitted.current.has(key)||isOccurrencePosted(rule,date,transactions)){setError(t('occurrenceAlreadyPosted'));return;}
    if(!isDue(rule,date,actualNow)){setError(t('occurrenceNotDue'));return;}
    if(!accounts.some(a=>a.id===rule.accountId)||!categories.some(c=>c.id===rule.categoryId&&c.type===rule.type)){setError(t('recurringMissingSource'));return;}
    submitted.current.add(key);
    try {
      onAdd({type:rule.type,amount:rule.amount,accountId:rule.accountId,categoryId:rule.categoryId,date,description:rule.title,note:key,recurringOccurrenceId:rule.id+'/'+date});setError('');
    }catch(e){submitted.current.delete(key);setError(e instanceof Error?e.message:String(e));}
  };
  const remove=async(rule:RecurringRule)=>{if(!await confirmAction(t('deleteRecurringConfirm'), {destructive:true}))return;try{onSaveRules(rules.filter(r=>r.id!==rule.id));if(editing===rule.id)reset();setError('');}catch(e){setError(e instanceof Error?e.message:String(e));}};
  const control='form-control w-full min-h-11 min-w-0 rounded-xl px-3 py-2.5 text-sm';
  const label='block space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300';
  const choice=(selected:boolean)=>'min-h-11 rounded-xl border px-2 text-sm font-semibold transition '+(selected?'border-blue-500 bg-blue-600 text-white':'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200');
  return <div className="space-y-4 pb-8">
    <section className="glass-card rounded-3xl p-4 sm:p-5">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><CalendarDays size={22} className="text-blue-600 dark:text-sky-300"/>{t('recurringTitle')}</h2>
      <p className="mb-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t('recurringManualHint')}</p>
      <form ref={form} onSubmit={save} className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">{t(editing?'editRecurring':'createRecurring')}</h3>
        <label className={label}>{t('recurringName')}<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} className={control}/></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={label}>{t('transactionType')}<IOSSelect label={t('transactionType')} value={type} onChange={e=>setType(e.target.value as 'expense'|'income')} className={control}><option value="expense">{t('expense')}</option><option value="income">{t('income')}</option></IOSSelect></label>
          <label className={label}>{t('amountVnd')}<input type="number" inputMode="numeric" min="1" step="1" required value={amount} onChange={e=>setAmount(e.target.value)} className={control}/></label>
          <label className={label}>{t('account')}<IOSSelect label={t('account')} value={accountId} onChange={e=>setAccountId(e.target.value)} className={control}>{accounts.map(a=><option key={a.id} value={a.id} data-icon={a.iconName} data-color={a.color}>{a.name}</option>)}</IOSSelect></label>
          <CategoryPicker categories={categories} type={type} value={categoryId} onChange={setCategoryId} {...categoryActions}/>
        </div>
        <fieldset><legend className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{t('repeatFrequency')}</legend>
          <div className="grid grid-cols-2 gap-2">{(['weekly','monthly'] as const).map(f=><button type="button" key={f} aria-pressed={frequency===f} className={choice(frequency===f)} onClick={()=>setFrequency(f)}>{t(f)}</button>)}</div>
        </fieldset>
        <fieldset><legend className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{t(frequency==='weekly'?'chooseWeekdays':'chooseMonthDays')}</legend>
          <div className="grid grid-cols-7 gap-1.5">
            {(frequency==='weekly'?dayOrder:Array.from({length:31},(_,i)=>i+1)).map(day=><button type="button" key={day}
              aria-label={frequency==='weekly'?dayName(day):t('dayOfMonth',{day})} aria-pressed={(frequency==='weekly'?weekDays:monthDays).includes(day)}
              className={choice((frequency==='weekly'?weekDays:monthDays).includes(day))}
              onClick={()=>frequency==='weekly'?toggle(day,weekDays,setWeekDays):toggle(day,monthDays,setMonthDays)}>{frequency==='weekly'?dayName(day):day}</button>)}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t(frequency==='monthly'?'monthEndHint':'multiDayHint')}</p>
        </fieldset>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={label}>{t('executionTime')}<DateField label={t('executionTime')} type="time" required value={time} onChange={e=>setTime(e.target.value)} className={control}/></label>
          <label className={label}>{t('scheduleStartDate')}<DateField label={t('scheduleStartDate')} type="date" required value={startDate} onChange={e=>setStartDate(e.target.value)} className={control}/></label>
        </div>
        <div className="flex gap-2">
          {editing&&<button type="button" onClick={reset} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-200">{t('cancel')}</button>}
          <button type="submit" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-semibold text-white"><Plus size={18}/>{t(editing?'saveChanges':'createRecurring')}</button>
        </div>
      </form>
    </section>
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
    <div className="space-y-3">{rules.length===0?<p className="p-5 text-center text-sm text-slate-500 dark:text-slate-400">{t('noRecurringRules')}</p>:rules.map(rule=>{
      const due=dueDates(rule,now,transactions).filter(date=>!submitted.current.has(occurrenceNote(rule,date)));
      const next=nextOccurrence(rule,now,transactions);
      const summary=rule.frequency==='weekly'?dayOrder.filter(d=>rule.daysOfWeek?.includes(d)).map(dayName).join(', '):(rule.daysOfMonth||[rule.day]).join(', ');
      return <article key={rule.id} className="glass-card space-y-3 rounded-2xl p-4">
        <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><h3 className="break-words font-semibold text-slate-900 dark:text-white">{rule.title}</h3><p className="mt-1 text-sm font-bold text-blue-700 dark:text-sky-300">{rule.amount.toLocaleString(language==='vi'?'vi-VN':'en-GB')} ₫</p></div>
          <button type="button" onClick={()=>edit(rule)} aria-label={t('editRecurring')+': '+rule.title} className="min-h-11 min-w-11 rounded-xl p-3 text-blue-600 dark:text-sky-300"><Pencil size={18}/></button>
          <button type="button" onClick={()=>remove(rule)} aria-label={t('delete')+': '+rule.title} className="min-h-11 min-w-11 rounded-xl p-3 text-rose-600 dark:text-rose-300"><Trash2 size={18}/></button>
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300"><Clock size={15} className="shrink-0"/>{t(rule.frequency==='weekly'?'weekly':'monthly')}: {summary} · {rule.time||'00:00'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{accounts.find(a=>a.id===rule.accountId)?.name||t('recurringMissingSource')} · {categories.find(c=>c.id===rule.categoryId)?.name}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300">{due.length?t('dueOccurrenceCount',{count:due.length}):next?t('nextOccurrence',{date:displayDate(next),time:rule.time||'00:00'}):t('noPendingOccurrences')}</p>
        {due.length>0&&<button type="button" onClick={()=>apply(rule,due[0])} className="min-h-11 w-full rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white">{t('recordOccurrence',{date:displayDate(due[0])})}</button>}
        <details className="text-xs text-slate-600 dark:text-slate-300"><summary className="min-h-11 cursor-pointer py-3">{t('viewCurrentOccurrences')}</summary><div className="space-y-2">{periodDates(rule,now).map(date=><div key={date} className="flex items-center justify-between gap-2 rounded-xl bg-slate-100 p-2 dark:bg-slate-900"><span>{displayDate(date)} · {rule.time||'00:00'}</span><span>{t(isOccurrencePosted(rule,date,transactions)||submitted.current.has(occurrenceNote(rule,date))?'occurrencePosted':isDue(rule,date,now)?'occurrenceDue':'occurrenceUpcoming')}</span></div>)}</div></details>
      </article>;
    })}</div>
  </div>;
};
