import { Package, Check } from 'lucide-react';
import { useActions, useAppState } from '../../state/StoreProvider.jsx';
import { selectShinies } from '../../state/store.js';
import { MAIN_DEX } from '../../data/pokedex.js';
import { boxOrder, placeOf } from '../../domain/boxes.js';
import { feedback } from '../../lib/feedback.js';

/**
 * Place d'un Pokémon dans les boîtes HOME selon les réglages (null hors du living dex : variantes…).
 * @param {string} [key]
 */
export function useBoxPlace(key) {
  const { boxFirst, boxForms } = useAppState(s => ({ boxFirst: s.settings.boxFirst || 1, boxForms: s.settings.boxForms }));
  return key ? placeOf(key, boxOrder(MAIN_DEX, boxForms), boxFirst) : null;
}

/** Place du Pokémon dans les boîtes HOME du living dex (fiche), avec « Ranger » une fois le shiny obtenu. */
export default function BoxPlace({ p }) {
  const { caught, isBoxed } = useAppState(s => ({
    caught: !!selectShinies(s)[p.key],
    isBoxed: s.catches.some(c => c.key === p.key && c.boxed)
  }));
  const { setBoxed } = useActions();
  const place = useBoxPlace(p.key);
  if (!place) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
      <Package className={`w-5 h-5 shrink-0 ${isBoxed ? 'text-emerald-400' : caught ? 'text-amber-400' : 'text-slate-500'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-100">Boîte {place.box} · ligne {place.row}, colonne {place.col}</div>
        <div className="text-xs text-slate-400">{isBoxed ? 'Rangé dans HOME' : caught ? 'À ranger dans HOME' : 'Sa place dans ton living dex HOME'}</div>
      </div>
      {caught && (
        <button onClick={() => { setBoxed([p.key], !isBoxed, isBoxed ? `${p.name} retiré des boîtes` : `${p.name} rangé`); feedback.tap(); }} aria-pressed={isBoxed}
          className={`shrink-0 min-h-11 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 ${isBoxed ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-200'}`}>
          {isBoxed ? <><Check className="w-3.5 h-3.5" /> Rangé</> : 'Ranger'}
        </button>
      )}
    </div>
  );
}
