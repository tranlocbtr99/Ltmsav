import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('AI transaction entry remains visible and routes to the AI transaction screen', () => {
  const navigation = readFileSync('src/components/Navigation.tsx', 'utf8');
  const app = readFileSync('src/App.tsx', 'utf8');
  const ai = readFileSync('src/components/AiChatTab.tsx', 'utf8');

  assert.match(navigation, /id:\s*'ai',\s*label:\s*'Nhập bằng AI'/);
  assert.match(navigation, /middleTabs\.map\(renderTab\)/);
  assert.match(app, /currentTab === 'ai'/);
  assert.match(app, /<AiChatTab\b/);
  assert.match(app, /onAddTransaction=\{handleAddTransaction\}/);
  assert.match(ai, /processAiMessage\(/);
  assert.match(ai, /onAddTransaction\(\{/);
});

test('AI shortcut on overview still opens AI transaction screen', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  assert.match(app, /onOpenAi=\{\(\) => setCurrentTab\('ai'\)\}/);
});
