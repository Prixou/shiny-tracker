import { describe, it, expect } from 'vitest';
import { countForDuration, secondsPerUnit } from '../../src/domain/pace.js';
import { DEFAULT_PACE } from '../../src/data/pace.js';
import { createHunt, huntElapsed } from '../../src/domain/hunt.js';
import { createAppStore } from '../../src/state/store.js';
import { DEFAULT_SETTINGS } from '../../src/domain/settings.js';

const NOW = Date.parse('2026-10-08T20:00:00Z');
const MIN = 60000;
const hunt = (method, count, minutes, extra = {}) => ({ ...createHunt({ targetId: '144', game: 'usum', method }, { now: NOW }), count, elapsedMs: minutes * MIN, ...extra });

describe('ajouter des resets d\'après le temps passé', () => {
  it('nombre de resets pour une durée et un temps moyen', () => {
    expect(countForDuration(60 * MIN, 40)).toBe(90); // 1 h à 40 s par reset
    expect(countForDuration(90 * MIN, 37.5)).toBe(144);
    expect(countForDuration(10 * MIN, 45)).toBe(13); // 13,3 → arrondi
    expect(countForDuration(0, 40)).toBe(0);
    expect(countForDuration(60 * MIN, 0)).toBe(0);
  });

  it('temps moyen : celui de la chasse dès 10 minutes de chrono', () => {
    const h = hunt('reset', 30, 20); // 30 resets en 20 min
    expect(secondsPerUnit(h, [h], NOW)).toEqual({ seconds: 40, source: 'hunt' });
    // Chrono en cours compris.
    const running = hunt('reset', 30, 15, { startedAt: NOW - 5 * MIN });
    expect(secondsPerUnit(running, [running], NOW).seconds).toBe(40);
  });

  it('sinon ton rythme sur la méthode (autres chasses), sinon l\'estimation', () => {
    const fresh = hunt('reset', 0, 0);
    const past = [hunt('reset', 120, 60), hunt('reset', 60, 30)]; // 180 resets en 1 h 30 : 30 s
    expect(secondsPerUnit(fresh, [fresh, ...past], NOW)).toEqual({ seconds: 30, source: 'mine' });
    expect(secondsPerUnit(fresh, [fresh], NOW)).toEqual({ seconds: 3600 / DEFAULT_PACE.reset, source: 'estimate' });
    const event = hunt('event', 0, 0); // pas de rythme pour une distribution : estimation générique
    expect(secondsPerUnit(event, [event], NOW).seconds).toBe(3600 / DEFAULT_PACE.other);
  });

  it('le store ajoute le compteur et le temps en une seule annulation', () => {
    let t = NOW;
    const store = createAppStore({ settings: DEFAULT_SETTINGS, hunts: [hunt('reset', 100, 50)] }, { now: () => (t += 1000) });
    const { actions } = store.getState();
    const id = store.getState().hunts[0].id;
    actions.addHuntTime(id, { count: 90, ms: 60 * MIN }, '+90 resets (1 h 00)');
    const h = store.getState().hunts[0];
    expect(h).toMatchObject({ count: 190, elapsedMs: 110 * MIN, startedAt: null });
    expect(store.getState().undoStack.at(-1).label).toBe('+90 resets (1 h 00)');
    // Sans le chrono : seul le compteur change.
    actions.addHuntTime(id, { count: 10 }, '+10 resets');
    expect(store.getState().hunts[0]).toMatchObject({ count: 200, elapsedMs: 110 * MIN });
    actions.undo();
    actions.undo();
    expect(store.getState().hunts[0]).toMatchObject({ count: 100, elapsedMs: 50 * MIN });
    expect(huntElapsed(store.getState().hunts[0], t)).toBe(50 * MIN);
    // Valeurs incohérentes ignorées.
    actions.addHuntTime(id, { count: -5, ms: -MIN }, 'rien');
    expect(store.getState().hunts[0]).toMatchObject({ count: 100, elapsedMs: 50 * MIN });
  });
});
