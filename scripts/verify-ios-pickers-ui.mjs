import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
await mkdir('ui-proof/pickers',{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4175'],{stdio:'inherit'});
let browser;
try {
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4175')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,timezoneId:'Asia/Ho_Chi_Minh',serviceWorkers:'block'});
  await context.addInitScript(()=>{
    localStorage.setItem('ltmsav_schema_version','7');localStorage.setItem('ltmsav_language','vi');
    localStorage.setItem('ltmsav_accounts_v1',JSON.stringify([
      {id:'cash',name:'Tiền mặt',type:'cash',balance:1800000,currency:'VND',iconName:'Banknote',color:'#1677ff'},
      {id:'bank',name:'Tài khoản ngân hàng',type:'bank',balance:4250000,currency:'VND',iconName:'Landmark',color:'#7045ba'},
      {id:'saving',name:'Mục tiêu tiết kiệm',type:'savings',balance:7000000,currency:'VND',iconName:'PiggyBank',color:'#d97706'}]));
    localStorage.setItem('ltmsav_categories_v1',JSON.stringify([
      ['food','Ăn uống','Utensils','#c2415d'],['travel','Di chuyển','Car','#1677ff'],['shop','Mua sắm','ShoppingBag','#7045ba'],['bill','Hóa đơn & Tiện ích','Zap','#b45c12'],['home','Nhà cửa','House','#1677ff'],['fun','Giải trí','Gamepad2','#147a46'],['health','Sức khỏe','Heart','#c2415d'],['study','Giáo dục','GraduationCap','#7045ba']
    ].map(([id,name,iconName,color])=>({id,name,iconName,color,type:'expense'}))));
    localStorage.setItem('ltmsav_transactions_v1','[]');
    localStorage.setItem('ltmsav_settings_v1',JSON.stringify({theme:'light',securityEnabled:false,pinCode:'',biometricEnabled:false,allowNegativeBalance:false,currency:'VND'}));
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4175');
  await page.locator('nav').getByRole('button',{name:'Tài sản',exact:true}).waitFor();
  await page.getByRole('button',{name:'Thêm giao dịch',exact:true}).click();
  const editor=page.getByRole('dialog',{name:'Thêm Giao Dịch Mới',exact:true});
  await editor.waitFor();
  await editor.locator('input[inputmode=numeric]').fill('65000');
  await editor.locator('input[type=text]').nth(1).fill('Draft remains intact');
  assert.equal(await page.locator('select').count(),0,'No native select menus anywhere in the rendered app');
  const category=editor.getByRole('combobox',{name:'Chọn danh mục',exact:true});
  const source=editor.getByRole('combobox',{name:'Nguồn tiền',exact:true});
  const popup=()=>page.locator('.ios-picker-sheet');
  for(const dark of [false,true]){
    await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
    await category.click();
    await popup().waitFor();
    assert.equal(await page.locator('#root').evaluate(e=>e.inert),true);
    assert.equal(await popup().getByRole('option').count(),8);
    assert.equal(await popup().getByRole('option',{name:'Ăn uống',exact:true}).getAttribute('aria-selected'),'true');
    await page.screenshot({animations:'disabled',path:`ui-proof/pickers/categories-${dark?'dark':'light'}.png`});
    await popup().getByRole('searchbox',{name:'Tìm trong danh sách'}).fill('di chuyen');
    assert.equal(await popup().getByRole('option').count(),1);
    await popup().getByRole('option',{name:'Di chuyển',exact:true}).click();
    assert.equal(await popup().count(),0);
    assert.match(await category.innerText(),/Di chuyển/);
    assert.equal(await editor.locator('input[inputmode=numeric]').inputValue(),'65.000');
    assert.equal(await editor.locator('input[type=text]').nth(1).inputValue(),'Draft remains intact');
    assert.equal(await page.locator('#root').evaluate(e=>e.inert),false);
    await source.click();
    await page.screenshot({animations:'disabled',path:`ui-proof/pickers/accounts-${dark?'dark':'light'}.png`});
    assert.match(await popup().innerText(),/4\.250\.000/);
    await page.keyboard.press('Escape');
    assert.equal(await popup().count(),0,'Escape dismisses only the picker');
    assert.equal(await editor.count(),1,'The transaction editor stays open');
    await category.click();await popup().getByRole('option',{name:'Ăn uống',exact:true}).click();
  }
  for(const viewport of [{width:320,height:740},{width:412,height:900},{width:844,height:390}]){
    await page.setViewportSize(viewport);await category.click();
    assert.ok(await popup().evaluate(e=>e.scrollWidth<=e.clientWidth),'Picker horizontal overflow');
    await popup().evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
    const bounds=await popup().boundingBox();assert.ok(bounds.x>=0 && bounds.y>=0 && bounds.x+bounds.width<=viewport.width+1 && bounds.y+bounds.height<=viewport.height+1,JSON.stringify({viewport,bounds}));
    const targets=await popup().getByRole('option').evaluateAll(items=>items.map(e=>({w:e.offsetWidth,h:e.offsetHeight})));
    assert.ok(targets.every(e=>e.w>=48&&e.h>=48),'Comfortable touch targets');
    await popup().getByRole('button',{name:'Đóng bảng chọn'}).click();
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await category.click();
  assert.ok(await popup().evaluate(e=>e.scrollWidth<=e.clientWidth),'Large-text picker overflow');
  await popup().getByRole('button',{name:'Đóng bảng chọn'}).click();
  await page.evaluate(()=>document.documentElement.style.fontSize='');
  await source.click();await popup().getByRole('option',{name:'Tài khoản ngân hàng',exact:true}).focus();
  await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Mục tiêu tiết kiệm');
  await page.keyboard.press('Home');await page.keyboard.press('Enter');
  assert.match(await source.innerText(),/Tiền mặt/);
  await editor.getByRole('button',{name:'Thêm Giao Dịch',exact:true}).click();
  const result=await page.evaluate(()=>({transactions:JSON.parse(localStorage.getItem('ltmsav_transactions_v1')),accounts:JSON.parse(localStorage.getItem('ltmsav_accounts_v1'))}));
  assert.equal(result.transactions.length,1);assert.equal(result.transactions[0].categoryId,'food');assert.equal(result.transactions[0].accountId,'cash');assert.equal(result.accounts[0].balance,1735000);
  assert.deepEqual(errors,[]);
  await writeFile('ui-proof/pickers/result.json',JSON.stringify({passed:true,themes:['light','dark'],accentInsensitiveSearch:true,selectionPreservesDraft:true,nestedEscapeAndFocus:true,nativeSelectCount:0,correctFinancialRecord:true},null,2));
}finally{await browser?.close();server.kill('SIGTERM');}
