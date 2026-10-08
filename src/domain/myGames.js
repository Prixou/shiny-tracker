// « Mes jeux » : jeux possédés et Charme Chroma jeu par jeu (réglages myGames / charmGames).
import { GAME_BY_ID } from '../data/games.js';

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
