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
 assert.equal(data.get('ltmsav_schema_version'),'8');
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
test('undo new transfers and income preserves subsequent unrelated work and is single-use',()=>{
 const created=storage.addTransaction(tx);
 const unrelated=storage.addTransaction({type:'income',amount:10,accountId:'a',categoryId:'cat_salary',date:'2026-10-24',description:'income'});
 assert.equal(storage.undoCreatedTransaction(created),true);
 assert.deepEqual(storage.getAccounts().map(a=>a.balance),[110,0]);
 assert.equal(storage.getTransactions()[0].id,unrelated.id);
 assert.throws(()=>storage.undoCreatedTransaction(created));
});
test('undo refuses edited records and spent income; write failures roll back everything',()=>{
 const created=storage.addTransaction(tx);storage.editTransaction(created.id,{amount:20});
 assert.throws(()=>storage.undoCreatedTransaction(created));
 const income=storage.addTransaction({type:'income',amount:50,accountId:'b',categoryId:'cat_salary',date:'2026-10-24',description:'income'});
 storage.addTransaction({type:'expense',amount:60,accountId:'b',categoryId:'cat_food',date:'2026-10-24',description:'spent'});
 assert.throws(()=>storage.undoCreatedTransaction(income));
 const expense=storage.addTransaction({type:'expense',amount:10,accountId:'a',categoryId:'cat_food',date:'2026-10-24',description:'food'});
 const before=storage.exportBackup();failKey='ltmsav_audit_logs_v1';assert.throws(()=>storage.undoCreatedTransaction(expense));assert.deepEqual(JSON.parse(storage.exportBackup()).data,JSON.parse(before).data);
});
test('schema7 to8 snapshots before migration and preserves all old raw data and PIN',()=>{
 data.set('ltmsav_schema_version','7');storage.saveSettings({...storage.getSettings(),pinCode:'5678',securityEnabled:true});
 const keys=['ltmsav_accounts_v1','ltmsav_transactions_v1','ltmsav_settings_v1','ltmsav_debts_v1','ltmsav_budgets_v1','ltmsav_recurring_v1'];
 const before=keys.map(k=>data.get(k));(storage as any).runDataMigration();assert.equal(data.get('ltmsav_schema_version'),'8');assert.deepEqual(keys.map(k=>data.get(k)),before);
 assert.equal(storage.getAutoSnapshots()[0].data.settings.pinCode,'5678');
});
test('new preferences round-trip backup and reject malformed values before mutation',()=>{
 storage.saveSettings({...storage.getSettings(),completeMonths:['2026-08','2026-09'],recurringReminders:true});
 const backup=storage.exportBackup();assert.equal(storage.importBackup(backup).success,true);assert.deepEqual(storage.getSettings().completeMonths,['2026-08','2026-09']);
 for(const patch of [{completeMonths:['2026-99']},{completeMonths:['2026-08','2026-08']},{recurringReminders:'true'}]){
  const b=JSON.parse(backup);Object.assign(b.data.settings,patch);const before=storage.exportBackup();assert.equal(storage.importBackup(JSON.stringify(b)).success,false);assert.deepEqual(JSON.parse(storage.exportBackup()).data,JSON.parse(before).data);
 }
});
