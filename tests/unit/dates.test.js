import { describe, it, expect } from 'vitest';
import { normalizeCatch, createCatch, bulkAddedDays, quickAddFields, hasKnownDate, UNKNOWN_DATE, BULK_MIN } from '../../src/domain/catch.js';
import { createAppStore } from '../../src/state/store.js';
import { forecast } from '../../src/domain/forecast.js';
import { monthlyCatches } from '../../src/domain/stats.js';
import { DEFAULT_SETTINGS } from '../../src/domain/settings.js';

const day = (key, date, extra = {}) => createCatch(key, { date, timestamp: Date.parse(`${date}T12:00:00`), ...extra }, DEFAULT_SETTINGS);

describe('date inconnue', () => {
  it('est conservée (et non remplacée par la date du jour) au rechargement', () => {
    const c = normalizeCatch({ key: '25', ...UNKNOWN_DATE });
    expect(c).toMatchObject({ date: '', timestamp: 0 });
    expect(hasKnownDate(c)).toBe(false);
    // Ancienne sauvegarde sans date ni horodatage : date inconnue.
    expect(normalizeCatch({ key: '4', caught: true })).toMatchObject({ date: '', timestamp: 0 });
    // Horodatage seul : la date en est déduite.
    expect(normalizeCatch({ key: '7', timestamp: new Date(2024, 0, 2, 12).getTime() }).date).toBe('2024-01-02');
  });

  it('ajout rapide selon le réglage', () => {
    expect(quickAddFields(DEFAULT_SETTINGS)).toEqual({});
    expect(quickAddFields({ ...DEFAULT_SETTINGS, quickAddDate: 'unknown' })).toEqual({ date: '', timestamp: 0 });
    const c = createCatch('25', quickAddFields({ quickAddDate: 'unknown' }), DEFAULT_SETTINGS);
    expect(c).toMatchObject({ date: '', timestamp: 0 });
  });

  it('ignorée par la courbe des 12 mois et par la date de fin estimée', () => {
    const now = Date.parse('2026-10-08T12:00:00');
    const unknown = Array.from({ length: 20 }, (_, i) => createCatch(String(i + 1), { ...UNKNOWN_DATE }, DEFAULT_SETTINGS));
    expect(monthlyCatches(unknown, new Date(now)).every(m => m.value === 0)).toBe(true);
    const f = forecast(unknown, now);
    expect(f.window).toBe(null); // aucune capture récente : pas de rythme inventé
    expect(f.remaining).toBeLessThan(forecast([], now).remaining);
  });
});

describe('historique saisi d\'un coup', () => {
  it('repère les jours avec beaucoup d\'ajouts à la main, sans compter les chasses', () => {
    const many = Array.from({ length: 12 }, (_, i) => day(String(i + 1), '2026-10-07'));
    const hunts = [day('100', '2026-10-07', { huntId: 'h1' }), day('101', '2026-10-07', { huntId: 'h2' })];
    const few = Array.from({ length: BULK_MIN - 1 }, (_, i) => day(String(200 + i), '2026-09-01'));
    const days = bulkAddedDays([...many, ...hunts, ...few, createCatch('300', { ...UNKNOWN_DATE }, DEFAULT_SETTINGS)]);
    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({ date: '2026-10-07', fromHunts: 2 });
    expect(days[0].ids.sort()).toEqual(many.map(c => c.id).sort());
  });

  it('le store passe ces captures en date inconnue en une seule annulation', () => {
    const many = Array.from({ length: 12 }, (_, i) => day(String(i + 1), '2026-10-07'));
    const store = createAppStore({ catches: many });
    const { actions } = store.getState();
    actions.setCatchDates(many.map(c => c.id), '');
    expect(store.getState().catches.every(c => c.date === '' && c.timestamp === 0)).toBe(true);
    expect(store.getState().undoStack.at(-1).label).toBe('Date inconnue pour 12 shiny');
    actions.undo();
    expect(store.getState().catches.every(c => c.date === '2026-10-07')).toBe(true);
    actions.setCatchDates([many[0].id], '2024-05-12');
    expect(store.getState().catches.find(c => c.id === many[0].id)).toMatchObject({ date: '2024-05-12', timestamp: Date.parse('2024-05-12T12:00:00') });
  });
});
