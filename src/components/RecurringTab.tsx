import React, { useEffect, useState } from 'react';
import { Account, Category, Transaction } from '../types';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';

type Rule = { id: string; title: string; amount: number; type: 'expense'|'income'; accountId: string; categoryId: string; day: number; startMonth: string; lastApplied?: string };
const KEY = 'ltmsav_recurring_rules_v1';
const monthKey = (d: Date) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
const read = (): Rule[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
interface Props { accounts: Account[]; categories: Category[]; transactions: Transaction[]; onAdd: (tx: Omit<Transaction,'id'|'createdAt'>) => void; }
export const RecurringTab: React.FC<Props> = ({accounts,categories,transactions,onAdd}) => {
  const [rules,setRules] = useState<Rule[]>(read);
  const [title,setTitle] = useState('');
  const [amount,setAmount] = useState('');
  const [type,setType] = useState<'expense'|'income'>('expense');
  const [accountId,setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId,setCategoryId] = useState('');
  const [day,setDay] = useState(1);
  const [error,setError] = useState('');
  const cats = categories.filter(c=>c.type===type);
  const currentMonth = monthKey(new Date());
  useEffect(()=>{ if(!accounts.some(a=>a.id===accountId)) setAccountId(accounts[0]?.id || ''); },[accounts,accountId]);
  useEffect(()=>{ if(!cats.some(c=>c.id===categoryId)) setCategoryId(cats[0]?.id || ''); },[categories,type,categoryId]);
  const save=(next:Rule[])=>{localStorage.setItem(KEY,JSON.stringify(next));setRules(next);};
  const create=(e:React.FormEvent)=>{
    e.preventDefault(); const n=Number(amount);
    if(!title.trim()||!Number.isSafeInteger(n)||n<=0||!accounts.some(a=>a.id===accountId)||!cats.some(c=>c.id===categoryId)||day<1||day>31){setError('Kiểm tra tên, số tiền, tài khoản, danh mục và ngày.');return;}
    const rule:Rule={id:crypto.randomUUID(),title:title.trim(),amount:n,type,accountId,categoryId,day,startMonth:currentMonth};
    try {save([...rules,rule]);setTitle('');setAmount('');setError('');} catch {setError('Không thể lưu lịch định kỳ.');}
  };
  const apply=(rule:Rule)=>{
    if(rule.lastApplied===currentMonth || transactions.some(tx=>tx.note?.includes('Giao dịch định kỳ: '+rule.id+' / '+currentMonth))){setError('Giao dịch đã được ghi nhận trong tháng này.');return;}
    const today=new Date(); const maxDay=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
    if(today.getDate()<Math.min(rule.day,maxDay)){setError('Giao dịch này chưa đến hạn trong tháng.');return;}
    if(!accounts.some(a=>a.id===rule.accountId)||!categories.some(c=>c.id===rule.categoryId)){setError('Tài khoản hoặc danh mục đã bị xóa.');return;}
    try {
      const date=currentMonth+'-'+String(Math.min(rule.day,maxDay)).padStart(2,'0');
      onAdd({type:rule.type,amount:rule.amount,accountId:rule.accountId,categoryId:rule.categoryId,date,description:rule.title,note:'Giao dịch định kỳ: '+rule.id+' / '+currentMonth});
      save(rules.map(r=>r.id===rule.id?{...r,lastApplied:currentMonth}:r));setError('');
    } catch {setError('Không thể ghi giao dịch. Vui lòng kiểm tra lại.');}
  };
  return <div className="space-y-4 pb-8">
    <div className="glass-card p-5 rounded-3xl"><div className="flex items-center gap-2 mb-3 text-blue-600"><CalendarDays size={22}/><h2 className="font-bold">Giao dịch định kỳ hằng tháng</h2></div>
      <p className="text-xs text-slate-500 mb-4">Lưu lịch và xác nhận ghi nhận khi đến hạn. Không tự động trừ tiền khi ứng dụng đóng.</p>
      <form onSubmit={create} className="grid grid-cols-2 gap-3">
        <input aria-label="Tên giao dịch" required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Tên giao dịch" className="col-span-2 p-3 rounded-xl bg-white/70 dark:bg-slate-800"/>
        <select aria-label="Loại" value={type} onChange={e=>setType(e.target.value as 'expense'|'income')} className="p-3 rounded-xl bg-white/70 dark:bg-slate-800"><option value="expense">Chi tiêu</option><option value="income">Thu nhập</option></select>
        <input aria-label="Số tiền" type="number" min="1" step="1" required value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Số tiền" className="p-3 rounded-xl bg-white/70 dark:bg-slate-800"/>
        <select aria-label="Tài khoản" value={accountId} onChange={e=>setAccountId(e.target.value)} className="p-3 rounded-xl bg-white/70 dark:bg-slate-800">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select aria-label="Danh mục" value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="p-3 rounded-xl bg-white/70 dark:bg-slate-800">{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label className="col-span-2 text-xs text-slate-600 dark:text-slate-300">Ngày lặp mỗi tháng <input type="number" min="1" max="31" value={day} onChange={e=>setDay(Number(e.target.value))} className="ml-2 w-20 p-2 rounded-xl bg-white/70 dark:bg-slate-800"/></label>
        <button type="submit" className="col-span-2 flex justify-center items-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 text-white font-bold"><Plus size={18}/> Tạo lịch định kỳ</button>
      </form>
    </div>
    {error&&<p role="alert" className="text-sm text-rose-600">{error}</p>}
    <div className="space-y-2">{rules.length===0?<p className="text-center text-slate-500 text-sm p-6">Chưa có lịch định kỳ.</p>:rules.map(rule=><div key={rule.id} className="glass-card p-4 rounded-2xl flex items-center gap-3"><div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{rule.title}</p><p className="text-xs text-slate-500">Ngày {rule.day} hằng tháng · {rule.amount.toLocaleString('vi-VN')} ₫</p><p className="text-[11px] text-slate-500">{rule.lastApplied===currentMonth?'Đã ghi nhận tháng này':'Chưa ghi nhận tháng này'}</p></div><button onClick={()=>apply(rule)} disabled={rule.lastApplied===currentMonth || transactions.some(tx=>tx.note?.includes('Giao dịch định kỳ: '+rule.id+' / '+currentMonth))} className="text-xs rounded-xl bg-blue-600 text-white p-2 disabled:opacity-40">Ghi nhận</button><button aria-label="Xóa lịch" onClick={()=>{if(confirm('Xóa lịch định kỳ này?'))save(rules.filter(r=>r.id!==rule.id));}} className="text-rose-500 p-2"><Trash2 size={17}/></button></div>)}</div>
  </div>;
};
