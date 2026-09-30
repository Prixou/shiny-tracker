import { Info } from 'lucide-react';
import { GAMES, GAME_BY_ID } from '../data/constants.js';
import { gameMethods, METHOD_BY_ID, charmAvailable, oddsAt, oddsContext, isDynamic } from '../data/methods.js';
import { fmtOdds } from '../lib/utils.js';
import { Field, Toggle } from './ui.jsx';

/** Choix jeu + méthode + options + Charme, avec calcul du taux en direct. */
export default function OddsConfig({ value, onChange, allowCustom = true }) {
  const game = GAME_BY_ID[value.game] || GAME_BY_ID.other;
  const methods = gameMethods(game.id);
  const method = METHOD_BY_ID[value.method] || methods[0];
  const ctx = oddsContext(value);
  const dynamic = isDynamic(ctx);
  const opts = value.opts || {};
  const setOpt = (id, v) => onChange({ opts: { ...opts, [id]: v } });

  const changeGame = id => {
    const ms = gameMethods(id);
    const next = ms.some(m => m.id === value.method) ? value.method : ms[0].id;
    onChange({ game: id, method: next, opts: {}, step: METHOD_BY_ID[next]?.step || 1 });
  };

  return (
    <div className="space-y-4">
      <Field label="Jeu" hint={game.tip ? `💡 ${game.tip}` : null}>
        <select className="input" value={game.id} onChange={e => changeGame(e.target.value)}>
          {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
        </select>
      </Field>

      <Field label="Méthode">
        <select className="input" value={method.id} onChange={e => onChange({ method: e.target.value, opts: {}, step: METHOD_BY_ID[e.target.value]?.step || 1 })}>
          {methods.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </select>
      </Field>

      {(method.options?.length > 0 || charmAvailable(game.id, method.id)) && (
        <div className="card px-4 py-1 divide-y divide-slate-800">
          {charmAvailable(game.id, method.id) && (
            <Toggle checked={!!value.charm} onChange={charm => onChange({ charm })} label="Charme Chroma" desc={`+${game.charm} tirage${game.charm > 1 ? 's' : ''} shiny dans ce jeu`} />
          )}
          {method.options?.map(o => o.type === 'toggle' ? (
            <Toggle key={o.id} checked={!!opts[o.id]} onChange={v => setOpt(o.id, v)} label={o.label} />
          ) : (
            <div key={o.id} className="py-3 space-y-2">
              <div className="text-sm font-bold text-slate-100">{o.label}</div>
              <div className="flex gap-1.5">
                {o.values.map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setOpt(o.id, v)} aria-pressed={(opts[o.id] ?? o.default ?? 0) === v}
                    className={`flex-1 min-h-10 rounded-xl border text-xs font-bold ${(opts[o.id] ?? o.default ?? 0) === v ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-amber-500/30">
        <div className="shrink-0 text-center">
          <div className="text-[10px] font-bold uppercase text-slate-500">{dynamic ? 'Départ' : 'Taux'}</div>
          <div className="text-lg font-black font-mono text-amber-400">{fmtOdds(oddsAt(value, 0))}</div>
        </div>
        {dynamic && (
          <div className="shrink-0 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-500">Max ({method.chain}+)</div>
            <div className="text-lg font-black font-mono text-emerald-400">{fmtOdds(oddsAt(value, method.chain))}</div>
          </div>
        )}
        {method.note && <p className="text-xs text-slate-400 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />{method.note}</p>}
      </div>

      {allowCustom && (
        <Field label="Taux personnalisé (facultatif)" hint="Remplace le calcul automatique, par exemple pour un évènement.">
          <input type="number" inputMode="numeric" min="1" className="input font-mono" value={value.customOdds || ''} placeholder="Automatique"
            onChange={e => onChange({ customOdds: Math.max(0, parseInt(e.target.value, 10) || 0) || null })} />
        </Field>
      )}
    </div>
  );
}
