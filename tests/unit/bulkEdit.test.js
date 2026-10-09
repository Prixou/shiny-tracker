import { describe, it, expect } from 'vitest';
import { needsReview, editCatch, commonValue, isEmptyPatch } from '../../src/domain/bulkEdit.js';
import { createCatch, normalizeCatch, UNKNOWN_DATE } from '../../src/domain/catch.js';
import { journalEntries, journalList, journalGroups, journalCounts } from '../../src/domain/journal.js';
import { createAppStore } from '../../src/state/store.js';
import { DEFAULT_SETTINGS } from '../../src/domain/settings.js';
import { oddsAt } from '../../src/data/methods.js';
import { GAME_BY_ID } from '../../src/data/games.js';

const quick = (key, extra = {}) => createCatch(key, extra, DEFAULT_SETTINGS);

describe('shiny à vérifier', () => {
  it('un shiny coché d\'un geste est à vérifier, pas un shiny de chasse ni un shiny détaillé', () => {
    expect(needsReview(quick('25'))).toBe(true);
    expect(needsReview(quick('25', { huntId: 'h1', count: 3000 }))).toBe(false);
    expect(needsReview(quick('25', { count: 120 }))).toBe(false);
    expect(needsReview(quick('25', { ball: 'ultraball' }))).toBe(false);
    expect(needsReview(quick('25', { nickname: 'Pika' }))).toBe(false);
    expect(needsReview(quick('25', { nature: 'Timide' }))).toBe(false);
    expect(needsReview(quick('25', { verified: true }))).toBe(false);
  });

  it('la confirmation est conservée par la sauvegarde', () => {
    expect(normalizeCatch({ ...quick('25'), verified: true }).verified).toBe(true);
    expect(needsReview(normalizeCatch({ ...quick('25'), verified: true }))).toBe(false);
  });
});

describe('édition en lot', () => {
  it('nouveau jeu : méthode du jeu si l\'ancienne n\'y existe pas, taux recalculé avec le Charme du jeu', () => {
    const c = quick('25', { game: 'sv', method: 'sv_wild' });
    const settings = { ...DEFAULT_SETTINGS, charmGames: { xy: true } };
    const out = editCatch(c, { game: 'xy' }, settings);
    expect(out.game).toBe('xy');
    expect(out.method).toBe(GAME_BY_ID.xy.methods[0]); // première méthode de X / Y
    expect(out.odds).toBe(Math.round(oddsAt({ game: 'xy', method: out.method, charm: true, opts: {} })));
    expect(out.verified).toBe(true);
    expect(needsReview(out)).toBe(false);

    const wild = editCatch(c, { game: 'xy', method: 'wild' }, settings);
    expect(wild.method).toBe('wild');
    expect(wild.odds).toBeLessThan(4096); // Charme Chroma de X / Y
    expect(editCatch(c, { game: 'xy', method: 'wild' }, DEFAULT_SETTINGS).odds).toBe(4096);
  });

  it('garde la méthode si le nouveau jeu la propose, et toute méthode pour un jeu inconnu', () => {
    const masuda = quick('25', { game: 'sv', method: 'masuda' });
    expect(editCatch(masuda, { game: 'xy' }, DEFAULT_SETTINGS).method).toBe('masuda');
    const unknown = editCatch(masuda, { game: '' }, DEFAULT_SETTINGS);
    expect(unknown).toMatchObject({ game: '', method: 'masuda' });
  });

  it('Ball, date et HOME ; jeu et méthode inchangés : le taux de la chasse est gardé', () => {
    const hunt = quick('25', { game: 'xy', method: 'radar', count: 40, odds: 99, huntId: 'h1' });
    const out = editCatch(hunt, { ball: 'luxeball', date: '2016-03-02', inHome: true }, DEFAULT_SETTINGS);
    expect(out).toMatchObject({ ball: 'luxeball', date: '2016-03-02', timestamp: Date.parse('2016-03-02T12:00:00'), inHome: true, odds: 99 });
    expect(editCatch(out, { inHome: false, date: '' }, DEFAULT_SETTINGS)).toMatchObject({ date: '', timestamp: 0 });
    expect('inHome' in editCatch(out, { inHome: false }, DEFAULT_SETTINGS)).toBe(false);
  });

  it('valeur commune et changement vide', () => {
    expect(commonValue([quick('1', { game: 'xy' }), quick('2', { game: 'xy' })], 'game')).toBe('xy');
    expect(commonValue([quick('1', { game: 'xy' }), quick('2', { game: 'sv' })], 'game')).toBeUndefined();
    expect(commonValue([], 'game')).toBeUndefined();
    expect(isEmptyPatch({})).toBe(true);
    expect(isEmptyPatch({ game: undefined, ball: undefined })).toBe(true);
    expect(isEmptyPatch({ game: '' })).toBe(false);
  });

  it('le store modifie tout le lot en une seule annulation', () => {
    const many = Array.from({ length: 5 }, (_, i) => quick(String(i + 1)));
    const other = quick('99');
    const store = createAppStore({ catches: [...many, other] });
    const { actions } = store.getState();
    actions.editCatches(many.map(c => c.id), { game: 'oras', ball: 'diveball' });
    const after = store.getState().catches;
    expect(after.filter(c => c.game === 'oras' && c.ball === 'diveball' && c.verified)).toHaveLength(5);
    expect(after.find(c => c.id === other.id)).toEqual(other);
    expect(store.getState().undoStack.at(-1).label).toBe('5 shiny modifiés');
    actions.undo();
    expect(store.getState().catches.every(c => c.game === 'sv' && !c.verified)).toBe(true);

    actions.editCatches([other.id], {});
    expect(store.getState().undoStack.at(-1).label).toBe('1 shiny vérifiés');
    expect(needsReview(store.getState().catches.find(c => c.id === other.id))).toBe(false);
  });
});

