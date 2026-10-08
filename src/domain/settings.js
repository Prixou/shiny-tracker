// Réglages de l'utilisateur, dont « Mes jeux » : jeux possédés et Charme Chroma jeu par jeu.
import { GAME_BY_ID } from '../data/games.js';

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
  charmGames: {}
};

/** Vrai si l'utilisateur a indiqué au moins un jeu possédé. */
export const myGamesSet = settings => (settings?.myGames?.length ? new Set(settings.myGames) : null);

/** L'utilisateur possède-t-il ce jeu ? Sans réglage, tous les jeux comptent. */
export const ownsGame = (settings, gameId) => {
  const set = myGamesSet(settings);
  return !set || set.has(gameId);
};

/** A-t-il le Charme Chroma dans ce jeu ? Réglage du jeu, sinon réglage général. */
export const hasCharm = (settings, gameId) => {
  if (!(GAME_BY_ID[gameId]?.charm > 0)) return false;
  const own = settings?.charmGames?.[gameId];
  return own ?? !!settings?.charm;
};

/** Préférences passées au calcul des meilleures options. */
export const bestOptionsPrefs = settings => ({
  owns: gameId => ownsGame(settings, gameId),
  // Sans réglage pour ce jeu, on montre le meilleur taux atteignable (Charme compris).
  charmFor: gameId => settings?.charmGames?.[gameId] ?? true
});
