import { describe, it, expect } from 'vitest';
import { myGamesSet, ownsGame, hasCharm, bestOptionsPrefs } from '../../src/domain/settings.js';

describe('Mes jeux', () => {
  it('sans jeux cochés, tous les jeux comptent', () => {
    expect(myGamesSet({ myGames: [] })).toBe(null);
    expect(ownsGame({}, 'sv')).toBe(true);
  });
  it('avec des jeux cochés, seuls ceux-là comptent', () => {
    const s = { myGames: ['xy'] };
    expect(ownsGame(s, 'xy')).toBe(true);
    expect(ownsGame(s, 'sv')).toBe(false);
  });
  it('Charme : réglage du jeu, sinon réglage général, jamais dans un jeu sans Charme', () => {
    expect(hasCharm({ charm: true }, 'sv')).toBe(true);
    expect(hasCharm({ charm: true, charmGames: { sv: false } }, 'sv')).toBe(false);
    expect(hasCharm({ charm: false, charmGames: { xy: true } }, 'xy')).toBe(true);
    expect(hasCharm({ charm: true }, 'dpp')).toBe(false);
  });
  it('meilleures options : Charme compté par défaut, sauf réglage contraire', () => {
    const prefs = bestOptionsPrefs({ myGames: ['sv'], charmGames: { xy: false } });
    expect(prefs.charmFor('sv')).toBe(true);
    expect(prefs.charmFor('xy')).toBe(false);
    expect(prefs.owns('xy')).toBe(false);
  });
});
