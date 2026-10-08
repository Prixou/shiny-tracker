// Chasses : création, migration des anciennes sauvegardes et calculs (compteur, chrono, chance).
/** @import { Hunt } from './types.js' */
import { GAME_BY_ID, gameIdFrom } from '../data/games.js';
import { cumulativeChance, migrateMethod, oddsAt, oddsContext, probAt } from '../data/methods.js';
import { uid } from '../lib/id.js';

/**
 * Temps de chasse en ms, chrono en cours compris.
 * @param {Hunt} h
 * @param {number} [now]
 * @returns {number}
 */
export const huntElapsed = (h, now = Date.now()) => h.elapsedMs + (h.startedAt ? Math.max(0, now - h.startedAt) : 0);
/**
 * Rencontres totales (phases précédentes comprises).
 * @param {Hunt} h
 * @returns {number}
 */
export const huntTotal = h => h.count + h.phases.reduce((sum, p) => sum + (p.count || 0), 0);
/**
 * Compteurs de chaque phase, puis de la phase en cours (une chaîne repart à 0 à chaque phase).
 * @param {Hunt} h
 * @returns {number[]}
 */
export const huntSegments = h => [...h.phases.map(p => p.count || 0), h.count];
/**
 * Probabilité d'avoir déjà eu au moins un shiny.
 * @param {Hunt} h
 * @returns {number}
 */
export const huntChance = h => cumulativeChance(h, huntSegments(h));
/**
 * Taux actuel (1/x), chaîne en cours comprise.
 * @param {Hunt} h
 * @returns {number}
 */
export const huntOdds = h => 1 / probAt(oddsContext(h), h.count);
/**
 * Arrête le chrono en cumulant le temps écoulé.
 * @param {Hunt} h
 * @param {number} [now]
 * @returns {Hunt}
 */
export const pauseHunt = (h, now = Date.now()) => (h.startedAt ? { ...h, elapsedMs: huntElapsed(h, now), startedAt: null } : h);

/**
 * Méthode proposée par défaut pour un jeu.
 * @param {string} gameId
 * @returns {string}
 */
export const defaultMethodFor = gameId => (GAME_BY_ID[gameId]?.methods || ['wild'])[0];

/**
 * Nouvelle chasse active, compteur à `count`.
 * @param {Partial<Hunt> & { targetId: string | number }} fields
 * @param {{ defaultGame?: string, now?: number }} [options]
 * @returns {Hunt}
 */
export function createHunt({ targetId, game, method, opts = {}, charm, customOdds = null, step, count = 0 }, { defaultGame = 'sv', now = Date.now() } = {}) {
  const g = game || defaultGame;
  return {
    id: uid(), targetId: String(targetId), game: g, method: method || defaultMethodFor(g), opts, charm: !!charm, customOdds: Number(customOdds) || null,
    count: Math.max(0, Number(count) || 0), step: Math.max(1, Number(step) || 1),
    phases: [], elapsedMs: 0, startedAt: null, status: 'active',
    createdAt: now, updatedAt: now, finishedAt: null, notes: ''
  };
}

/**
 * Chasse au format actuel à partir de n'importe quelle version (null si inexploitable).
 * @param {any} h Chasse lue (toutes versions).
 * @returns {Hunt | null}
 */
export function normalizeHunt(h) {
  if (!h || !h.targetId) return null;
  const { method, opts } = migrateMethod(h.method);
  const game = gameIdFrom(h.game) || 'sv';
  const legacyOdds = Number(h.odds) || Number(h.baseOdds) || 0;
  // Ancien format : le taux était saisi à la main ; on le garde s'il diffère du calcul automatique.
  const auto = Math.round(oddsAt({ game, method, charm: !!h.charm, opts }));
  const customOdds = Number(h.customOdds) || (legacyOdds && Math.abs(legacyOdds - auto) > 1 && h.opts === undefined ? legacyOdds : null);
  return {
    id: String(h.id || uid()),
    targetId: String(h.targetId),
    game,
    method,
    opts: { ...opts, ...(h.opts || {}) },
    charm: !!h.charm,
    customOdds,
    count: Math.max(0, Number(h.count) || 0),
    step: Math.max(1, Number(h.step) || 1),
    phases: Array.isArray(h.phases) ? h.phases : [],
    elapsedMs: Number(h.elapsedMs) || (Number(h.elapsedSeconds) || 0) * 1000,
    startedAt: Number(h.startedAt) || null,
    status: h.status === 'done' ? 'done' : 'active',
    createdAt: h.createdAt || Date.now(),
    updatedAt: h.updatedAt || Date.now(),
    finishedAt: h.finishedAt || null,
    notes: h.notes || ''
  };
}
/**
 * @param {unknown} arr
 * @returns {Hunt[]}
 */
export const normalizeHunts = arr => (Array.isArray(arr) ? arr.map(normalizeHunt).filter(Boolean) : []);
