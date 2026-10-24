import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = await import(path.join(process.env.PLAYWRIGHT_MODULE, 'index.mjs'));
const root=path.resolve('dist');
await fs.mkdir('ui-preview',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
try {
for(const theme of ['light','dark']) {
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'block',locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname!=='ltmsav.test')return route.abort();
  const name=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
  const target=path.resolve(root,name);
  if(!target.startsWith(root+path.sep))return route.abort();
  const type=name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.html')?'text/html':name.endsWith('.png')?'image/png':'application/octet-stream';
  try {await route.fulfill({body:await fs.readFile(target),contentType:type});}catch{await route.fulfill({status:404,body:''});}
 });
 await context.addInitScript(({theme})=>{
  const accounts=[{id:'preview_cash',name:'Tiền mặt',type:'cash',balance:1250000,currency:'VND',iconName:'Wallet',color:'#30b882'},{id:'preview_bank',name:'Tài khoản ngân hàng',type:'bank',balance:15680000,currency:'VND',iconName:'Landmark',color:'#2686ed'}];
  const date=new Date();const today=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const transactions=[{id:'preview_1',type:'expense',amount:65000,accountId:'preview_cash',categoryId:'cat_food',date:today,description:'Ăn trưa',createdAt:date.toISOString()},{id:'preview_2',type:'income',amount:18000000,accountId:'preview_bank',categoryId:'cat_salary',date:today,description:'Lương tháng',createdAt:date.toISOString()},{id:'preview_3',type:'expense',amount:450000,accountId:'preview_bank',categoryId:'cat_shopping',date:today,description:'Mua sắm',createdAt:date.toISOString()}];
  localStorage.setItem('ltmsav_schema_version','6');localStorage.setItem('ltmsav_language','vi');
  localStorage.setItem('ltmsav_accounts_v1',JSON.stringify(accounts));localStorage.setItem('ltmsav_transactions_v1',JSON.stringify(transactions));
  localStorage.setItem('ltmsav_settings_v1',JSON.stringify({theme,securityEnabled:false,pinCode:'',biometricEnabled:false,allowNegativeBalance:false}));
 },{theme});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://ltmsav.test/');await page.locator('.ios-dock').waitFor();await page.waitForTimeout(1200);
 assert.ok(await page.locator('.ios-balance-card').evaluate(element=>element.getBoundingClientRect().height < 290),'Balance hero is too tall');
 const before=await page.evaluate(()=>[localStorage.getItem('ltmsav_accounts_v1'),localStorage.getItem('ltmsav_transactions_v1')]);
 for(const [index,name] of ['overview','transactions','ai','budgets','assets'].entries()) {
  await page.locator('.ios-tab').nth(index).click();await page.waitForTimeout(1200);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${theme}/${name}: horizontal overflow`);
  await page.screenshot({path:`ui-preview/${theme}-${name}.png`});
 }
 await page.getByRole('button',{name:'Cài đặt',exact:true}).click();await page.waitForTimeout(1200);await page.screenshot({path:`ui-preview/${theme}-settings.png`});
 await page.locator('.ios-tab').first().click();
 await page.getByRole('button',{name:'Thêm giao dịch',exact:true}).click();await page.waitForTimeout(1200);await page.screenshot({path:`ui-preview/${theme}-add-dialog.png`});
 await page.keyboard.press('Escape');
 assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('ltmsav_accounts_v1'),localStorage.getItem('ltmsav_transactions_v1')]),before,'UI navigation modified ledger');
 assert.deepEqual(errors,[],`${theme}: browser errors`);
 await page.setViewportSize({width:320,height:740});await page.reload();await page.locator('.ios-dock').waitFor();await page.waitForTimeout(1200);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${theme}: 320px overflow`);
 await page.screenshot({path:`ui-preview/${theme}-320-overview.png`});
 await page.locator('.ios-tab').nth(1).click();
 await page.getByRole('button',{name:'Định kỳ',exact:true}).click();await page.waitForTimeout(800);
 await page.getByRole('button',{name:'Thêm lịch định kỳ',exact:true}).first().click();
 await page.getByLabel('Tên khoản thu / chi',{exact:true}).fill('Hóa đơn định kỳ mẫu');
 await page.getByLabel('Số tiền (VND)',{exact:true}).fill('50000');
 await page.screenshot({path:`ui-preview/${theme}-recurring-editor.png`});
 await page.getByRole('button',{name:'Lưu lịch định kỳ',exact:true}).click();
 try { await page.getByRole('heading',{name:'Hóa đơn định kỳ mẫu',exact:true}).waitFor({timeout:10000}); } catch(error) { await page.screenshot({path:`ui-preview/${theme}-recurring-error.png`}); console.log('Recurring alerts:',await page.locator('[role=alert]').allTextContents()); throw error; }
 const posted=await page.evaluate(()=>({accounts:JSON.parse(localStorage.getItem('ltmsav_accounts_v1')),tx:JSON.parse(localStorage.getItem('ltmsav_transactions_v1')),rules:JSON.parse(localStorage.getItem('ltmsav_recurring_v1'))}));
 assert.equal(posted.accounts[0].balance,1200000,'Monthly expense must debit exactly once');
 assert.equal(posted.tx.filter(tx=>tx.recurringRuleId).length,1,'Exactly one due occurrence');
 assert.equal(posted.rules.length,1);assert.ok(posted.rules[0].lastProcessedMonth);
 await page.getByRole('button',{name:'Tạm dừng lịch: Hóa đơn định kỳ mẫu',exact:true}).click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_recurring_v1'))[0].enabled),false);
 await page.waitForTimeout(500);await page.screenshot({path:`ui-preview/${theme}-recurring-list.png`});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Recurring UI overflow at 320px');
 assert.deepEqual(errors,[],'Recurring flow browser errors');
 results.push({recurringCreatedAndPostedOnce:true,recurringPaused:true,theme,viewport:'390x844 + 320x740' ,views:7,ledgerPreserved:true,errors});await context.close();
}
}finally{await browser.close();}
await fs.writeFile('ui-preview/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
