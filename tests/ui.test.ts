import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis,'localStorage',{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},configurable:true});
(globalThis as any).document={documentElement:{lang:''}};
const { LanguageProvider } = await import('../src/contexts/LanguageContext');
const { AddTransactionModal } = await import('../src/components/AddTransactionModal');
const { EditTransactionModal } = await import('../src/components/EditTransactionModal');
const tx={ id:'t',type:'expense' as const,amount:10,accountId:'a',categoryId:'c',date:'2026-10-24',description:'test',createdAt:'' };
test('add dialog opens, closes, reopens without changing hook order', async()=>{
 let root:any; const render=(isOpen:boolean)=>React.createElement(LanguageProvider,null,React.createElement(AddTransactionModal,{accounts:[],categories:[],isOpen,onClose:()=>{},onAdd:()=>{}}));
 await act(async()=>{root=create(render(false));});
 for(const open of [true,false,true]) await act(async()=>{root.update(render(open));});
 assert.ok(root.toJSON()); await act(async()=>root.unmount());
});
test('edit dialog opens, closes, reopens without changing hook order',async()=>{
 let root:any; const render=(open:boolean)=>React.createElement(LanguageProvider,null,React.createElement(EditTransactionModal,{accounts:[],categories:[],isOpen:open,transaction:open?tx:null,onClose:()=>{},onSave:()=>{},onDelete:()=>{}}));
 await act(async()=>{root=create(render(false));});
 for(const open of [true,false,true])await act(async()=>root.update(render(open)));
 assert.ok(root.toJSON());await act(async()=>root.unmount());
});
