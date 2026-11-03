import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { CategoryManager } from '../src/components/CategoryManager';
import { CategoryPicker } from '../src/components/CategoryPicker';
import { AddTransactionModal } from '../src/components/AddTransactionModal';
import { EditTransactionModal } from '../src/components/EditTransactionModal';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { Category, Transaction } from '../src/types';
const categories:Category[]=[
  {id:'expense',name:'Ăn uống',type:'expense',iconName:'Utensils',color:'#F59E0B'},
  {id:'income',name:'Lương',type:'income',iconName:'Briefcase',color:'#10B981'},
  {id:'lend',name:'Bạn bè',type:'lend',iconName:'Users',color:'#3B82F6'},
];
const noop=()=>{};
const render=(children:React.ReactNode)=>{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null}});
  return renderToStaticMarkup(React.createElement(LanguageProvider,{children}));
};
test('category picker separates lending from expense and income options',()=>{
  const html=render(React.createElement(CategoryPicker,{categories,type:'lend',value:'lend',onChange:noop}));
  assert.match(html,/>Bạn bè</);
  assert.doesNotMatch(html,/>Ăn uống</);
  assert.doesNotMatch(html,/>Lương</);
});
test('historical loan may still display its existing expense category',()=>{
  const html=render(React.createElement(CategoryPicker,{categories,type:'lend',value:'expense',legacyCategoryId:'expense',onChange:noop}));
  assert.match(html,/Ăn uống/);
  assert.match(html,/danh mục cũ/);
});
test('category manager exposes all three category types in Personal',()=>{
  const html=render(React.createElement(CategoryManager,{categories}));
  assert.match(html,/Quản lý danh mục/);
  assert.match(html,/Chi tiêu/);
  assert.match(html,/Thu nhập/);
  assert.match(html,/Cho vay/);
});
test('add and edit sheets use shared theme surface and a real submit form',()=>{
  const account={id:'a',name:'Cash',type:'cash' as const,balance:1000,currency:'VND',iconName:'Wallet',color:'#10B981'};
  const add=render(React.createElement(AddTransactionModal,{accounts:[account],categories,isOpen:true,onClose:noop,onAdd:noop}));
  const transaction:Transaction={id:'tx',type:'lend',accountId:'a',categoryId:'expense',amount:100,date:'2026-11-03',description:'Old loan',createdAt:'2026-11-03'};
  const edit=render(React.createElement(EditTransactionModal,{accounts:[account],categories,transaction,isOpen:true,onClose:noop,onSave:noop,onDelete:noop}));
  for(const html of [add,edit]){
    assert.match(html,/role="dialog"/);
    assert.match(html,/transaction-dialog/);
    assert.match(html,/type="submit" form=/);
    assert.doesNotMatch(html,/from-\[#f7fcff\]/);
  }
  const css=readFileSync('src/index.css','utf8');
  assert.match(css,/html\.dark \.transaction-dialog/);
  assert.match(css,/color-scheme: dark/);
});
