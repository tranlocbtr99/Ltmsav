import { test } from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  data = new Map<string,string>();
  failSnapshots = false;
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string,v: string) {
    if(this.failSnapshots && k.includes('snapshots')) throw new Error('quota');
    this.data.set(k,String(v));
  }
  removeItem(k: string) { this.data.delete(k); }
  clear() { throw new Error('Unexpected clear'); }
}

async function load(seed: Record<string,string>, fail=false) {
  const memory = new MemoryStorage();
  Object.entries(seed).forEach(([k,v])=>memory.setItem(k,v));
  memory.failSnapshots = fail;
  Object.defineProperty(globalThis,'localStorage',{value:memory,configurable:true});
  const {storage} = await import('../src/services/storage.ts?case='+crypto.randomUUID());
  return {storage,memory};
}

test('old IDs, balances, PIN and all user records survive upgrade',async()=>{
  const seed = {
    ltmsav_schema_version:'1',
    ltmsav_accounts_v1:JSON.stringify([{id:'acc_tcb',name:'Bank',balance:3639125}]),
    ltmsav_transactions_v1:JSON.stringify([{id:'tx_1',amount:100}]),
    ltmsav_debts_v1:JSON.stringify([{id:'debt_1',remainingAmount:123}]),
    ltmsav_budgets_v1:JSON.stringify([{id:'b_1',monthlyLimit:1000}]),
    ltmsav_settings_v1:JSON.stringify({pinCode:'1234',securityEnabled:true,customField:'keep'}),
    ltmsav_language:'en',
  };
  const {memory}=await load(seed);
  for(const [k,v] of Object.entries(seed)) if(!['ltmsav_schema_version','ltmsav_settings_v1'].includes(k)) assert.equal(memory.getItem(k),v);
  const settings=JSON.parse(memory.getItem('ltmsav_settings_v1')!);
  assert.equal(settings.pinCode,'1234'); assert.equal(settings.securityEnabled,true);
  assert.deepEqual(JSON.parse(memory.getItem('ltmsav_auto_snapshots_v1')!)[0].raw,seed);
  assert.equal(memory.getItem('ltmsav_schema_version'),'7');
});
test('snapshot quota failure leaves every existing byte unchanged',async()=>{
  const seed={ltmsav_schema_version:'1',finflow_accounts_v1:'[{"id":"acc_cash","balance":42}]'};
  const {memory}=await load(seed,true);
  assert.deepEqual(Object.fromEntries(memory.data),seed);
});
test('legacy migration preserves old and new records',async()=>{
  const {memory}=await load({finflow_accounts_v1:'[{"id":"acc_cash","balance":42}]'});
  assert.equal(memory.getItem('finflow_accounts_v1'),memory.getItem('ltmsav_accounts_v1'));
});
test('transfer add edit delete maintains total and returns original balances',async()=>{
  const {storage}=await load({ltmsav_schema_version:'5',ltmsav_accounts_v1:JSON.stringify([{id:'a',balance:1000},{id:'b',balance:100}])});
  const tx=storage.addTransaction({type:'transfer',amount:200,accountId:'a',targetAccountId:'b',description:'move',date:'2026-10-26'} as any);
  assert.deepEqual(storage.getAccounts().map(a=>a.balance),[800,300]);
  storage.editTransaction(tx.id,{amount:350});
  assert.deepEqual(storage.getAccounts().map(a=>a.balance),[650,450]);
  storage.deleteTransaction(tx.id);
  assert.deepEqual(storage.getAccounts().map(a=>a.balance),[1000,100]);
});
test('invalid restore cannot overwrite user data',async()=>{
  const {storage,memory}=await load({ltmsav_schema_version:'5',ltmsav_accounts_v1:'[{"id":"a","balance":42}]'});
  const before=Object.fromEntries(memory.data);
  assert.equal(storage.importBackup('{"data":{"accounts":{},"transactions":[]}}').success,false);
  assert.deepEqual(Object.fromEntries(memory.data),before);
});
test('failed transaction write rolls back both balances and records',async()=>{
  const {storage,memory}=await load({ltmsav_schema_version:'7',ltmsav_accounts_v1:'[{"id":"a","balance":1000}]',ltmsav_transactions_v1:'[]'});
  const original=memory.setItem.bind(memory);
  let fail=true;
  memory.setItem=(key,value)=>{if(key==='ltmsav_transactions_v1' && fail){fail=false;throw Error('disk full');} original(key,value);};
  assert.throws(()=>storage.addTransaction({type:'expense',amount:100,accountId:'a',description:'food',date:'2026-10-26'} as any));
  assert.equal(storage.getAccounts()[0].balance,1000);
  assert.deepEqual(storage.getTransactions(),[]);
  assert.equal(memory.getItem('ltmsav_pending_write'),null);
});
test('interrupted previous release journal is recovered before migration',async()=>{
  const {storage,memory}=await load({ltmsav_schema_version:'7',ltmsav_accounts_v1:'[{"id":"a","balance":9}]',ltmsav_pending_write:JSON.stringify({ltmsav_accounts_v1:'[{"id":"a","balance":42}]'})});
  assert.equal(storage.getAccounts()[0].balance,42);
  assert.equal(memory.getItem('ltmsav_pending_write'),null);
});
test('invalid amount and same-account transfer cannot modify storage',async()=>{
  const {storage,memory}=await load({ltmsav_schema_version:'7',ltmsav_accounts_v1:'[{"id":"a","balance":1000}]'});
  const before=Object.fromEntries(memory.data);
  for(const amount of [0,-1,Infinity,NaN,1.5]) assert.throws(()=>storage.addTransaction({type:'expense',amount,accountId:'a',description:'bad',date:'2026-10-26'} as any));
  assert.throws(()=>storage.addTransaction({type:'transfer',amount:10,accountId:'a',targetAccountId:'a',date:'2026-10-26'} as any));
  assert.deepEqual(Object.fromEntries(memory.data),before);
});
test('current and future schema data remains byte-identical on startup',async()=>{
  for(const version of ['7','8']) {
    const seed={ltmsav_schema_version:version,ltmsav_settings_v1:'{"pinCode":"9521","securityEnabled":true,"newField":1}',ltmsav_accounts_v1:'[{"id":"a","balance":42,"unknown":1}]',ltmsav_language:'vi'};
    const {memory}=await load(seed);
    assert.deepEqual(Object.fromEntries(memory.data),seed);
  }
});
test('malformed nested backups and future schemas preserve all current bytes',async()=>{
  const {storage,memory}=await load({ltmsav_schema_version:'7',ltmsav_accounts_v1:'[{"id":"a","name":"Cash","balance":42}]'});
  const before=Object.fromEntries(memory.data);
  const valid={accounts:[{id:'a',name:'Cash',balance:42}],transactions:[]};
  for(const payload of [
    {schemaVersion:8,data:valid},
    {data:{...valid,accounts:[{id:'a',name:'Cash',balance:'bad'}]}},
    {data:{...valid,accounts:[...valid.accounts,...valid.accounts]}},
    {data:{...valid,settings:{securityEnabled:true,pinCode:''}}},
    {data:{...valid,transactions:[{id:'bad',type:'expense',amount:-1,accountId:'a',date:'2026-10-26'}]}},
  ]) {
    assert.equal(storage.importBackup(JSON.stringify(payload)).success,false);
    assert.deepEqual(Object.fromEntries(memory.data),before);
  }
});
test('backup round trip retains records, unknown fields and security settings',async()=>{
  const {storage}=await load({ltmsav_schema_version:'7',ltmsav_accounts_v1:'[{"id":"a","name":"Cash","balance":42,"custom":"keep"}]',ltmsav_settings_v1:'{"pinCode":"9521","securityEnabled":true,"custom":"keep"}'});
  const backup=storage.exportBackup();
  assert.equal(storage.importBackup(backup).success,true);
  assert.equal(storage.exportBackup().includes('"custom": "keep"'),true);
  assert.equal(storage.getAccounts()[0].balance,42);
  assert.equal(storage.getSettings().pinCode,'9521');
});

