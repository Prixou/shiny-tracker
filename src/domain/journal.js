// Journal des captures : filtres, tris, regroupements et export CSV (tableur, séparateur « ; »).
/** @import { Catch } from './types.js' */
/** @import { Pokemon } from '../data/pokedex.js' */
import { GAME_BY_ID } from '../data/games.js';
import { METHOD_BY_ID } from '../data/methods.js';
import { BALL_BY_ID, REGION_BY_ID, regionForId } from '../data/constants.js';
import { getPokemon } from '../data/pokedex.js';
import { formatDuration, monthLabel } from '../lib/format.js';
import { normalize } from '../lib/text.js';
import { catchRatio } from './luck.js';
import { needsReview } from './bulkEdit.js';

/**
 * Une ligne du journal.
 * @typedef {object} JournalEntry
 * @property {string} id
 * @property {string} key
 * @property {Catch} rec
 * @property {Pokemon} p
 */

/**
 * Groupe de lignes (mois, région ou tout le journal).
 * @typedef {object} JournalGroup
 * @property {string} key
 * @property {string | null} label
 * @property {JournalEntry[]} items
 */

export const JOURNAL_SORTS = /** @type {const} */ ([
  { id: 'recent', label: 'Plus récents' },
  { id: 'oldest', label: 'Plus anciens' },
  { id: 'dex', label: 'N° du Pokédex' },
  { id: 'most', label: 'Plus de rencontres' },
  { id: 'luckiest', label: 'Les plus chanceux' },
  { id: 'unluckiest', label: 'Les plus longs (vs taux)' }
]);

/** Filtres : tout, shiny à vérifier (ajoutés d'un geste), shiny sans date. */
export const JOURNAL_FILTERS = /** @type {const} */ (['all', 'review', 'undated']);

/** @type {Record<string, (c: Catch) => boolean>} */
const FILTER_TESTS = { all: () => true, review: needsReview, undated: c => !c.date };

/**
 * Lignes du journal (captures dont le Pokémon est connu).
 * @param {Catch[]} catches
 * @returns {JournalEntry[]}
 */
export const journalEntries = catches => catches
  .map(rec => ({ id: rec.id, key: rec.key, rec, p: getPokemon(rec.key) }))
  .filter(e => e.p);

/**
 * Nombre de shiny par filtre.
 * @param {Catch[]} catches
 * @returns {{ all: number, review: number, undated: number }}
 */
export function journalCounts(catches) {
  let review = 0;
  let undated = 0;
  for (const c of catches) {
    if (needsReview(c)) review++;
    if (!c.date) undated++;
  }
  return { all: catches.length, review, undated };
}

/** @type {Record<string, (a: JournalEntry, b: JournalEntry) => number>} */
const SORT_CMP = {
  recent: (a, b) => (b.rec.timestamp || 0) - (a.rec.timestamp || 0),
  // Les shiny sans date restent en dernier, quel que soit le sens.
  oldest: (a, b) => (a.rec.timestamp || Number.MAX_SAFE_INTEGER) - (b.rec.timestamp || Number.MAX_SAFE_INTEGER),
  dex: (a, b) => a.p.id - b.p.id || a.p.key.localeCompare(b.p.key),
  most: (a, b) => (b.rec.count || 0) - (a.rec.count || 0),
  luckiest: (a, b) => (catchRatio(a.rec) ?? Infinity) - (catchRatio(b.rec) ?? Infinity),
  unluckiest: (a, b) => (catchRatio(b.rec) ?? -1) - (catchRatio(a.rec) ?? -1)
};

/**
 * Lignes filtrées (recherche dans le nom, le surnom et les notes) puis triées.
 * @param {JournalEntry[]} entries
 * @param {{ query?: string, filter?: string, sort?: string }} options
 * @returns {JournalEntry[]}
 */
export function journalList(entries, { query = '', filter = 'all', sort = 'recent' }) {
  const q = normalize(query);
  const keep = FILTER_TESTS[filter] || FILTER_TESTS.all;
  return entries
    .filter(e => keep(e.rec) && (!q || e.p.search.includes(q) || normalize(e.rec.nickname).includes(q) || normalize(e.rec.notes).includes(q)))
    .sort(SORT_CMP[sort] || SORT_CMP.recent);
}

/**
 * Regroupement : par mois pour les tris par date (« Date inconnue » à part), par région pour le tri
 * par numéro, sinon un seul groupe.
 * @param {JournalEntry[]} list
 * @param {string} sort
 * @returns {JournalGroup[]}
 */
export function journalGroups(list, sort) {
  /** @type {(e: JournalEntry) => string} */
  let keyOf;
  /** @type {(k: string) => string} */
  let labelOf;
  if (sort === 'recent' || sort === 'oldest') {
    keyOf = e => (e.rec.date ? e.rec.date.slice(0, 7) : 'unknown');
    labelOf = k => (k === 'unknown' ? 'Date inconnue' : monthLabel(k));
  } else if (sort === 'dex') {
    keyOf = e => regionForId(e.p.id);
    labelOf = k => REGION_BY_ID[k]?.name || k;
  } else {
    return [{ key: 'all', label: null, items: list }];
  }
  /** @type {Map<string, JournalEntry[]>} */
  const map = new Map();
  for (const e of list) {
    const k = keyOf(e);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(e);
  }
  return [...map].map(([key, items]) => ({ key, label: labelOf(key), items }));
}

const HEADER = ['N°', 'Pokémon', 'Surnom', 'Date', 'Jeu', 'Méthode', 'Ball', 'Rencontres', 'Taux', 'Durée', 'Sexe', 'Nature', 'Talent', 'Niveau', 'Baron', 'Marque', 'Notes'];
const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

/**
 * `entries` : [{ p (Pokémon), rec (capture) }]. Commence par un BOM pour qu'Excel lise l'UTF-8.
 * @param {Array<{ p: Pokemon, rec: Catch }>} entries
 * @returns {string}
 */
export function journalCsv(entries) {
  /** @type {Array<Array<string | number | null | undefined>>} */
  const rows = [HEADER];
  for (const { p, rec } of entries) {
    rows.push([p.id, p.name, rec.nickname, rec.date, GAME_BY_ID[rec.game]?.name, METHOD_BY_ID[rec.method]?.name, BALL_BY_ID[rec.ball]?.name,
      rec.count, rec.odds ? `1/${rec.odds}` : '', rec.elapsedMs ? formatDuration(rec.elapsedMs) : '', rec.gender === 'm' ? '♂' : rec.gender === 'f' ? '♀' : '',
      rec.nature, rec.ability, rec.level, rec.alpha ? 'Oui' : '', rec.mark, rec.notes]);
  }
  return '﻿' + rows.map(r => r.map(esc).join(';')).join('\n');
}
