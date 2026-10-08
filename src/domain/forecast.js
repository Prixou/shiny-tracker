// Projection de fin du living dex shiny, d'après le rythme récent de nouvelles espèces.
import { MAIN_DEX } from '../data/pokedex.js';
import { REGIONS } from '../data/constants.js';

const DAY = 86400000;
const WINDOWS = [90, 365]; // fenêtre courte d'abord, plus longue si trop peu de captures récentes
const MIN_NEW = 3;

/**
 * `catches` : toutes les captures. Seules les espèces chassables (hors Shiny Lock) comptent.
 * Renvoie { pace (par jour), window (jours), recent, remaining, eta (timestamp|null), regions[] } ou null.
 */
export function forecast(catches, now = Date.now()) {
  const first = new Map();
  for (const c of catches) {
    const t = c.timestamp || 0;
    if (!first.has(c.key) || t < first.get(c.key)) first.set(c.key, t);
  }
  const huntable = MAIN_DEX.filter(p => !p.isShinyLocked);
  const remaining = huntable.filter(p => !first.has(p.key)).length;

  let window = null;
  let recentKeys = [];
  for (const days of WINDOWS) {
    recentKeys = huntable.filter(p => first.has(p.key) && first.get(p.key) >= now - days * DAY).map(p => p.key);
    if (recentKeys.length >= MIN_NEW) { window = days; break; }
  }
  if (!window) return { remaining, pace: 0, window: null, recent: recentKeys.length, eta: null, regions: [] };

  const pace = recentKeys.length / window;
  const recent = new Set(recentKeys);
  const regions = REGIONS.map(r => {
    const all = huntable.filter(p => p.region === r.id);
    if (!all.length) return null;
    const left = all.filter(p => !first.has(p.key)).length;
    const regionPace = all.filter(p => recent.has(p.key)).length / window;
    return { ...r, left, total: all.length, eta: left === 0 ? 0 : regionPace > 0 ? now + (left / regionPace) * DAY : null };
  }).filter(Boolean);

  return { remaining, pace, window, recent: recentKeys.length, eta: remaining ? now + (remaining / pace) * DAY : now, regions };
}
