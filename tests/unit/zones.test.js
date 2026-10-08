import { describe, it, expect, beforeAll } from 'vitest';
import { loadEncounters } from '../../src/services/encounters.js';
import { gamesWithZones, zonesOf, zoneProgress, missingInGame, isMissingIn, canHuntIn } from '../../src/domain/zones.js';
import { replaceableProvisionals, hasOwnCopy } from '../../src/domain/provisional.js';
import { createCatch, latestByKey } from '../../src/domain/catch.js';
import { bestOptionsPrefs, DEFAULT_SETTINGS } from '../../src/domain/settings.js';
import { formKeysIn } from '../../src/data/forms.js';

let data;
beforeAll(async () => { data = await loadEncounters(); });
const zone = (game, name) => zonesOf(data, game).find(z => z.name === name);
const keys = z => z.encounters.map(e => e.p.key);

describe('explorateur par zones', () => {
  it('connaît les lieux des jeux où l\'on chasse des shiny (pas Rouge / Bleu / Jaune, sans shiny)', () => {
    const games = gamesWithZones(data);
    expect(games.has('rbj')).toBe(false);
    expect(canHuntIn('rbj')).toBe(false);
    for (const g of ['gsc', 'rse', 'frlg', 'dpp', 'hgss', 'bw', 'b2w2', 'xy', 'oras', 'sm', 'usum', 'letsgo', 'swsh', 'bdsp', 'pla', 'sv', 'za']) {
      expect(games.has(g), g).toBe(true);
    }
  });

  it('trie les zones par nom en respectant les numéros', () => {
    const names = zonesOf(data, 'xy').map(z => z.name).filter(n => /^Route \d+$/.test(n));
    const nums = names.map(n => Number(n.slice(6)));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
  });

  it('liste les Pokémon d\'une zone, par numéro, avec mode et niveaux', () => {
    const route1 = zone('frlg', 'Route 1');
    expect(keys(route1)).toEqual(expect.arrayContaining(['16', '19'])); // Roucool, Rattata
    const pidgey = route1.encounters.find(e => e.p.key === '16');
    expect(pidgey.methods.length).toBeGreaterThan(0);
    expect(pidgey.minLevel).toBeLessThanOrEqual(pidgey.maxLevel);
    const ids = route1.encounters.map(e => e.p.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it('affiche la forme régionale dans les jeux qui la remplacent', () => {
    expect(formKeysIn(19, 'sm')).toEqual(['19-alola']);
    expect(formKeysIn(128, 'sv')).toEqual(['128-paldea-combat', '128-paldea-blaze', '128-paldea-aqua']);
    expect(formKeysIn(19, 'xy')).toEqual(['19']);
    const usumKeys = zonesOf(data, 'usum').flatMap(keys);
    expect(usumKeys).toContain('19-alola'); // Rattata d'Alola dans Ultra-Soleil / Ultra-Lune
    expect(usumKeys).not.toContain('19');
    expect(zonesOf(data, 'xy').flatMap(keys)).not.toContain('19-alola');
  });

  it('compte les shiny manquants (hors Shiny Lock) par zone et pour le jeu', () => {
    const route1 = zone('frlg', 'Route 1');
    const shinies = latestByKey([createCatch('16', {}, DEFAULT_SETTINGS)]);
    const progress = zoneProgress(route1, shinies, 'frlg');
    expect(progress.caught).toBe(1);
    expect(progress.missing).toBe(progress.total - 1);
    expect(isMissingIn(route1.encounters.find(e => e.p.key === '16'), shinies, 'frlg')).toBe(false);
    const zones = zonesOf(data, 'frlg');
    expect(missingInGame(zones, shinies, 'frlg')).toBe(missingInGame(zones, {}, 'frlg') - 1);
  });

  it('calcule chaque jeu une seule fois', () => {
    expect(zonesOf(data, 'sv')).toBe(zonesOf(data, 'sv'));
    expect(zonesOf({}, 'sv')).toEqual([]);
  });
});

describe('exemplaires provisoires', () => {
  const prefs = bestOptionsPrefs(DEFAULT_SETTINGS);
  const provisional = key => createCatch(key, { provisional: true, method: 'event', game: 'other' }, DEFAULT_SETTINGS);

  it('signale un provisoire qu\'on peut maintenant chasser, avec sa meilleure option', () => {
    const list = replaceableProvisionals([provisional('150')], data, prefs);
    expect(list).toHaveLength(1);
    expect(list[0].p.key).toBe('150');
    expect(list[0].option.odds).toBeGreaterThan(0);
  });

  it('ne signale rien si on a déjà son propre exemplaire, ou si le Pokémon reste Shiny Lock', () => {
    const own = createCatch('150', {}, DEFAULT_SETTINGS);
    expect(hasOwnCopy([provisional('150'), own], '150')).toBe(true);
    expect(replaceableProvisionals([provisional('150'), own], data, prefs)).toEqual([]);
    expect(replaceableProvisionals([provisional('1007')], data, prefs)).toEqual([]); // Koraidon, Shiny Lock
  });

  it('une seule entrée par Pokémon, et seulement dans les jeux possédés', () => {
    expect(replaceableProvisionals([provisional('150'), provisional('150')], data, prefs)).toHaveLength(1);
    const onlyGsc = bestOptionsPrefs({ ...DEFAULT_SETTINGS, myGames: ['gsc'] });
    expect(replaceableProvisionals([provisional('150')], data, onlyGsc)).toEqual([]);
  });

  it('le statut provisoire est conservé par la sauvegarde', async () => {
    const { normalizeCatch } = await import('../../src/domain/catch.js');
    expect(normalizeCatch({ ...provisional('150') }).provisional).toBe(true);
  });
});
