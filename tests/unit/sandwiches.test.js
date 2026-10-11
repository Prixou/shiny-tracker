import { describe, it, expect } from 'vitest';
import { SPARKLING_SANDWICHES, ENCOUNTER_SANDWICHES, EGG_SANDWICHES } from '../../src/data/sandwiches.js';
import { TYPE_BY_ID, POKEMON_TYPES } from '../../src/data/constants.js';

const count = list => list.reduce((n, i) => n + i.n, 0);
const allTypes = POKEMON_TYPES.map(t => t.id).sort();

describe('recettes de sandwichs (fichier généré et vérifié)', () => {
  it('Brillance Nv. 3 : un sandwich par type, 1 garniture et seulement des paires d\'Épices valides (toujours une salée)', () => {
    expect(SPARKLING_SANDWICHES.map(s => s.type).sort()).toEqual(allTypes);
    for (const s of SPARKLING_SANDWICHES) {
      expect(count(s.fillings)).toBe(1);
      expect(s.pairs.length).toBeGreaterThan(0);
      for (const pair of s.pairs) {
        expect(pair).toHaveLength(2);
        expect(pair.every(h => h.startsWith('Épice secrète'))).toBe(true);
        expect(pair.some(h => h.endsWith('salée'))).toBe(true);
      }
      for (const power of ['brillance', 'insigne', 'rencontre']) expect(s.powers).toContainEqual({ power, type: s.type, level: 3 });
    }
  });

  it('sans Épice : Aura Rencontre Nv. 2 du bon type pour les 18 types, recettes jouables en solo', () => {
    expect(ENCOUNTER_SANDWICHES.map(e => e.type).sort()).toEqual(allTypes);
    for (const e of ENCOUNTER_SANDWICHES) {
      for (const r of [e.free, e.official].filter(Boolean)) {
        expect(r.powers).toContainEqual({ power: 'rencontre', type: e.type, level: 2 });
        expect([...r.fillings, ...r.condiments].some(i => i.name.startsWith('Épice'))).toBe(false);
        expect(count(r.fillings)).toBeLessThanOrEqual(6);
        expect(count(r.condiments)).toBeLessThanOrEqual(4);
        expect(r.powers.every(p => !p.type || TYPE_BY_ID[p.type])).toBe(true);
      }
      expect(['tested', 'computed']).toContain(e.free.kind);
      if (e.official) expect(e.official).toMatchObject({ kind: 'official', number: expect.any(Number), name: expect.any(String), where: expect.any(String) });
    }
    // Recettes relevées en jeu par la communauté.
    expect(ENCOUNTER_SANDWICHES.filter(e => e.free.kind === 'tested').map(e => e.type).sort()).toEqual(['fire', 'flying', 'psychic', 'water']);
  });

  it('Aura Œuf Nv. 2 : recettes du jeu, sans Épice', () => {
    expect(EGG_SANDWICHES.length).toBeGreaterThan(0);
    for (const r of EGG_SANDWICHES) {
      expect(r.kind).toBe('official');
      expect(r.powers).toContainEqual({ power: 'oeuf', type: '', level: 2 });
      expect(r.condiments.some(i => i.name.startsWith('Épice'))).toBe(false);
    }
  });
});
