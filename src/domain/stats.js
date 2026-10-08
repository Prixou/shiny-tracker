// Statistiques de la collection et des chasses (écran Stats).
/** @import { Catch, Hunt } from './types.js' */
import { MAIN_DEX, POKEDEX, getPokemon } from '../data/pokedex.js';
import { REGIONS, POKEMON_TYPES, POKE_BALLS } from '../data/constants.js';
import { GAMES } from '../data/games.js';
import { METHODS } from '../data/methods.js';
import { LUCK_TIERS, catchRatio, getLuckTier } from './luck.js';
import { huntTotal } from './hunt.js';

const progress = (all, shinies) => ({ total: all.length, value: all.filter(p => shinies[p.key]).length });

/**
 * Captures des 12 derniers mois (le mois en cours en dernier).
 * @param {Catch[]} catches
 * @param {Date} [now]
 */
export function monthlyCatches(catches, now = new Date()) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      short: d.toLocaleDateString('fr-FR', { month: 'narrow' }),
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      value: catches.filter(c => c.date?.startsWith(key)).length
    };
  });
}

/**
 * @param {{ shinies: Record<string, Catch>, catches: Catch[], hunts: Hunt[], now?: Date }} input
 */
export function computeStats({ shinies, catches, hunts, now = new Date() }) {
  const recs = catches.map(rec => ({ p: getPokemon(rec.key), rec })).filter(r => r.p);
  const huntable = MAIN_DEX.filter(p => !p.isShinyLocked);
  const variants = POKEDEX.filter(p => p.isVariant);
  const countBy = (list, field) => list.map(item => ({ ...item, value: recs.filter(r => r.rec[field] === item.id).length }))
    .filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  const withCount = recs.filter(r => r.rec.count > 0);
  const ratios = recs.map(r => ({ ...r, ratio: catchRatio(r.rec) })).filter(r => r.ratio != null).sort((a, b) => a.ratio - b.ratio);
  const luck = LUCK_TIERS.map(t => ({ ...t, value: ratios.filter(r => getLuckTier(r.ratio).id === t.id).length }));
  const active = hunts.filter(h => h.status === 'active');

  return {
    caught: MAIN_DEX.filter(p => shinies[p.key]).length,
    total: MAIN_DEX.length,
    copies: recs.length,
    variantsCaught: variants.filter(p => shinies[p.key]).length,
    variantsTotal: variants.length,
    huntableCaught: huntable.filter(p => shinies[p.key]).length,
    huntableTotal: huntable.length,
    encounters: withCount.reduce((n, r) => n + r.rec.count, 0),
    time: recs.reduce((n, r) => n + (r.rec.elapsedMs || 0), 0),
    avg: withCount.length ? withCount.reduce((n, r) => n + r.rec.count, 0) / withCount.length : 0,
    avgRatio: ratios.length ? ratios.reduce((n, r) => n + r.ratio, 0) / ratios.length : 0,
    luckiest: ratios.slice(0, 3),
    unluckiest: ratios.length > 3 ? ratios.slice(-Math.min(3, ratios.length - 3)).reverse() : [],
    byRegion: REGIONS.map(r => ({ ...r, ...progress(MAIN_DEX.filter(p => p.region === r.id), shinies) })).filter(r => r.total > 0),
    byType: POKEMON_TYPES.map(t => ({ ...t, ...progress(MAIN_DEX.filter(p => p.types.includes(t.id)), shinies) })),
    byMethod: countBy(METHODS, 'method'),
    byBall: countBy(POKE_BALLS, 'ball'),
    byGame: countBy(GAMES, 'game'),
    luck,
    months: monthlyCatches(recs.map(r => r.rec), now),
    huntEncounters: active.reduce((n, h) => n + huntTotal(h), 0),
    huntTime: active.reduce((n, h) => n + h.elapsedMs, 0),
    activeHunts: active.length
  };
}
