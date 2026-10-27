import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BottomNavBar } from '../src/components/Navigation';
import { AssetsTab } from '../src/components/AssetsTab';
import { OverviewTab } from '../src/components/OverviewTab';
import { LanguageProvider } from '../src/contexts/LanguageContext';

const noop = () => {};
function render(component: React.ReactNode) {
  Object.defineProperty(globalThis, 'localStorage', {configurable:true, value:{getItem:()=>null}});
  return renderToStaticMarkup(React.createElement(LanguageProvider, {children:component}));
}

test('rendered navigation exposes assets and AI with a selected asset state', () => {
  const html = render(React.createElement(BottomNavBar, {currentTab:'assets', onTabChange:noop, onOpenAdd:noop, isOnline:true}));
  assert.match(html, /aria-current="page" aria-label="Tài sản"/);
  assert.match(html, /aria-label="Nhập bằng AI"/);
  assert.equal((html.match(/<button/g)||[]).length,6);
});
test('home provides a visible manage assets entry even with the total hidden', () => {
  const html = render(React.createElement(OverviewTab, {accounts:[], transactions:[], categories:[], budgets:[], debts:[], assetsHidden:true, onToggleAssetsVisibility:noop, onOpenAdd:noop, onOpenAi:noop, onSelectTransaction:noop, onNavigateTab:noop}));
  assert.match(html,/Quản lý tài sản/);
  assert.match(html,/••••••/);
});
test('asset cards expose distinct labeled edit and balance actions', () => {
  const html = render(React.createElement(AssetsTab, {accounts:[{id:'a', name:'Techcombank', type:'bank', balance:100000, currency:'VND', iconName:'Landmark', color:'#10B981'}], debts:[], onAddAccount:noop, onEditAccount:noop, onAdjustBalance:noop, onAddDebtOrLoan:noop, onRecordPayment:noop, onDeleteAccount:noop}));
  assert.match(html,/aria-label="Chỉnh sửa tài sản: Techcombank"/);
  assert.match(html,/>Sửa thông tin</);
  assert.match(html,/aria-label="Điều chỉnh số dư: Techcombank"/);
});
