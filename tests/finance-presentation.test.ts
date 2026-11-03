import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {compareMonthToDate} from '../src/services/financePresentation';
import {OverviewTab} from '../src/components/OverviewTab';
import {LanguageProvider} from '../src/contexts/LanguageContext';
import type {Transaction} from '../src/types';
const tx = (date:string,amount:number,type:Transaction['type']='expense'):Transaction => ({id:date,type,amount,date,accountId:'cash',categoryId:'food',description:'Meal',createdAt:date});
test('month comparison uses elapsed local days, crosses years, ignores internal transfers and future dates',()=>{
  const data=[tx('2025-12-01',100),tx('2025-12-20',500),tx('2026-01-01',150),tx('2026-01-10',700),tx('2026-01-01',999,'transfer')];
  assert.deepEqual(compareMonthToDate(data,new Date(2026,0,3)),{income:null,expense:50});
});
test('comparison clamps previous February and represents zero baseline as unavailable',()=>{
  assert.equal(compareMonthToDate([tx('2026-02-28',100),tx('2026-03-31',200)],new Date(2026,2,31)).expense,100);
  assert.equal(compareMonthToDate([tx('2026-03-01',200)],new Date(2026,2,2)).expense,null);
});
test('hidden home never exposes amounts in transactions, chart tooltips or forecast',()=>{
  Object.defineProperty(globalThis,'localStorage',{value:{getItem:()=>null},configurable:true});
  const noop=()=>{};
  const html=renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(OverviewTab,{
    accounts:[{id:'cash',name:'Cash',type:'cash',balance:1234567,currency:'VND',iconName:'Wallet',color:'#1677ff'}],
    transactions:[tx('2026-11-01',654321)],categories:[],budgets:[],debts:[],assetsHidden:true,onToggleAssetsVisibility:noop,onOpenAdd:noop,onOpenAi:noop,onSelectTransaction:noop,onNavigateTab:noop
  })));
  assert.ok(!html.includes('1.234.567'));
  assert.ok(!html.includes('654.321'));
  assert.ok(html.includes('Quản lý tài sản'));
});
