import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Sheet } from './Sheet.jsx';

// Demande de confirmation (panneau) : `await confirm({ title, message, danger })` → vrai / faux.
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
