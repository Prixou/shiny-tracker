import { GitBranch, Trash2 } from 'lucide-react';
import { useActions } from '../../state/StoreProvider.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { fmtNumber, formatDate, isoFromTimestamp } from '../../lib/format.js';
import { Sprite } from '../../ui/index.js';

/** Phases (ou chaînes) précédentes de la chasse. */
export default function PhaseList({ hunt, dynamic }) {
  const { removePhase } = useActions();
  return (
    <div className="card p-4 space-y-2">
      <div className="label-caps">{dynamic ? 'Chaînes / phases' : 'Phases'} ({hunt.phases.length})</div>
      {hunt.phases.map((ph, i) => {
        const p = ph.key ? getPokemon(ph.key) : null;
        return (
          <div key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-slate-950 border border-slate-800">
            {p ? <Sprite pokemon={p} className="w-10 h-10" /> : <span className="w-10 h-10 flex items-center justify-center text-slate-500"><GitBranch className="w-4 h-4" /></span>}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-200 truncate">Phase {i + 1}{p ? ` · ${p.name}` : ''}</div>
              <div className="text-xs text-slate-500 truncate">{fmtNumber(ph.count)} · {formatDate(isoFromTimestamp(ph.at))}{ph.note ? ` · ${ph.note}` : ''}</div>
            </div>
            <button onClick={() => removePhase(hunt.id, i)} className="icon-btn w-9 h-9 text-slate-500" aria-label="Supprimer la phase"><Trash2 className="w-4 h-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
