import React, {useEffect,useId,useState} from 'react';
import {createPortal} from 'react-dom';
import {CalendarDays,Clock,ChevronLeft,ChevronRight,X} from 'lucide-react';
import {localDateKey} from '../services/recurrence';
import {useDialogFocus} from '../hooks/useDialogFocus';
import {useLanguage} from '../contexts/LanguageContext';
type Props=Omit<React.InputHTMLAttributes<HTMLInputElement>,'onChange'|'type'|'value'> & {type:'date'|'time';value:string;label?:string;onChange:(e:{target:{value:string}})=>void};
export function DateField({type,value,label,onChange,id,className='',required,min,max,'aria-label':ariaLabel}:Props){
  const {t,language}=useLanguage();const uid=useId();const [open,setOpen]=useState(false);
  const title=label || ariaLabel || t(type==='date'?'transactionDate':'executionTime');
  const dateValue=new Date(value+'T12:00:00');
  const formatted=value && type==='date' ? (!isNaN(dateValue.getTime()) ? dateValue.toLocaleDateString(language==='vi'?'vi-VN':'en-GB') : '') : value;
  const Icon=type==='date'?CalendarDays:Clock;
  return <><button type="button" id={id || uid} role="combobox" aria-label={title} aria-expanded={open} aria-haspopup="dialog" aria-required={required || undefined} aria-describedby={uid+'-value'} className={`ios-select-trigger silver-date-trigger ${className}`} onClick={()=>setOpen(true)}><span className="ios-field-icon"><Icon size={20}/></span><span id={uid+'-value'} className="ios-field-copy">{formatted || t('chooseOption')}</span><ChevronRight size={18}/></button>
    {open && <DateSheet {...{type,value,title,min:String(min||''),max:String(max||''),required,onChange}} onClose={()=>setOpen(false)}/>}</>;
}
function DateSheet({type,value,title,min,max,required,onChange,onClose}:{type:'date'|'time';value:string;title:string;min:string;max:string;required?:boolean;onChange:Props['onChange'];onClose:()=>void}){
  const {t,language}=useLanguage();const today=localDateKey(new Date());
  const [draft,setDraft]=useState(value || (type==='date'?today:'08:00'));
  const parsed=type==='date' && /^\d{4}-\d{2}-\d{2}$/.test(draft)?new Date(draft+'T12:00:00'):new Date();
  const initial=isNaN(parsed.getTime())?new Date():parsed;
  const [month,setMonth]=useState(new Date(initial.getFullYear(),initial.getMonth(),1));
  const ref=useDialogFocus(true,onClose);
  useEffect(()=>{const root=document.getElementById('root');if(!root)return;const before=root.inert;root.inert=true;return()=>{root.inert=before;};},[]);
  const allowed=(key:string)=>(!min||key>=min)&&(!max||key<=max);
  const valid=type==='date'?/^\d{4}-\d{2}-\d{2}$/.test(draft)&&localDateKey(new Date(draft+'T12:00:00'))===draft&&allowed(draft):/^([01]\d|2[0-3]):[0-5]\d$/.test(draft);
  const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const choose=(key:string)=>{if(allowed(key)){setDraft(key);const d=new Date(key+'T12:00:00');setMonth(new Date(d.getFullYear(),d.getMonth(),1));}};
  return createPortal(<div className="ios-picker-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="ios-picker-sheet silver-calendar-sheet"><header className="ios-picker-header"><div className="ios-picker-grabber"/><div className="ios-picker-heading"><h2>{title}</h2><button type="button" className="ios-picker-close" onClick={onClose} aria-label={t('closePicker')}><X size={20}/></button></div></header><div className="ios-picker-scroll">
    {type==='date'?<><div className="silver-calendar-month"><button type="button" aria-label={t('previousMonth')} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft/></button><strong>{month.toLocaleDateString(language==='vi'?'vi-VN':'en-GB',{month:'long',year:'numeric'})}</strong><button type="button" aria-label={t('nextMonth')} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight/></button></div>
      <div className="silver-calendar-grid">{[0,1,2,3,4,5,6].map(day=><span key={'w'+day} className="silver-weekday">{t('weekday'+day)}</span>)}{Array.from({length:month.getDay()},(_,i)=><span key={'empty'+i}/>)}{Array.from({length:days},(_,i)=>{const key=localDateKey(new Date(month.getFullYear(),month.getMonth(),i+1));return <button key={key} type="button" aria-label={key} disabled={!allowed(key)} aria-pressed={draft===key} data-today={key===today || undefined} onClick={()=>setDraft(key)}>{i+1}</button>;})}</div>
      <div className="silver-calendar-shortcuts"><button type="button" disabled={!allowed(today)} onClick={()=>choose(today)}>{t('today')}</button><button type="button" disabled={!allowed(localDateKey(new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()-1)))} onClick={()=>choose(localDateKey(new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()-1)))}>{t('yesterday')}</button></div></>:
      <div className="silver-time-fields"><label>{t('hoursLabel')}<input inputMode="numeric" maxLength={2} aria-label={t('hoursLabel')} value={draft.split(':')[0] || ''} onChange={e=>setDraft(e.target.value.replace(/\D/g,'')+':'+(draft.split(':')[1] || '00'))} onBlur={()=>setDraft(d=>d.split(':')[0].padStart(2,'0')+':'+(d.split(':')[1]||'00'))}/></label><span>:</span><label>{t('minutesLabel')}<input inputMode="numeric" maxLength={2} aria-label={t('minutesLabel')} value={draft.split(':')[1] || ''} onChange={e=>setDraft((draft.split(':')[0]||'08')+':'+e.target.value.replace(/\D/g,''))} onBlur={()=>setDraft(d=>(d.split(':')[0]||'08')+':'+(d.split(':')[1]||'').padStart(2,'0'))}/></label></div>}
    <div className="silver-calendar-actions">{!required && <button type="button" onClick={()=>{onChange({target:{value:''}});onClose();}}>{t('clearChoice')}</button>}<button type="button" onClick={onClose}>{t('cancel')}</button><button type="button" className="is-primary" disabled={!valid} onClick={()=>{onChange({target:{value:draft}});onClose();}}>{t('confirmActionLabel')}</button></div>
  </div></div></div>,document.body);
}
