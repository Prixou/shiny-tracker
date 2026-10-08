import { describe, it, expect } from 'vitest';
import { buildExport, parseImport, mergeData, encodeCompact } from '../../src/domain/backup.js';

const catches = [
  { id: 'c1', key: '25', date: '2026-10-01', method: 'sv_wild', ball: 'pokeball', game: 'sv', count: 120, odds: 512, elapsedMs: 3600000, nickname: 'Pika', updatedAt: 10 },
  { id: 'c2', key: '506', date: '2026-09-01', method: 'wild', ball: 'poke', game: 'bw', count: 0, odds: 8192, elapsedMs: 0, updatedAt: 10, inHome: true }
];
const hunts = [{ id: 'h1', targetId: '133', game: 'xy', method: 'radar', opts: {}, charm: true, count: 12, step: 1, phases: [], elapsedMs: 60000, startedAt: 123, status: 'active', updatedAt: 10 }];
const data = { catches, hunts, wishlist: { 448: true }, lists: [{ id: 'l1', name: 'Avant la Banque', emoji: '⏳', keys: { 506: true } }], settings: { charm: true } };

describe('sauvegarde et restauration', () => {
  it('l\'export complet se relit à l\'identique (sans chrono en cours)', () => {
    const back = parseImport(JSON.stringify(buildExport(data)));
    expect(back.catches.map(c => c.id)).toEqual(['c1', 'c2']);
    expect(back.catches[1].inHome).toBe(true);
    expect(back.hunts[0].startedAt).toBe(null);
    expect(back.wishlist).toEqual({ 448: true });
    expect(back.lists[0].name).toBe('Avant la Banque');
  });

  it('le format compact (QR code, lien) garde l\'essentiel', () => {
    const code = encodeCompact(data);
    for (const input of [code, `https://exemple.fr/#import=${code}`]) {
      const back = parseImport(input);
      expect(back.catches.map(c => [c.key, c.date, c.count, c.odds])).toEqual([['25', '2026-10-01', 120, 512], ['506', '2026-09-01', 0, 8192]]);
      expect(back.catches[0].nickname).toBe('Pika');
      expect(back.hunts[0].targetId).toBe('133');
      expect(back.lists[0].keys).toEqual({ 506: true });
    }
  });

  it('refuse un contenu vide ou illisible', () => {
    expect(() => parseImport('{}')).toThrow();
    expect(() => parseImport('n\'importe quoi')).toThrow();
  });
});

describe('fusion de deux appareils', () => {
  it('la version modifiée le plus récemment gagne, sans doublon', () => {
    const current = { catches, hunts, wishlist: { 448: true }, lists: [] };
    const incoming = {
      catches: [{ ...catches[0], nickname: 'Nouveau', updatedAt: 20 }, { ...catches[1], updatedAt: 5, inHome: false }, { id: 'c3', key: '1', date: '2026-10-02', ball: 'poke', count: 5, updatedAt: 1 }],
      hunts: [{ ...hunts[0], count: 30, startedAt: null, updatedAt: 20 }],
      wishlist: { 1: true },
      lists: []
    };
    const merged = mergeData(current, incoming);
    expect(merged.catches).toHaveLength(3);
    expect(merged.catches.find(c => c.id === 'c1').nickname).toBe('Nouveau');
    expect(merged.catches.find(c => c.id === 'c2').inHome).toBe(true);
    // Le chrono qui tourne sur cet appareil n'est pas arrêté par une version distante plus récente.
    expect(merged.hunts[0]).toMatchObject({ count: 30, startedAt: 123 });
    expect(merged.wishlist).toEqual({ 448: true, 1: true });
  });

  it('les anciennes captures sans identifiant ne sont pas dupliquées', () => {
    const current = { catches: [{ ...catches[0] }], hunts: [], wishlist: {}, lists: [] };
    const incoming = { catches: [{ ...catches[0], id: 'autre-id' }], hunts: [], wishlist: {}, lists: [] };
    expect(mergeData(current, incoming).catches).toHaveLength(1);
  });
});
