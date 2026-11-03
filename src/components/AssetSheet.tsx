import React, {useEffect, useId, useState} from 'react';
import {createPortal} from 'react-dom';
import {useDialogFocus} from '../hooks/useDialogFocus';

/** Portaled above navigation, with an independent form scroller and visible actions. */
export function AssetSheet({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  const ref=useDialogFocus(true,onClose);
  const titleId=useId();
  const [viewport,setViewport]=useState(()=>({height:window.visualViewport?.height ?? window.innerHeight,top:window.visualViewport?.offsetTop ?? 0}));
  useEffect(()=>{
    const root=document.getElementById('root'),before=root?.inert;
    if(root)root.inert=true;
    const update=()=>setViewport({height:window.visualViewport?.height ?? window.innerHeight,top:window.visualViewport?.offsetTop ?? 0});
    window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);window.addEventListener('resize',update);
    return()=>{if(root)root.inert=before ?? false;window.visualViewport?.removeEventListener('resize',update);window.visualViewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
  },[]);
  return createPortal(<div className="silver-asset-overlay" style={{height:viewport.height,top:viewport.top}}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className="silver-asset-dialog">
      <span id={titleId} className="sr-only">{title}</span>{children}
    </div>
  </div>,document.body);
}
