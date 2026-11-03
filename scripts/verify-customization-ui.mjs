import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

await mkdir('ui-proof',{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173'],{stdio:'inherit'});
let browser;
try {
  for(let i=0;i<60;i++){
    try{const r=await fetch('http://127.0.0.1:4173');if(r.ok)break;}catch{}
    await new Promise(r=>setTimeout(r,500));
  }
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Ho_Chi_Minh',serviceWorkers:'block'});
  await context.addInitScript(()=>{
    if(localStorage.getItem('ui-proof-seeded'))return;
    localStorage.setItem('ltmsav_schema_version','6');
    localStorage.setItem('ltmsav_language','vi');
    localStorage.setItem('ltmsav_accounts_v1',JSON.stringify([{id:'cash',name:'Tiền mặt',type:'cash',balance:500000,currency:'VND',iconName:'Wallet',color:'#10B981'}]));
    localStorage.setItem('ltmsav_categories_v1',JSON.stringify([{id:'food',name:'Ăn uống',type:'expense',iconName:'Utensils',color:'#F59E0B'},{id:'salary',name:'Lương',type:'income',iconName:'Briefcase',color:'#10B981'}]));
    localStorage.setItem('ltmsav_transactions_v1','[]');
    localStorage.setItem('ltmsav_settings_v1',JSON.stringify({theme:'dark',securityEnabled:false,pinCode:'',biometricEnabled:false,allowNegativeBalance:false,currency:'VND',autoConfirmAi:false}));
    localStorage.setItem('ui-proof-seeded','yes');
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4173');
  await page.getByRole('button',{name:'Tài sản',exact:true}).waitFor();
  await page.getByRole('button',{name:'Thêm giao dịch',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.getByRole('button',{name:'Cho vay',exact:true}).click();
  await dialog.getByRole('button',{name:'Tùy chỉnh danh mục'}).click();
  await dialog.getByPlaceholder('Tên danh mục').fill('Bạn dự án');
  await dialog.getByRole('button',{name:'Thêm danh mục',exact:true}).click();
  const loanId=await dialog.getByLabel('Danh mục',{exact:true}).inputValue();
  assert.ok(loanId);
  await dialog.locator('input[type="text"]').nth(0).fill('1000');
  await dialog.locator('input[type="text"]').nth(1).fill('UI loan test');
  const computed=await dialog.evaluate(el=>{
    const style=getComputedStyle(el);
    const input=getComputedStyle(el.querySelector('input'));
    return {image:style.backgroundImage,color:style.color,inputBg:input.backgroundColor,inputColor:input.color};
  });
  assert.match(computed.image,/23, 35, 56/);
  assert.equal(computed.inputBg,'rgb(11, 18, 32)');
  assert.equal(computed.inputColor,'rgb(241, 245, 249)');
  for(const width of [360,412]){
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow at '+width);
    await dialog.screenshot({path:'ui-proof/transaction-dark-'+width+'.png'});
  }
  await page.evaluate(()=>document.documentElement.classList.remove('dark'));
  await dialog.screenshot({path:'ui-proof/transaction-light.png'});
  await page.evaluate(()=>document.documentElement.classList.add('dark'));
  await dialog.getByRole('button',{name:'Thêm Giao Dịch',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  const records=await page.evaluate(()=>({accounts:JSON.parse(localStorage.getItem('ltmsav_accounts_v1')),transactions:JSON.parse(localStorage.getItem('ltmsav_transactions_v1'))}));
  assert.equal(records.accounts[0].balance,499000);
  assert.equal(records.transactions[0].type,'lend');
  assert.equal(records.transactions[0].categoryId,loanId);

  await page.getByRole('button',{name:'Giao dịch định kỳ',exact:true}).click();
  await page.getByLabel('Tên giao dịch',{exact:true}).fill('UI recurring test');
  await page.getByLabel('Số tiền (VND)',{exact:true}).fill('100');
  await page.getByRole('button',{name:'Hằng tuần',exact:true}).click();
  for(const [label,selected] of [['T2',true],['T3',false],['T4',true],['T5',false],['T6',true],['T7',false],['CN',false]]){
    const button=page.getByRole('button',{name:label,exact:true});
    if((await button.getAttribute('aria-pressed')==='true')!==selected)await button.click();
  }
  await page.getByLabel('Giờ thực hiện',{exact:true}).fill('08:15');
  await page.getByRole('button',{name:'Tạo lịch định kỳ',exact:true}).click();
  let rules=await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_recurring_rules_v1')));
  assert.deepEqual(rules[0].daysOfWeek,[1,3,5]);
  assert.equal(rules[0].time,'08:15');
  await page.getByRole('button',{name:'Sửa lịch định kỳ: UI recurring test',exact:true}).click();
  await page.getByRole('button',{name:'Hằng tháng',exact:true}).click();
  for(const day of [5,15,25]){
    await page.getByRole('button',{name:'Ngày '+day,exact:true}).click();
  }
  // Editing a weekly schedule retains a harmless monthly default; explicitly unselect it.
  const first=page.getByRole('button',{name:'Ngày 1',exact:true});
  if(await first.getAttribute('aria-pressed')==='true')await first.click();
  await page.getByRole('button',{name:'Lưu Thay Đổi',exact:true}).click();
  rules=await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_recurring_rules_v1')));
  assert.equal(rules.length,1);
  assert.deepEqual(rules[0].daysOfMonth,[5,15,25]);
  assert.equal(rules[0].frequency,'monthly');
  await page.screenshot({path:'ui-proof/recurring-dark.png',fullPage:true});
  await page.getByRole('button',{name:'Cá nhân',exact:true}).click();
  await page.getByRole('heading',{name:'Quản lý danh mục'}).waitFor();
  await page.screenshot({path:'ui-proof/category-manager.png',fullPage:true});
  assert.deepEqual(errors,[]);
  await writeFile('ui-proof/result.json',JSON.stringify({passed:true,widths:[360,412],darkStyles:computed,categoryId:loanId,weeklyAndMonthlyEditing:true,balanceVerified:true},null,2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
