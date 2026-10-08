// Export du journal des captures au format CSV (tableur, séparateur « ; »).
/** @import { Catch } from './types.js' */
/** @import { Pokemon } from '../data/pokedex.js' */
import { GAME_BY_ID } from '../data/games.js';
import { METHOD_BY_ID } from '../data/methods.js';
import { BALL_BY_ID } from '../data/constants.js';
import { formatDuration } from '../lib/format.js';

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
