import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock, Plus, Pause, Play, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react';
import type { Account, Category, RecurringTransaction, RecurringInput } from '../types';
import { localDate } from '../services/date';
import { monthlyDate } from '../services/recurrence';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  rules: RecurringTransaction[];
  accounts: Account[];
  categories: Category[];
  onSave: (input: RecurringInput, id?: string) => Promise<void>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const RecurringTransactionsTab: React.FC<Props> = ({rules, accounts, categories, onSave, onToggle, onDelete}) => {
  const {t, language} = useLanguage();
  const [editing, setEditing] = useState<RecurringTransaction | 'new' | null>(null);
  const [error, setError] = useState('');
  const action = (fn:()=>void) => {try {setError(''); fn();} catch (e) {setError((e as Error).message);} };
  return <div className="space-y-4 pb-8">
    <div className="ios-page-heading"><div><p className="ios-eyebrow">{t('monthlySchedule')}</p><h1 className="!text-[25px]">{t('recurringTitle')}</h1></div>
      <button type="button" onClick={()=>setEditing('new')} className="ios-add-button" aria-label={t('addRecurring')}><Plus size={22}/></button></div>
    <div className="glass-panel p-4 flex gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300"><CalendarClock size={20} className="shrink-0 text-blue-500"/><p>{t('recurringExplanation')}</p></div>
    {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
    {!rules.length && <div className="glass-card p-8 text-center space-y-3"><CalendarClock size={34} className="mx-auto text-blue-500"/><h2 className="font-bold">{t('recurringEmpty')}</h2><p className="text-xs text-slate-500 dark:text-slate-400">{t('recurringExamples')}</p><button type="button" onClick={()=>setEditing('new')} className="rounded-full bg-blue-600 text-white text-sm px-5 py-3 font-semibold">{t('addRecurring')}</button></div>}
    {rules.map(rule=><section key={rule.id} className="glass-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-bold break-words">{rule.description}</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{accounts.find(a=>a.id===rule.accountId)?.name || t('missingAccount')} · {categories.find(c=>c.id===rule.categoryId)?.name || t('other')}</p></div>
      <span className={`font-bold tabular-nums shrink-0 text-sm ${rule.type==='income'?'text-emerald-600 dark:text-emerald-400':'text-rose-600 dark:text-rose-400'}`}>{rule.type==='income'?'+':'−'}{rule.amount.toLocaleString(language==='vi'?'vi-VN':'en-US')}₫</span></div>
      <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 px-3 py-1.5">{t('monthlyOnDay',{day:rule.dayOfMonth})}</span><span className="text-slate-500 dark:text-slate-400">{rule.enabled?t('recurringNext',{date:rule.nextDueDate.split('-').reverse().join('/')}):t('recurringPaused')}</span></div>
      {rule.enabled && rule.nextDueDate<=localDate() && <p className="text-xs text-amber-700 dark:text-amber-300 flex gap-1.5"><AlertCircle size={15} className="shrink-0"/>{t('recurringPending')}</p>}
      <div className="flex justify-end gap-1 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
        <button type="button" className="ios-tool" aria-label={`${rule.enabled?t('pauseRecurring'):t('resumeRecurring')}: ${rule.description}`} onClick={()=>action(()=>onToggle(rule.id))}>{rule.enabled?<Pause size={18}/>:<Play size={18}/>}</button>
        <button type="button" className="ios-tool" aria-label={`${t('edit')}: ${rule.description}`} onClick={()=>setEditing(rule)}><Pencil size={17}/></button>
        <button type="button" className="ios-tool !text-rose-500" aria-label={`${t('delete')}: ${rule.description}`} onClick={()=>{if(window.confirm(t('deleteRecurringConfirm')))action(()=>onDelete(rule.id));}}><Trash2 size={17}/></button>
      </div>
    </section>)}
    {editing && <RecurringEditor key={editing==='new'?'new':editing.id} rule={editing==='new'?undefined:editing} accounts={accounts} categories={categories} onSave={onSave} onClose={()=>setEditing(null)}/>}
  </div>, document.body);
};

