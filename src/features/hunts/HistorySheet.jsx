import { History, RotateCcw, Trash2 } from 'lucide-react';
import { useActions } from '../../state/StoreProvider.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { luckRatio } from '../../data/methods.js';
import { huntChance, huntTotal } from '../../domain/hunt.js';
import { getLuckTier } from '../../domain/luck.js';
import { fmtNumber, formatDate, formatDuration, isoFromTimestamp } from '../../lib/format.js';
import { Sheet, Sprite } from '../../ui/index.js';

/** Chasses terminées : reprendre ou supprimer. */
export default function HistorySheet({ open, onClose, hunts }) {
  const { resumeHunt, deleteHunt } = useActions();
  return (
    <Sheet open={open} onClose={onClose} title="Chasses terminées" icon={<History className="w-5 h-5" />}>
      <div className="space-y-2">
        {hunts.map(h => {
          const p = getPokemon(h.targetId);
          const total = huntTotal(h);
          const luck = getLuckTier(total > 0 ? luckRatio(huntChance(h)) : null);
          return (
            <div key={h.id} className="flex items-center gap-3 p-2 pr-1 rounded-2xl bg-slate-950 border border-slate-800">
              <Sprite pokemon={p} className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-100 truncate">{p?.name} <span title={luck.name}>{luck.emoji}</span></div>
                <div className="text-xs text-slate-500 truncate">{fmtNumber(total)} · {formatDuration(h.elapsedMs, { short: true })} · {formatDate(isoFromTimestamp(h.finishedAt))}</div>
              </div>
              <button className="icon-btn text-slate-400" aria-label="Reprendre" onClick={() => { resumeHunt(h.id); onClose(); }}><RotateCcw className="w-4 h-4" /></button>
              <button className="icon-btn text-slate-500" aria-label="Supprimer" onClick={() => deleteHunt(h.id)}><Trash2 className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
