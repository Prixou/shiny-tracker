import { describe, it, expect } from 'vitest';
import { GUIDES, guideForMethod } from '../../src/data/guides.js';
import { GAMES, GAME_BY_ID } from '../../src/data/games.js';
import { METHOD_BY_ID, oddsAt } from '../../src/data/methods.js';

const odds = (id, label) => {
  const o = GUIDES.find(g => g.id === id).odds.find(x => x.label === label);
  return Math.round(oddsAt(o.cfg, o.chain || 0));
};

describe('tutos des méthodes', () => {
  it('jeux, méthodes et réglages existent ; chaque exemple de taux est une méthode du jeu', () => {
    for (const g of GUIDES) {
      expect(g.steps.length, g.id).toBeGreaterThan(0);
      for (const id of g.games) expect(GAME_BY_ID[id], `${g.id} ${id}`).toBeTruthy();
      for (const m of g.methods) expect(METHOD_BY_ID[m], `${g.id} ${m}`).toBeTruthy();
      for (const o of g.odds) {
        expect(GAME_BY_ID[o.cfg.game].methods, `${g.id} ${o.label}`).toContain(o.cfg.method);
        expect(oddsAt(o.cfg, o.chain || 0)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('chaque méthode proposée par un jeu (hors GO et distributions) a son tuto', () => {
    const methods = new Set(GAMES.flatMap(g => g.methods).filter(m => !m.startsWith('go_') && m !== 'event' && m !== 'other'));
    for (const m of methods) expect(guideForMethod(m), m).toBeTruthy();
  });

  it('taux calculés par le moteur : valeurs connues', () => {
    expect(odds('masuda', 'Masuda + Charme Chroma')).toBe(512);
    expect(odds('masuda', 'Masuda (Gen 6 et +)')).toBe(683);
    expect(odds('sv-outbreak', '60 KO + Charme + sandwich Brillance Nv. 3')).toBe(512);
    expect(odds('sv-outbreak', '60 KO + Charme Chroma')).toBe(820);
    expect(odds('pla', 'Apparition massive, recherche parfaite + Charme')).toBe(128);
    expect(odds('dynamax', 'Avec le Charme Chroma')).toBe(100);
    expect(odds('reset', 'Gen 2 à 5')).toBe(8192);
  });
});
