import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OverviewTab } from '../src/components/OverviewTab';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import type { Account } from '../src/types';

Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null }, configurable: true });

function render(balances: [Account['type'], number][], hidden = false) {
  const accounts = balances.map(([type, balance], i) => ({
    id: String(i), name: String(i), type, balance, currency: 'VND', iconName: 'Wallet', color: '#000',
  }));
  const noop = () => {};
  const html = renderToStaticMarkup(React.createElement(LanguageProvider, null,
    React.createElement(OverviewTab, {
      accounts, assetsHidden: hidden, onToggleAssetsVisibility: noop,
      transactions: [], categories: [], budgets: [], debts: [],
      onOpenAdd: noop, onOpenAi: noop, onSelectTransaction: noop, onNavigateTab: noop,
    })));
  return html.slice(html.indexOf('<section'), html.indexOf('</section>'));
}

test('home shows available balance after subtracting all savings accounts', () => {
  const hero = render([['cash', 2000000], ['bank', 6000000], ['savings', 3000000], ['savings', 1000000], ['credit', -500000]]);
  assert.match(hero, /11\.500\.000/);
  assert.match(hero, /7\.500\.000/);
  assert.match(hero, /4\.000\.000/);
});
test('empty accounts, no savings and negative available balances', () => {
  assert.match(render([]), />0 /);
  assert.match(render([['bank', 1234567]]), /1\.234\.567/);
  assert.match(render([['savings', 5000000], ['credit', -250000]]), /-250\.000/);
});
test('eye toggle masks total, available and savings balances', () => {
  const hero = render([['bank', 2345678], ['savings', 1111111]], true);
  for (const amount of ['3.456.789', '2.345.678', '1.111.111']) assert.ok(!hero.includes(amount));
  assert.equal(hero.split('••••••').length - 1, 3);
});
