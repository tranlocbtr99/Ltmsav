import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, ChevronDown, Search, X} from 'lucide-react';
import {DynamicIcon} from './DynamicIcon';
import {useLanguage} from '../contexts/LanguageContext';
import {useDialogFocus} from '../hooks/useDialogFocus';

type Option = {value: string; label: string; disabled?: boolean; icon: string; color?: string; detail?: string; subtitle?: string};
type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'multiple' | 'size'> & {
  label?: string;
  layout?: 'list' | 'grid';
  onChange?: (event: {target: {value: string}}) => void;
};
const plainText = (node: React.ReactNode): string => React.Children.toArray(node).map(child => typeof child === 'string' || typeof child === 'number' ? String(child) : React.isValidElement<{children?: React.ReactNode}>(child) ? plainText(child.props.children) : '').join('');
const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase();

/** App-owned selector: option elements are configuration, never native Android UI. */
export function IOSSelect({label, layout='list', children, value, onChange, id, className='', disabled, required, 'aria-label': ariaLabel}: Props) {
  const {t}=useLanguage();
  const uid=useId(), triggerId=id || uid;
  const [open,setOpen]=useState(false);
  const options=useMemo(() => React.Children.toArray(children).filter(React.isValidElement).map(child => {
    const props=(child as React.ReactElement<Record<string,unknown>>).props;
    return {value:String(props.value ?? ''),label:plainText(props.children as React.ReactNode),disabled:!!props.disabled,
      icon:String(props['data-icon'] || 'CircleDollarSign'),color:props['data-color'] as string|undefined,
      detail:props['data-detail'] as string|undefined,subtitle:props['data-subtitle'] as string|undefined};
  }),[children]);
  const selected=options.find(option=>option.value === String(value ?? ''));
  const title=label || ariaLabel || t('chooseOption');
  return <>
    <button id={triggerId} type="button" role="combobox" aria-label={label || ariaLabel}
      aria-expanded={open} aria-describedby={uid+'-value'} aria-haspopup="dialog" aria-controls={open ? uid+'-sheet' : undefined}
      aria-required={required || undefined} disabled={disabled} onClick={()=>setOpen(true)}
      className={`ios-select-trigger ${className}`}>
      {selected?.icon && <span className="ios-field-icon" aria-hidden="true"><DynamicIcon name={selected.icon} className="w-5 h-5"/></span>}
      <span id={uid+'-value'} className="ios-field-copy"><span className="ios-field-value">{selected?.label || t('chooseOption')}</span>{selected?.detail && <span className="ios-field-detail tabular-nums">{selected.detail}</span>}</span>
      <ChevronDown size={18} className="ios-field-chevron" aria-hidden="true"/>
    </button>
    {open && <SelectionSheet id={uid+'-sheet'} title={title} options={options} value={String(value ?? '')} layout={layout}
      onClose={()=>setOpen(false)} onPick={next=>{onChange?.({target:{value:next}});setOpen(false);}}/>}
  </>;
}
function SelectionSheet({id,title,options,value,layout,onClose,onPick}:{id:string;title:string;options:Option[];value:string;layout:'list'|'grid';onClose:()=>void;onPick:(value:string)=>void}) {
  const {t}=useLanguage();
  const [query,setQuery]=useState('');
  const ref=useDialogFocus(true,onClose);
  const dragStart=useRef<{x:number;y:number}|null>(null);
  const filtered=options.filter(option=>option.value !== '' && fold(option.label+' '+(option.subtitle || '')).includes(fold(query.trim())));
  useEffect(()=>{
    const root=document.getElementById('root');
    if (!root) return;
    const previous=root.inert; root.inert=true;
    return ()=>{root.inert=previous;};
  },[]);
  const moveOption=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)'));
    const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
    const offset=event.key==='ArrowDown' && layout==='grid' ? 3 : event.key==='ArrowUp' && layout==='grid' ? -3 : ['ArrowUp','ArrowLeft'].includes(event.key) ? -1 : 1;
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+offset));
    if(buttons[next]){event.preventDefault();buttons[next].focus();}
  };
  return createPortal(<div className="ios-picker-overlay" onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div ref={ref} id={id} role="dialog" aria-modal="true" aria-labelledby={id+'-title'} className="ios-picker-sheet">
      <header className="ios-picker-header"
        onTouchStart={event=>{dragStart.current={x:event.touches[0].clientX,y:event.touches[0].clientY};}}
        onTouchEnd={event=>{const start=dragStart.current;if(start && event.changedTouches[0].clientY-start.y>70 && Math.abs(event.changedTouches[0].clientX-start.x)<50)onClose();dragStart.current=null;}}>
        <div className="ios-picker-grabber" aria-hidden="true"/>
        <div className="ios-picker-heading"><div><h2 id={id+'-title'}>{title}</h2><p>{t('pickerChoiceHint')}</p></div>
          <button type="button" className="ios-picker-close" aria-label={t('closePicker')} onClick={onClose}><X size={20}/></button>
        </div>
        {options.length>5 && <div className="ios-picker-search"><Search size={18} aria-hidden="true"/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} aria-label={t('searchOptions')} placeholder={t('searchOptions')}/>{query && <button type="button" onClick={()=>setQuery('')} aria-label={t('clearFilter')}><X size={16}/></button>}</div>}
      </header>
      <div className="ios-picker-scroll">
        <div role="listbox" aria-label={title} onKeyDown={moveOption} className={`ios-picker-options ios-picker-${layout}`}>
          {filtered.map(option=><button key={option.value} type="button" role="option" aria-label={option.label} aria-selected={option.value===value} disabled={option.disabled}
            onClick={()=>onPick(option.value)} className="ios-picker-option">
            <span className="ios-option-icon" style={{'--option-color':option.color || '#1677ff'} as React.CSSProperties} aria-hidden="true"><DynamicIcon name={option.icon} className="w-6 h-6"/></span>
            <span className="ios-option-copy"><span className="ios-option-name">{option.label}</span>{option.subtitle && <span className="ios-option-subtitle">{option.subtitle}</span>}</span>
            {option.detail && <span className="ios-option-detail tabular-nums">{option.detail}</span>}
            <span className="ios-option-check" aria-hidden="true">{option.value===value && <Check size={15} strokeWidth={3}/>}</span>
          </button>)}
        </div>
        {filtered.length===0 && <div className="ios-picker-empty" role="status"><Search size={28} aria-hidden="true"/><strong>{t('noOptionsFound')}</strong><p>{t('tryAnotherSearch')}</p></div>}
      </div>
    </div>
  </div>,document.body);
}
