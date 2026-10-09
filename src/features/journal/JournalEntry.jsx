import { memo } from 'react';
import { Check } from 'lucide-react';
import { GAME_BY_ID } from '../../data/games.js';
import { METHOD_BY_ID } from '../../data/methods.js';
import { formatDate, fmtNumber } from '../../lib/format.js';
import { getLuckTier, catchRatio } from '../../domain/luck.js';
import { Sprite, BallIcon } from '../../ui/index.js';

/**
 * Une ligne du journal. En mode sélection, un toucher coche ou décoche le shiny au lieu d'ouvrir sa fiche.
 * `onOpen(key)` et `onToggle(id)` doivent être stables (la ligne n'est rendue à nouveau que si elle change).
 */
const JournalEntry = memo(function JournalEntry({ entry, selecting, selected, onOpen, onToggle }) {
  const { key, id, rec, p } = entry;
  const luck = getLuckTier(catchRatio(rec));
  const game = GAME_BY_ID[rec.game];
  const method = METHOD_BY_ID[rec.method];
  return (
    <button onClick={() => (selecting ? onToggle(id) : onOpen(key))} aria-pressed={selecting ? selected : undefined}
      className={`cv-auto w-full flex items-center gap-3 p-2.5 pr-3 rounded-2xl border text-left ${selected ? 'bg-amber-500/10 border-amber-500/60' : 'bg-slate-900/80 border-slate-800 active:bg-slate-800'}`}>
      {selecting && (
        <span aria-hidden="true" className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600'}`}>
          {selected && <Check className="w-4 h-4" strokeWidth={3} />}
        </span>
      )}
      <div className="relative shrink-0">
        <Sprite pokemon={p} className="w-16 h-16 drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]" />
        <BallIcon id={rec.ball} className="w-6 h-6 absolute -bottom-1 -right-1" />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-amber-200 truncate">{rec.nickname || p.name}</span>
          {rec.gender === 'm' && <span className="text-sky-400 text-sm">♂</span>}
          {rec.gender === 'f' && <span className="text-pink-400 text-sm">♀</span>}
          {rec.provisional && <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 text-[10px] font-black">Provisoire</span>}
        </div>
        {rec.nickname && <div className="text-[11px] text-slate-500 -mt-0.5">{p.name}</div>}
        <div className="text-xs text-slate-400 truncate">{formatDate(rec.date)} · {game ? `${game.icon} ${game.short}` : 'Jeu inconnu'}</div>
        <div className="text-xs text-slate-500 truncate">{method?.icon} {method?.name}{rec.count ? ` · ${fmtNumber(rec.count)} renc.` : ''}</div>
      </div>
      <span className={`shrink-0 text-xl w-10 h-10 rounded-xl border flex items-center justify-center ${luck.bg}`} title={luck.name}>{luck.emoji}</span>
    </button>
  );
});

export default JournalEntry;
