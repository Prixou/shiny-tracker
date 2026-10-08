import { Hourglass, ChevronRight, X } from 'lucide-react';
import { useActions, useAppState } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { bankDaysLeft, bankOpen } from '../../domain/bank.js';

/** Rappel « Banque : J-n » au-dessus de la grille, jusqu'à la fermeture (masquable). */
export default function BankBanner() {
  const hidden = useAppState(s => !!s.ui.hideBankBanner);
  const { setUiValue } = useActions();
  const { openBankPlan } = useNav();
  if (hidden || !bankOpen()) return null;
  return (
    <div className="flex items-center gap-1 pl-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
      <button onClick={openBankPlan} className="flex-1 min-w-0 flex items-center gap-2.5 min-h-12 text-left">
        <Hourglass className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="flex-1 min-w-0 text-sm text-slate-200 truncate"><strong className="text-amber-300">Banque : J-{bankDaysLeft()}</strong> · mon plan</span>
        <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
      </button>
      <button onClick={() => setUiValue('hideBankBanner', true)} className="icon-btn" aria-label="Masquer le rappel de la Banque"><X className="w-4 h-4" /></button>
    </div>
  );
}
