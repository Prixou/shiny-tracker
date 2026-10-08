// Exemplaires provisoires : shiny obtenus par distribution (Shiny Lock), gardés en attendant de
// pouvoir chasser le Pokémon soi-même, avec son propre ID dresseur.
/** @import { BestOption, Catch, EncounterData } from './types.js' */
/** @import { BestOptionsPrefs } from './settings.js' */
/** @import { Pokemon } from '../data/pokedex.js' */
import { getPokemon } from '../data/pokedex.js';
import { bestOptions } from './bestOptions.js';

/**
 * Possède-t-on un exemplaire « à soi » (non provisoire) de ce Pokémon ?
 * @param {Catch[]} catches
 * @param {string} key
 */
export const hasOwnCopy = (catches, key) => catches.some(c => c.key === key && !c.provisional);

/**
 * Exemplaires provisoires qu'on peut maintenant remplacer : pas encore d'exemplaire à soi, et au moins
 * une façon de le chasser dans ses jeux. Une entrée par Pokémon, avec sa meilleure option.
 * @param {Catch[]} catches
 * @param {EncounterData} data
 * @param {BestOptionsPrefs} [prefs]
 * @returns {Array<{ p: Pokemon, copy: Catch, option: BestOption }>}
 */
export function replaceableProvisionals(catches, data, prefs) {
  const out = [];
  const seen = new Set();
  for (const c of catches) {
    if (!c.provisional || seen.has(c.key) || hasOwnCopy(catches, c.key)) continue;
    seen.add(c.key);
    const p = getPokemon(c.key);
    const option = p && bestOptions(p, data, prefs).main[0];
    if (option) out.push({ p, copy: c, option });
  }
  return out;
}
