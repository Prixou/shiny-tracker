import { describe, it, expect } from 'vitest';
import { oddsAt, cumulativeChance, encountersFor, luckRatio, migrateMethod, gameMethods, charmAvailable, isDynamic, oddsContext } from '../../src/data/methods.js';

// Taux publiés (Serebii, Bulbapedia, Rotom Labs…). Les guides divisent souvent simplement (4096 / 5 = 819)
// alors que l'app calcule la probabilité exacte (819,6) : on tolère ±1 sur le dénominateur.
const raw = (cfg, chain = 0) => oddsAt({ opts: {}, charm: false, ...cfg }, chain);
const odds = (cfg, chain = 0) => ({
  toBe: expected => expect(Math.abs(raw(cfg, chain) - expected), `1/${raw(cfg, chain).toFixed(1)} au lieu de 1/${expected}`).toBeLessThanOrEqual(1)
});

describe('taux de base par génération', () => {
  it('1/8192 en Gen 2 à 5, 1/4096 ensuite', () => {
    for (const game of ['gsc', 'rse', 'frlg', 'dpp', 'hgss', 'bw', 'b2w2']) odds({ game, method: 'wild' }).toBe(8192);
    for (const game of ['xy', 'oras', 'sm', 'usum', 'letsgo', 'swsh', 'bdsp', 'pla', 'sv', 'za']) odds({ game, method: 'wild' }).toBe(4096);
  });
  it('Charme Chroma : +2 tirages en général, ×4 en Z-A et Légendes Arceus', () => {
    odds({ game: 'sv', method: 'sv_wild', charm: true }).toBe(1366);
    odds({ game: 'b2w2', method: 'wild', charm: true }).toBe(2731);
    odds({ game: 'za', method: 'za_wild', charm: true }).toBe(1024);
    odds({ game: 'pla', method: 'pla_wild', charm: true }).toBe(1024);
  });
  it('pas de Charme dans les jeux qui n\'en ont pas', () => {
    expect(charmAvailable('dpp', 'wild')).toBe(false);
    odds({ game: 'dpp', method: 'wild', charm: true }).toBe(8192);
  });
});

describe('Écarlate / Violet', () => {
  it('sandwich, apparition massive et Charme', () => {
    odds({ game: 'sv', method: 'sv_wild', opts: { sparkling: 3 } }).toBe(1024);
    odds({ game: 'sv', method: 'sv_wild', charm: true, opts: { outbreak: true } }, 60).toBe(819);
    odds({ game: 'sv', method: 'sv_wild', charm: true, opts: { outbreak: true, sparkling: 3 } }, 60).toBe(512);
  });
  it('les KO comptent par paliers (30 puis 60)', () => {
    const cfg = { game: 'sv', method: 'sv_wild', charm: true, opts: { outbreak: true, sparkling: 3 } };
    odds(cfg, 29).toBe(683);
    odds(cfg, 30).toBe(586);
    odds(cfg, 60).toBe(512);
    expect(isDynamic(oddsContext({ ...cfg }))).toBe(true);
    expect(isDynamic(oddsContext({ game: 'sv', method: 'sv_wild', opts: {} }))).toBe(false);
  });
  it('évènement boosté : +0,5 % tiré avant le sandwich et le Charme', () => {
    odds({ game: 'sv', method: 'sv_wild', opts: { eventBoost: true } }).toBe(191);
    odds({ game: 'sv', method: 'sv_wild', charm: true, opts: { outbreak: true, sparkling: 3, eventBoost: true } }, 60).toBe(144);
  });
});

