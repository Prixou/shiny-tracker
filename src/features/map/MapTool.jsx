import { useMemo, useState } from 'react';
import { Map as MapIcon, MapPin, Search, ChevronRight, Check, Info } from 'lucide-react';
import { useActions, useAppState, useShinies } from '../../state/StoreProvider.jsx';
import { useEncounters } from '../../state/encounters.js';
import { gamesWithZones, zonesOf, zoneProgress, missingInGame } from '../../domain/zones.js';
import { normalize } from '../../lib/text.js';
import { GameOptions } from '../../ui/index.js';
import ZoneSheet from './ZoneSheet.jsx';

/** Jeu affiché par défaut : le dernier consulté, sinon le jeu principal, sinon un de « Mes jeux ». */
function defaultGame(available, { mapGame, defaultGame: main, myGames }) {
  return [mapGame, main, ...(myGames || []), 'sv'].find(g => g && available.has(g)) || [...available][0];
}

/** Outils → Carte : les zones d'un jeu et les shiny qui t'y manquent. */
export default function MapTool() {
  const data = useEncounters();
  const shinies = useShinies();
  const { mapGame, onlyMissing, defaultGame: main, myGames } = useAppState(s => ({
    mapGame: s.ui.mapGame, onlyMissing: !!s.ui.mapOnlyMissing, defaultGame: s.settings.defaultGame, myGames: s.settings.myGames
  }));
  const { setUiValue } = useActions();
  const [query, setQuery] = useState('');
  const [openZone, setOpenZone] = useState(null);

  const available = useMemo(() => (data ? gamesWithZones(data) : new Set()), [data]);
  const game = data ? defaultGame(available, { mapGame, defaultGame: main, myGames }) : null;
  const zones = useMemo(() => (data && game ? zonesOf(data, game) : []), [data, game]);
  const rows = useMemo(() => {
    const q = normalize(query);
    return zones
      .map(z => ({ z, progress: zoneProgress(z, shinies, game) }))
      .filter(({ z, progress }) => (!q || normalize(z.name).includes(q)) && (!onlyMissing || progress.missing > 0));
  }, [zones, shinies, game, query, onlyMissing]);
  const missingTotal = useMemo(() => missingInGame(zones, shinies, game), [zones, shinies, game]);

  if (!data) return <div className="h-64 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 label-caps text-amber-400"><MapIcon className="w-4 h-4" /> Carte des zones</div>
        <select className="input" value={game} onChange={e => { setUiValue('mapGame', e.target.value); setQuery(''); }} aria-label="Jeu">
          <GameOptions filter={g => available.has(g.id)} />
        </select>
        <p className="text-sm text-slate-400">
          {zones.length} zones · <strong className="text-amber-300">{missingTotal}</strong> shiny qui te manque{missingTotal > 1 ? 'nt' : ''} à trouver ici
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input type="search" enterKeyHint="search" autoComplete="off" className="input pl-11" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Route, ville, grotte…" aria-label="Rechercher une zone" />
        </div>
        <button onClick={() => setUiValue('mapOnlyMissing', !onlyMissing)} aria-pressed={onlyMissing}
          className={`chip shrink-0 min-h-12 ${onlyMissing ? 'chip-on' : 'chip-off'}`}>
          Manquants
        </button>
      </div>

      {rows.length ? (
        <ul className="space-y-1.5">
          {rows.map(({ z, progress }) => (
            <li key={z.name}>
              <button onClick={() => setOpenZone(z.name)}
                className="w-full flex items-center gap-3 min-h-12 px-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-left active:bg-slate-800">
                <MapPin className="w-4 h-4 shrink-0 text-slate-500" />
                <span className="flex-1 min-w-0 text-sm font-bold text-slate-100 truncate">{z.name}</span>
                {progress.missing ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-black">{progress.missing} ✨</span>
                ) : (
                  <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-400"><Check className="w-3.5 h-3.5" /> complète</span>
                )}
                <ChevronRight className="w-4 h-4 shrink-0 text-slate-500" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex gap-2 text-sm text-slate-400 p-4"><Info className="w-4 h-4 shrink-0 mt-0.5" /> {onlyMissing ? 'Aucune zone avec un shiny manquant : bravo !' : 'Aucune zone trouvée.'}</p>
      )}

      <p className="text-[11px] text-slate-500">Lieux de PokéAPI et PKHeX. Le nombre ✨ compte les shiny qui te manquent et qu'on peut chasser dans cette zone (hors Shiny Lock).</p>
      {openZone && <ZoneSheet gameId={game} zoneName={openZone} onClose={() => setOpenZone(null)} />}
    </div>
  );
}
