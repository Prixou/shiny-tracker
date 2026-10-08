import { describe, it, expect } from 'vitest';
import { forecast } from '../../src/domain/forecast.js';
import { EVENTS, eventStatus } from '../../src/data/events.js';
import { formatDuration, fmtOdds, getLuckTier, normalize, catchRatio } from '../../src/lib/utils.js';
import { MAIN_DEX } from '../../src/data/pokedex.js';
import { GAME_BY_ID } from '../../src/data/games.js';

const DAY = 86400000;
const NOW = Date.parse('2026-10-08T12:00:00Z');
const huntable = MAIN_DEX.filter(p => !p.isShinyLocked);

describe('date de fin estimée', () => {
  it('rythme des 3 derniers mois et date cohérente', () => {
    const catches = huntable.slice(0, 9).map((p, i) => ({ key: p.key, timestamp: NOW - (i + 1) * 10 * DAY }));
    const f = forecast(catches, NOW);
    expect(f.window).toBe(90);
    expect(f.recent).toBe(9); // de 10 à 90 jours : toutes dans la fenêtre
    expect(f.remaining).toBe(huntable.length - 9);
    expect(f.eta).toBeCloseTo(NOW + (f.remaining / (9 / 90)) * DAY, -3);
    expect(f.regions.find(r => r.id === 'kanto').eta).toBeGreaterThan(NOW);
  });
  it('fenêtre de 12 mois si peu de captures récentes, rien en dessous de 3', () => {
    const old = huntable.slice(0, 4).map((p, i) => ({ key: p.key, timestamp: NOW - (100 + i) * DAY }));
    expect(forecast(old, NOW).window).toBe(365);
    expect(forecast(old.slice(0, 2), NOW).eta).toBe(null);
  });
  it('un exemplaire en double ne compte qu\'une fois (première capture)', () => {
    const p = huntable[0];
    const f = forecast([{ key: p.key, timestamp: NOW - 400 * DAY }, { key: p.key, timestamp: NOW - DAY }], NOW);
    expect(f.recent).toBe(0);
  });
});

describe('agenda', () => {
  it('statut selon la date', () => {
    const e = { start: '2026-10-02T00:00:00Z', end: '2026-10-08T23:59:00Z' };
    expect(eventStatus(e, Date.parse('2026-10-01T00:00:00Z'))).toBe('soon');
    expect(eventStatus(e, NOW)).toBe('live');
    expect(eventStatus(e, Date.parse('2026-10-09T00:00:00Z'))).toBe('past');
    expect(eventStatus({ start: '2026-01-01T00:00:00Z', end: null }, NOW)).toBe('live');
  });
  it('données valides : dates lisibles, jeux connus, préréglages de chasse cohérents', () => {
    const ids = new Set();
    for (const e of EVENTS) {
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
      expect(Number.isNaN(Date.parse(e.start))).toBe(false);
      if (e.end) expect(Date.parse(e.end)).toBeGreaterThan(Date.parse(e.start));
      expect(GAME_BY_ID[e.game]).toBeTruthy();
      if (e.hunt) expect(e.hunt.cfg.game).toBe(e.game);
    }
    expect(EVENTS.find(e => e.id === 'bank-closing').end).toBe('2027-02-26T03:00:00Z');
  });
});

describe('utilitaires', () => {
  it('durées, taux, recherche sans accents', () => {
    expect(formatDuration(3_725_000)).toBe('1:02:05');
    expect(formatDuration(90_000, { short: true })).toBe('1 min');
    expect(fmtOdds(512.4)).toBe('1/512');
    expect(normalize('Évoli')).toBe(normalize('evoli'));
  });
  it('paliers de chance', () => {
    expect(getLuckTier(0.2).id).toBe('king');
    expect(getLuckTier(1).id).toBe('fair');
    expect(getLuckTier(5).id).toBe('forgotten');
    expect(catchRatio({ count: 1024, odds: 512 })).toBe(2);
    expect(catchRatio({ count: 0, odds: 512 })).toBe(null);
  });
});
