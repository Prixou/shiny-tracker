import { describe, it, expect, beforeAll } from 'vitest';
import { loadEncounters } from '../../src/services/encounters.js';
import { huntMethodIndex, huntMethodId, huntMethodLabel, caughtIn } from '../../src/domain/huntIndex.js';
import { bestOptions, huntOptions } from '../../src/domain/bestOptions.js';
import { filterPokedex, DEFAULT_FILTERS, countActive } from '../../src/domain/dexFilter.js';
import { bestOptionsPrefs, DEFAULT_SETTINGS } from '../../src/domain/settings.js';
import { bankPriorities } from '../../src/domain/bank.js';
import { tonightPlan } from '../../src/domain/tonight.js';
import { getPokemon, MAIN_DEX } from '../../src/data/pokedex.js';
import { GAMES, GAME_BY_ID } from '../../src/data/games.js';

let data;
beforeAll(async () => { data = await loadEncounters(); });
const index = () => huntMethodIndex(data);
const keysOf = id => index().byId.get(id)?.keys || new Set();

describe('Pokémon disponibles par méthode', () => {
  it('une entrée par jeu et méthode, rangée par jeu puis par méthode du jeu, jamais vide', () => {
    const { entries, byId } = index();
    expect(entries.length).toBeGreaterThan(30);
    expect(new Set(entries.map(e => e.id)).size).toBe(entries.length);
    expect(byId.size).toBe(entries.length);
    const rank = new Map(GAMES.map((g, i) => [g.id, i]));
    for (let i = 1; i < entries.length; i++) {
      const [a, b] = [entries[i - 1], entries[i]];
      expect(rank.get(a.game)).toBeLessThanOrEqual(rank.get(b.game));
      if (a.game === b.game) expect(GAME_BY_ID[a.game].methods.indexOf(a.method)).toBeLessThan(GAME_BY_ID[b.game].methods.indexOf(b.method));
    }
    for (const e of entries) {
      expect(e.keys.size).toBeGreaterThan(0);
      expect(e.id).toBe(huntMethodId(e.game, e.method));
      expect(GAME_BY_ID[e.game].methods).toContain(e.method); // méthode réellement disponible dans ce jeu
      expect(e.game).not.toBe('pogo'); // GO ne compte pas dans le living dex
    }
    expect(huntMethodIndex(data)).toBe(index()); // calculé une seule fois
  });

  it('contient chaque meilleure option de la fiche', () => {
    for (const p of MAIN_DEX.filter((_, i) => i % 7 === 0)) {
      for (const o of bestOptions(p, data).main.filter(o => o.game !== 'pogo')) {
        expect(keysOf(huntMethodId(o.game, o.cfg.method)).has(p.key), `${p.key} ${o.game} ${o.cfg.method}`).toBe(true);
      }
    }
  });

  it('liste aussi les méthodes moins bonnes : sauvage, SOS, apparitions massives de Hisui', () => {
    // Légendes Arceus : Zorua de Hisui en apparition massive, mais aussi en sauvage et en apparition massive massive.
    for (const m of ['pla_mo', 'pla_mmo', 'pla_wild']) expect(keysOf(`pla|${m}`).has('570-hisui'), m).toBe(true);
    expect(keysOf('pla|pla_wild').size).toBeGreaterThan(150);
    // Soleil / Lune : SOS pour bien plus que les quelques Pokémon dont c'est la meilleure option.
    expect(keysOf('sm|sos').size).toBeGreaterThan(30);
    expect(keysOf('xy|radar').has('506')).toBe(true); // Ponchiot au Poké Radar
    expect(keysOf('xy|chain_fishing').has('129')).toBe(true); // Magicarpe en pêche à la chaîne
    expect(keysOf('xy|chain_fishing').has('25')).toBe(false); // Pikachu ne se pêche pas
    // Le mode complet ne change pas la meilleure option.
    const eevee = getPokemon('133');
    expect(huntOptions(eevee, data, {}, { all: true }).length).toBeGreaterThan(huntOptions(eevee, data).length);
  });

  it('libellé, et tes shiny déjà obtenus parmi les Pokémon d\'une méthode', () => {
    expect(huntMethodLabel('xy|radar')).toBe('📡 Poké Radar · XY');
    const entry = index().byId.get('xy|chain_fishing');
    expect(caughtIn(entry, {})).toBe(0);
    expect(caughtIn(entry, { 129: { key: '129' }, 25: { key: '25' } })).toBe(1);
  });

  it('filtre du Pokédex « Chassable avec », combiné aux statuts', () => {
    const ctx = (filters, shinies = {}) => ({
      filters: { ...DEFAULT_FILTERS, ...filters }, query: '', shinies, catchesByKey: {}, wishlist: {}, lists: [],
      hideLocked: false, showVariants: false, myGames: [], huntKeys: keysOf('xy|chain_fishing')
    });
    expect(DEFAULT_FILTERS.hunt).toBe('all');
    expect(countActive({ ...DEFAULT_FILTERS, hunt: 'xy|chain_fishing' })).toBe(countActive(DEFAULT_FILTERS) + 1);
    const all = filterPokedex(ctx({ hunt: 'xy|chain_fishing' }));
    expect(all.map(p => p.key).sort()).toEqual([...keysOf('xy|chain_fishing')].sort());
    const shinies = { 129: { key: '129', timestamp: 1 } };
    expect(filterPokedex(ctx({ hunt: 'xy|chain_fishing', status: 'caught' }, shinies)).map(p => p.key)).toEqual(['129']);
    expect(filterPokedex(ctx({ hunt: 'xy|chain_fishing', status: 'missing' }, shinies))).toHaveLength(all.length - 1);
    // Sans filtre de méthode, l'index n'a aucun effet.
    expect(filterPokedex({ ...ctx({}), huntKeys: null }).length).toBe(MAIN_DEX.length);
  });
});

