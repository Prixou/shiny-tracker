import { TYPE_BY_ID, REGION_BY_ID, BALL_BY_ID } from '../../data/constants.js';
import { GAME_BY_ID, PLATFORMS } from '../../data/games.js';
import { METHOD_BY_ID } from '../../data/methods.js';
import { CATEGORIES } from '../../domain/dexFilter.js';
import { huntMethodLabel } from '../../domain/huntIndex.js';
import { RegionIcon } from '../../ui/index.js';

/** Libellé de la puce du filtre « jeu ». */
const gameChipLabel = game => {
  if (game === 'mine') return '🎮 Dans mes jeux';
  if (game.startsWith('platform:')) return `🎮 ${PLATFORMS.find(pl => `platform:${pl.id}` === game)?.name}`;
  return `${GAME_BY_ID[game]?.icon} ${GAME_BY_ID[game]?.short}`;
};

/**
 * Puces des filtres actifs, chacune effaçable d'un toucher.
 * @returns {Array<{ key: string, label: any, color?: string, clear: () => void }>}
 */
export function filterChips(filters, setFilters, lists) {
  return [
    ...(filters.hunt && filters.hunt !== 'all' ? [{ key: 'h', label: `Chassable : ${huntMethodLabel(filters.hunt)}`, clear: () => setFilters({ hunt: 'all' }) }] : []),
    ...filters.regions.map(id => ({ key: `r-${id}`, label: <><RegionIcon region={REGION_BY_ID[id]} className="w-[18px] h-[18px]" /> {REGION_BY_ID[id]?.name}</>, clear: () => setFilters({ regions: filters.regions.filter(x => x !== id) }) })),
    ...filters.types.map(id => ({ key: `t-${id}`, label: TYPE_BY_ID[id]?.name, color: TYPE_BY_ID[id]?.color, clear: () => setFilters({ types: filters.types.filter(x => x !== id) }) })),
    ...filters.categories.map(id => ({ key: `c-${id}`, label: CATEGORIES.find(c => c.id === id)?.label, clear: () => setFilters({ categories: filters.categories.filter(x => x !== id) }) })),
    ...(filters.game !== 'all' ? [{ key: 'g', label: gameChipLabel(filters.game), clear: () => setFilters({ game: 'all' }) }] : []),
    ...(filters.method !== 'all' ? [{ key: 'm', label: `${METHOD_BY_ID[filters.method]?.icon} ${METHOD_BY_ID[filters.method]?.name}`, clear: () => setFilters({ method: 'all' }) }] : []),
    ...(filters.ball !== 'all' ? [{ key: 'b', label: BALL_BY_ID[filters.ball]?.name, clear: () => setFilters({ ball: 'all' }) }] : []),
    ...filters.lists.map(id => {
      const list = lists.find(l => l.id === id);
      return { key: `l-${id}`, label: `${list?.emoji || ''} ${list?.name || 'Liste'}`, clear: () => setFilters({ lists: filters.lists.filter(x => x !== id) }) };
    })
  ];
}
