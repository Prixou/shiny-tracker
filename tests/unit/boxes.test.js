import { describe, it, expect } from 'vitest';
import { BOX_SIZE, boxOrder, boxesOf, placeOf, boxedKeys, slotStatus, boxSummary, keysToStore } from '../../src/domain/boxes.js';
import { MAIN_DEX, POKEDEX, getPokemon } from '../../src/data/pokedex.js';
import { createCatch, latestByKey } from '../../src/domain/catch.js';
import { needsReview } from '../../src/domain/bulkEdit.js';
import { createAppStore } from '../../src/state/store.js';
import { DEFAULT_SETTINGS } from '../../src/domain/settings.js';

const at = (key, ts, extra = {}) => createCatch(key, { timestamp: ts, ...extra }, DEFAULT_SETTINGS);

describe('boîtes HOME du living dex', () => {
  it('30 places par boîte, dans l\'ordre du Pokédex, à partir de la boîte choisie', () => {
    const boxes = boxesOf(MAIN_DEX);
    expect(boxes).toHaveLength(Math.ceil(MAIN_DEX.length / BOX_SIZE));
    expect(boxes[0].number).toBe(1);
    expect(boxes[0].slots).toHaveLength(30);
    expect(boxes.at(-1).slots).toHaveLength(MAIN_DEX.length - (boxes.length - 1) * 30);
    expect(boxesOf(MAIN_DEX, 3)[0].number).toBe(3);
    expect(placeOf('1', MAIN_DEX)).toEqual({ box: 1, slot: 1, row: 1, col: 1 });
    expect(placeOf('1', MAIN_DEX, 5).box).toBe(5);
  });

  it('formes régionales juste après l\'espèce, ou toutes à la fin', () => {
    const after = boxOrder(MAIN_DEX, 'after');
    const rattata = placeOf('19', after);
    expect(placeOf('19-alola', after)).toMatchObject({ box: rattata.box, slot: rattata.slot + 1 });
    const end = boxOrder(MAIN_DEX, 'end');
    expect(boxOrder(MAIN_DEX, 'end')).toBe(end); // même tableau : places en cache
    expect(placeOf('25', end)).toEqual({ box: 1, slot: 25, row: 5, col: 1 }); // Pikachu, sans forme avant lui
    const species = MAIN_DEX.filter(p => !p.isForm).length;
    expect(placeOf('19-alola', end).box).toBe(1 + Math.floor(species / 30));
    const variant = POKEDEX.find(p => p.isVariant);
    expect(placeOf(variant.key, after)).toBeNull();
  });

  it('état des places : rangé, à ranger, manquant, Shiny Lock', () => {
    const catches = [at('1', 1, { boxed: true }), at('4', 2)];
    const shinies = latestByKey(catches);
    const boxed = boxedKeys(catches);
    expect(slotStatus(getPokemon('1'), shinies, boxed)).toBe('stored');
    expect(slotStatus(getPokemon('4'), shinies, boxed)).toBe('toStore');
    expect(slotStatus(getPokemon('7'), shinies, boxed)).toBe('missing');
    const locked = MAIN_DEX.find(p => p.isShinyLocked);
    expect(slotStatus(locked, shinies, boxed)).toBe('locked');
    const first = boxesOf(MAIN_DEX)[0].slots;
    expect(boxSummary(first, shinies, boxed)).toMatchObject({ stored: 1, toStore: 1 });
    expect(keysToStore(first, shinies, boxed)).toEqual(['4']);
  });

  it('ranger ne confirme pas les détails d\'un shiny « à vérifier »', () => {
    expect(needsReview(at('25', 1, { boxed: true }))).toBe(true);
  });

  it('le store range le dernier exemplaire, retire tous les exemplaires, en une annulation', () => {
    const old = at('1', 1);
    const recent = at('1', 2);
    const store = createAppStore({ catches: [old, recent, at('4', 3)] });
    const { actions } = store.getState();
    actions.setBoxed(['1', '4', '7'], true); // 7 : pas de shiny, ignoré
    const boxed = () => store.getState().catches.filter(c => c.boxed).map(c => c.id).sort();
    expect(boxed()).toEqual([recent.id, store.getState().catches.find(c => c.key === '4').id].sort());
    expect(store.getState().undoStack.at(-1).label).toBe('2 shiny rangés');
    actions.undo();
    expect(boxed()).toEqual([]);
    actions.setBoxed(['1'], true);
    actions.setBoxed(['1'], false);
    expect(boxed()).toEqual([]);
    expect(store.getState().undoStack.at(-1).label).toBe('1 shiny retiré des boîtes');
  });
});
