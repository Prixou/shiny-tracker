import { POKE_BALLS, BALL_BY_ID } from '../data/constants.js';
import { BallIcon } from './pokemon.jsx';

/**
 * Choix de la Poké Ball (grille de 27). `emptyLabel` : on peut retoucher la Ball choisie pour revenir
 * à « aucune » (ex. : « Garder » dans l'édition en lot).
 */
export default function BallPicker({ value, onChange, emptyLabel = '' }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-400">Poké Ball</span>
        <span className="text-xs font-bold text-amber-300 truncate">{BALL_BY_ID[value]?.name || emptyLabel}</span>
      </div>
      <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
        {POKE_BALLS.map(b => (
          <button key={b.id} type="button" onClick={() => onChange(emptyLabel && value === b.id ? '' : b.id)} aria-label={b.name} aria-pressed={value === b.id}
            className={`aspect-square rounded-xl flex items-center justify-center border transition active:scale-90 ${value === b.id ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-950 border-slate-800'}`}>
            <BallIcon id={b.id} className="w-7 h-7" />
          </button>
        ))}
      </div>
    </div>
  );
}
