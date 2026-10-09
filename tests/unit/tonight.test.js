import { describe, it, expect, beforeAll } from 'vitest';
import { loadEncounters } from '../../src/services/encounters.js';
import { chanceWithin, defaultPlatforms, onPlatforms, tonightPlan, tonightSessions } from '../../src/domain/tonight.js';
import { personalPace, paceFor } from '../../src/domain/pace.js';
import { DEFAULT_PACE } from '../../src/data/pace.js';
import { createHunt } from '../../src/domain/hunt.js';
import { createCatch, latestByKey } from '../../src/domain/catch.js';
import { bestOptionsPrefs, DEFAULT_SETTINGS } from '../../src/domain/settings.js';
import { GAME_BY_ID } from '../../src/data/games.js';

let data;
beforeAll(async () => { data = await loadEncounters(); });
const HOUR = 3600000;
const NOW = Date.parse('2026-10-08T20:00:00Z');
const prefsFor = myGames => bestOptionsPrefs({ ...DEFAULT_SETTINGS, myGames });
const hunt = (method, count, hours, extra = {}) => ({ ...createHunt({ targetId: '25', game: 'sv', method }), count, elapsedMs: hours * HOUR, ...extra });

describe('rythme de chasse', () => {
  it('ton rythme par méthode, à partir de 30 minutes de chasses chronométrées', () => {
    const pace = personalPace([hunt('sv_wild', 1000, 1), hunt('sv_wild', 500, 1), hunt('masuda', 50, 0.1), hunt('reset', 30, 0.25)], NOW);
    expect(pace.sv_wild).toEqual({ pace: 750, hours: 2 });
    expect(pace.masuda).toBeUndefined(); // moins de 10 minutes
    expect(pace.reset).toBeUndefined(); // moins de 30 minutes au total
  });

  it('ton rythme d\'abord, sinon l\'estimation ; une distribution ne se chasse pas', () => {
    expect(paceFor('sv_wild', { sv_wild: { pace: 750 } })).toEqual({ pace: 750, mine: true });
    expect(paceFor('reset', {})).toEqual({ pace: DEFAULT_PACE.reset, mine: false });
    expect(paceFor('event', {})).toBeNull();
  });
});

describe('que chasser ce soir', () => {
  it('chance de trouver en un temps donné et consoles', () => {
    expect(chanceWithin(4096, 4096, 1)).toBeCloseTo(1 - Math.exp(-1), 3);
    expect(chanceWithin(512, 400, 0)).toBe(0);
    expect(onPlatforms('gsc', ['3ds'])).toBe(true); // Console virtuelle
    expect(onPlatforms('sv', ['3ds', 'ds'])).toBe(false);
    expect(defaultPlatforms([])).toEqual(['switch', '3ds']);
    expect(defaultPlatforms(['sv', 'gsc', 'bw', 'pogo'])).toEqual(['switch', '3ds', 'ds']); // GO : pas de living dex
  });

  it('seulement les manquants chassables dans tes jeux sur les consoles choisies, du plus probable au moins probable', () => {
    const shinies = latestByKey([createCatch('25', {}, DEFAULT_SETTINGS)]);
    const plan = tonightPlan(data, { shinies, prefs: prefsFor(['sv']), hours: 1, platforms: ['switch'], now: NOW });
    expect(plan.length).toBeGreaterThan(5);
    expect(plan.every(o => o.option.game === 'sv' && !o.p.isShinyLocked && o.p.key !== '25')).toBe(true);
    expect(plan.map(o => o.score)).toEqual([...plan.map(o => o.score)].sort((a, b) => b - a));
    expect(plan[0].chance).toBeGreaterThan(0.2);
    expect(plan[0].avgHours).toBeCloseTo(plan[0].option.odds / plan[0].pace, 6);
    expect(tonightPlan(data, { shinies, prefs: prefsFor(['sv']), hours: 1, platforms: ['3ds'], now: NOW })).toEqual([]);
  });

  it('plus de temps, plus de chances ; ton rythme change l\'estimation', () => {
    const base = { shinies: {}, prefs: prefsFor(['sv']), platforms: ['switch'], now: NOW, limit: 1 };
    const [short] = tonightPlan(data, { ...base, hours: 0.5 });
    const [long] = tonightPlan(data, { ...base, hours: 3 });
    expect(long.chance).toBeGreaterThan(short.chance);
    const method = short.option.cfg.method;
    const [fast] = tonightPlan(data, { ...base, hours: 0.5, personal: { [method]: { pace: DEFAULT_PACE[method] * 3 } } });
    expect(fast.mine).toBe(true);
    expect(fast.chance).toBeGreaterThan(short.chance);
  });

  it('bonus : objectifs, évènement shiny en cours, et DS / 3DS avant la fermeture de la Banque', () => {
    const base = { shinies: {}, prefs: prefsFor(['sv']), hours: 1, platforms: ['switch'], now: NOW, limit: 400 };
    const plan = tonightPlan(data, base);
    const later = plan.at(-1);
    const wished = tonightPlan(data, { ...base, wishlist: { [later.p.key]: true } });
    expect(wished.findIndex(o => o.p.key === later.p.key)).toBeLessThan(plan.length - 1);
    expect(wished.find(o => o.p.key === later.p.key).wished).toBe(true);

    // Apparitions massives boostées de Germéclat (Agenda), pendant l'évènement.
    const during = tonightPlan(data, { ...base, now: Date.parse('2026-08-10T12:00:00Z') });
    expect(during[0]).toMatchObject({ event: true });
    expect(['969', '970']).toContain(during[0].p.key);
    expect(tonightPlan(data, base).some(o => o.event)).toBe(false);

    const legacy = { shinies: {}, prefs: prefsFor(['xy', 'oras', 'sm', 'usum']), hours: 2, platforms: ['3ds'], limit: 400 };
    const before = tonightPlan(data, { ...legacy, now: NOW });
    expect(before.some(o => o.bank)).toBe(true);
    expect(before.every(o => GAME_BY_ID[o.option.game].platform === '3ds')).toBe(true);
    expect(tonightPlan(data, { ...legacy, now: Date.parse('2027-03-01T00:00:00Z') }).some(o => o.bank)).toBe(false);
  });

  it('regroupe par session de jeu (un jeu, une méthode), la plus intéressante d\'abord', () => {
    const plan = tonightPlan(data, { shinies: {}, prefs: prefsFor([]), hours: 1, platforms: ['switch', '3ds'], now: NOW });
    const sessions = tonightSessions(plan);
    expect(sessions.length).toBeGreaterThan(3);
    expect(new Set(sessions.map(s => s.id)).size).toBe(sessions.length);
    expect(sessions[0].best).toBe(plan[0]);
    expect(sessions.map(s => s.best.score)).toEqual([...sessions.map(s => s.best.score)].sort((a, b) => b - a));
    for (const s of sessions.slice(0, 5)) {
      expect(s.items.every(o => o.option.game === s.best.option.game && o.option.cfg.method === s.best.option.cfg.method)).toBe(true);
    }
    expect(sessions.reduce((n, s) => n + s.items.length, 0)).toBe(plan.length);
  });
});
