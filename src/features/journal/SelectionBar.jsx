import { X } from 'lucide-react';

/** Barre du mode sélection, au-dessus de la navigation (à gauche du bouton de l'assistant), à portée de pouce. */
export default function SelectionBar({ count, onEdit, onClose }) {
  return (
    <div className="fixed z-30 left-4 right-[5.5rem] bottom-[calc(var(--nav-h)+var(--safe-bottom)+16px)] md:bottom-6 md:left-auto md:w-96 flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 shadow-xl shadow-black/40">
      <button onClick={onClose} className="icon-btn w-11 h-11 shrink-0" aria-label="Quitter la sélection">
        <X className="w-5 h-5" />
      </button>
      <span className="flex-1 min-w-0 text-sm font-bold text-slate-100 truncate" aria-live="polite">
        {count} sélectionné{count > 1 ? 's' : ''}
      </span>
      <button onClick={onEdit} disabled={!count} className="btn-primary min-h-11 px-4 text-sm shrink-0 disabled:opacity-40">Modifier</button>
    </div>
  );
}
