import {test} from 'node:test';
import assert from 'node:assert/strict';
import {processAiMessage, validateAiResponse} from '../src/services/aiParser';
import {Account, Category} from '../src/types';
const accounts:Account[]=[{id:'a',name:'Tiền mặt',balance:123456,type:'cash',currency:'VND',iconName:'Wallet',color:'#000'}];
const categories:Category[]=[{id:'c',name:'Ăn uống',type:'expense',iconName:'Tag',color:'#000'}];
const context={transactions:[],recurring:[],budgets:[]};
test('balance and forecasting questions use actual local data without network calls or writes',async()=>{
 const previous=globalThis.fetch; let calls=0;globalThis.fetch=(async()=>{calls++;throw new Error('network forbidden')}) as typeof fetch;
 try{
  const r=await processAiMessage('Số dư còn bao nhiêu?',accounts,categories,undefined,context);
  assert.match(r.answer!,/123\.456/);assert.equal(r.commands?.length,0);
  const f=await processAiMessage('Dự báo chi tiêu quý tiếp theo',accounts,categories,undefined,context);
  assert.match(f.answer!,/Chưa đủ 2 tháng/);assert.equal(f.commands?.length,0);assert.equal(calls,0);
 }finally{globalThis.fetch=previous;}
});
test('untrusted model commands reject bad account, category, date, currency and amount',()=>{
 const c={kind:'expense',amount:50000,currency:'VND',account:'Tiền mặt',category:'Ăn uống',date:'2026-10-24',description:'Lunch'};
 const response=(cmd:object)=>({analysis:'ok',intent:'create_expense',needs_confirmation:false,commands:[cmd]});
 assert.equal(validateAiResponse(response(c),accounts,categories).needs_confirmation,true);
 for(const patch of [{account:'Unknown'},{category:'Unknown'},{date:'2026-02-31'},{amount:NaN},{amount:-1},{amount:1.5},{currency:'USD'},{kind:'other'},{kind:'transfer',account_to:'Tiền mặt'}]) assert.throws(()=>validateAiResponse(response({...c,...patch}),accounts,categories));
});
