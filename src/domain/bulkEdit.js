// Édition en lot des captures : shiny « à vérifier » (ajoutés d'un geste, détails par défaut) et
// application d'un même changement (jeu, méthode, Ball, date, HOME) à plusieurs captures.
/** @import { Catch } from './types.js' */
/** @import { Settings } from './settings.js' */
import { gameMethods, oddsAt } from '../data/methods.js';
import { timestampFromIso } from '../lib/format.js';
import { CATCH_FIELDS } from './catch.js';
import { hasCharm } from './settings.js';

/**
 * Changements d'une édition en lot. Champ absent : inchangé.
 * @typedef {object} CatchPatch
 * @property {string} [game] '' : jeu non précisé.
 * @property {string} [method]
 * @property {string} [ball]
 * @property {string} [date] Date « AAAA-MM-JJ » ('' : date inconnue).
 * @property {boolean} [inHome]
 */

/**
 * Shiny à vérifier : ajouté à la main (sans chasse), sans rencontres ni aucun détail saisi, et pas encore
 * confirmé (le ranger dans HOME ne confirme pas ses détails). Typiquement un shiny coché d'un geste dans le
 * Pokédex : jeu, méthode et Ball sont ceux par défaut.
 * @param {Catch} c
 * @returns {boolean}
 */
export const needsReview = c => !c.verified && !c.huntId && !c.count && !c.elapsedMs && c.ball === 'pokeball'
  && !c.nickname && !c.notes && !c.gender && !CATCH_FIELDS.some(f => f !== 'boxed' && c[f]);

/**
 * Valeur commune d'un champ (undefined si les captures diffèrent ou s'il n'y en a aucune).
 * @template {keyof Catch} K
 * @param {Catch[]} catches
 * @param {K} field
 * @returns {Catch[K] | undefined}
 */
export function commonValue(catches, field) {
  if (!catches.length) return undefined;
  const first = catches[0][field];
  return catches.every(c => c[field] === first) ? first : undefined;
}

/**
 * Méthode retenue pour un jeu : celle demandée, sinon l'actuelle si le jeu la propose, sinon la première du jeu.
 * Jeu non précisé : toutes les méthodes restent possibles.
 * @param {string} game
 * @param {string} current
 * @param {string} [wanted]
 * @returns {string}
 */
function methodFor(game, current, wanted) {
  if (!game) return wanted || current;
  const ids = gameMethods(game).map(m => m.id);
  if (wanted && ids.includes(wanted)) return wanted;
  return ids.includes(current) ? current : ids[0] || 'other';
}

/**
 * Applique une édition en lot à une capture. La capture devient « vérifiée ». Nouveau jeu ou nouvelle
 * méthode : taux recalculé (Charme selon « Mes jeux ») et options de méthode remises à zéro.
 * @param {Catch} c
 * @param {CatchPatch} patch
 * @param {Partial<Settings>} settings
 * @returns {Catch}
 */
export function editCatch(c, patch, settings) {
  const next = { ...c, verified: true };
  if (patch.ball) next.ball = patch.ball;
  if (patch.date !== undefined) {
    next.date = patch.date;
    next.timestamp = patch.date ? timestampFromIso(patch.date) : 0;
  }
  if (patch.inHome === true) next.inHome = true;
  if (patch.inHome === false) delete next.inHome;
  const game = patch.game ?? c.game;
  const method = methodFor(game, c.method, patch.method);
  if (game !== c.game || method !== c.method) {
    if (method !== c.method) next.opts = {};
    next.game = game;
    next.method = method;
    next.odds = Math.round(oddsAt({ game: game || 'other', method, charm: hasCharm(settings, game), opts: next.opts }));
    next.luck = null;
  }
  return next;
}

/**
 * Le changement modifie-t-il quelque chose ? (Sinon, l'édition sert seulement à confirmer les détails.)
 * @param {CatchPatch} patch
 */
export const isEmptyPatch = patch => Object.values(patch).every(v => v === undefined);
