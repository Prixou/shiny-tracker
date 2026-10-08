import { describe, it, expect } from 'vitest';
import { filterPokedex, DEFAULT_FILTERS, countActive, singleGame } from '../../src/domain/dexFilter.js';
import { computeStats, monthlyCatches } from '../../src/domain/stats.js';
import { journalCsv } from '../../src/domain/journal.js';
import { getLuckTier, catchRatio, LUCK_TIERS, NO_LUCK } from '../../src/domain/luck.js';
import { createCatch, latestByKey, groupByKey } from '../../src/domain/catch.js';
import { createHunt, huntTotal, huntElapsed, pauseHunt, defaultMethodFor } from '../../src/domain/hunt.js';
import { createList, setKeys } from '../../src/domain/lists.js';
import { homeTransfer, BANK_DEADLINE } from '../../src/domain/bank.js';
import { isoFromTimestamp, timestampFromIso, fmtOdds, fmtPercent, formatDuration } from '../../src/lib/format.js';
import { normalize } from '../../src/lib/text.js';
import { getPokemon, MAIN_DEX } from '../../src/data/pokedex.js';
import { DEFAULT_SETTINGS } from '../../src/domain/settings.js';

const ctx = (extra = {}) => ({
  filters: { ...DEFAULT_FILTERS, ...(extra.filters || {}) },
  query: extra.query || '',
  shinies: extra.shinies || {},
  catchesByKey: extra.catchesByKey || {},
  wishlist: extra.wishlist || {},
  lists: extra.lists || [],
  hideLocked: !!extra.hideLocked,
  showVariants: !!extra.showVariants,
  myGames: extra.myGames || []
});

describe('filtres du Pokédex', () => {
  it('recherche par nom (sans accents), nom anglais ou numéro', () => {
    expect(filterPokedex(ctx({ query: 'evoli' })).map(p => p.key)).toContain('133');
    expect(filterPokedex(ctx({ query: 'Eevee' })).map(p => p.key)).toContain('133');
    expect(filterPokedex(ctx({ query: '#0133' })).map(p => p.key)).toEqual(['133']);
  });

  it('statuts capturés, manquants et objectifs', () => {
    const shinies = { 25: { key: '25', timestamp: 1 } };
    expect(filterPokedex(ctx({ shinies, filters: { status: 'caught' } })).map(p => p.key)).toEqual(['25']);
    expect(filterPokedex(ctx({ shinies, filters: { status: 'missing' } })).some(p => p.key === '25')).toBe(false);
    expect(filterPokedex(ctx({ wishlist: { 4: true }, filters: { status: 'wish' } })).map(p => p.key)).toEqual(['4']);
  });

  it('région, double type et jeu', () => {
    const johto = filterPokedex(ctx({ filters: { regions: ['johto'] } }));
    expect(johto).toHaveLength(100);
    const fireFlying = filterPokedex(ctx({ filters: { types: ['fire', 'flying'] } }));
    expect(fireFlying.map(p => p.key)).toContain('6');
    expect(fireFlying.every(p => p.types.includes('fire') && p.types.includes('flying'))).toBe(true);
    const pla = filterPokedex(ctx({ filters: { game: 'pla' } }));
    expect(pla.map(p => p.key)).toContain('570-hisui');
    expect(pla.some(p => p.key === '1')).toBe(false); // Bulbizarre absent de Hisui
  });

  it('« Dans mes jeux » et Shiny Lock masqués', () => {
    const mine = filterPokedex(ctx({ filters: { game: 'mine' }, myGames: ['pla'] }));
    expect(mine.length).toBeLessThan(MAIN_DEX.length);
    expect(mine.map(p => p.key)).toContain('570-hisui');
    const hidden = filterPokedex(ctx({ hideLocked: true }));
    expect(hidden.some(p => p.isShinyLocked)).toBe(false);
  });

  it('tri par nom et compteur de filtres actifs', () => {
    const byName = filterPokedex(ctx({ filters: { sort: 'name', regions: ['kanto'] } }));
    expect(byName[0].name.localeCompare(byName[1].name, 'fr')).toBeLessThanOrEqual(0);
    expect(countActive({ ...DEFAULT_FILTERS, regions: ['kanto'], game: 'sv' })).toBe(2);
    expect(singleGame('sv')).toBe('sv');
    expect(singleGame('mine')).toBe(null);
    expect(singleGame('platform:3ds')).toBe(null);
  });
});

describe('statistiques', () => {
  const catches = [
    createCatch('25', { count: 100, odds: 512, ball: 'loveball', date: '2026-09-10', timestamp: Date.parse('2026-09-10T12:00:00') }, DEFAULT_SETTINGS),
    createCatch('133', { count: 2000, odds: 512, date: '2026-10-01', timestamp: Date.parse('2026-10-01T12:00:00') }, DEFAULT_SETTINGS)
  ];
  const stats = computeStats({ shinies: latestByKey(catches), catches, hunts: [], now: new Date('2026-10-08T12:00:00') });

  it('progression, rencontres et moyenne', () => {
    expect(stats.caught).toBe(2);
    expect(stats.total).toBe(MAIN_DEX.length);
    expect(stats.encounters).toBe(2100);
    expect(stats.avg).toBe(1050);
    expect(stats.byRegion.find(r => r.id === 'kanto')).toMatchObject({ value: 2, total: 151 });
  });

  it('chance : le plus chanceux d\'abord, répartition par palier', () => {
    expect(stats.luckiest[0].p.key).toBe('25');
    expect(stats.luck.reduce((n, l) => n + l.value, 0)).toBe(2);
    expect(stats.byBall.map(b => b.id).sort()).toEqual(['loveball', 'pokeball']);
  });

  it('12 mois, le mois en cours en dernier', () => {
    const months = monthlyCatches(catches, new Date('2026-10-08T12:00:00'));
    expect(months).toHaveLength(12);
    expect(months.at(-1)).toMatchObject({ key: '2026-10', value: 1 });
    expect(months.at(-2)).toMatchObject({ key: '2026-09', value: 1 });
  });
});

