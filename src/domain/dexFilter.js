// Filtres et tri du Pokédex shiny.
import { POKEDEX, MAIN_DEX, isAvailableIn } from '../data/pokedex.js';
import { gamesOnPlatform, isLockedIn } from '../data/games.js';
import { normalize, collator } from '../lib/text.js';

export const CATEGORIES = [
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
const VARIANT_CATS = ['variant', 'mega', 'gmax'];

export const SORTS = [
  { id: 'id', label: 'N° Pokédex' },
  { id: 'name', label: 'Nom (A → Z)' },
  { id: 'recent', label: 'Capture la plus récente' },
  { id: 'encounters', label: 'Nombre de rencontres' },
  { id: 'copies', label: 'Nombre d\'exemplaires' }
];

// `game` : 'all', 'mine' (mes jeux), 'platform:<console>' ou un identifiant de jeu.
export const DEFAULT_FILTERS = { status: 'all', regions: [], types: [], game: 'all', method: 'all', ball: 'all', categories: [], lists: [], sort: 'id' };

/** Jeu précis choisi dans le filtre (null pour « tous », « mes jeux » ou une console). */
export const singleGame = game => (game !== 'all' && game !== 'mine' && !game.startsWith('platform:') ? game : null);

/** Nombre de filtres actifs (hors statut et tri). */
export const countActive = f => f.regions.length + f.types.length + f.categories.length + f.lists.length +
  (f.game !== 'all') + (f.method !== 'all') + (f.ball !== 'all');

/** Pokémon affichés pour des filtres, une recherche et l'état de la collection. */
export function filterPokedex({ filters, query = '', shinies, catchesByKey, wishlist, lists, hideLocked, showVariants, myGames }) {
  const q = normalize(query);
  const platform = filters.game.startsWith('platform:') ? filters.game.slice(9) : null;
  const game = singleGame(filters.game);
  const platformGames = platform ? gamesOnPlatform(platform).map(g => g.id) : filters.game === 'mine' ? (myGames || []) : null;
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
