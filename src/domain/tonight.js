// « Que chasser ce soir ? » : pour le temps disponible et les consoles à portée de main, les Pokémon
// manquants qu'on a le plus de chances de trouver, d'après le meilleur taux et le rythme de chaque méthode.
/** @import { BestOption, EncounterData } from './types.js' */
/** @import { BestOptionsPrefs } from './settings.js' */
/** @import { Pokemon } from '../data/pokedex.js' */
import { GAME_BY_ID } from '../data/games.js';
import { oddsAt } from '../data/methods.js';
import { MAIN_DEX } from '../data/pokedex.js';
import { EVENTS, eventStatus } from '../data/events.js';
import { bestOptions } from './bestOptions.js';
import { bankOpen, viaBank } from './bank.js';
import { paceFor } from './pace.js';

/** Consoles proposées (Pokémon GO ne compte pas dans le living dex). */
export const TONIGHT_PLATFORMS = /** @type {const} */ (['switch', '3ds', 'ds', 'gba']);
export const TONIGHT_HOURS = /** @type {const} */ ([0.5, 1, 2, 3]);

/**
 * Consoles cochées par défaut : celles de « Mes jeux » (Console virtuelle Game Boy : 3DS), sinon Switch et 3DS.
 * @param {string[]} [myGames]
 * @returns {string[]}
 */
export function defaultPlatforms(myGames = []) {
  const mine = TONIGHT_PLATFORMS.filter(pl => myGames.some(g => onPlatforms(g, [pl])));
  return mine.length ? mine : ['switch', '3ds'];
}

/**
 * Une suggestion pour la session.
 * @typedef {object} TonightOption
 * @property {Pokemon} p
 * @property {BestOption} option Jeu, méthode et réglages de chasse.
 * @property {number} pace Unités par heure retenues.
 * @property {boolean} mine Rythme personnel (sinon estimation).
 * @property {number} chance Probabilité de le trouver dans le temps disponible.
 * @property {number} avgHours Durée moyenne (taux / rythme).
 * @property {boolean} event Évènement shiny en cours.
 * @property {boolean} wished Dans les objectifs.
 * @property {boolean} bank Seulement sur DS / 3DS : à chasser avant la fermeture de la Banque.
 * @property {number} score
 */

/**
 * Probabilité d'au moins un shiny en `hours` heures, à `pace` unités par heure et au taux 1/odds.
 * @param {number} odds
 * @param {number} pace
 * @param {number} hours
 */
export const chanceWithin = (odds, pace, hours) => (odds > 0 ? 1 - Math.pow(1 - 1 / odds, pace * hours) : 0);

/**
 * Le jeu se joue-t-il sur l'une de ces consoles ? (Console virtuelle Game Boy : sur 3DS.)
 * @param {string} gameId
 * @param {readonly string[]} platforms
 */
export function onPlatforms(gameId, platforms) {
  const g = GAME_BY_ID[gameId];
  return !!g && (platforms.includes(g.platform) || (!!g.vc3ds && platforms.includes('3ds')));
}

/**
 * Option de chasse d'un évènement shiny de l'Agenda (préréglage `hunt`).
 * @param {any} e
 * @param {BestOptionsPrefs} prefs
 * @returns {BestOption & { event: true }}
 */
function eventOption(e, prefs) {
  const charm = (prefs.charmFor || (() => true))(e.hunt.cfg.game);
  const cfg = { opts: {}, ...e.hunt.cfg, charm };
  return { game: cfg.game, cfg, odds: oddsAt(cfg), label: e.title, locations: [], event: true };
}

/**
 * Candidat : un Pokémon manquant (hors Shiny Lock) et toutes ses options de chasse dans tes jeux,
 * évènements shiny en cours compris. Calcul lourd, indépendant du temps disponible et des consoles.
 * @typedef {object} TonightCandidate
 * @property {Pokemon} p
 * @property {Array<BestOption & { event?: boolean }>} options
 * @property {boolean} noSwitch Aucun jeu Switch ne permet de le chasser.
 */

/**
 * @param {EncounterData} data
 * @param {{ shinies: Record<string, unknown>, prefs?: BestOptionsPrefs, events?: any[], now?: number }} options
 * @returns {TonightCandidate[]}
 */
