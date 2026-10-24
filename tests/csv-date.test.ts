import {test} from 'node:test';
import assert from 'node:assert/strict';
import {csvCell,transactionsCsv} from '../src/services/csv';
import {localDate} from '../src/services/date';
test('CSV neutralizes formulas, quotes commas/newlines and preserves Vietnamese BOM',()=>{
 assert.equal(csvCell(' =SUM(A1)'), '"\' =SUM(A1)"');
 assert.equal(csvCell('a,"b"\nc'), '"a,""b""\nc"');
 assert.ok(transactionsCsv([],[],[]).startsWith('\uFEFF'));
});
test('calendar date follows device date',()=>assert.equal(localDate(new Date(2026,9,24,0,1)),'2026-10-24'));
