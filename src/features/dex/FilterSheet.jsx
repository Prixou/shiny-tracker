import { useState } from 'react';
import { SlidersHorizontal, ListPlus, ShieldAlert } from 'lucide-react';
import { useAppState } from '../../state/StoreProvider.jsx';
import { MAIN_DEX } from '../../data/pokedex.js';
import { POKEMON_TYPES, REGIONS, POKE_BALLS } from '../../data/constants.js';
import { PLATFORMS, gamesOnPlatform } from '../../data/games.js';
import { METHODS } from '../../data/methods.js';
import { CATEGORIES, DEFAULT_FILTERS } from '../../domain/dexFilter.js';
import { Sheet, RegionIcon, TypeIcon, GameOptions } from '../../ui/index.js';
import ListsSheet from '../lists/ListsSheet.jsx';

const toggleIn = (list, id) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

/** Panneau des filtres du Pokédex. */
export default function FilterSheet({ open, onClose, filters, setFilters, resultCount }) {
  const [showLists, setShowLists] = useState(false);
  const { lists, myGames } = useAppState(s => ({ lists: s.lists, myGames: s.settings.myGames }));
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filtres"
      icon={<SlidersHorizontal className="w-5 h-5" />}
      wide
      footer={
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS, status: filters.status, sort: filters.sort })}>Effacer</button>
          <button className="btn-primary flex-1" onClick={onClose}>Voir {resultCount} Pokémon</button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <div className="label-caps">Régions</div>
          <div className="grid grid-cols-3 gap-2">
            {REGIONS.filter(r => MAIN_DEX.some(p => p.region === r.id)).map(r => {
              const on = filters.regions.includes(r.id);
              return (
                <button key={r.id} onClick={() => setFilters({ regions: toggleIn(filters.regions, r.id) })} aria-pressed={on}
                  className={`flex items-center gap-1.5 min-h-10 px-2.5 rounded-xl border text-xs font-bold transition active:scale-95 ${on ? 'text-white ring-2 ring-white/40' : 'bg-slate-950 text-slate-300'}`}
                  style={{ backgroundColor: on ? r.color : undefined, borderColor: on ? r.color : `${r.color}66` }}>
                  <RegionIcon region={r} mono className="w-5 h-5" /> {r.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <div className="label-caps">Types <span className="normal-case font-semibold text-slate-500">(2 max. = double type)</span></div>
          <div className="grid grid-cols-3 gap-2">
            {POKEMON_TYPES.map(t => {
              const on = filters.types.includes(t.id);
              return (
                <button key={t.id}
                  onClick={() => setFilters({ types: on ? filters.types.filter(x => x !== t.id) : [...filters.types.slice(-1), t.id] })}
                  className={`flex items-center gap-1.5 min-h-10 px-2.5 rounded-xl border text-xs font-bold transition active:scale-95 ${on ? 'text-white ring-2 ring-white/40' : 'bg-slate-950 text-slate-300'}`}
                  style={{ backgroundColor: on ? t.color : undefined, borderColor: on ? t.color : `${t.color}66` }}>
                  <TypeIcon type={t.id} className="w-4 h-4" /> {t.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="label-caps">Mes listes</div>
            <button onClick={() => setShowLists(true)} className="text-xs font-bold text-amber-400 px-2 py-1 rounded-lg active:bg-slate-800 flex items-center gap-1"><ListPlus className="w-3.5 h-3.5" /> Gérer</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lists.map(l => (
              <button key={l.id} onClick={() => setFilters({ lists: toggleIn(filters.lists, l.id) })}
                className={`chip ${filters.lists.includes(l.id) ? 'chip-on' : 'chip-off'}`}>
                {l.emoji} {l.name} <span className="text-xs opacity-60">{Object.keys(l.keys).length}</span>
              </button>
            ))}
            {lists.length === 0 && <p className="text-xs text-slate-500">Crée des listes (« À faire en Z-A », « Préférés »…) depuis ici ou depuis la fiche d'un Pokémon.</p>}
          </div>
        </section>

        <section className="space-y-2">
          <div className="label-caps">Catégories</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setFilters({ categories: toggleIn(filters.categories, c.id) })}
                className={`chip ${filters.categories.includes(c.id) ? 'chip-on' : 'chip-off'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="label-caps">Disponible dans le jeu</span>
            <select className="input" value={filters.game} onChange={e => setFilters({ game: e.target.value })}>
              <option value="all">🎮 Tous les jeux</option>
              {myGames?.length > 0 && <option value="mine">⭐ Dans mes jeux ({myGames.length})</option>}
              <optgroup label="Par console">
                {PLATFORMS.filter(pl => gamesOnPlatform(pl.id).some(g => g.dexes)).map(pl => <option key={pl.id} value={`platform:${pl.id}`}>🎮 Disponible sur {pl.name}</option>)}
              </optgroup>
              <GameOptions />
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="label-caps">Méthode de capture</span>
            <select className="input" value={filters.method} onChange={e => setFilters({ method: e.target.value })}>
              <option value="all">Toutes les méthodes</option>
              {METHODS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="label-caps">Poké Ball</span>
            <select className="input" value={filters.ball} onChange={e => setFilters({ ball: e.target.value })}>
              <option value="all">Toutes les Balls</option>
              {POKE_BALLS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
        </section>
        <p className="text-xs text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 inline text-rose-400" /> = Shiny Lock (dans le jeu choisi) · ◆ = forme régionale · ✦ = variante.
          La disponibilité vient des Pokédex régionaux de chaque jeu.
        </p>
      </div>
      <ListsSheet open={showLists} onClose={() => setShowLists(false)} />
    </Sheet>
  );
}
