import { useCallback, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, Star, ArrowUpDown, Sparkles } from 'lucide-react';
import { useActions, useAppState, useCatchesByKey, useShinies, useStoreApi } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { isLockedIn } from '../../data/games.js';
import { DEFAULT_FILTERS, countActive, filterPokedex, singleGame } from '../../domain/dexFilter.js';
import { quickAddFields } from '../../domain/catch.js';
import { useDebouncedValue, useProgressiveList } from '../../lib/hooks.js';
import { feedback } from '../../lib/feedback.js';
import { Segmented, EmptyState, useConfirm } from '../../ui/index.js';
import PokemonCard from './PokemonCard.jsx';
import FilterSheet from './FilterSheet.jsx';
import SortSheet from './SortSheet.jsx';
import BankBanner from './BankBanner.jsx';
import ProvisionalBanner from './ProvisionalBanner.jsx';
import { filterChips } from './filterChips.jsx';
import { useHuntFilter } from './useHuntFilter.js';

const DENSITY_CLASSES = {
  3: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7',
  4: 'grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8',
  5: 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
};

export default function DexView() {
  const store = useStoreApi();
  const shinies = useShinies();
  const catchesByKey = useCatchesByKey();
  const { wishlist, lists, settings } = useAppState(s => ({ wishlist: s.wishlist, lists: s.lists, settings: s.settings }));
  const { setUiValue, addCatch, removeCatchesOf } = useActions();
  const { openPokemon } = useNav();
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 120);
  const [filters, setFiltersState] = useState(() => ({ ...DEFAULT_FILTERS, ...(store.getState().ui.dexFilters || {}) }));
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const setFilters = useCallback(patch => {
    setFiltersState(f => {
      const next = { ...f, ...patch };
      setUiValue('dexFilters', next);
      return next;
    });
  }, [setUiValue]);

  const hunt = useHuntFilter(filters.hunt);
  const results = useMemo(
    () => filterPokedex({ filters, query: debouncedQuery, shinies, catchesByKey, wishlist, lists, hideLocked: settings.hideLocked, showVariants: settings.showVariants, myGames: settings.myGames, huntKeys: hunt.keys }),
    [filters, debouncedQuery, shinies, catchesByKey, wishlist, lists, settings.hideLocked, settings.showVariants, settings.myGames, hunt.keys]
  );
  const caughtInResults = useMemo(() => results.reduce((n, p) => n + (shinies[p.key] ? 1 : 0), 0), [results, shinies]);
  // Nouvelle recherche ou nouveaux filtres : on repart du haut de la liste.
  const [limit, sentinel] = useProgressiveList({ resetKey: `${JSON.stringify(filters)}|${debouncedQuery}` });

  const toggleCaught = useCallback(async p => {
    const copies = store.getState().catches.filter(c => c.key === p.key);
    if (copies.length) {
      const hasDetails = copies.length > 1 || copies.some(c => c.count > 0 || c.notes || c.nickname);
      if (store.getState().settings.confirmUncatch && hasDetails) {
        const ok = await confirm({ title: `Retirer ${p.name} ?`, message: `${copies.length} exemplaire${copies.length > 1 ? 's' : ''} et leurs détails (rencontres, notes, Ball…) seront supprimés. Tu pourras annuler juste après.`, confirmLabel: 'Retirer', danger: true });
        if (!ok) return;
      }
      removeCatchesOf(p.key, `${p.name} retiré`);
      feedback.undo();
    } else {
      addCatch(p.key, quickAddFields(store.getState().settings), `${p.name} shiny capturé ✨`);
      feedback.success();
    }
  }, [store, confirm, removeCatchesOf, addCatch]);

  const activeCount = countActive(filters);
  const pct = results.length ? Math.round((caughtInResults / results.length) * 100) : 0;
  const density = DENSITY_CLASSES[settings.density] ? settings.density : 4;
  const lockGame = singleGame(filters.game);

  const activeChips = filterChips(filters, setFilters, lists);

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

      <BankBanner />
      <ProvisionalBanner />

      {hunt.status === 'loading' ? (
        <div className="py-16 flex justify-center"><Sparkles className="w-7 h-7 text-amber-400 animate-spin" aria-label="Chargement des lieux de capture" /></div>
      ) : results.length === 0 ? (
        <EmptyState icon={<Search className="w-7 h-7" />} title={hunt.status === 'error' ? 'Lieux de capture indisponibles' : 'Aucun Pokémon trouvé'}
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
              locked={isLockedIn(p, lockGame)}
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

      <FilterSheet open={showFilters} onClose={() => setShowFilters(false)} filters={filters} setFilters={setFilters} resultCount={results.length} />
      <SortSheet open={showSort} onClose={() => setShowSort(false)} sort={filters.sort} onSort={sort => setFilters({ sort })} density={density} />
    </div>
  );
}