export function tonightCandidates(data, { shinies, prefs = {}, events = EVENTS, now = Date.now() }) {
  const live = events.filter(e => e.hunt && eventStatus(e, now) === 'live');
  /** @type {TonightCandidate[]} */
  const out = [];
  for (const p of MAIN_DEX) {
    if (p.isShinyLocked || shinies[p.key]) continue;
    const { main, others } = bestOptions(p, data, prefs);
    /** @type {Array<BestOption & { event?: boolean }>} */
    const options = [...main];
    for (const e of live) if (e.hunt.keys.includes(p.key)) options.push(eventOption(e, prefs));
    if (options.length) out.push({ p, options, noSwitch: ![...main, ...others].some(o => GAME_BY_ID[o.game]?.platform === 'switch') });
  }
  return out;
}

/**
 * Classement : chance de trouver le shiny dans le temps disponible, avec un bonus pour les évènements shiny
 * en cours, les objectifs et les shiny à chasser sur DS / 3DS avant la fermeture de la Banque (`bankTime`).
 * @param {TonightCandidate[]} candidates
 * @param {{ hours: number, platforms: readonly string[], personal?: Record<string, { pace: number }>,
 *   wishlist?: Record<string, unknown>, bankTime?: boolean }} options
 * @returns {TonightOption[]}
 */
export function rankTonight(candidates, { hours, platforms, personal = {}, wishlist = {}, bankTime = true }) {
  /** @type {TonightOption[]} */
  const out = [];
  for (const { p, options, noSwitch } of candidates) {
    /** @type {TonightOption | null} */
    let best = null;
    for (const option of options) {
      if (!onPlatforms(option.game, platforms)) continue;
      const pace = paceFor(option.cfg.method, personal);
      if (!pace) continue;
      const chance = chanceWithin(option.odds, pace.pace, hours);
      const event = !!option.event;
      const wished = !!wishlist[p.key];
      const bank = bankTime && noSwitch && viaBank(option.game);
      const score = chance * (1 + (event ? 1 : 0) + (wished ? 0.5 : 0) + (bank ? 0.5 : 0));
      if (!best || score > best.score) best = { p, option, pace: pace.pace, mine: pace.mine, chance, avgHours: option.odds / pace.pace, event, wished, bank, score };
    }
    if (best) out.push(best);
  }
  return out.sort((a, b) => b.score - a.score || a.p.id - b.p.id);
}

/**
 * Suggestions classées en une fois (candidats puis classement).
 * @param {EncounterData} data
 * @param {{ shinies: Record<string, unknown>, prefs?: BestOptionsPrefs, hours: number, platforms: readonly string[],
 *   personal?: Record<string, { pace: number }>, wishlist?: Record<string, unknown>, events?: any[], now?: number, limit?: number }} options
 * @returns {TonightOption[]}
 */
export function tonightPlan(data, options) {
  const now = options.now ?? Date.now();
  return rankTonight(tonightCandidates(data, { ...options, now }), { ...options, bankTime: bankOpen(now) }).slice(0, options.limit ?? Infinity);
}

/**
 * Une session : un jeu et une méthode (ou un évènement), avec les Pokémon qu'on peut y chasser.
 * @typedef {object} TonightSession
 * @property {string} id
 * @property {TonightOption} best Meilleure suggestion de la session (taux, chance, rythme).
 * @property {TonightOption[]} items Du plus intéressant au moins intéressant.
 * @property {boolean} event
 * @property {boolean} bank
 */

/**
 * Regroupe les suggestions par session de jeu (on joue à un jeu, avec une méthode, pas à un Pokémon).
 * @param {TonightOption[]} plan Suggestions classées (tonightPlan).
 * @returns {TonightSession[]} De la plus intéressante à la moins intéressante.
 */
export function tonightSessions(plan) {
  /** @type {Map<string, TonightSession>} */
  const sessions = new Map();
  for (const o of plan) {
    const id = o.event ? `event|${o.option.label}` : `${o.option.game}|${o.option.cfg.method}`;
    if (!sessions.has(id)) sessions.set(id, { id, best: o, items: [], event: o.event, bank: false });
    const s = sessions.get(id);
    s.items.push(o);
    s.bank ||= o.bank;
  }
  return [...sessions.values()];
}
