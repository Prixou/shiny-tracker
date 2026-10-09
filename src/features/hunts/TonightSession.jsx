import { useState } from 'react';
import { Star } from 'lucide-react';
import { GAME_BY_ID } from '../../data/games.js';
import { METHOD_BY_ID } from '../../data/methods.js';
import { fmtNumber, fmtOdds, fmtPercent, formatDuration } from '../../lib/format.js';
import { Sprite } from '../../ui/index.js';

const SHOWN = 6;

/** Une session suggérée : jeu, méthode, chance dans le temps choisi, et les Pokémon à y chasser (un toucher lance la chasse). */
export default function TonightSession({ session, hours, onHunt }) {
  const [all, setAll] = useState(false);
  const { best, items } = session;
  const game = GAME_BY_ID[best.option.game];
  const method = METHOD_BY_ID[best.option.cfg.method];
  const title = session.event ? best.option.label : game?.name;
  const visible = all ? items : items.slice(0, SHOWN);
  return (
    <article className="card p-4 space-y-3" aria-label={`${title} · ${method?.name}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5" aria-hidden="true">{game?.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-white leading-snug">{title}</h3>
          <p className="text-xs text-slate-400 truncate">{method?.icon} {method?.name} · {fmtOdds(best.option.odds)}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-black font-mono text-amber-300 leading-none">{fmtPercent(best.chance, 0)}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">en {hours < 1 ? '30 min' : `${hours} h`}</div>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        ≈ {formatDuration(best.avgHours * 3600000, { short: true })} en moyenne · {best.mine ? 'ton rythme' : 'rythme estimé'} : {fmtNumber(best.pace)} {method?.unit || 'rencontres'}/h
      </p>
      {(session.event || session.bank) && (
        <div className="flex flex-wrap gap-1.5">
          {session.event && <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[11px] font-black">Évènement en cours</span>}
          {session.bank && <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 text-[11px] font-black">Avant la fermeture de la Banque</span>}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {visible.map(o => (
          <button key={o.p.key} onClick={() => onHunt(o)} aria-label={`Chasser ${o.p.name}`}
            className="flex items-center gap-1 pl-0.5 pr-2.5 min-h-11 max-w-full rounded-xl bg-slate-950 border border-slate-800 active:bg-slate-800">
            <Sprite pokemon={o.p} className="w-9 h-9 shrink-0" alt="" />
            <span className="text-xs font-bold text-slate-200 truncate">{o.p.name}</span>
            {o.wished && <Star className="w-3.5 h-3.5 shrink-0 text-amber-400 fill-amber-400" aria-label="Objectif" />}
          </button>
        ))}
        {items.length > SHOWN && (
          <button onClick={() => setAll(a => !a)} className="min-h-11 px-3 rounded-xl border border-dashed border-slate-700 text-xs font-bold text-slate-400">
            {all ? 'Moins' : `+${items.length - SHOWN} autres`}
          </button>
        )}
      </div>
    </article>
  );
}
