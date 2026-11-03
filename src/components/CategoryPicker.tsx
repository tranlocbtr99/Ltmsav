import { confirmAction } from './Confirmation';
import { IOSSelect } from './IOSSelect';
import React, { useId, useState } from 'react';
import { Category, CategoryActions, CategoryType } from '../types';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { CATEGORY_PRESETS } from '../services/categoryCatalog';
import { useLanguage } from '../contexts/LanguageContext';
interface Props extends CategoryActions {
  categories: Category[];
  type: CategoryType;
  value: string;
  onChange: (id: string) => void;
  legacyCategoryId?: string;
}
export const CategoryPicker: React.FC<Props> = ({categories,type,value,onChange,legacyCategoryId,onCreateCategory,onUpdateCategory,onDeleteCategory}) => {
  const {t,language}=useLanguage();
  const id=useId();
  const [expanded,setExpanded]=useState(false);
  const [name,setName]=useState('');
  const [editing,setEditing]=useState<string|null>(null);
  const [error,setError]=useState('');
  const options=categories.filter(c=>c.type===type || (c.id===legacyCategoryId && type==='lend'));
  const run=(fn:()=>void)=>{try{fn();setError('');}catch(e){setError(e instanceof Error?e.message:String(e));}};
  const add=(entry?:typeof CATEGORY_PRESETS.expense[number])=>run(()=>{
    if(!onCreateCategory)return;
    const title=entry?entry[language]:name.trim();
    if(!title)return;
    if(editing && !entry){onUpdateCategory?.(editing,title);setEditing(null);}
    else {
      const existing=categories.find(c=>c.type===type&&c.name.toLocaleLowerCase()===title.toLocaleLowerCase());
      const created=existing||onCreateCategory({name:title,type,iconName:entry?.iconName||'Tag',color:entry?.color||'#6366F1'});
      onChange(created.id);
    }
    setName('');
  });
  return <div className="min-w-0 space-y-2">
    <label htmlFor={id} className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{t('category')}</label>
    <IOSSelect label={t('chooseCategory')} layout="grid" id={id} value={value} onChange={e=>onChange(e.target.value)} className="form-control w-full min-h-11 rounded-xl px-3 py-2.5 text-sm">
      <option value="">{t('chooseCategory')}</option>
      {options.map(c=><option key={c.id} value={c.id} data-icon={c.iconName} data-color={c.color}>{c.name}{c.type!==type?' ('+t('legacyCategory')+')':''}</option>)}
    </IOSSelect>
    {onCreateCategory&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)} className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-sky-300"><Plus size={16}/>{t('customizeCategories')}</button>}
    {expanded&&<div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('categoryTemplates')}</p>
      <div className="flex flex-wrap gap-2">{CATEGORY_PRESETS[type].map(entry=><button type="button" key={entry.vi} onClick={()=>add(entry)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">{entry[language]}</button>)}</div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor={id+'-name'}>{t(editing?'renameCategory':'manualCategory')}</label>
      <div className="flex gap-2">
        <input id={id+'-name'} value={name} onChange={e=>setName(e.target.value)} maxLength={80} placeholder={t('categoryName')} className="form-control min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}}}/>
        <button type="button" disabled={!name.trim()} onClick={()=>add()} aria-label={t(editing?'saveChanges':'addCategoryAction')} className="min-h-11 rounded-xl bg-blue-600 px-3 text-white disabled:opacity-40"><Check size={18}/></button>
        {editing&&<button type="button" aria-label={t('cancel')} onClick={()=>{setEditing(null);setName('');}} className="p-2 text-slate-500"><X size={18}/></button>}
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto">{categories.filter(c=>c.type===type).map(c=><div key={c.id} className="flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 break-words text-slate-800 dark:text-slate-100">{c.name}</span>
        {onUpdateCategory&&<button type="button" aria-label={t('renameCategory')+': '+c.name} className="min-h-11 min-w-11 p-2 text-blue-600 dark:text-sky-300" onClick={()=>{setEditing(c.id);setName(c.name);}}><Pencil size={16}/></button>}
        {onDeleteCategory&&<button type="button" aria-label={t('delete')+': '+c.name} className="min-h-11 min-w-11 p-2 text-rose-600 dark:text-rose-300" onClick={async()=>{if(await confirmAction(t('deleteCategoryConfirm',{name:c.name}), {destructive:true}))run(()=>{onDeleteCategory(c.id);if(value===c.id)onChange('');});}}><Trash2 size={16}/></button>}
      </div>)}</div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('categoryDeleteHint')}</p>
    </div>}
    {error&&<p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
  </div>;
};
