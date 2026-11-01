// Pokémon disponibles par méthode de chasse : pour chaque jeu et chaque méthode, les espèces (et formes
// régionales) qu'on peut y chasser, d'après les mêmes règles que les meilleures options de la fiche.
/** @import { EncounterData } from './types.js' */
import { GAMES, GAME_BY_ID } from '../data/games.js';
import { METHOD_BY_ID } from '../data/methods.js';
import { MAIN_DEX } from '../data/pokedex.js';
import { huntOptions } from './bestOptions.js';

/**
 * Une méthode dans un jeu, avec les Pokémon qu'on peut y chasser.
 * @typedef {object} HuntMethodEntry
 * @property {string} id « jeu|méthode » (filtre du Pokédex).
 * @property {string} game
 * @property {string} method
 * @property {Set<string>} keys Clés des Pokémon disponibles.
 */

/** @type {WeakMap<EncounterData, { entries: HuntMethodEntry[], byId: Map<string, HuntMethodEntry> }>} */
const cache = new WeakMap();

/**
 * Index des méthodes de chasse (calculé une fois par jeu de données), du jeu le plus récent au plus ancien,
 * dans l'ordre des méthodes de chaque jeu.
 * @param {EncounterData} data
 * @returns {{ entries: HuntMethodEntry[], byId: Map<string, HuntMethodEntry> }}
 */
export function huntMethodIndex(data) {
  const hit = cache.get(data);
  if (hit) return hit;
  /** @type {Map<string, HuntMethodEntry>} */
  const byId = new Map();
  for (const p of MAIN_DEX) {
    for (const o of huntOptions(p, data, {}, { all: true })) {
      const id = huntMethodId(o.game, o.cfg.method);
      if (!byId.has(id)) byId.set(id, { id, game: o.game, method: o.cfg.method, keys: new Set() });
      byId.get(id).keys.add(p.key);
    }
  }
  const gameRank = new Map(GAMES.map((g, i) => [g.id, i]));
  const methodRank = e => GAME_BY_ID[e.game]?.methods.indexOf(e.method) ?? 99;
  const entries = [...byId.values()].sort((a, b) => (gameRank.get(a.game) ?? 99) - (gameRank.get(b.game) ?? 99) || methodRank(a) - methodRank(b));
  const index = { entries, byId };
  cache.set(data, index);
  return index;
}

/**
 * @param {string} game
 * @param {string} method
 * @returns {string}
 */
export const huntMethodId = (game, method) => `${game}|${method}`;

/**
 * Libellé court : « 📡 Poké Radar · XY ».
 * @param {string} id
 * @returns {string}
 */
export function huntMethodLabel(id) {
  const [game, method] = id.split('|');
  const m = METHOD_BY_ID[method];
  return `${m?.icon || ''} ${m?.name || method} · ${GAME_BY_ID[game]?.short || game}`.trim();
}

/**
 * Pokémon déjà obtenus parmi ceux d'une méthode.
 * @param {HuntMethodEntry} entry
 * @param {Record<string, unknown>} shinies
 * @returns {number}
 */
export const caughtIn = (entry, shinies) => [...entry.keys].filter(k => shinies[k]).length;