describe('journal CSV', () => {
  it('en-tête, séparateur « ; », guillemets échappés et BOM UTF-8', () => {
    const rec = createCatch('25', { nickname: 'Pika "Pikachu"', game: 'sv', method: 'masuda', count: 300, odds: 512, gender: 'f' }, DEFAULT_SETTINGS);
    const csv = journalCsv([{ p: getPokemon('25'), rec }]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    const [head, row] = csv.slice(1).split('\n');
    expect(head.split(';')[1]).toBe('"Pokémon"');
    expect(row).toContain('"Pika ""Pikachu"""');
    expect(row).toContain('"Écarlate / Violet"');
    expect(row).toContain('"1/512"');
    expect(row).toContain('"♀"');
  });
});

describe('chance, captures, chasses et listes', () => {
  it('paliers de chance', () => {
    expect(getLuckTier(null)).toBe(NO_LUCK);
    expect(getLuckTier(0.2).id).toBe('king');
    expect(getLuckTier(1).id).toBe('fair');
    expect(getLuckTier(10).id).toBe('forgotten');
    expect(LUCK_TIERS.at(-1).max).toBe(Infinity);
    expect(catchRatio({ count: 1024, odds: 512 })).toBe(2);
    expect(catchRatio({ luck: 0.5, count: 1, odds: 1 })).toBe(0.5);
    expect(catchRatio({ count: 0, odds: 512 })).toBe(null);
  });

  it('nouvelle capture : jeu par défaut, méthode du jeu, Charme selon Mes jeux', () => {
    const c = createCatch('25', {}, { ...DEFAULT_SETTINGS, defaultGame: 'xy', charmGames: { xy: true } });
    expect(c).toMatchObject({ key: '25', game: 'xy', method: defaultMethodFor('xy'), ball: 'pokeball' });
    expect(c.odds).toBeLessThan(4096); // Charme compté
    const grouped = groupByKey([c, { ...c, id: 'b', timestamp: c.timestamp + 1 }]);
    expect(grouped['25'][0].id).toBe('b');
  });

  it('chasse : total, chrono et pause', () => {
    const h = { ...createHunt({ targetId: '133', count: 5 }, { now: 1000 }), phases: [{ count: 10 }], startedAt: 1000, elapsedMs: 500 };
    expect(huntTotal(h)).toBe(15);
    expect(huntElapsed(h, 3000)).toBe(2500);
    expect(pauseHunt(h, 3000)).toMatchObject({ startedAt: null, elapsedMs: 2500 });
  });

  it('listes : nom nettoyé, clés ajoutées et retirées', () => {
    expect(createList({ name: '   ' }).name).toBe('Nouvelle liste');
    expect(createList({ name: 'x'.repeat(60) }).name).toHaveLength(40);
    expect(setKeys({ a: true }, ['b'], true)).toEqual({ a: true, b: true });
    expect(setKeys({ a: true, b: true }, ['a'], false)).toEqual({ b: true });
  });
});

describe('transfert vers Pokémon HOME', () => {
  const before = BANK_DEADLINE - 86400000;
  const after = BANK_DEADLINE + 86400000;
  it('Switch : oui ; 3DS/DS : via la Banque jusqu\'à la fermeture', () => {
    expect(homeTransfer('sv', before)).toBe('oui');
    expect(homeTransfer('xy', before)).toMatch(/^oui, via Pokémon Banque jusqu'au 25 février 2027/);
    expect(homeTransfer('xy', after)).toMatch(/^non/);
    expect(homeTransfer('gsc', before)).toMatch(/Banque/);
    expect(homeTransfer('frlg', after)).toMatch(/version Switch.*plus possible/);
    expect(homeTransfer('inconnu')).toBe('inconnu');
  });
});

describe('mise en forme', () => {
  it('dates locales (et non UTC) aller-retour', () => {
    const ts = timestampFromIso('2026-10-08');
    expect(isoFromTimestamp(ts)).toBe('2026-10-08');
    // Juste après minuit (heure locale) : toujours le bon jour.
    expect(isoFromTimestamp(new Date(2026, 9, 9, 0, 30).getTime())).toBe('2026-10-09');
  });

  it('taux, pourcentages, durées et recherche', () => {
    expect(fmtOdds(511.6)).toBe('1/512');
    expect(fmtPercent(0.0004)).toBe('< 0,1 %');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
    expect(formatDuration(3_725_000, { short: true })).toBe('1 h 02');
    expect(normalize('  Électhor’s ')).toBe('electhor s');
  });
});
