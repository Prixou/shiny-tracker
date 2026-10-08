import { describe, it, expect, beforeAll } from 'vitest';
import { BANK_DEADLINE, bankOpen, bankDaysLeft, viaBank, bankPriorities, groupByMethod, MIN_GAIN } from '../../src/lib/bank.js';
import { loadEncounters } from '../../src/lib/encountersData.js';
import { bestOptions } from '../../src/lib/bestOptions.js';
import { GAME_BY_ID } from '../../src/data/games.js';

let data;
beforeAll(async () => { data = await loadEncounters(); });

describe('fermeture de Pokémon Banque', () => {
  it('date officielle : 25 février 2027 à 19 h, heure du Pacifique', () => {
    expect(new Date(BANK_DEADLINE).toISOString()).toBe('2027-02-26T03:00:00.000Z');
    expect(bankOpen(Date.parse('2027-02-26T02:59:00Z'))).toBe(true);
    expect(bankOpen(Date.parse('2027-02-26T03:00:00Z'))).toBe(false);
    expect(bankDaysLeft(Date.parse('2027-02-25T03:00:00Z'))).toBe(1);
    expect(bankDaysLeft(Date.parse('2027-03-01T00:00:00Z'))).toBe(0);
  });

  it('seuls les jeux DS, 3DS et Console virtuelle passent par la Banque', () => {
    for (const g of ['xy', 'oras', 'sm', 'usum', 'bw', 'b2w2', 'dpp', 'hgss', 'gsc', 'rbj']) expect(viaBank(g)).toBe(true);
    for (const g of ['sv', 'za', 'pla', 'swsh', 'bdsp', 'letsgo', 'pogo', 'frlg', 'other', 'inconnu']) expect(viaBank(g)).toBe(false);
  });
});

describe('priorités avant la fermeture', () => {
  it('« seulement DS/3DS » : aucune option dans un jeu Switch', () => {
    const { only } = bankPriorities(data, { shinies: {} });
    expect(only.length).toBeGreaterThan(0);
    for (const e of only) {
      expect(viaBank(e.best.game)).toBe(true);
      expect(bestOptions(e.p, data).main.some(o => GAME_BY_ID[o.game].platform === 'switch' && o.game !== 'champions')).toBe(false);
    }
    const names = only.map(e => e.p.name);
    expect(names).toEqual(expect.arrayContaining(['Serpang', 'Rosabyss', 'Nirondelle']));
  });

  it('« bien plus faciles » : au moins 3 fois mieux que sur Switch', () => {
    const { easier } = bankPriorities(data, { shinies: {} });
    expect(easier.length).toBeGreaterThan(0);
    for (const e of easier) {
      expect(viaBank(e.best.game)).toBe(true);
      if (Number.isFinite(e.gain)) expect(e.switchBest.odds / e.best.odds).toBeGreaterThanOrEqual(MIN_GAIN);
    }
  });

  it('ignorent les shiny déjà capturés', () => {
    const { only } = bankPriorities(data, { shinies: {} });
    const caught = only[0].p.key;
    const after = bankPriorities(data, { shinies: { [caught]: { key: caught } } });
    expect(after.only.some(e => e.p.key === caught)).toBe(false);
  });

  it('tiennent compte des jeux Switch possédés', () => {
    const owns = g => ['xy', 'sv'].includes(g);
    const { easier } = bankPriorities(data, { shinies: {}, prefs: { owns, charmFor: () => true } });
    expect(easier.some(e => e.switchElsewhere)).toBe(true);
    for (const e of easier) expect(owns(e.best.game)).toBe(true);
  });

  it('se regroupent par jeu et méthode', () => {
    const { easier } = bankPriorities(data, { shinies: {} });
    const groups = groupByMethod(easier);
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(easier.length);
    for (const g of groups) for (const e of g.items) expect(`${e.best.game}|${e.best.cfg.method}`).toBe(g.id);
  });
});