test('editing asset appearance preserves balance, ID, currency and linked transactions', async () => {
  const original = {id:'acc_existing', name:'Old bank', type:'bank', balance:-125000, currency:'VND', iconName:'Landmark', color:'#10B981', custom:'keep'};
  const transactions = JSON.stringify([{id:'tx_existing', accountId:original.id, amount:5000}]);
  const {storage,memory} = await load({ltmsav_schema_version:'7', ltmsav_accounts_v1:JSON.stringify([original]), ltmsav_transactions_v1:transactions});
  const updates = {name:'New wallet',type:'wallet' as const,iconName:'Wallet',color:'#6366F1'};
  assert.deepEqual(storage.updateAccount(original.id,updates), {...original,...updates});
  assert.equal(memory.getItem('ltmsav_transactions_v1'),transactions);
  assert.equal(storage.updateAccount('missing',updates),null);
  assert.equal(storage.getAccounts().length,1);
});

test('schema 6 upgrade snapshots raw bytes and preserves categories, recurring rules and finance data', async()=>{
  const rule={id:'r1',title:'Rent',amount:100,type:'expense',accountId:'a',categoryId:'c',day:31,startMonth:'2026-10',lastApplied:'2026-10'};
  const seed={ltmsav_schema_version:'6',ltmsav_accounts_v1:'[{"id":"a","balance":500}]',ltmsav_categories_v1:'[{"id":"c","type":"expense","name":"Old"}]',ltmsav_recurring_rules_v1:JSON.stringify([rule]),ltmsav_settings_v1:'{"pinCode":"9521","securityEnabled":true}'};
  const {storage,memory}=await load(seed);
  for(const [key,value] of Object.entries(seed))if(key!=='ltmsav_schema_version')assert.equal(memory.getItem(key),value);
  assert.equal(memory.getItem('ltmsav_schema_version'),'7');
  assert.deepEqual(storage.getAutoSnapshots()[0].raw,seed);
  assert.deepEqual(storage.getRecurringRules(),[rule]);
});
test('custom loan categories and multi-day schedules survive backup restore without changing balances',async()=>{
  const {storage,memory}=await load({ltmsav_schema_version:'7',ltmsav_accounts_v1:'[{"id":"a","name":"Cash","balance":500}]',ltmsav_transactions_v1:'[]'});
  const loan=storage.addCategory({name:'Bạn bè',type:'lend',iconName:'Users',color:'#3B82F6'});
  const same=storage.addCategory({name:' Bạn bè ',type:'lend',iconName:'Tag',color:'#000000'});
  assert.equal(same.id,loan.id);
  const another=storage.addCategory({name:'Gia đình',type:'lend',iconName:'Home',color:'#000000'});
  assert.notEqual(another.id,loan.id);
  storage.updateCategory(loan.id,'Bạn thân');
  assert.equal(storage.getCategories().find(c=>c.id===loan.id)?.name,'Bạn thân');
  const expense=storage.getCategories().find(c=>c.type==='expense')!;
  const rule={id:'r',title:'Food',amount:50,type:'expense' as const,accountId:'a',categoryId:expense.id,day:1,startMonth:'2026-11',frequency:'weekly' as const,daysOfWeek:[1,3,5],time:'09:15',startDate:'2026-11-03'};
  storage.saveRecurringRules([rule]);
  const backup=storage.exportBackup();
  assert.equal(storage.importBackup(backup).success,true);
  assert.deepEqual(storage.getRecurringRules(),[rule]);
  assert.equal(storage.getAccounts()[0].balance,500);
  assert.throws(()=>storage.deleteCategory(expense.id));
  assert.equal(storage.deleteCategory(another.id),true);
  storage.addTransaction({type:'lend',amount:10,accountId:'a',categoryId:loan.id,date:'2026-11-03',description:'Loan'});
  assert.throws(()=>storage.deleteCategory(loan.id));
  assert.equal(storage.getTransactions()[0].categoryId,loan.id);
  assert.equal(memory.getItem('ltmsav_pending_write'),null);
});
test('invalid recurring backup cannot overwrite current data',async()=>{
  const {storage,memory}=await load({ltmsav_schema_version:'7',ltmsav_accounts_v1:'[{"id":"a","name":"Cash","balance":500}]',ltmsav_transactions_v1:'[]'});
  const before=Object.fromEntries(memory.data);
  const invalid={id:'r',title:'Bad',type:'expense',amount:5,accountId:'a',categoryId:'c',day:1,startMonth:'2026-11',frequency:'weekly',daysOfWeek:[],time:'08:00'};
  assert.equal(storage.importBackup(JSON.stringify({schemaVersion:7,data:{accounts:storage.getAccounts(),transactions:[],recurringRules:[invalid]}})).success,false);
  assert.deepEqual(Object.fromEntries(memory.data),before);
});
