import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
const data = new Map<string,string>();
let failKey = '';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: {
 getItem: (k:string) => data.get(k) ?? null,
 setItem: (k:string,v:string) => { if (k === failKey) { failKey=''; throw new Error('quota'); } data.set(k,String(v)); },
 removeItem: (k:string) => data.delete(k), clear: () => data.clear(),
}, configurable: true });
const { storage } = await import('../src/services/storage');
const account = (id:string,balance:number) => ({ id, name:id, balance, type:'cash' as const, currency:'VND', iconName:'Wallet', color:'#000000' });
const tx = { type:'transfer' as const, amount:30, accountId:'a', targetAccountId:'b', categoryId:'', date:'2026-10-24', description:'transfer' };
beforeEach(() => { data.clear(); data.set('ltmsav_schema_version','6'); storage.saveAccounts([account('a',100),account('b',0)]); failKey=''; });
test('transfer, edit, delete preserve money and reverse correctly', () => {
 const created=storage.addTransaction(tx);
 assert.deepEqual(storage.getAccounts().map(a=>a.balance),[70,30]);
 storage.editTransaction(created.id,{amount:40});
 assert.deepEqual(storage.getAccounts().map(a=>a.balance),[60,40]);
 storage.deleteTransaction(created.id);
 assert.deepEqual(storage.getAccounts().map(a=>a.balance),[100,0]);
});
test('invalid targets, same account, negative/NaN amounts and insufficient balance cannot mutate ledger', () => {
 for (const update of [{targetAccountId:'missing'},{targetAccountId:'a'},{amount:-1},{amount:NaN},{amount:101}]) {
 assert.throws(()=>storage.addTransaction({...tx,...update}));
 assert.deepEqual(storage.getAccounts().map(a=>a.balance),[100,0]);
 assert.equal(storage.getTransactions().length,0);
 }
});
test('write failure rolls balances back', () => {
 failKey='ltmsav_transactions_v1'; assert.throws(()=>storage.addTransaction(tx));
 assert.deepEqual(storage.getAccounts().map(a=>a.balance),[100,0]);
 assert.equal(storage.getTransactions().length,0);
 assert.equal(data.has('ltmsav_pending_write'),false);
});
test('malformed and duplicate backup cannot overwrite data', () => {
 const original=storage.exportBackup();
 for (const accounts of [{bad:true},[account('a',100),account('a',100)],[account('a',NaN)]]) {
 assert.equal(storage.importBackup(JSON.stringify({data:{accounts,transactions:[]}})).success,false);
 assert.deepEqual(storage.getAccounts().map(a=>a.balance),[100,0]);
 }
 assert.equal(storage.importBackup(original).success,true);
});
test('v2 migration preserves user-owned demo IDs, PIN, budgets and debts', () => {
 data.set('ltmsav_schema_version','2'); storage.saveAccounts([account('acc_cash',123456)]);
 storage.saveSettings({...storage.getSettings(),pinCode:'1234',securityEnabled:true});
 (storage as any).runDataMigration();
 assert.equal(storage.getAccounts()[0].balance,123456);
 assert.equal(storage.getSettings().pinCode,'1234');
 assert.equal(storage.getSettings().securityEnabled,true);
 assert.equal(data.get('ltmsav_schema_version'),'7');
 assert.equal(storage.getAutoSnapshots()[0].data.accounts[0].balance,123456);
});
test('migration stops when safety snapshot cannot be saved', () => {
 data.set('ltmsav_schema_version','2'); failKey='ltmsav_auto_snapshots_v1';
 (storage as any).runDataMigration();
 assert.equal(data.get('ltmsav_schema_version'),'2');
 assert.deepEqual(storage.getAccounts().map(a=>a.balance),[100,0]);
});
test('recover interrupted write restores original raw data', () => {
 data.set('ltmsav_pending_write',JSON.stringify({ltmsav_accounts_v1:JSON.stringify([account('a',100)])}));
 storage.saveAccounts([account('a',1)]); (storage as any).recoverPendingWrite();
 assert.equal(storage.getAccounts()[0].balance,100);
});
test('account with history cannot be removed',()=>{ storage.addTransaction(tx); assert.throws(()=>storage.deleteAccount('a')); assert.equal(storage.getAccounts().length,2); });
test('many AI commands receive distinct IDs',()=>{ const ids=new Set(Array.from({length:20},()=>storage.addTransaction({...tx,type:'income',amount:1}).id));assert.equal(ids.size,20); });
