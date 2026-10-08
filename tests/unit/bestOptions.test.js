import { describe, it, expect, beforeAll } from 'vitest';
import { bestOptions } from '../../src/domain/bestOptions.js';
import { loadEncounters } from '../../src/services/encounters.js';
import { getPokemon, POKEDEX } from '../../src/data/pokedex.js';
import { GAME_BY_ID } from '../../src/data/games.js';
import { bestOptionsPrefs } from '../../src/domain/settings.js';

let data;
beforeAll(async () => { data = await loadEncounters(); });
const games = (key, prefs) => bestOptions(getPokemon(key), data, prefs).main.map(o => o.game);
const option = (key, game) => bestOptions(getPokemon(key), data).main.find(o => o.game === game);

describe('meilleures options shiny', () => {
  it('sont triées du meilleur taux au moins bon', () => {
    for (const key of ['25', '133', '448', '570', '147']) {
      const { main } = bestOptions(getPokemon(key), data);
      expect(main.length).toBeGreaterThan(0);
      for (let i = 1; i < main.length; i++) expect(main[i].odds).toBeGreaterThanOrEqual(main[i - 1].odds);
      expect(new Set(main.map(o => o.game)).size).toBe(main.length); // une option par jeu
    }
  });

  it('proposent les grandes méthodes attendues', () => {
    expect(option('399', 'bdsp')?.cfg.method).toBe('radar'); // Keunotor au Poké Radar
    expect(option('570-hisui', 'pla')?.cfg.method).toBe('pla_mo'); // Zorua de Hisui en apparition massive
    expect(option('506', 'xy')?.cfg.method).toBe('radar'); // Ponchiot au Poké Radar (Safari des Amis)
    expect(option('150', 'swsh')?.cfg.method).toBe('dynamax'); // Mewtwo en Expédition Dynamax
    expect(option('906', 'sv')?.cfg.method).toBe('masuda'); // Poussacha : Masuda
  });

  it('gardent les fossiles des Grands Souterrains (Diamant Étincelant / Perle Scintillante)', () => {
    for (const key of ['138', '140', '142', '345', '347']) {
      expect(option(key, 'bdsp')).toMatchObject({ label: 'Fossile des Grands Souterrains', cfg: { method: 'reset' } });
    }
  });

  it('ajoutent la Masuda dans les jeux DS, 3DS et Switch', () => {
    expect(option('507', 'usum')?.cfg.method).toBe('masuda'); // Ponchien
    expect(option('133', 'swsh')?.cfg.method).toBe('masuda');
    expect(Math.round(option('133', 'swsh').odds)).toBe(512);
  });

  it('ne proposent plus la reproduction avec parent shiny (1/64)', () => {
    for (const key of ['1', '25', '143', '147']) {
      expect(bestOptions(getPokemon(key), data).main.some(o => o.cfg.method === 'gsc_breed')).toBe(false);
    }
  });

  it('ne proposent rien pour les Shiny Lock, Méga et Gigamax', () => {
    expect(bestOptions(getPokemon('1007'), data).main).toEqual([]);
    const mega = POKEDEX.find(p => p.variantKind === 'mega');
    const gmax = POKEDEX.find(p => p.variantKind === 'gmax');
    expect(bestOptions(mega, data).main).toEqual([]);
    expect(bestOptions(gmax, data).main).toEqual([]);
  });

  it('placent les formes régionales dans les bons jeux', () => {
    // Sablaireau d'Alola : pas dans X / Y ; Darumarond de Galar : pas dans Noir 2 / Blanc 2.
    for (const [key, region] of [['28-alola', 'alola'], ['554-galar', 'galar'], ['37-alola', 'alola']]) {
      for (const g of games(key)) expect(GAME_BY_ID[g].forms).toContain(region);
    }
    // La forme normale n'est pas proposée là où la forme régionale la remplace.
    expect(games('19')).not.toContain('sm');
    expect(games('52')).not.toContain('swsh');
  });

  it('suivent « Mes jeux » et le Charme Chroma par jeu', () => {
    const settings = { myGames: ['xy', 'sv'], charmGames: { xy: false, sv: true } };
    const r = bestOptions(getPokemon('133'), data, bestOptionsPrefs(settings));
    expect(r.main.every(o => ['xy', 'sv'].includes(o.game))).toBe(true);
    expect(r.others.length).toBeGreaterThan(0);
    expect(r.others.every(o => !['xy', 'sv'].includes(o.game))).toBe(true);
    expect(r.main.find(o => o.game === 'xy').cfg.charm).toBe(false);
    expect(r.main.find(o => o.game === 'sv').cfg.charm).toBe(true);
  });
});
