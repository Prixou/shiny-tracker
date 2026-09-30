import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X, Check, Star, ShieldAlert, ArrowUpDown, Grid3x3, Sparkles, ListPlus } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { useNav } from '../state/nav.jsx';
import { POKEDEX, MAIN_DEX, isAvailableIn } from '../data/pokedex.js';
import { POKEMON_TYPES, REGIONS, SHINY_METHODS, POKE_BALLS, GAME_BY_ID, TYPE_BY_ID, REGION_BY_ID, METHOD_BY_ID, BALL_BY_ID, isLockedIn } from '../data/constants.js';
import { normalize, collator } from '../lib/utils.js';
import { useDebouncedValue, feedback } from '../lib/hooks.js';
import { Sheet, Segmented, Sprite, BallIcon, RegionIcon, TypeIcon, EmptyState, useConfirm } from '../components/ui.jsx';
import ListsSheet from '../components/ListsSheet.jsx';
import GameOptions from '../components/GameOptions.jsx';
import { PLATFORMS, gamesOnPlatform } from '../data/games.js';

const PAGE = 72;

const CATEGORIES = [
  { id: 'legendary', label: 'Légendaires', test: p => p.isLegendary },
  { id: 'mythical', label: 'Fabuleux', test: p => p.isMythical },
  { id: 'starter', label: 'Starters', test: p => p.isStarter },
  { id: 'baby', label: 'Bébés', test: p => p.isBaby },
  { id: 'form', label: 'Formes régionales', test: p => p.isForm },
  { id: 'variant', label: 'Variantes', test: p => p.isVariant && p.variantKind !== 'mega' && p.variantKind !== 'gmax' },
  { id: 'mega', label: 'Méga-Évolutions', test: p => p.variantKind === 'mega' },
  { id: 'gmax', label: 'Gigamax', test: p => p.variantKind === 'gmax' },
  { id: 'locked', label: 'Shiny Lock', test: p => p.isShinyLocked }
];

const SORTS = [
  { id: 'id', label: 'N° Pokédex' },
  { id: 'name', label: 'Nom (A → Z)' },
  { id: 'recent', label: 'Capture la plus récente' },
  { id: 'encounters', label: 'Nombre de rencontres' },
  { id: 'copies', label: 'Nombre d\'exemplaires' }
];

export const DEFAULT_FILTERS = { status: 'all', regions: [], types: [], game: 'all', method: 'all', ball: 'all', categories: [], lists: [], sort: 'id' };
const VARIANT_CATS = ['variant', 'mega', 'gmax'];

const toggleIn = (list, id) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

