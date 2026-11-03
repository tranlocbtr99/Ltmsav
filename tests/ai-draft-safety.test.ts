import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVietnameseFinancialCommand} from '../src/services/aiParser';

test('offline AI draft keeps missing amount and source explicit instead of inventing money or an account',()=>{
  const result=parseVietnameseFinancialCommand('ăn trưa',['Tiền mặt','Ngân hàng'],['Ăn uống']);
  assert.equal(result.commands?.[0].amount,0);
  assert.equal(result.commands?.[0].account,'');
  assert.equal(result.needs_confirmation,true);
});
test('offline AI still recognizes explicit shorthand money and source',()=>{
  const result=parseVietnameseFinancialCommand('Ăn trưa 65k bằng Tiền mặt',['Tiền mặt','Ngân hàng'],['Ăn uống']);
  assert.equal(result.commands?.[0].amount,65000);
  assert.equal(result.commands?.[0].account,'Tiền mặt');
  assert.equal(result.commands?.[0].kind,'expense');
});
