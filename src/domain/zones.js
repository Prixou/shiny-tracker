// Explorateur par zones : lieux d'un jeu et Pokémon qu'on y rencontre, avec la progression shiny.
/** @import { Catch, EncounterData, OddsConfig } from './types.js' */
/** @import { BestOptionsPrefs } from './settings.js' */
/** @import { Pokemon } from '../data/pokedex.js' */
import { getPokemon } from '../data/pokedex.js';
import { GAME_BY_ID, isLockedIn } from '../data/games.js';
import { formKeysIn } from '../data/forms.js';
import { encounterMethodName } from '../data/encounterMethods.js';
import { collator } from '../lib/text.js';
import { bestOptions } from './bestOptions.js';
import { defaultMethodFor } from './hunt.js';

/**
 * Un Pokémon rencontré dans une zone.
 * @typedef {object} ZoneEncounter
 * @property {Pokemon} p
 * @property {string[]} methods Modes de rencontre (« Herbes / grotte », « Canne »…).
 * @property {number} minLevel
 * @property {number} maxLevel
 * @property {number} chance Meilleure probabilité d'apparition connue (%), 0 si inconnue.
 */

/**
 * Lieu d'un jeu.
 * @typedef {object} Zone
 * @property {string} name
 * @property {ZoneEncounter[]} encounters Par numéro de Pokédex.
 */

// Zones calculées une fois par jeu (les données de lieux ne changent pas pendant la session).
/** @type {WeakMap<EncounterData, Map<string, Zone[]>>} */
const cache = new WeakMap();

/**
 * Peut-on chasser des shiny dans ce jeu ? (Rouge / Bleu / Jaune : pas de shiny en Gen 1.)
 * @param {string} gameId
 */
export const canHuntIn = gameId => (GAME_BY_ID[gameId]?.methods || []).some(m => m !== 'other');

/**
 * Jeux pour lesquels on connaît des lieux et où l'on peut chasser des shiny.
 * @param {EncounterData} data
 * @returns {Set<string>}
 */
export function gamesWithZones(data) {
  const used = new Set();
  for (const rows of Object.values(data?.encounters || {})) for (const [g] of rows) used.add(data.games[g]);
  return new Set([...used].filter(canHuntIn));
}

/**
 * Zones d'un jeu, triées par nom (« Route 2 » avant « Route 10 »).
 * @param {EncounterData} data
 * @param {string} gameId
 * @returns {Zone[]}
 */
export function zonesOf(data, gameId) {
  if (!data?.encounters) return [];
  let byGame = cache.get(data);
  if (!byGame) cache.set(data, (byGame = new Map()));
  if (byGame.has(gameId)) return byGame.get(gameId);

  /** @type {Map<string, Map<string, { methods: Set<string>, minLevel: number, maxLevel: number, chance: number }>>} */
  const places = new Map();
  for (const [speciesId, rows] of Object.entries(data.encounters)) {
    const keys = formKeysIn(Number(speciesId), gameId);
    for (const [g, loc, m, min, max, chance] of rows) {
      if (data.games[g] !== gameId) continue;
      const name = data.locations[loc];
      if (!places.has(name)) places.set(name, new Map());
      const zone = places.get(name);
      for (const key of keys) {
        const e = zone.get(key) || { methods: new Set(), minLevel: min, maxLevel: max, chance: 0 };
        e.methods.add(encounterMethodName(data.methods[m]));
        e.minLevel = Math.min(e.minLevel, min);
        e.maxLevel = Math.max(e.maxLevel, max);
        e.chance = Math.max(e.chance, chance || 0);
        zone.set(key, e);
      }
    }
  }

  const zones = [...places].map(([name, entries]) => ({
    name,
    encounters: [...entries].map(([key, e]) => ({ p: getPokemon(key), methods: [...e.methods], minLevel: e.minLevel, maxLevel: e.maxLevel, chance: e.chance }))
      .filter(e => e.p)
      .sort((a, b) => a.p.id - b.p.id || a.p.key.localeCompare(b.p.key))
  })).filter(z => z.encounters.length).sort((a, b) => collator.compare(a.name, b.name));
  byGame.set(gameId, zones);
  return zones;
}

/**
 * Un Pokémon de la zone manque-t-il (pas encore shiny, et chassable dans ce jeu) ?
 * @param {ZoneEncounter} e
 * @param {Record<string, Catch>} shinies
 * @param {string} gameId
 */
export const isMissingIn = (e, shinies, gameId) => !shinies[e.p.key] && !isLockedIn(e.p, gameId);

/**
 * Progression d'une zone : shiny manquants (chassables ici) et déjà obtenus.
 * @param {Zone} zone
 * @param {Record<string, Catch>} shinies
 * @param {string} gameId
 * @returns {{ missing: number, caught: number, total: number }}
 */
export function zoneProgress(zone, shinies, gameId) {
  let missing = 0;
  let caught = 0;
  for (const e of zone.encounters) {
    if (shinies[e.p.key]) caught++;
    else if (!isLockedIn(e.p, gameId)) missing++;
  }
  return { missing, caught, total: zone.encounters.length };
}

/**
 * Espèces manquantes trouvables dans au moins une zone du jeu.
 * @param {Zone[]} zones
 * @param {Record<string, Catch>} shinies
 * @param {string} gameId
 * @returns {number}
 */
export function missingInGame(zones, shinies, gameId) {
  const keys = new Set();
  for (const z of zones) for (const e of z.encounters) if (isMissingIn(e, shinies, gameId)) keys.add(e.p.key);
  return keys.size;
}

/**
 * Réglages d'une nouvelle chasse de ce Pokémon dans ce jeu : la meilleure option connue du jeu,
 * sinon la méthode par défaut.
 * @param {Pokemon} p
 * @param {string} gameId
 * @param {EncounterData} data
 * @param {BestOptionsPrefs} prefs
 * @param {boolean} charm Charme Chroma dans ce jeu.
 * @returns {OddsConfig}
 */
export function huntConfigIn(p, gameId, data, prefs, charm) {
  const { main, others } = bestOptions(p, data, prefs);
  const option = [...main, ...others].find(o => o.game === gameId);
  return option ? option.cfg : { game: gameId, method: defaultMethodFor(gameId), opts: {}, charm };
}
