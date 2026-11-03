import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['--import','tsx','server.ts'],{env:{...process.env,NODE_ENV:'production',GEMINI_API_KEY:''},stdio:['ignore','ignore','pipe']});let error='';server.stderr.on('data',chunk=>{error+=chunk.toString();});
try{
 let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Backend startup failed: '+error);try{if((await fetch('http://127.0.0.1:3000')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
 const post=body=>fetch('http://127.0.0.1:3000/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const context={accounts:['Tiền mặt','Techcombank'],categories:['Ăn uống'],categoryDetails:[{name:'Ăn uống',type:'expense'}],localDate:'2026-11-04'};
 assert.equal((await post({...context,message:123})).status,400);
 assert.equal((await post({...context,message:'ăn trưa',accounts:'wrong'})).status,400);
 let r=await(await post({...context,message:'ăn trưa'})).json();assert.equal(r.commands[0].amount,0);assert.equal(r.commands[0].account,'');
 r=await(await post({...context,message:'hôm qua ăn trưa 65k bằng tiền mặt'})).json();assert.equal(r.commands[0].amount,65000);assert.equal(r.commands[0].account,'Tiền mặt');assert.equal(r.commands[0].date,'2026-11-03');
 r=await(await post({...context,message:'chuyển 500k từ Techcombank sang Tiền mặt'})).json();assert.equal(r.commands[0].account,'Techcombank');assert.equal(r.commands[0].account_to,'Tiền mặt');
 r=await(await post({...context,message:'chưa chi 65k bằng tiền mặt'})).json();assert.deepEqual(r.commands,[]);
 console.log('AI backend contract passed');
}finally{server.kill('SIGTERM');}
