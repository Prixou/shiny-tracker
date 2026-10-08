import { describe, it, expect, vi } from 'vitest';
import { createAppStore, selectShinies, selectCatchesByKey, selectCaughtCount, selectSnapshot } from '../../src/state/store.js';
import { DEFAULT_SETTINGS } from '../../src/domain/settings.js';
import { huntTotal } from '../../src/domain/hunt.js';

// Horloge contrôlée : chaque appel avance d'une seconde (horodatages distincts et prévisibles).
const clock = (start = Date.parse('2026-10-08T10:00:00Z')) => {
  let t = start;
  const now = () => (t += 1000);
  now.set = v => { t = v; };
  now.peek = () => t;
  return now;
};
const setup = (initial = {}, opts = {}) => {
  const now = clock();
  const store = createAppStore({ settings: { ...DEFAULT_SETTINGS, defaultGame: 'sv' }, ...initial }, { now, ...opts });
  return { store, a: store.getState().actions, get: store.getState, now };
};

describe('store : captures, objectifs et annulation', () => {
  it('ajoute une capture, retire l\'objectif et peut tout annuler en une fois', () => {
    const { a, get } = setup({ wishlist: { 25: true } });
    a.addCatch('25', {}, 'Pikachu capturé');
    expect(get().catches).toHaveLength(1);
    expect(get().catches[0]).toMatchObject({ key: '25', game: 'sv', method: 'sv_wild' });
    expect(get().wishlist['25']).toBeUndefined();
    expect(get().undoStack.at(-1).label).toBe('Pikachu capturé');

    const entry = a.undo();
    expect(entry.label).toBe('Pikachu capturé');
    expect(get().catches).toHaveLength(0);
    expect(get().wishlist['25']).toBe(true);
    expect(get().undoStack).toHaveLength(0);
    expect(a.undo()).toBe(null);
  });

  it('n\'annule que les éléments touchés (les autres modifications sont conservées)', () => {
    const { a, get } = setup();
    a.addCatch('1');
    a.addCatch('4');
    a.updateCatch(get().catches.find(c => c.key === '1').id, { nickname: 'Bulbi' }); // sans annulation
    a.undo(); // annule l'ajout de Salamèche seulement
    expect(get().catches.map(c => c.key)).toEqual(['1']);
    expect(get().catches[0].nickname).toBe('Bulbi');
  });

  it('limite la pile d\'annulation à 25 entrées', () => {
    const { a, get } = setup();
    for (let i = 1; i <= 30; i++) a.toggleWish(String(i));
    expect(get().undoStack).toHaveLength(25);
  });

  it('horodate les données (synchro) mais pas les réglages ni l\'interface', () => {
    const { a, get } = setup({ stamp: 5 });
    a.setSettings({ haptics: false });
    a.setUiValue('tab', 'stats');
    expect(get().stamp).toBe(5);
    a.toggleWish('25');
    expect(get().stamp).toBeGreaterThan(5);
  });

  it('marque et démarque des captures transférées dans HOME', () => {
    const { a, get } = setup();
    a.addCatch('25', { game: 'xy' });
    const id = get().catches[0].id;
    a.markInHome([id], true);
    expect(get().catches[0].inHome).toBe(true);
    a.markInHome([id], false);
    expect('inHome' in get().catches[0]).toBe(false);
  });

  it('listes : création, ajout avec libellé, bascule, suppression annulable', () => {
    const { a, get } = setup();
    const id = a.createList({ name: '  Avant la Banque  ', emoji: '⏳' });
    expect(get().lists[0]).toMatchObject({ id, name: 'Avant la Banque', emoji: '⏳', keys: {} });
    a.setInList(id, ['25', '133'], true, '2 Pokémon ajoutés');
    expect(get().lists[0].keys).toEqual({ 25: true, 133: true });
    expect(get().undoStack.at(-1).label).toBe('2 Pokémon ajoutés');
    a.toggleInList(id, '25');
    expect(get().lists[0].keys).toEqual({ 133: true });
    a.deleteList(id);
    expect(get().lists).toHaveLength(0);
    a.undo();
    expect(get().lists[0].keys).toEqual({ 133: true });
  });
});

