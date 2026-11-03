import React, { useState } from 'react';
import { Category, CategoryActions, CategoryType } from '../types';
import { CategoryPicker } from './CategoryPicker';
import { useLanguage } from '../contexts/LanguageContext';
export const CategoryManager: React.FC<CategoryActions & {categories: Category[]}> = ({categories,...actions}) => {
  const {t}=useLanguage();
  const [type,setType]=useState<CategoryType>('expense');
  const [selected,setSelected]=useState('');
  return <section className="glass-card mb-4 space-y-4 rounded-3xl p-4">
    <h2 className="font-bold text-slate-900 dark:text-white">{t('categoryManagerTitle')}</h2>
    <div className="grid grid-cols-3 gap-2">{(['expense','income','lend'] as const).map(kind=><button type="button" key={kind} aria-pressed={kind===type} onClick={()=>{setType(kind);setSelected('');}} className={'min-h-11 rounded-xl px-2 text-sm font-semibold '+(kind===type?'bg-blue-600 text-white':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200')}>{t(kind==='lend'?'loan':kind)}</button>)}</div>
    <CategoryPicker categories={categories} type={type} value={selected} onChange={setSelected} {...actions}/>
  </section>;
};
