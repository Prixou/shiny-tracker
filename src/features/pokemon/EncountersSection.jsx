import { useState } from 'react';
import { MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { GAME_BY_ID } from '../../data/games.js';
import { useEncounters } from '../../state/encounters.js';
import { encounterMethodName } from '../../data/encounterMethods.js';
import ZoneSheet from '../map/ZoneSheet.jsx';

// Lieux de capture issus de PokéAPI (données complètes surtout jusqu'à la Gen 7).
export default function EncountersSection({ pokemon }) {
  const data = useEncounters();
  const [openGame, setOpenGame] = useState(null);
  const [zone, setZone] = useState(null);

  if (!data) return <div className="h-16 rounded-2xl bg-slate-950 border border-slate-800 animate-pulse" />;
  const rows = data.encounters?.[pokemon.baseId] || [];
  const byGame = new Map();
  for (const [g, loc, m, min, max, chance] of rows) {
    const game = data.games[g];
    if (!byGame.has(game)) byGame.set(game, []);
    byGame.get(game).push({ loc: data.locations[loc], method: encounterMethodName(data.methods[m]), min, max, chance });
  }
  const games = [...byGame.keys()].sort((a, b) => (GAME_BY_ID[b]?.gen || 0) - (GAME_BY_ID[a]?.gen || 0));

  return (
    <section className="space-y-2">
      <h3 className="label-caps flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Où le trouver</h3>
      {data.error || games.length === 0 ? (
        <p className="text-sm text-slate-500 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          Aucun lieu de rencontre sauvage connu{' (évolution, œuf, échange, raid ou évènement)'}.
        </p>
      ) : games.map(g => {
        const list = byGame.get(g).sort((a, b) => b.chance - a.chance);
        const open = openGame === g;
        return (
          <div key={g} className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
            <button onClick={() => setOpenGame(open ? null : g)} className="w-full flex items-center justify-between gap-2 px-3 min-h-11 text-sm font-bold text-slate-200" aria-expanded={open}>
              <span className="truncate">{GAME_BY_ID[g]?.icon} {GAME_BY_ID[g]?.name}</span>
              <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">{list.length} lieu{list.length > 1 ? 'x' : ''}<ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} /></span>
            </button>
            {open && (
              <ul className="border-t border-slate-800 divide-y divide-slate-800/70">
                {list.map((r, i) => (
                  <li key={i}>
                    {/* Touche un lieu : tous les Pokémon de cette zone. */}
                    <button onClick={() => setZone({ game: g, name: r.loc })} className="w-full min-h-12 px-3 py-2 text-xs flex items-center justify-between gap-3 text-left active:bg-slate-800/60">
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-200 truncate">{r.loc}</span>
                        <span className="text-slate-500">{r.method} · Nv. {r.min === r.max ? r.min : `${r.min}–${r.max}`}</span>
                      </span>
                      <span className="shrink-0 flex items-center gap-1 font-mono text-slate-400">
                        {r.chance > 0 && `${r.chance} %`}<ChevronRight className="w-4 h-4 text-slate-600" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {zone && <ZoneSheet gameId={zone.game} zoneName={zone.name} onClose={() => setZone(null)} />}
    </section>
  );
}
