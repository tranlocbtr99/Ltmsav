import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
await mkdir('ui-proof/assets',{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4177'],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4177')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
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
 await page.goto('http://127.0.0.1:4177');const nav=page.locator('nav');
 await nav.getByRole('button',{name:'Trang chủ',exact:true}).waitFor();
 assert.equal(await page.locator('.silver-balance').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
 assert.match(await page.locator('.balance-amount').innerText(),/12\.480\.000/);
 await nav.getByRole('button',{name:'Tài sản',exact:true}).click();
 await page.getByRole('button',{name:'Thêm tài khoản',exact:true}).click();
 const dialog=page.locator('.silver-asset-dialog');await dialog.waitFor();
 for(const dark of [false,true]){await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);
 for(const viewport of [{width:390,height:844},{width:320,height:640},{width:844,height:390},{width:390,height:420}]){
  await page.setViewportSize(viewport);
  for(const zoom of [1,2]){await page.evaluate(z=>document.documentElement.style.fontSize=z===2?'200%':'',zoom);
   const box=await dialog.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=viewport.height+1,JSON.stringify(box));
   assert.ok(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),'No horizontal overflow');
   const submit=dialog.locator('button[type=submit]');await submit.click({trial:true});
   assert.ok(await submit.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Submit is above navigation');
   const fields=dialog.locator('.silver-asset-fields');await fields.evaluate(el=>el.scrollTop=el.scrollHeight);await submit.click({trial:true});
  }
 }
 }
 await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width:390,height:844});
 await dialog.locator('input').first().fill('Asset overlay test');
 await dialog.getByRole('combobox').click();await page.locator('.ios-picker-sheet').getByRole('option').first().click();
 assert.equal(await dialog.locator('input').first().inputValue(),'Asset overlay test');
 await dialog.locator('input').last().fill('125000');
 await page.screenshot({path:'ui-proof/assets/account-dark.png'});
 await dialog.locator('button[type=submit]').click();await dialog.waitFor({state:'hidden'});
 const accounts=await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_accounts_v1')));
 assert.equal(accounts.length,4);assert.equal(accounts.find(a=>a.name==='Asset overlay test').balance,125000);
 assert.equal(await page.locator('#root').evaluate(el=>el.inert),false);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
 assert.deepEqual(errors,[]);assert.deepEqual(nativeDialogs,[]);
 await writeFile('ui-proof/assets/result.json',JSON.stringify({passed:true,themes:2,viewports:4,textScales:2,submitUncovered:true,nestedPickerPreservesDraft:true,createdAccountBalance:125000}));
}finally{await browser?.close();server.kill('SIGTERM');}