describe('Légendes Arceus et Z-A', () => {
  it('recherche parfaite, apparitions massives et Mégapparitions', () => {
    odds({ game: 'pla', method: 'pla_wild', opts: { research: 3 } }).toBe(1024);
    odds({ game: 'pla', method: 'pla_wild', charm: true, opts: { research: 3 } }).toBe(585);
    odds({ game: 'pla', method: 'pla_mo', charm: true, opts: { research: 3 } }).toBe(128);
    odds({ game: 'pla', method: 'pla_mmo', charm: true, opts: { research: 3 } }).toBe(216);
  });
  it('donuts Brillance de Z-A et fossiles', () => {
    odds({ game: 'za', method: 'za_wild', charm: true, opts: { sparkling: 3 } }).toBe(586);
    odds({ game: 'za', method: 'za_fossil', charm: true }).toBe(4096);
  });
  it('téléportation en boucle : plusieurs cibles par cycle', () => {
    const one = oddsAt({ game: 'za', method: 'za_fasttravel', charm: true, opts: { sparkling: 3, spawns: 1 } });
    const four = oddsAt({ game: 'za', method: 'za_fasttravel', charm: true, opts: { sparkling: 3, spawns: 4 } });
    expect(Math.round(one)).toBe(586);
    expect(four).toBeLessThan(one / 3.9);
  });
});

describe('méthodes à chaîne et reproduction', () => {
  it('Masuda selon la génération', () => {
    odds({ game: 'dpp', method: 'masuda' }).toBe(1639);
    odds({ game: 'bw', method: 'masuda' }).toBe(1366);
    odds({ game: 'b2w2', method: 'masuda', charm: true }).toBe(1024);
    odds({ game: 'xy', method: 'masuda' }).toBe(683);
    odds({ game: 'sv', method: 'masuda', charm: true }).toBe(512);
  });
  it('Poké Radar à 40 : 1/200 en Gen 4, environ 1/99 ensuite', () => {
    odds({ game: 'dpp', method: 'radar' }, 40).toBe(200);
    odds({ game: 'xy', method: 'radar' }, 40).toBe(99);
  });
  it('pêche à la chaîne, SOS, Combo Capture, Safari des Amis, Dynamax', () => {
    odds({ game: 'xy', method: 'chain_fishing' }, 20).toBe(100);
    odds({ game: 'usum', method: 'sos', charm: true }, 31).toBe(274);
    odds({ game: 'letsgo', method: 'catch_combo' }, 31).toBe(342);
    odds({ game: 'letsgo', method: 'catch_combo', charm: true, opts: { lure: true } }, 31).toBe(274);
    odds({ game: 'xy', method: 'friend_safari' }).toBe(819);
    odds({ game: 'swsh', method: 'dynamax' }).toBe(300);
    odds({ game: 'swsh', method: 'dynamax', charm: true }).toBe(100);
  });
  it('taux personnalisé prioritaire', () => {
    odds({ game: 'sv', method: 'sv_wild', customOdds: 777 }).toBe(777);
  });
});

describe('probabilités cumulées', () => {
  it('au taux x, x rencontres donnent environ 63 %', () => {
    expect(cumulativeChance({ game: 'sv', method: 'sv_wild', opts: {} }, [4096])).toBeCloseTo(0.632, 2);
  });
  it('les phases s\'additionnent', () => {
    const cfg = { game: 'sv', method: 'sv_wild', opts: {} };
    expect(cumulativeChance(cfg, [2048, 2048])).toBeCloseTo(cumulativeChance(cfg, [4096]), 10);
  });
  it('rencontres nécessaires pour 50 % et 90 %', () => {
    const cfg = { game: 'sv', method: 'sv_wild', opts: {} };
    expect(encountersFor(cfg, 0.5)).toBe(2839);
    expect(encountersFor(cfg, 0.9)).toBe(9431);
  });
  it('ratio de chance de 1 au taux pile', () => {
    expect(luckRatio(1 - Math.exp(-1))).toBeCloseTo(1, 10);
  });
});

describe('compatibilité', () => {
  it('anciennes méthodes migrées', () => {
    expect(migrateMethod('outbreak_sandwich')).toEqual({ method: 'sv_wild', opts: { outbreak: true, sparkling: 3 } });
    expect(migrateMethod('inconnue').method).toBe('wild');
  });
  it('la reproduction avec parent shiny (1/64) n\'est plus proposée', () => {
    expect(gameMethods('gsc').map(m => m.id)).not.toContain('gsc_breed');
  });
});
