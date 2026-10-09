// Rythme de chasse par méthode : le tien (d'après tes chasses chronométrées), sinon une estimation.
/** @import { Hunt } from './types.js' */
import { DEFAULT_PACE } from '../data/pace.js';
import { huntElapsed, huntTotal } from './hunt.js';

// Une chasse compte à partir de 10 minutes de chrono ; un rythme personnel à partir de 30 minutes cumulées.
const MIN_HUNT_MS = 10 * 60000;
const MIN_TOTAL_MS = 30 * 60000;
const HOUR = 3600000;

/**
 * Ton rythme par méthode (unités par heure), d'après tes chasses en cours et terminées.
 * @param {Hunt[]} hunts
 * @param {number} [now]
 * @returns {Record<string, { pace: number, hours: number }>}
 */
export function personalPace(hunts, now = Date.now()) {
  /** @type {Record<string, { n: number, ms: number }>} */
  const acc = {};
  for (const h of hunts) {
    const ms = huntElapsed(h, now);
    const n = huntTotal(h);
    if (ms < MIN_HUNT_MS || n <= 0) continue;
    const a = (acc[h.method] ||= { n: 0, ms: 0 });
    a.n += n;
    a.ms += ms;
  }
  return Object.fromEntries(Object.entries(acc)
    .filter(([, a]) => a.ms >= MIN_TOTAL_MS)
    .map(([method, a]) => [method, { pace: a.n / (a.ms / HOUR), hours: a.ms / HOUR }]));
}

/**
 * Rythme retenu pour une méthode : le tien s'il est connu, sinon l'estimation (null : ne se chasse pas).
 * @param {string} method
 * @param {Record<string, { pace: number }>} [personal]
 * @returns {{ pace: number, mine: boolean } | null}
 */
export function paceFor(method, personal = {}) {
  if (personal[method]?.pace > 0) return { pace: personal[method].pace, mine: true };
  return DEFAULT_PACE[method] ? { pace: DEFAULT_PACE[method], mine: false } : null;
}
