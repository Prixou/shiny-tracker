import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertTriangle, Info } from 'lucide-react';
import { useBackClose } from '../lib/hooks.js';
import { TYPE_BY_ID, ballSprite, BALL_BY_ID } from '../data/constants.js';
import { spriteUrl } from '../data/pokedex.js';

let openSheets = 0;

// Panneau glissant depuis le bas sur mobile, fenêtre centrée sur grand écran.
export function Sheet({ open, onClose, title, subtitle, icon, children, footer, wide = false, full = false }) {
  useBackClose(open, onClose);
  useEffect(() => {
    if (!open) return;
    openSheets++;
    document.documentElement.classList.add('sheet-open');
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (--openSheets === 0) document.documentElement.classList.remove('sheet-open');
    };
  }, [open, onClose]);

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
            <button onClick={onClose} className="icon-btn -mr-2" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && <div className="px-5 pt-3 pb-safe-4 border-t border-slate-800/80 bg-slate-900 sm:rounded-b-3xl">{footer}</div>}
        {!footer && <div className="pb-safe" />}
      </div>
    </div>,
    document.body
  );
}

export function Segmented({ options, value, onChange, size = 'md', className = '' }) {
  return (
    <div className={`flex bg-slate-950/80 border border-slate-800 rounded-2xl p-1 gap-1 ${className}`} role="tablist">
      {options.map(o => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-xl font-bold transition-colors ${size === 'sm' ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} ${
              active ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
            {o.badge != null && <span className={`text-[10px] font-mono ${active ? 'text-slate-900/70' : 'text-slate-500'}`}>{o.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, desc, icon }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 py-3 text-left"
    >
      {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-slate-100">{label}</span>
        {desc && <span className="block text-xs text-slate-400 mt-0.5">{desc}</span>}
      </span>
      <span className={`shrink-0 w-12 h-7 rounded-full p-1 transition-colors ${checked ? 'bg-amber-500' : 'bg-slate-700'}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

export const Field = ({ label, children, hint, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-xs font-bold text-slate-400 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
  </label>
);

export const EmptyState = ({ icon, title, children, action }) => (
  <div className="flex flex-col items-center text-center py-14 px-6 gap-3">
    <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">{icon}</div>
    <h3 className="text-base font-black text-slate-200">{title}</h3>
    {children && <p className="text-sm text-slate-400 max-w-xs">{children}</p>}
    {action}
  </div>
);

// Image avec repli discret si le sprite n'existe pas / hors ligne.
export function Sprite({ pokemon, src, className = 'w-16 h-16', alt, pixel = true, ...rest }) {
  const [failed, setFailed] = useState(false);
  const url = src || spriteUrl(pokemon);
  useEffect(() => setFailed(false), [url]);
  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center text-slate-600`} aria-label={alt || pokemon?.name}>
        <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt ?? pokemon?.name ?? ''}
      className={`${className} object-contain ${pixel ? 'pixelated' : ''}`}
      loading="lazy"
      decoding="async"
      draggable="false"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

export const BallIcon = ({ id, className = 'w-6 h-6' }) => (
  <img src={ballSprite(id)} alt={BALL_BY_ID[id]?.name || 'Poké Ball'} title={BALL_BY_ID[id]?.name} className={`${className} object-contain pixelated`} loading="lazy" draggable="false" />
);

const TYPE_ICON_URL = id => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${id}.svg`;

export function TypeIcon({ type, className = 'w-3.5 h-3.5' }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`${className} rounded-full bg-white/70 inline-block`} />;
  return <img src={TYPE_ICON_URL(type)} alt="" className={`${className} object-contain`} onError={() => setFailed(true)} loading="lazy" />;
}

export function TypeBadge({ type, small = false }) {
  const t = TYPE_BY_ID[type];
  if (!t) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ backgroundColor: t.color, textShadow: '0 1px 1px rgba(0,0,0,.35)' }}
    >
      <TypeIcon type={type} className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {t.name}
    </span>
  );
}

/* ---------- Toasts ---------- */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, { type = 'success', action, duration = 2600 } = {}) => {
    const id = Math.random();
    setToasts([{ id, message, type, action }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  const dismiss = id => setToasts(t => t.filter(x => x.id !== id));
  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="fixed left-0 right-0 z-[70] flex flex-col items-center gap-2 px-4 pointer-events-none bottom-toast">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto w-full max-w-sm flex items-center gap-3 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-2xl px-4 py-3 shadow-2xl animate-toast-in" role="status">
              {t.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" /> : t.type === 'info' ? <Info className="w-5 h-5 text-sky-400 shrink-0" /> : <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
              <span className="flex-1 text-sm font-semibold text-slate-100">{t.message}</span>
              {t.action && (
                <button onClick={() => { t.action.onClick(); dismiss(t.id); }} className="text-sm font-black text-amber-400 px-2 py-1 -my-1 rounded-lg active:bg-slate-700">
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

/* ---------- Confirmation ---------- */
const ConfirmContext = createContext(async () => false);
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);
  const confirm = useCallback(opts => new Promise(resolve => {
    resolver.current = resolve;
    setState(opts);
  }), []);
  const close = result => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Sheet
        open={!!state}
        onClose={() => close(false)}
        title={state?.title}
        icon={state?.danger ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : null}
        footer={
          <div className="flex gap-3">
            <button onClick={() => close(false)} className="btn-secondary flex-1">{state?.cancelLabel || 'Annuler'}</button>
            <button onClick={() => close(true)} className={`${state?.danger ? 'btn-danger' : 'btn-primary'} flex-1`}>{state?.confirmLabel || 'Confirmer'}</button>
          </div>
        }
      >
        <p className="text-sm text-slate-300 leading-relaxed">{state?.message}</p>
      </Sheet>
    </ConfirmContext.Provider>
  );
}
