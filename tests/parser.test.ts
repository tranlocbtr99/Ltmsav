import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVietnameseFinancialCommand as parse } from '../src/services/aiParser';
test('missing amount never invents a transaction',()=> {const r=parse('ăn trưa',['Tiền mặt'],['Ăn uống']);assert.equal(r.commands?.length,0);assert.ok(r.clarification_question);});
test('amount units',()=> {for(const [text,amount] of [['ăn trưa 45k',45000],['nhận lương 2tr',2000000],['nhận 1,5 triệu',1500000]] as const)assert.equal(parse(text,['Tiền mặt'],['Ăn uống','Lương']).commands?.[0].amount,amount);});
test('unknown transfer destination cannot be guessed',()=> {const r=parse('chuyển 50k từ Tiền mặt sang ngân hàng lạ',['Tiền mặt','Techcombank'],[]);assert.equal(r.commands?.length,0);assert.ok(r.clarification_question);});
test('transfer source follows sentence rather than account list order',()=>{const r=parse('chuyển 50k từ Techcombank sang Tiền mặt',['Tiền mặt','Techcombank'],[]);assert.equal(r.commands?.[0].account,'Techcombank');assert.equal(r.commands?.[0].account_to,'Tiền mặt');});
test('ambiguous account, multiple amounts, negation and recurring ask rather than write',()=>{
 for(const text of ['ăn trưa 45k','chi 30k và 50k tiền mặt','không ghi chi 50k tiền mặt','trả tiền nhà 2tr hàng tháng tiền mặt']) assert.equal(parse(text,['Tiền mặt','Techcombank'],['Ăn uống']).commands?.length,0);
});
test('unaccented aliases and relative/explicit dates',()=>{
 const now=new Date(2026,9,24);
 const r=parse('an trua 45k hom qua tcb',['Tiền mặt','Techcombank'],['Ăn uống'],now);
 assert.equal(r.commands?.[0].account,'Techcombank');assert.equal(r.commands?.[0].date,'2026-10-23');
 assert.equal(parse('ăn trưa 45k ngày 20/10/2026',['Tiền mặt'],['Ăn uống'],now).commands?.[0].amount,45000);
 assert.equal(parse('ăn trưa 45k ngày 31/02/2026',['Tiền mặt'],['Ăn uống'],now).commands?.length,0);
 assert.equal(parse('ăn trưa ngày 20/10/2026',['Tiền mặt'],['Ăn uống'],now).commands?.length,0);
});
test('grouped amounts and decimal units are not dates',()=>{
 for(const [text,amount] of [['ăn trưa 1.000.000',1000000],['ăn trưa 1,5 triệu',1500000],['ăn trưa 45.000đ',45000]] as const) assert.equal(parse(text,['Tiền mặt'],['Ăn uống']).commands?.[0].amount,amount);
});
test('compact million shorthand and year boundary relative date',()=>{
 assert.equal(parse('ăn trưa 2tr5',['Tiền mặt'],['Ăn uống']).commands?.[0].amount,2500000);
 assert.equal(parse('ăn trưa 45k hôm qua',['Tiền mặt'],['Ăn uống'],new Date(2027,0,1)).commands?.[0].date,'2026-12-31');
});