function RecurringEditor({rule, accounts, categories, onSave, onClose}: {rule?:RecurringTransaction;accounts:Account[];categories:Category[];onSave:Props['onSave'];onClose:()=>void}) {
  const {t}=useLanguage();const today=localDate();
  const [type,setType]=useState<'income'|'expense'>(rule?.type??'expense');
  const [description,setDescription]=useState(rule?.description??'');const [amount,setAmount]=useState(String(rule?.amount??''));
  const [accountId,setAccount]=useState(rule?.accountId??accounts[0]?.id??'');
  const [categoryId,setCategory]=useState(rule?.categoryId??categories.find(c=>c.type==='expense')?.id??'');
  const [day,setDay]=useState(rule?.dayOfMonth??Number(today.slice(-2)));const [month,setMonth]=useState(rule?.nextDueDate.slice(0,7)??today.slice(0,7));
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const fields='w-full rounded-2xl px-3 py-3 bg-white/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white';
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try {
    await onSave({type,description,amount:Number(amount),accountId,categoryId,dayOfMonth:day,nextDueDate:monthlyDate(month,day),enabled:rule?.enabled??true},rule?.id);onClose();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return createPortal(<div className="fixed inset-0 z-[100] text-slate-900 dark:text-slate-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-labelledby="recurring-editor-title" onKeyDown={e=>{if(e.key==='Escape'&&!busy)onClose();}}>
    <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[30px] space-y-4">
      <div className="flex items-center justify-between gap-2"><h2 id="recurring-editor-title" className="text-lg font-bold">{rule?t('editRecurring'):t('addRecurring')}</h2><button type="button" disabled={busy} onClick={onClose} className="ios-tool" aria-label={t('close')}><X size={20}/></button></div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">{(['expense','income'] as const).map(value=><button key={value} type="button" aria-pressed={type===value} onClick={()=>{setType(value);setCategory(categories.find(c=>c.type===value)?.id??'');}} className={`rounded-full p-3 text-sm font-semibold ${type===value?'bg-blue-600 text-white':'bg-slate-100 dark:bg-slate-800'}`}>{t(value)}</button>)}</div>
        <label className="block text-xs font-semibold space-y-1"><span>{t('recurringName')}</span><input autoFocus required maxLength={100} value={description} onChange={e=>setDescription(e.target.value)} className={fields}/></label>
        <label className="block text-xs font-semibold space-y-1"><span>{t('recurringAmount')}</span><input required type="number" inputMode="numeric" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} className={fields}/></label>
        <label className="block text-xs font-semibold space-y-1"><span>{t('recurringAccount')}</span><select required value={accountId} onChange={e=>setAccount(e.target.value)} className={fields}><option value="" disabled>{t('recurringChooseAccount')}</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label className="block text-xs font-semibold space-y-1"><span>{t('category')}</span><select required value={categoryId} onChange={e=>setCategory(e.target.value)} className={fields}><option value="" disabled>{t('recurringChooseCategory')}</option>{categories.filter(c=>c.type===type).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold space-y-1"><span>{t('recurringDay')}</span><input type="number" required min="1" max="31" step="1" value={day} onChange={e=>setDay(Number(e.target.value))} className={fields}/></label>
        <label className="block text-xs font-semibold space-y-1 min-w-0"><span>{t('recurringFirstMonth')}</span><input type="month" required min={today.slice(0,7)} value={month} onChange={e=>setMonth(e.target.value)} className={fields}/></label></div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t('recurringCalendarHint')}</p>
        {error&&<p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
        <button type="submit" disabled={busy||!accounts.length} className="w-full rounded-full py-3 bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2"><Check size={18}/>{busy?t('recurringSaving'):t('saveRecurring')}</button>
      </form>
    </div>
  </div>, document.body);
}
