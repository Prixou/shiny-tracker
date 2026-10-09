// Réglages de l'utilisateur, dont « Mes jeux » : jeux possédés et Charme Chroma jeu par jeu.
import { GAME_BY_ID } from '../data/games.js';

/**
 * Réglages de l'utilisateur (propres à l'appareil, non synchronisés).
 * @typedef {object} Settings
 * @property {boolean} haptics Vibrations.
 * @property {boolean} keepAwake Écran allumé pendant une chasse.
 * @property {boolean} autoPause Chronos en pause quand l'app passe en arrière-plan.
 * @property {boolean} charm Charme Chroma par défaut (jeux non précisés dans « Mes jeux »).
 * @property {string} defaultGame
 * @property {3 | 4 | 5} density Taille de la grille du Pokédex.
 * @property {boolean} colorUncaught
 * @property {boolean} hideLocked
 * @property {boolean} showVariants
 * @property {boolean} animatedSprites
 * @property {boolean} confirmUncatch
 * @property {boolean} sound
 * @property {string[]} myGames Jeux possédés (vide : non renseigné, tous les jeux comptent).
 * @property {Record<string, boolean>} charmGames Charme Chroma jeu par jeu.
 * @property {'today' | 'unknown'} quickAddDate Date des shiny cochés d'un geste (✓ du Pokédex, bouton de la fiche).
 * @property {number} boxFirst Numéro de la première boîte HOME du living dex.
 * @property {'after' | 'end'} boxForms Formes régionales rangées juste après l'espèce, ou à la fin.
 */

/** @type {Settings} */
export const DEFAULT_SETTINGS = {
  haptics: true,
  keepAwake: true,
  autoPause: true,
  charm: false,
  defaultGame: 'sv',
  density: 4,
  colorUncaught: false,
  hideLocked: false,
  showVariants: false,
  animatedSprites: false,
  confirmUncatch: true,
  sound: false,
  // Jeux possédés (vide = non renseigné) et Charme Chroma jeu par jeu.
  myGames: [],
  charmGames: {},
  // « unknown » pour saisir son historique sans fausser les dates.
  quickAddDate: 'today',
  // Boîtes HOME du living dex.
  boxFirst: 1,
  boxForms: 'after'
};

/**
 * Préférences des meilleures options : jeux possédés et Charme Chroma compté.
 * @typedef {object} BestOptionsPrefs
 * @property {(gameId: string) => boolean} [owns]
 * @property {(gameId: string) => boolean} [charmFor]
 */

/**
 * Vrai si l'utilisateur a indiqué au moins un jeu possédé.
 * @param {Partial<Settings> | null | undefined} settings
 * @returns {Set<string> | null}
 */
export const myGamesSet = settings => (settings?.myGames?.length ? new Set(settings.myGames) : null);

/**
 * L'utilisateur possède-t-il ce jeu ? Sans réglage, tous les jeux comptent.
 * @param {Partial<Settings> | null | undefined} settings
 * @param {string} gameId
 * @returns {boolean}
 */
export const ownsGame = (settings, gameId) => {
  const set = myGamesSet(settings);
  return !set || set.has(gameId);
};

/**
 * A-t-il le Charme Chroma dans ce jeu ? Réglage du jeu, sinon réglage général.
 * @param {Partial<Settings> | null | undefined} settings
 * @param {string} gameId
 * @returns {boolean}
 */
export const hasCharm = (settings, gameId) => {
  if (!(GAME_BY_ID[gameId]?.charm > 0)) return false;
  const own = settings?.charmGames?.[gameId];
  return own ?? !!settings?.charm;
};

/**
 * Préférences passées au calcul des meilleures options.
 * @param {Partial<Settings> | null | undefined} settings
 * @returns {BestOptionsPrefs}
 */
export const bestOptionsPrefs = settings => ({
  owns: gameId => ownsGame(settings, gameId),
  // Sans réglage pour ce jeu, on montre le meilleur taux atteignable (Charme compris).
  charmFor: gameId => settings?.charmGames?.[gameId] ?? true
});
