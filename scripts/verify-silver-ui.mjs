import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
await mkdir('ui-proof/silver',{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4176'],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4176')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Ho_Chi_Minh',serviceWorkers:'block'});
 await context.addInitScript(()=>{
  if(localStorage.getItem('silver-proof'))return;
  const now=new Date(),date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  localStorage.setItem('silver-proof','1');localStorage.setItem('ltmsav_schema_version','7');localStorage.setItem('ltmsav_language','vi');
  localStorage.setItem('ltmsav_accounts_v1',JSON.stringify([{id:'cash',name:'Tiền mặt',type:'cash',balance:2480000,currency:'VND',iconName:'Wallet',color:'#087cfa'},{id:'bank',name:'Ngân hàng',type:'bank',balance:10000000,currency:'VND',iconName:'Landmark',color:'#087cfa'},{id:'saving',name:'Tiết kiệm',type:'savings',balance:12000000,currency:'VND',iconName:'PiggyBank',color:'#7045ba'}]));
  localStorage.setItem('ltmsav_categories_v1',JSON.stringify([{id:'food',name:'Ăn uống',type:'expense',iconName:'Utensils',color:'#ba3151'},{id:'salary',name:'Lương',type:'income',iconName:'Briefcase',color:'#147a46'}]));
  localStorage.setItem('ltmsav_transactions_v1',JSON.stringify([{id:'original',type:'expense',amount:35000,accountId:'cash',categoryId:'food',date,description:'Original transaction',createdAt:date}]));
  localStorage.setItem('ltmsav_budgets_v1',JSON.stringify([{id:'budget',categoryId:'food',monthlyLimit:2000000}]));
  localStorage.setItem('ltmsav_settings_v1',JSON.stringify({theme:'light',securityEnabled:false,pinCode:'123456',biometricEnabled:false,allowNegativeBalance:false,currency:'VND',autoConfirmAi:false}));
 });
 const page=await context.newPage(),errors=[],nativeDialogs=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{nativeDialogs.push(d.message());await d.dismiss();});
 await page.goto('http://127.0.0.1:4176');const nav=page.locator('nav');
 await nav.getByRole('button',{name:'Trang chủ',exact:true}).waitFor();
 assert.equal(await page.locator('.silver-balance').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
 assert.match(await page.locator('.balance-amount').innerText(),/12\.480\.000/);
 for(const dark of [false,true]){
  await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
  for(const [name,file] of [['Trang chủ','home'],['Giao dịch','transactions'],['Tài sản','assets'],['Kế hoạch','plans'],['Cá nhân','settings']]){
   await (name==='Cá nhân'?page.locator('header.finance-header'):nav).getByRole('button',{name,exact:true}).click();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+name);
   await page.screenshot({animations:'disabled',path:`ui-proof/silver/${file}-${dark?'dark':'light'}.png`,fullPage:true});
  }
 }
 await nav.getByRole('button',{name:'Kế hoạch',exact:true}).click();
 await page.getByRole('group',{name:'Kế hoạch',exact:true}).getByRole('button',{name:'Giao dịch định kỳ',exact:true}).click();
 await page.getByRole('heading',{name:'Giao dịch định kỳ',exact:true}).waitFor();
 assert.equal(await nav.getByRole('button',{name:'Kế hoạch',exact:true}).getAttribute('aria-current'),'page');
 await page.screenshot({animations:'disabled',path:'ui-proof/silver/recurring-dark.png',fullPage:true});
 await nav.getByRole('button',{name:'Trang chủ',exact:true}).click();
 await page.getByRole('button',{name:'Báo cáo',exact:true}).click();
 await page.getByRole('heading',{name:'Báo cáo',exact:true}).waitFor();
 await page.screenshot({animations:'disabled',path:'ui-proof/silver/reports-dark.png',fullPage:true});
 await nav.getByRole('button',{name:'Trang chủ',exact:true}).click();
 await page.getByRole('button',{name:'Thêm giao dịch',exact:true}).click();
 const editor=page.getByRole('dialog',{name:'Thêm giao dịch',exact:true});await editor.waitFor();
 await editor.locator('.amount-input').fill('50000');await editor.locator('input[type=text]').nth(1).fill('Silver UI test');
 const dateField=editor.getByRole('combobox',{name:'Ngày giao dịch',exact:true});const beforeDate=await dateField.innerText();
 await dateField.click();const calendar=page.getByRole('dialog',{name:'Ngày giao dịch',exact:true});
 const selectedDay=await calendar.locator('button[aria-pressed=true]').getAttribute('aria-label');
 await calendar.getByRole('button',{name:'Tháng sau',exact:true}).click();
 await calendar.getByRole('button',{name:'Hủy',exact:true}).click();assert.equal(await dateField.innerText(),beforeDate,'Calendar cancel preserves draft date');
 await dateField.click();await calendar.getByRole('button',{name:selectedDay,exact:true}).click();
 await page.screenshot({animations:'disabled',path:'ui-proof/silver/calendar-dark.png'});
 await calendar.getByRole('button',{name:'Xác nhận',exact:true}).click();
 await editor.getByRole('button',{name:'Hủy',exact:true}).first().click();
 let alert=page.getByRole('alertdialog');await alert.waitFor();
 assert.equal(await page.locator('#root').evaluate(el=>el.inert),true);
 await page.screenshot({animations:'disabled',path:'ui-proof/silver/confirmation-dark.png'});
 await alert.getByRole('button',{name:'Hủy',exact:true}).click();assert.equal(await editor.locator('.amount-input').inputValue(),'50.000');
 await editor.getByRole('button',{name:'Lưu giao dịch',exact:true}).click();await editor.waitFor({state:'hidden'});
 assert.equal(await page.evaluate(()=>document.body.style.overflow),'','No leaked modal scroll lock');
 let records=await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_transactions_v1')));assert.equal(records.length,2);
 await nav.getByRole('button',{name:'Giao dịch',exact:true}).click();
 await page.locator('.transaction-row:visible').filter({hasText:'Silver UI test'}).click();
 const edit=page.getByRole('dialog',{name:'Chỉnh sửa giao dịch',exact:true});await edit.getByRole('button',{name:'Xóa',exact:true}).click();
 alert=page.getByRole('alertdialog');await alert.getByRole('button',{name:'Hủy',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_transactions_v1')).length),2);
 await edit.getByRole('button',{name:'Xóa',exact:true}).click();await alert.getByRole('button',{name:'Xóa',exact:true}).click();await edit.waitFor({state:'hidden'});
 records=await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_transactions_v1')));assert.deepEqual(records.map(t=>t.id),['original']);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_accounts_v1'))[0].balance),2480000);
 assert.equal(await page.evaluate(()=>document.body.style.overflow),'');assert.equal(await page.locator('#root').evaluate(el=>el.inert),false);
 // Financial search and AI conversations survive switching sections.
 const search=page.getByRole('textbox',{name:'Tìm theo mô tả, ghi chú, người liên quan...',exact:true});
 const txSearch=page.locator('section:not([hidden]) input[type=text]').first();await txSearch.fill('Original');
 await nav.getByRole('button',{name:'Tài sản',exact:true}).click();await nav.getByRole('button',{name:'Giao dịch',exact:true}).click();assert.equal(await txSearch.inputValue(),'Original');
 await page.route('**/api/chat',route=>route.fulfill({json:{intent:'query_report',needs_confirmation:false,analysis:'Silver conversation persists',commands:[]}}));
 await nav.getByRole('button',{name:'Nhập bằng AI',exact:true}).click();
 await page.getByRole('textbox').fill('Kiểm tra hội thoại');await page.locator('section:not([hidden])').getByRole('button',{name:'Nhập bằng AI',exact:true}).click();
 await page.getByText('Silver conversation persists',{exact:true}).waitFor();
 await nav.getByRole('button',{name:'Tài sản',exact:true}).click();await nav.getByRole('button',{name:'Nhập bằng AI',exact:true}).click();await page.getByText('Silver conversation persists',{exact:true}).waitFor();
 await page.screenshot({animations:'disabled',path:'ui-proof/silver/ai-dark.png',fullPage:true});
 for(const width of [320,412,844]){
  await page.setViewportSize({width,height:width===844?390:844});
  for(const name of ['Trang chủ','Giao dịch','Tài sản','Kế hoạch','Cá nhân']){await (name==='Cá nhân'?page.locator('header.finance-header'):nav).getByRole('button',{name,exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} overflow ${width}`);}
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 for(const name of ['Trang chủ','Giao dịch','Tài sản','Kế hoạch','Cá nhân']){await (name==='Cá nhân'?page.locator('header.finance-header'):nav).getByRole('button',{name,exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Large text '+name);}
 await page.evaluate(()=>document.documentElement.style.fontSize='');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_settings_v1')).pinCode),'123456');
 assert.deepEqual(nativeDialogs,[]);assert.deepEqual(errors,[]);
 await writeFile('ui-proof/silver/result.json',JSON.stringify({passed:true,calendarCancelAndConfirm:true,customConfirmation:true,noNativeDialogs:true,noLeakedScrollLock:true,persistentTabsAndAI:true,ledgerRestoredAfterDelete:true,pinPreserved:true,themes:['light','dark'],viewports:[320,390,412,844]},null,2));
}finally{await browser?.close();server.kill('SIGTERM');}
