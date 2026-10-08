import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useActions } from '../../state/StoreProvider.jsx';
import { GAME_BY_ID } from '../../data/games.js';
import { METHOD_BY_ID } from '../../data/methods.js';
import { catchRatio, getLuckTier } from '../../domain/luck.js';
import { fmtNumber, fmtOdds, formatDate, formatDuration } from '../../lib/format.js';
import { BallIcon } from '../../ui/index.js';
import CaptureForm from './CaptureForm.jsx';

/** Un exemplaire capturé : résumé, chance, détails modifiables. */
export default function CopyCard({ copy, defaultOpen }) {
  const { updateCatch, removeCatch } = useActions();
  const [open, setOpen] = useState(defaultOpen);
  const ratio = catchRatio(copy);
  const luck = getLuckTier(ratio);
  const game = GAME_BY_ID[copy.game];
  return (
    <div className={`rounded-2xl border ${open ? 'border-amber-500/40 bg-slate-950' : 'border-slate-800 bg-slate-950'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3 text-left" aria-expanded={open}>
        <BallIcon id={copy.ball} className="w-7 h-7" />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-slate-100 truncate">
            {copy.nickname || formatDate(copy.date)}{copy.gender === 'm' ? ' ♂' : copy.gender === 'f' ? ' ♀' : ''}{copy.alpha ? ' · Baron' : ''}
          </span>
          <span className="block text-xs text-slate-500 truncate">
            {copy.nickname ? `${formatDate(copy.date)} · ` : ''}{game ? `${game.icon} ${game.short} · ` : ''}{METHOD_BY_ID[copy.method]?.name}
            {copy.count ? ` · ${fmtNumber(copy.count)} renc.` : ''}
          </span>
        </span>
        <span className="text-lg" title={luck.name}>{luck.emoji}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          {ratio != null && (
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${luck.bg}`}>
              <span className="text-2xl">{luck.emoji}</span>
              <div className="min-w-0">
                <div className={`text-sm font-black ${luck.color}`}>{luck.name}</div>
                <div className="text-xs text-slate-300">
                  {fmtNumber(copy.count)} rencontres · {fmtOdds(copy.odds)}{copy.elapsedMs ? ` · ${formatDuration(copy.elapsedMs, { short: true })}` : ''}
                </div>
              </div>
            </div>
          )}
          <CaptureForm value={copy} onChange={patch => updateCatch(copy.id, patch)} />
          <button onClick={() => removeCatch(copy.id)} className="btn-ghost w-full text-rose-300"><Trash2 className="w-4 h-4" /> Supprimer cet exemplaire</button>
        </div>
      )}
    </div>
  );
}