describe('méthodes masquées dans les Réglages', () => {
  const prefsHiding = (...methods) => bestOptionsPrefs({ ...DEFAULT_SETTINGS, hiddenMethods: methods });

  it('aucune méthode masquée par défaut', () => {
    expect(DEFAULT_SETTINGS.hiddenMethods).toEqual([]);
    expect(bestOptionsPrefs(DEFAULT_SETTINGS).hidden.size).toBe(0);
    expect(bestOptionsPrefs({}).hidden.size).toBe(0); // anciens réglages sans ce champ
  });

  it('le Poké Radar masqué : la meilleure option passe à la méthode suivante du même jeu', () => {
    const keunotor = getPokemon('399');
    expect(bestOptions(keunotor, data).main.find(o => o.game === 'bdsp')?.cfg.method).toBe('radar');
    const r = bestOptions(keunotor, data, prefsHiding('radar'));
    expect([...r.main, ...r.others].some(o => o.cfg.method === 'radar')).toBe(false);
    const bdsp = r.main.find(o => o.game === 'bdsp');
    expect(bdsp).toBeDefined(); // toujours chassable dans ce jeu, autrement
    expect(bdsp.cfg.method).not.toBe('radar');
  });

  it('Masuda, SOS et Pokémon GO masqués partout', () => {
    for (const key of ['133', '906', '25', '150']) {
      const r = bestOptions(getPokemon(key), data, prefsHiding('masuda', 'sos', 'go_standard', 'go_raid'));
      const methods = [...r.main, ...r.others, ...r.extra].map(o => o.cfg.method);
      for (const m of ['masuda', 'sos', 'go_standard', 'go_raid']) expect(methods, `${key} ${m}`).not.toContain(m);
    }
    // Poussacha : sans Masuda, plus rien dans Écarlate / Violet (starter non sauvage).
    expect(bestOptions(getPokemon('906'), data, prefsHiding('masuda')).main.some(o => o.game === 'sv' && o.cfg.method === 'masuda')).toBe(false);
  });

  it('« Que chasser ce soir ? » et le plan Banque respectent les méthodes masquées', () => {
    const now = Date.parse('2026-10-08T20:00:00Z');
    const plan = tonightPlan(data, { shinies: {}, prefs: prefsHiding('radar', 'chain_fishing'), hours: 1, platforms: ['3ds'], now, limit: 400 });
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.some(o => ['radar', 'chain_fishing'].includes(o.option.cfg.method))).toBe(false);
    const all = tonightPlan(data, { shinies: {}, prefs: bestOptionsPrefs(DEFAULT_SETTINGS), hours: 1, platforms: ['3ds'], now, limit: 400 });
    expect(all.some(o => ['radar', 'chain_fishing'].includes(o.option.cfg.method))).toBe(true);

    const bank = bankPriorities(data, { shinies: {}, prefs: prefsHiding('sos', 'radar') });
    for (const e of [...bank.only, ...bank.easier]) {
      expect(['sos', 'radar']).not.toContain(e.best.cfg.method);
      if (e.switchBest) expect(['sos', 'radar']).not.toContain(e.switchBest.cfg.method);
    }
  });
});
