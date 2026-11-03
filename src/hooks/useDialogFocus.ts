import {useEffect, useRef} from 'react';

const modalStack: HTMLDivElement[] = [];

/** Keep keyboard navigation within a sheet and restore the invoking control. */
export function useDialogFocus(open: boolean, onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    if (!open) return;
    const node=ref.current;
    if (!node) return;
    modalStack.push(node);
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []).filter(el => el.getClientRects().length);
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length-1] !== node) return;
      if (event.key === 'Escape') { event.preventDefault(); dismiss.current(); }
      if (event.key !== 'Tab') return;
      const list = controls(), first = list[0], last = list[list.length - 1];
      if (event.shiftKey && (document.activeElement === first || !ref.current?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !ref.current?.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown',keydown);
    return () => {
      const index=modalStack.indexOf(node);
      if(index>=0)modalStack.splice(index,1);
      document.body.style.overflow = modalStack.length ? 'hidden' : overflow;
      document.removeEventListener('keydown',keydown);
      queueMicrotask(() => { if (previous?.isConnected) previous.focus(); });
    };
  },[open]);
  return ref;
}
