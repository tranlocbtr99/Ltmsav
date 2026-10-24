import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVietnameseFinancialCommand as parse } from '../src/services/aiParser';
test('missing amount never invents a transaction',()=> {const r=parse('ăn trưa',['Tiền mặt'],['Ăn uống']);assert.equal(r.commands?.length,0);assert.ok(r.clarification_question);});
test('amount units',()=> {for(const [text,amount] of [['ăn trưa 45k',45000],['nhận lương 2tr',2000000],['nhận 1,5 triệu',1500000]] as const)assert.equal(parse(text,['Tiền mặt'],['Ăn uống','Lương']).commands?.[0].amount,amount);});
test('unknown transfer destination cannot be guessed',()=> {const r=parse('chuyển 50k từ Tiền mặt sang ngân hàng lạ',['Tiền mặt','Techcombank'],[]);assert.equal(r.commands?.length,0);assert.ok(r.clarification_question);});
test('transfer source follows sentence rather than account list order',()=>{const r=parse('chuyển 50k từ Techcombank sang Tiền mặt',['Tiền mặt','Techcombank'],[]);assert.equal(r.commands?.[0].account,'Techcombank');assert.equal(r.commands?.[0].account_to,'Tiền mặt');});
