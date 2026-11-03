import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
await mkdir('ui-proof/liquid-finance',{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4174'],{stdio:'inherit'});
let browser;
try {
  for(let i=0;i<60;i++) { try { if((await fetch('http://127.0.0.1:4174')).ok)break; }catch{} await new Promise(r=>setTimeout(r,250)); }
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Ho_Chi_Minh',serviceWorkers:'block',hasTouch:true});
  await context.addInitScript(()=>{
    if(localStorage.getItem('liquid-proof'))return;
    const now=new Date(), date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    localStorage.setItem('ltmsav_schema_version','7');
    localStorage.setItem('ltmsav_language','vi');
    localStorage.setItem('ltmsav_accounts_v1',JSON.stringify([
      {id:'cash',name:'Tiền mặt',type:'cash',balance:1315947,currency:'VND',iconName:'Wallet',color:'#1677ff'},
      {id:'save',name:'Tiết kiệm',type:'savings',balance:6000000,currency:'VND',iconName:'PiggyBank',color:'#7045ba'}
    ]));
    localStorage.setItem('ltmsav_categories_v1',JSON.stringify([{id:'food',name:'Ăn uống',type:'expense',iconName:'Utensils',color:'#ba3151'},{id:'salary',name:'Lương',type:'income',iconName:'Briefcase',color:'#147a46'}]));
    localStorage.setItem('ltmsav_transactions_v1',JSON.stringify([{id:'old-tx',description:'Bữa trưa',date,amount:65000,accountId:'cash',categoryId:'food',type:'expense',createdAt:date}]));
    localStorage.setItem('ltmsav_budgets_v1',JSON.stringify([{id:'budget',categoryId:'food',monthlyLimit:1000000}]));
    localStorage.setItem('ltmsav_settings_v1',JSON.stringify({theme:'light',securityEnabled:false,pinCode:'',biometricEnabled:false,allowNegativeBalance:false,currency:'VND',autoConfirmAi:false}));
    localStorage.setItem('liquid-proof','yes');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174');
  const nav=page.locator('nav');
  await nav.getByRole('button',{name:'Trang chủ',exact:true}).waitFor();
  assert.equal(await nav.getByRole('button').count(),5);
  assert.equal(await nav.getByRole('button',{name:'Cá nhân',exact:true}).count(),0);
  assert.equal(await page.locator('header').getByRole('button',{name:'Cá nhân',exact:true}).count(),1);
  assert.match(await page.locator('.balance-hero').innerText(),/1\.315\.947/);
  const heroHeight=await page.locator('.balance-hero').evaluate(e=>e.getBoundingClientRect().height);
  assert.ok(heroHeight<230,'Compact balance card: '+heroHeight);
  await page.getByRole('button',{name:'Ẩn tổng tài sản',exact:true}).click();
  assert.ok(!(await page.locator('main').innerText()).includes('65.000'));
  assert.equal(await page.locator('main [title*="65.000"]').count(),0);
  await page.getByRole('button',{name:'Hiện tổng tài sản',exact:true}).click();
  for(const dark of [false,true]) {
    await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
    for(const [name,file] of [['Trang chủ','home'],['Giao dịch','transactions'],['Tài sản','assets'],['Kế hoạch','plans'],['Cá nhân','settings']]) {
      await (name === 'Cá nhân' ? page.locator('header') : nav).getByRole('button',{name,exact:true}).click();
      await page.screenshot({animations:'disabled',path:`ui-proof/liquid-finance/${file}-${dark?'dark':'light'}.png`,fullPage:true});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow on '+name);
    }
  }
  await nav.getByRole('button',{name:'Tài sản',exact:true}).click();
  await page.getByLabel('Tùy chọn tài khoản: Tiền mặt').click();
  await page.getByRole('button',{name:'Xem lịch sử',exact:true}).click();
  assert.equal(await page.locator('main').getByRole('combobox').count(),0); // filter initially collapsed
  assert.match(await page.locator('main').innerText(),/Bữa trưa/);
  await page.getByRole('button',{name:'Thêm giao dịch',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  const height=await page.getByRole('dialog').evaluate(el=>el.offsetHeight);
  assert.ok(height>800,'Mobile entry fills the viewport: '+height);
  await page.screenshot({animations:'disabled',path:'ui-proof/liquid-finance/add-dark.png'});
  await page.getByRole('dialog').getByRole('button',{name:'Hủy',exact:true}).last().click();
  // Five bottom destinations plus header profile remain reachable at small, large and landscape widths.
  for(const viewport of [{width:320,height:740},{width:360,height:800},{width:412,height:900},{width:844,height:390}]) {
    await page.setViewportSize(viewport);
    const targets=await nav.getByRole('button').evaluateAll(buttons=>buttons.map(b=>({top:b.offsetTop,width:b.offsetWidth,height:b.offsetHeight})));
    assert.equal(new Set(targets.map(t=>t.top)).size,1,'Bottom bar must stay on one row');
    assert.ok(targets.every(t=>t.width>=48 && t.height>=48),'Minimum navigation touch target');
    for(const name of ['Trang chủ','Giao dịch','Tài sản','Kế hoạch','Cá nhân']) {
      await (name === 'Cá nhân' ? page.locator('header') : nav).getByRole('button',{name,exact:true}).click();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} overflow at ${viewport.width}`);
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  for(const name of ['Trang chủ','Giao dịch','Tài sản','Kế hoạch','Cá nhân']) {
    await (name === 'Cá nhân' ? page.locator('header') : nav).getByRole('button',{name,exact:true}).click();
    const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,5).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.slice(0,100)})));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Large text overflow on '+name+': '+JSON.stringify(overflow));
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='');
  await page.route('**/api/chat',async route=>{
    const now=new Date(),date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const cmd={kind:'expense',amount:65000,currency:'VND',account:'Tiền mặt',category:'Ăn uống',date,description:'AI test'};
    await route.fulfill({json:{intent:'create_expense',needs_confirmation:true,analysis:'Kiểm tra trước khi lưu.',commands:[cmd,{...cmd,amount:25000,description:'AI second'}]}});
  });
  await nav.getByRole('button',{name:'Nhập bằng AI',exact:true}).click();
  await page.getByRole('textbox').fill('Ăn trưa 65k bằng tiền mặt');
  await page.locator('main').getByRole('button',{name:'Nhập bằng AI',exact:true}).click();
  await page.getByText('Kiểm tra trước khi lưu.',{exact:true}).waitFor();
  const drafts=page.locator('fieldset');
  assert.equal(await drafts.count(),2);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_transactions_v1')).length),1,'AI only creates drafts');
  await drafts.first().getByLabel('Số tiền (VND)',{exact:true}).fill('70000');
  await page.screenshot({animations:'disabled',path:'ui-proof/liquid-finance/ai-dark.png',fullPage:true});
  // Two synchronous click events must still post exactly once.
  await page.getByRole('button',{name:'Xác Nhận & Ghi Sổ Ngay',exact:true}).first().evaluate(button=>{button.click();button.click();});
  let records=await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_transactions_v1')));
  assert.equal(records.length,2); assert.equal(records.find(t=>t.description==='AI test').amount,70000);
  assert.equal(await drafts.count(),1,'The other draft remains independently confirmable');
  await page.getByRole('button',{name:'Xác Nhận & Ghi Sổ Ngay',exact:true}).click();
  records=await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_transactions_v1')));
  assert.equal(records.length,3);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ltmsav_accounts_v1'))[0].balance),1220947);
  assert.deepEqual(errors,[]);
  await writeFile('ui-proof/liquid-finance/result.json',JSON.stringify({passed:true,heroHeight,viewports:[320,360,390,412,844],themes:['light','dark'],aiEditedAndConfirmedIndependently:true,doubleClickGuard:true,privacy:true},null,2));
} finally {await browser?.close();server.kill('SIGTERM');}
