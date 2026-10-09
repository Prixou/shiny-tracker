// Rangement du living dex shiny dans les boîtes de Pokémon HOME : 30 places par boîte (6 colonnes × 5 lignes),
// dans l'ordre du Pokédex national. Formes régionales juste après leur espèce, ou regroupées à la fin.
/** @import { Catch } from './types.js' */
/** @import { Pokemon } from '../data/pokedex.js' */

export const BOX_SIZE = 30;
export const BOX_COLUMNS = 6;

/**
 * Boîte de HOME.
 * @typedef {object} Box
 * @property {number} number Numéro dans HOME.
 * @property {Pokemon[]} slots Jusqu'à 30 Pokémon, dans l'ordre des places.
 */

/**
 * Place d'un Pokémon.
 * @typedef {object} BoxPlace
 * @property {number} box Numéro de boîte dans HOME.
 * @property {number} slot Place dans la boîte (1 à 30).
 * @property {number} row Ligne (1 à 5).
 * @property {number} col Colonne (1 à 6).
 */

/** @typedef {'stored' | 'toStore' | 'missing' | 'locked'} SlotStatus */

/** @type {WeakMap<Pokemon[], Pokemon[]>} */
const formsAtEnd = new WeakMap();

/**
 * Ordre de rangement.
 * @param {Pokemon[]} dex Pokédex principal (espèces et formes régionales, ordre national).
 * @param {'after' | 'end'} [forms] Formes régionales juste après l'espèce, ou à la fin.
 * @returns {Pokemon[]}
 */
export function boxOrder(dex, forms = 'after') {
  if (forms !== 'end') return dex;
  // Même tableau à chaque appel : les places calculées par placeOf restent en cache.
  let end = formsAtEnd.get(dex);
  if (!end) formsAtEnd.set(dex, (end = [...dex.filter(p => !p.isForm), ...dex.filter(p => p.isForm)]));
  return end;
}

/**
 * Découpe l'ordre de rangement en boîtes.
 * @param {Pokemon[]} order
 * @param {number} [firstBox] Numéro de la première boîte du living dex dans HOME.
 * @returns {Box[]}
 */
export function boxesOf(order, firstBox = 1) {
  /** @type {Box[]} */
  const boxes = [];
  for (let i = 0; i < order.length; i += BOX_SIZE) boxes.push({ number: firstBox + i / BOX_SIZE, slots: order.slice(i, i + BOX_SIZE) });
  return boxes;
}

/** @type {WeakMap<Pokemon[], Map<string, number>>} */
const indexes = new WeakMap();

/**
 * Place d'un Pokémon (null s'il n'est pas dans le living dex : variante, Méga…).
 * @param {string} key
 * @param {Pokemon[]} order
 * @param {number} [firstBox]
 * @returns {BoxPlace | null}
 */
export function placeOf(key, order, firstBox = 1) {
  let index = indexes.get(order);
  if (!index) indexes.set(order, (index = new Map(order.map((p, i) => [p.key, i]))));
  const i = index.get(String(key));
  if (i === undefined) return null;
  const slot = (i % BOX_SIZE) + 1;
  return { box: firstBox + Math.floor(i / BOX_SIZE), slot, row: Math.ceil(slot / BOX_COLUMNS), col: ((slot - 1) % BOX_COLUMNS) + 1 };
}

/**
 * Espèces dont un exemplaire est rangé.
 * @param {Catch[]} catches
 * @returns {Set<string>}
 */
export const boxedKeys = catches => new Set(catches.filter(c => c.boxed).map(c => c.key));

/**
 * État d'une place : rangé, à ranger (shiny obtenu), manquant, ou Shiny Lock manquant.
 * @param {Pokemon} p
 * @param {Record<string, Catch>} shinies
 * @param {Set<string>} boxed
 * @returns {SlotStatus}
 */
export function slotStatus(p, shinies, boxed) {
  if (boxed.has(p.key)) return 'stored';
  if (shinies[p.key]) return 'toStore';
  return p.isShinyLocked ? 'locked' : 'missing';
}

/**
 * Bilan d'une boîte (ou de tout le living dex).
 * @param {Pokemon[]} slots
 * @param {Record<string, Catch>} shinies
 * @param {Set<string>} boxed
 * @returns {Record<SlotStatus, number>}
 */
export function boxSummary(slots, shinies, boxed) {
  const out = { stored: 0, toStore: 0, missing: 0, locked: 0 };
  for (const p of slots) out[slotStatus(p, shinies, boxed)]++;
  return out;
}

/**
 * Shiny obtenus mais pas encore rangés.
 * @param {Pokemon[]} slots
 * @param {Record<string, Catch>} shinies
 * @param {Set<string>} boxed
 * @returns {string[]} Clés.
 */
export const keysToStore = (slots, shinies, boxed) => slots.filter(p => slotStatus(p, shinies, boxed) === 'toStore').map(p => p.key);