describe('store : chasses', () => {
  it('crée une chasse active et la sélectionne', () => {
    const { a, get } = setup();
    const id = a.createHunt({ targetId: 133, game: 'sv', method: 'sv_wild' });
    expect(get().hunts[0]).toMatchObject({ id, targetId: '133', status: 'active', count: 0, step: 1 });
    expect(get().ui.activeHuntId).toBe(id);
  });

  it('compteur : +1 démarre le chrono, pause cumule le temps, -1 ne passe pas sous 0', () => {
    const { a, get, now } = setup();
    const id = a.createHunt({ targetId: '133' });
    a.increment(id, 1);
    const h = () => get().hunts[0];
    expect(h().count).toBe(1);
    expect(h().startedAt).not.toBe(null);
    now.set(now.peek() + 60_000);
    a.toggleTimer(id);
    expect(h().startedAt).toBe(null);
    expect(h().elapsedMs).toBeGreaterThanOrEqual(60_000);
    a.increment(id, -5);
    expect(h().count).toBe(0);
  });

  it('phases : le compteur repart à 0, le total est conservé', () => {
    const { a, get } = setup();
    const id = a.createHunt({ targetId: '133', count: 40 });
    a.addPhase(id, { key: '25' }, 'Phase 1 enregistrée à 40');
    a.increment(id, 10);
    expect(get().hunts[0].count).toBe(10);
    expect(huntTotal(get().hunts[0])).toBe(50);
    expect(get().undoStack.at(-1).label).toBe('Phase 1 enregistrée à 40');
    a.removePhase(id, 0);
    expect(huntTotal(get().hunts[0])).toBe(10);
  });

  it('shiny trouvé : capture enregistrée, chasse terminée, objectif retiré ; annulable en une fois', () => {
    const { a, get } = setup({ wishlist: { 133: true } });
    const id = a.createHunt({ targetId: '133', game: 'sv', method: 'masuda', charm: true, count: 300 });
    a.toggleTimer(id);
    const c = a.finishHunt(id, { ball: 'loveball', date: '2026-10-01', timestamp: Date.parse('2026-10-01T12:00:00') });
    expect(c).toMatchObject({ key: '133', ball: 'loveball', count: 300, odds: 512, huntId: id, date: '2026-10-01' });
    expect(c.timestamp).toBe(Date.parse('2026-10-01T12:00:00')); // date choisie conservée
    expect(c.luck).toBeGreaterThan(0);
    expect(get().hunts[0]).toMatchObject({ status: 'done', startedAt: null });
    expect(get().wishlist['133']).toBeUndefined();

    a.undo();
    expect(get().catches).toHaveLength(0);
    expect(get().hunts[0].status).toBe('active');
    expect(get().wishlist['133']).toBe(true);
  });

  it('pause automatique : au démarrage et à la mise en arrière-plan', () => {
    const startedAt = Date.parse('2026-10-08T09:00:00Z');
    const hunt = { id: 'h1', targetId: '133', game: 'sv', method: 'wild', opts: {}, count: 3, step: 1, phases: [], elapsedMs: 1000, startedAt, updatedAt: startedAt + 5000, status: 'active' };
    const { get } = setup({ hunts: [hunt] });
    // Temps compté jusqu'à la dernière modification enregistrée.
    expect(get().hunts[0]).toMatchObject({ startedAt: null, elapsedMs: 6000 });

    const off = setup({ hunts: [hunt], settings: { ...DEFAULT_SETTINGS, autoPause: false } });
    expect(off.get().hunts[0].startedAt).toBe(startedAt);
    off.a.pauseAll();
    expect(off.get().hunts[0].startedAt).toBe(null);
  });
});

describe('store : imports, synchro et remise à zéro', () => {
  it('import : fusion par défaut, remplacement avec réglages ; annulable', () => {
    const { a, get } = setup();
    a.addCatch('1');
    const incoming = { catches: [{ id: 'x', key: '4', date: '2026-01-01', ball: 'pokeball', count: 0, updatedAt: 1 }], hunts: [], wishlist: { 7: true }, lists: [], settings: { haptics: false } };
    a.importData(incoming);
    expect(get().catches.map(c => c.key).sort()).toEqual(['1', '4']);
    expect(get().wishlist['7']).toBe(true);
    a.undo();
    expect(get().catches.map(c => c.key)).toEqual(['1']);

    a.importData(incoming, 'replace');
    expect(get().catches.map(c => c.key)).toEqual(['4']);
    expect(get().settings.haptics).toBe(false);
  });

  it('synchro : remplace les données sans annulation, garde un chrono en cours, renvoie l\'horodatage', () => {
    const { a, get } = setup();
    const id = a.createHunt({ targetId: '133' });
    a.toggleTimer(id);
    const running = get().hunts[0].startedAt;
    const undoBefore = get().undoStack.length;
    const stamp = a.replaceData({ catches: [], hunts: [{ ...get().hunts[0], startedAt: null, count: 99 }], wishlist: {}, lists: [] });
    expect(stamp).toBe(get().stamp);
    expect(get().hunts[0]).toMatchObject({ count: 99, startedAt: running });
    expect(get().undoStack).toHaveLength(undoBefore);
  });

  it('tout effacer : vide les données, appelle onReset, annulable', () => {
    const onReset = vi.fn();
    const { a, get } = setup({}, { onReset });
    a.addCatch('25');
    a.setSettings({ defaultGame: 'za' });
    a.resetAll();
    expect(onReset).toHaveBeenCalledOnce();
    expect(get().catches).toEqual([]);
    expect(get().settings.defaultGame).toBe(DEFAULT_SETTINGS.defaultGame);
    a.undo();
    expect(get().catches.map(c => c.key)).toEqual(['25']);
  });
});

describe('store : sélecteurs', () => {
  it('dernière capture et exemplaires par espèce, mémorisés tant que les captures ne changent pas', () => {
    const { a, get } = setup();
    a.addCatch('25', { timestamp: 1 });
    a.addCatch('25', { timestamp: 2, nickname: 'Récent' });
    a.addCatch('133');
    const shinies = selectShinies(get());
    expect(shinies['25'].nickname).toBe('Récent');
    expect(selectCatchesByKey(get())['25']).toHaveLength(2);
    expect(selectCaughtCount(get())).toBe(2);
    a.setUiValue('tab', 'dex');
    expect(selectShinies(get())).toBe(shinies); // même référence : pas de nouveau rendu
    expect(selectSnapshot(get())).toMatchObject({ shinies, catches: get().catches });
  });
});
