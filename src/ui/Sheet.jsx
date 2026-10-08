import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBackClose } from '../lib/hooks.js';

// Pile des fenêtres ouvertes : Échap ne ferme que celle du dessus.
const sheetStack = [];

// Panneau glissant depuis le bas sur mobile, fenêtre centrée sur grand écran.
export function Sheet({ open, onClose, title, subtitle, icon, actions, children, footer, wide = false, full = false, bodyRef }) {
  useBackClose(open, onClose);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = Symbol('sheet');
    sheetStack.push(id);
    document.documentElement.classList.add('sheet-open');
    const onKey = e => {
      if (e.key === 'Escape' && sheetStack[sheetStack.length - 1] === id) {
        e.stopImmediatePropagation();
        onCloseRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      sheetStack.splice(sheetStack.indexOf(id), 1);
      if (!sheetStack.length) document.documentElement.classList.remove('sheet-open');
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} ${full ? 'h-[92dvh]' : 'max-h-[92dvh]'} flex flex-col bg-slate-900 border border-slate-800 sm:rounded-3xl rounded-t-3xl shadow-2xl animate-sheet-up sm:animate-pop-in overscroll-contain`}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1" aria-hidden="true">
          <div className="w-10 h-1.5 rounded-full bg-slate-700" />
        </div>
        {title && (
          <div className="flex items-center gap-3 px-5 pt-2 sm:pt-5 pb-3 border-b border-slate-800/80">
            {icon && <div className="shrink-0 text-amber-400">{icon}</div>}
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-white truncate">{title}</h2>
              {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
            </div>
            {actions}
            <button onClick={onClose} className="icon-btn -mr-2" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && <div className="px-5 pt-3 pb-safe-4 border-t border-slate-800/80 bg-slate-900 sm:rounded-b-3xl">{footer}</div>}
        {!footer && <div className="pb-safe" />}
      </div>
    </div>,
    document.body
  );
}
