import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertTriangle, Info } from 'lucide-react';

// Messages courts en bas de l'écran (un seul à la fois), avec action facultative (« Annuler »).
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
