import { useEffect, useState } from 'react';
import { Trophy, MapPin, Timer, Info, ShieldAlert } from 'lucide-react';
import { GAME_BY_ID } from '../data/constants.js';
import { bestOptions } from '../lib/bestOptions.js';
import { bestOptionsPrefs, myGamesSet } from '../lib/myGames.js';
import { useStore } from '../state/store.jsx';
import { loadEncounters } from '../lib/encountersData.js';
import { fmtOdds } from '../lib/utils.js';

const MEDALS = ['🥇', '🥈', '🥉'];
const SHOWN = 3;

/** Carte « Meilleures options shiny » de la fiche Pokémon. */
export default function BestOptions({ pokemon, onHunt, fallbackTip }) {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const { settings } = useStore();
  useEffect(() => {
    let alive = true;
    loadEncounters().then(d => { if (alive) setData(d); }).catch(() => { if (alive) setData({}); });
    return () => { alive = false; };
  }, []);

  if (!data) return <div className="h-40 rounded-3xl bg-slate-950 border border-slate-800 animate-pulse" />;
  const { main, extra, others } = bestOptions(pokemon, data, bestOptionsPrefs(settings));
  const filtered = !!myGamesSet(settings);

  return (
    <section className="p-4 rounded-3xl bg-slate-950 border border-amber-500/25 space-y-3">
      <div className="flex items-center gap-2 label-caps text-amber-400"><Trophy className="w-4 h-4" /> Meilleures options shiny</div>

      {main.length === 0 ? (
        <p className="flex gap-2 text-sm text-slate-300 leading-relaxed">
          {pokemon.isShinyLocked ? <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" /> : <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />}
          {filtered && others.length ? 'Aucune option dans tes jeux.' : fallbackTip || 'Pas de méthode de chasse connue : évolution, échange ou distribution.'}
        </p>
      ) : main.slice(0, showAll ? main.length : SHOWN).map((o, i) => {
        const game = GAME_BY_ID[o.game];
        const open = expanded === i;
        const shown = open ? o.locations : o.locations.slice(0, 3);
        return (
          <div key={o.game} className={`rounded-2xl border p-3 space-y-2 ${i === 0 ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5 w-6 text-center shrink-0">{MEDALS[i] || <span className="text-sm font-black text-slate-500">{i + 1}.</span>}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-slate-100">{game?.icon} {game?.name}</div>
                <div className="text-xs text-slate-300">{o.label}{o.cfg.charm && game?.charm ? ' · Charme Chroma' : ''}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`text-lg font-black font-mono ${i === 0 ? 'text-amber-300' : 'text-slate-100'}`}>{fmtOdds(o.odds)}</div>
              </div>
            </div>
            {o.locations.length > 0 && (
              <div className="flex gap-1.5 text-xs text-slate-400 pl-9">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {shown.join(' · ')}
                  {o.locations.length > 3 && (
                    <button onClick={() => setExpanded(open ? null : i)} className="ml-1 font-bold text-amber-400">
                      {open ? 'moins' : `+${o.locations.length - 3}`}
                    </button>
                  )}
                </span>
              </div>
            )}
            {o.estimate && <p className="pl-9 text-[11px] text-sky-300/90">≈ {o.estimate}</p>}
            {o.note && <p className="pl-9 text-[11px] text-slate-400">💡 {o.note}</p>}
            <div className="pl-9">
              <button onClick={() => onHunt(o.cfg)} className="btn-secondary min-h-10 w-full text-xs">
                <Timer className="w-4 h-4" /> Chasser avec ces réglages
              </button>
            </div>
          </div>
        );
      })}

      {main.length > SHOWN && (
        <button onClick={() => setShowAll(v => !v)} className="btn-ghost w-full min-h-10 text-xs">
          {showAll ? 'Afficher moins' : `Voir les ${main.length - SHOWN} autres jeux`}
        </button>
      )}

      {others.length > 0 && (
        <div className="space-y-1.5">
          <button onClick={() => setShowOthers(v => !v)} className="btn-ghost w-full min-h-10 text-xs">
            {showOthers ? 'Masquer les jeux que tu n\'as pas' : `${others.length} option${others.length > 1 ? 's' : ''} dans des jeux que tu n'as pas`}
          </button>
          {showOthers && others.map(o => {
            const game = GAME_BY_ID[o.game];
            return (
              <button key={o.game} onClick={() => onHunt(o.cfg)} className="w-full flex items-center justify-between gap-3 px-3 min-h-11 rounded-2xl bg-slate-900 border border-slate-800 text-left opacity-80">
                <span className="text-xs text-slate-300 min-w-0"><strong className="text-slate-100">{game?.icon} {game?.short}</strong> · {o.label}</span>
                <span className="text-sm font-mono font-black text-slate-200 shrink-0">{fmtOdds(o.odds)}</span>
              </button>
            );
          })}
        </div>
      )}

      {extra.map(o => (
        <button key={o.game} onClick={() => onHunt(o.cfg)} className="w-full flex items-center justify-between gap-3 px-3 min-h-11 rounded-2xl bg-slate-900 border border-slate-800 text-left">
          <span className="text-xs text-slate-300 min-w-0"><strong className="text-slate-100">📱 Pokémon GO</strong> · {o.label}</span>
          <span className="text-sm font-mono font-black text-slate-200 shrink-0">{fmtOdds(o.odds)}</span>
        </button>
      ))}
      <p className="text-[11px] text-slate-500">{filtered ? 'Selon tes jeux et tes Charmes Chroma (Réglages → Mes jeux).' : 'Taux maximaux (Charme Chroma et bonus inclus).'} Lieux : PokéAPI et PKHeX ; les apparitions massives d'ÉV sont estimées.</p>
    </section>
  );
}