describe('journal : filtres, tris et groupes', () => {
  const at = (key, date, extra = {}) => quick(key, { date, timestamp: date ? Date.parse(`${date}T12:00:00`) : 0, ...extra });
  const catches = [
    at('25', '2026-10-07'),
    at('1', '2026-09-01', { huntId: 'h1', count: 500 }),
    at('722', '', { verified: true }),
    at('152', '')
  ];
  const entries = journalEntries(catches);

  it('compte et filtre les shiny à vérifier et sans date', () => {
    expect(journalCounts(catches)).toEqual({ all: 4, review: 2, undated: 2 });
    expect(journalList(entries, { filter: 'review' }).map(e => e.key).sort()).toEqual(['152', '25']);
    expect(journalList(entries, { filter: 'undated' }).map(e => e.key).sort()).toEqual(['152', '722']);
    expect(journalList(entries, { query: 'bulbi' }).map(e => e.key)).toEqual(['1']);
  });

  it('tri par numéro groupé par région, tri par date groupé par mois (date inconnue à la fin)', () => {
    const dex = journalList(entries, { sort: 'dex' });
    expect(dex.map(e => e.key)).toEqual(['1', '25', '152', '722']);
    expect(journalGroups(dex, 'dex').map(g => [g.label, g.items.length])).toEqual([['Kanto', 2], ['Johto', 1], ['Alola', 1]]);
    const recent = journalList(entries, { sort: 'recent' });
    expect(journalGroups(recent, 'recent').map(g => g.label)).toEqual(['Octobre 2026', 'Septembre 2026', 'Date inconnue']);
    const oldest = journalList(entries, { sort: 'oldest' });
    expect(oldest.slice(-2).every(e => !e.rec.date)).toBe(true);
    expect(journalGroups(journalList(entries, { sort: 'most' }), 'most')).toHaveLength(1);
  });

  it('jeu inconnu possible pour tout un lot', () => {
    const out = editCatch(at('25', '2026-10-07'), { game: '', date: UNKNOWN_DATE.date }, DEFAULT_SETTINGS);
    expect(out).toMatchObject({ game: '', date: '', timestamp: 0 });
  });
});