export function filterPokedex({ filters, query, shinies, catchesByKey, wishlist, lists, hideLocked, showVariants }) {
  const q = normalize(query);
  const platform = filters.game.startsWith('platform:') ? filters.game.slice(9) : null;
  const game = filters.game !== 'all' && !platform ? filters.game : null;
  const platformGames = platform ? gamesOnPlatform(platform).map(g => g.id) : null;
  const cats = CATEGORIES.filter(c => filters.categories.includes(c.id));
  const withVariants = showVariants || filters.categories.some(c => VARIANT_CATS.includes(c));
  const selectedLists = lists.filter(l => filters.lists.includes(l.id));
  const out = (withVariants ? POKEDEX : MAIN_DEX).filter(p => {
    const rec = shinies[p.key];
    if (filters.status === 'caught' && !rec) return false;
    if (filters.status === 'missing' && rec) return false;
    if (filters.status === 'wish' && !wishlist[p.key]) return false;
    if (hideLocked && !rec && !filters.categories.includes('locked') && isLockedIn(p, game)) return false;
    if (filters.regions.length && !filters.regions.includes(p.region)) return false;
    if (filters.types.length && !filters.types.every(t => p.types.includes(t))) return false;
    if (game && !isAvailableIn(p, game)) return false;
    if (platformGames && !platformGames.some(g => isAvailableIn(p, g) && !isLockedIn(p, g)) && !rec) return false;
    if (filters.method !== 'all' && !(catchesByKey[p.key] || []).some(c => c.method === filters.method)) return false;
    if (filters.ball !== 'all' && !(catchesByKey[p.key] || []).some(c => c.ball === filters.ball)) return false;
    if (selectedLists.length && !selectedLists.some(l => l.keys[p.key])) return false;
    if (cats.length && !cats.some(c => c.test(p))) return false;
    if (q && !p.search.includes(q) && String(p.id) !== q.replace(/^#?0*/, '')) return false;
    return true;
  });
  if (filters.sort === 'name') out.sort((a, b) => collator.compare(a.name, b.name));
  if (filters.sort === 'recent') out.sort((a, b) => (shinies[b.key]?.timestamp || 0) - (shinies[a.key]?.timestamp || 0));
  if (filters.sort === 'encounters') out.sort((a, b) => (shinies[b.key]?.count || 0) - (shinies[a.key]?.count || 0));
  if (filters.sort === 'copies') out.sort((a, b) => (catchesByKey[b.key]?.length || 0) - (catchesByKey[a.key]?.length || 0));
  return out;
}

const countActive = f => f.regions.length + f.types.length + f.categories.length + f.lists.length +
  (f.game !== 'all') + (f.method !== 'all') + (f.ball !== 'all');

const DENSITY_CLASSES = {
  3: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7',
  4: 'grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8',
  5: 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
};

export default function DexView() {
  const { shinies, catchesByKey, wishlist, lists, settings, ui, setUiValue, setSettings, addCatch, removeCatchesOf } = useStore();
  const { openPokemon } = useNav();
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 120);
  const [filters, setFiltersState] = useState(() => ({ ...DEFAULT_FILTERS, ...(ui.dexFilters || {}) }));
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef(null);

  const setFilters = useCallback(patch => {
    setFiltersState(f => {
      const next = { ...f, ...patch };
      setUiValue('dexFilters', next);
      return next;
    });
  }, [setUiValue]);

  const results = useMemo(
    () => filterPokedex({ filters, query: debouncedQuery, shinies, catchesByKey, wishlist, lists, hideLocked: settings.hideLocked, showVariants: settings.showVariants }),
    [filters, debouncedQuery, shinies, catchesByKey, wishlist, lists, settings.hideLocked, settings.showVariants]
  );
  const caughtInResults = useMemo(() => results.reduce((n, p) => n + (shinies[p.key] ? 1 : 0), 0), [results, shinies]);

  useEffect(() => { setLimit(PAGE); }, [filters, debouncedQuery]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setLimit(l => l + PAGE);
    }, { rootMargin: '1200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [results.length]);

  const toggleCaught = useCallback(async p => {
    const copies = catchesByKey[p.key] || [];
    if (copies.length) {
      const hasDetails = copies.length > 1 || copies.some(c => c.count > 0 || c.notes || c.nickname);
      if (settings.confirmUncatch && hasDetails) {
        const ok = await confirm({ title: `Retirer ${p.name} ?`, message: `${copies.length} exemplaire${copies.length > 1 ? 's' : ''} et leurs détails (rencontres, notes, Ball…) seront supprimés. Tu pourras annuler juste après.`, confirmLabel: 'Retirer', danger: true });
        if (!ok) return;
      }
      removeCatchesOf(p.key, `${p.name} retiré`);
      feedback.undo();
    } else {
      addCatch(p.key, {}, `${p.name} shiny capturé ✨`);
      feedback.success();
    }
  }, [catchesByKey, settings.confirmUncatch, confirm, removeCatchesOf, addCatch]);

  const activeCount = countActive(filters);
  const pct = results.length ? Math.round((caughtInResults / results.length) * 100) : 0;
  const density = DENSITY_CLASSES[settings.density] ? settings.density : 4;

  const activeChips = [
    ...filters.regions.map(id => ({ key: `r-${id}`, label: <><RegionIcon region={REGION_BY_ID[id]} className="h-7 -my-1 -ml-1" /> {REGION_BY_ID[id]?.name}</>, clear: () => setFilters({ regions: filters.regions.filter(x => x !== id) }) })),
    ...filters.types.map(id => ({ key: `t-${id}`, label: TYPE_BY_ID[id]?.name, color: TYPE_BY_ID[id]?.color, clear: () => setFilters({ types: filters.types.filter(x => x !== id) }) })),
    ...filters.categories.map(id => ({ key: `c-${id}`, label: CATEGORIES.find(c => c.id === id)?.label, clear: () => setFilters({ categories: filters.categories.filter(x => x !== id) }) })),
    ...(filters.game !== 'all' ? [{ key: 'g', label: filters.game.startsWith('platform:') ? `🎮 ${PLATFORMS.find(pl => `platform:${pl.id}` === filters.game)?.name}` : `${GAME_BY_ID[filters.game]?.icon} ${GAME_BY_ID[filters.game]?.short}`, clear: () => setFilters({ game: 'all' }) }] : []),
    ...(filters.method !== 'all' ? [{ key: 'm', label: `${METHOD_BY_ID[filters.method]?.icon} ${METHOD_BY_ID[filters.method]?.name}`, clear: () => setFilters({ method: 'all' }) }] : []),
    ...(filters.ball !== 'all' ? [{ key: 'b', label: BALL_BY_ID[filters.ball]?.name, clear: () => setFilters({ ball: 'all' }) }] : []),
    ...filters.lists.map(id => ({ key: `l-${id}`, label: `${lists.find(l => l.id === id)?.emoji || ''} ${lists.find(l => l.id === id)?.name || 'Liste'}`, clear: () => setFilters({ lists: filters.lists.filter(x => x !== id) }) }))
  ];

  return (
    <div className="space-y-3">
      <div className="sticky z-20 top-[calc(3.5rem+var(--safe-top))] -mx-4 px-4 md:mx-0 md:px-0 pt-1 pb-2 bg-slate-950/90 backdrop-blur-xl space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nom (FR/EN) ou numéro…"
              className="input pl-11 pr-10"
              aria-label="Rechercher un Pokémon"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 icon-btn w-10 h-10" aria-label="Effacer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(true)} className={`relative icon-btn w-12 h-12 border ${activeCount ? 'bg-amber-500/15 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-800'}`} aria-label="Filtres">
            <SlidersHorizontal className="w-5 h-5" />
            {activeCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black flex items-center justify-center">{activeCount}</span>}
          </button>
          <button onClick={() => setShowSort(true)} className="icon-btn w-12 h-12 border bg-slate-900 border-slate-800" aria-label="Tri et affichage">
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>

        <Segmented
          size="sm"
          value={filters.status}
          onChange={status => setFilters({ status })}
          options={[
            { id: 'all', label: 'Tous' },
            { id: 'caught', label: 'Capturés' },
            { id: 'missing', label: 'Manquants' },
            { id: 'wish', label: 'Objectifs', icon: <Star className="w-3.5 h-3.5" /> }
          ]}
        />

        {activeChips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {activeChips.map(c => (
              <button key={c.key} onClick={c.clear} className="chip chip-off min-h-8 py-1 text-xs shrink-0" style={c.color ? { borderColor: c.color } : undefined}>
                {c.label} <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
            <button onClick={() => setFilters({ ...DEFAULT_FILTERS, status: filters.status, sort: filters.sort })} className="chip min-h-8 py-1 text-xs border-transparent text-amber-400 shrink-0">
              Tout effacer
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold font-mono text-slate-400 shrink-0">
          <span className="text-amber-400">{caughtInResults}</span>/{results.length} · {pct}%
        </span>
      </div>

      {results.length === 0 ? (
        <EmptyState icon={<Search className="w-7 h-7" />} title="Aucun Pokémon trouvé"
          action={<button className="btn-secondary" onClick={() => { setQuery(''); setFilters(DEFAULT_FILTERS); }}>Réinitialiser les filtres</button>}>
          Essaie un autre nom ou retire quelques filtres.
        </EmptyState>
      ) : (
        <div className={`grid ${DENSITY_CLASSES[density]} gap-2`}>
          {results.slice(0, limit).map(p => (
            <PokemonCard
              key={p.key}
              p={p}
              rec={shinies[p.key]}
              copies={catchesByKey[p.key]?.length || 0}
              locked={isLockedIn(p, filters.game !== 'all' && !filters.game.startsWith('platform:') ? filters.game : null)}
              wished={!!wishlist[p.key]}
              compact={density === 5}
              colorUncaught={settings.colorUncaught}
              onOpen={openPokemon}
              onToggle={toggleCaught}
            />
          ))}
        </div>
      )}
      {limit < results.length && <div ref={sentinel} className="h-20 flex items-center justify-center"><Sparkles className="w-5 h-5 text-slate-600 animate-pulse" /></div>}

      <FilterSheet open={showFilters} onClose={() => setShowFilters(false)} filters={filters} setFilters={setFilters} resultCount={results.length} lists={lists} />

      <Sheet open={showSort} onClose={() => setShowSort(false)} title="Tri et affichage" icon={<ArrowUpDown className="w-5 h-5" />}>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="label-caps">Trier par</div>
            {SORTS.map(s => (
              <button key={s.id} onClick={() => { setFilters({ sort: s.id }); setShowSort(false); }}
                className={`w-full flex items-center justify-between min-h-12 px-4 rounded-2xl border text-sm font-bold ${filters.sort === s.id ? 'bg-amber-500/10 border-amber-500/60 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-200'}`}>
                {s.label} {filters.sort === s.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="label-caps flex items-center gap-2"><Grid3x3 className="w-3.5 h-3.5" /> Taille de la grille</div>
            <Segmented value={density} onChange={d => setSettings({ density: d })}
              options={[{ id: 3, label: 'Grande' }, { id: 4, label: 'Moyenne' }, { id: 5, label: 'Compacte' }]} />
          </div>
        </div>
      </Sheet>
    </div>
  );
}

const PokemonCard = memo(function PokemonCard({ p, rec, copies, locked, wished, compact, colorUncaught, onOpen, onToggle }) {
  const caught = !!rec;
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-colors ${
        caught ? 'bg-gradient-to-b from-amber-500/15 to-slate-900 border-amber-500/40' : 'bg-slate-900/70 border-slate-800/80'
      }`}
    >
      <button onClick={() => onOpen(p.key)} className="w-full flex flex-col items-center pt-1.5 pb-2 px-1 active:bg-slate-800/60" aria-label={`${p.name}, ${caught ? 'capturé' : 'non capturé'}`}>
        <div className="w-full flex items-center gap-0.5 pl-1 pr-7 text-[10px] font-mono font-bold text-slate-500 h-4">
          <span>{p.isForm ? '◆' : p.isVariant ? '✦' : ''}{String(p.id).padStart(3, '0')}</span>
          {locked && <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" aria-label="Shiny Lock" />}
          {wished && !caught && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
        </div>
        <div className="relative w-full flex justify-center">
          <Sprite
            pokemon={p}
            className={`${compact ? 'w-14 h-14' : 'w-full max-w-20 aspect-square'} ${caught ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]' : colorUncaught ? 'opacity-80' : 'opacity-45 grayscale'}`}
          />
          {caught && <BallIcon id={rec.ball} className="w-4 h-4 absolute bottom-0 right-0.5" />}
          {copies > 1 && <span className="absolute bottom-0 left-0.5 px-1 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black leading-4">×{copies}</span>}
        </div>
        {!compact && <span className={`w-full text-[11px] leading-tight font-bold truncate px-0.5 ${caught ? 'text-amber-200' : 'text-slate-300'}`}>{p.name}</span>}
      </button>
      <button
        onClick={() => onToggle(p)}
        className="absolute top-0 right-0 w-10 h-10 flex items-start justify-end p-1"
        aria-label={caught ? `Retirer ${p.name}` : `Marquer ${p.name} capturé`}
      >
        <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${caught ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950/80 border-slate-600 text-transparent'}`}>
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </span>
      </button>
    </div>
  );
});

function FilterSheet({ open, onClose, filters, setFilters, resultCount, lists }) {
  const [showLists, setShowLists] = useState(false);
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
          <div className="flex flex-wrap gap-2">
            {REGIONS.filter(r => MAIN_DEX.some(p => p.region === r.id)).map(r => (
              <button key={r.id} onClick={() => setFilters({ regions: toggleIn(filters.regions, r.id) })}
                className={`chip ${filters.regions.includes(r.id) ? 'chip-on' : 'chip-off'}`}>
                <RegionIcon region={r} className="h-9 -my-1.5 -ml-1.5" /> {r.name}
              </button>
            ))}
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
              {SHINY_METHODS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
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
