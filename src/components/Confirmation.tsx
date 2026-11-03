import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {AlertTriangle} from 'lucide-react';
import {useDialogFocus} from '../hooks/useDialogFocus';
import {useLanguage} from '../contexts/LanguageContext';
type Request = {message:string; destructive?:boolean; title?:string; confirmLabel?:string; resolve:(answer:boolean)=>void};
const queue:Request[]=[];
let update:(()=>void)|undefined;
export function confirmAction(message:string, options:Omit<Partial<Request>,'message'|'resolve'>={}) {
  if(!update || queue.some(request=>request.message===message))return Promise.resolve(false);
  return new Promise<boolean>(resolve=>{queue.push({message,...options,resolve});update?.();});
}
export function ConfirmationHost() {
  const [request,setRequest]=useState<Request>();
  useEffect(()=>{update=()=>setRequest(queue[0]);return()=>{update=undefined;queue.splice(0).forEach(r=>r.resolve(false));};},[]);
  if(!request)return null;
  return <ConfirmationView request={request} onAnswer={answer=>{queue.shift()?.resolve(answer);update?.();}}/>;
}
function ConfirmationView({request,onAnswer}:{request:Request;onAnswer:(answer:boolean)=>void}) {
  const {t}=useLanguage();
  const ref=useDialogFocus(true,()=>onAnswer(false));
  useEffect(()=>{const root=document.getElementById('root');if(!root)return;const before=root.inert;root.inert=true;return()=>{root.inert=before;};},[]);
  return createPortal(<div className="silver-alert-overlay" onClick={e=>{if(e.target===e.currentTarget)onAnswer(false);}}><div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="silver-confirm-title" aria-describedby="silver-confirm-message" className="silver-alert">
    {request.destructive && <div className="silver-alert-symbol"><AlertTriangle size={24}/></div>}
    <h2 id="silver-confirm-title">{request.title || t('confirmActionTitle')}</h2><p id="silver-confirm-message">{request.message}</p>
    <div className="silver-alert-actions"><button type="button" onClick={()=>onAnswer(false)}>{t('cancel')}</button><button type="button" className={request.destructive?'is-destructive':'is-primary'} onClick={()=>onAnswer(true)}>{request.confirmLabel || t(request.destructive?'delete':'confirmActionLabel')}</button></div>
  </div></div>,document.body);
}
