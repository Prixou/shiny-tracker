// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { loadState, clearAll } from '../../src/state/persistence.js';
import { normalizeCatch } from '../../src/domain/catch.js';
import { normalizeHunt } from '../../src/domain/hunt.js';
import { DEFAULT_SETTINGS } from '../../src/domain/settings.js';

beforeEach(() => localStorage.clear());

describe('migration des anciennes sauvegardes', () => {
  it('v1 (app.jsx d\'origine) : objet par Pokémon, dates fr-FR, anciennes méthodes', () => {
    localStorage.setItem('shiny_tracker_data_v2', JSON.stringify({
      25: { caught: true, date: '12/05/2024', method: 'outbreak_sandwich', ball: 'ultra' },
      4: { caught: false },
      133: { caught: true, timestamp: Date.parse('2024-01-02T12:00:00'), method: 'pokeradar' }
    }));
    const s = loadState();
    expect(s.catches).toHaveLength(2);
    const pika = s.catches.find(c => c.key === '25');
    expect(pika.date).toBe('2024-05-12');
    expect(pika.method).toBe('sv_wild');
    expect(pika.opts).toEqual({ outbreak: true, sparkling: 3 });
    expect(s.catches.find(c => c.key === '133').method).toBe('radar');
    // Le nouveau format est écrit tout de suite, l'ancien est gardé en secours.
    expect(JSON.parse(localStorage.getItem('shp:catches'))).toHaveLength(2);
    expect(localStorage.getItem('shiny_tracker_data_v2')).not.toBe(null);
  });

  it('réglages : valeurs par défaut complétées', () => {
    localStorage.setItem('shp:settings', JSON.stringify({ haptics: false }));
    const s = loadState();
    expect(s.settings.haptics).toBe(false);
    expect(s.settings.myGames).toEqual(DEFAULT_SETTINGS.myGames);
    expect(s.settings.charmGames).toEqual({});
  });

  it('captures : champs facultatifs conservés (dont « transféré dans HOME »)', () => {
    const c = normalizeCatch({ key: '506', game: 'bw', method: 'wild', inHome: true, nature: 'Timide', alpha: true });
    expect(c.inHome).toBe(true);
    expect(c.nature).toBe('Timide');
    expect(c.odds).toBe(8192);
    expect(normalizeCatch({ key: '1', game: 'Écarlate / Violet' }).game).toBe('sv');
  });

  it('chasses : taux saisi à la main conservé s\'il diffère du calcul', () => {
    const h = normalizeHunt({ targetId: '25', game: 'sv', method: 'wild', odds: 100 });
    expect(h.customOdds).toBe(100);
    expect(normalizeHunt({ targetId: '25', game: 'sv', method: 'sv_wild', odds: 4096, opts: {} }).customOdds).toBe(null);
    expect(normalizeHunt({})).toBe(null);
  });
});

describe('effacement', () => {
  it('efface les données et la conversation de l\'assistant, pas la clé API', () => {
    localStorage.setItem('shp:catches', '[]');
    localStorage.setItem('shp:ai-chat', '{}');
    localStorage.setItem('shp:ai', '{"keys":{"gemini":"AIza"}}');
    clearAll();
    expect(localStorage.getItem('shp:catches')).toBe(null);
    expect(localStorage.getItem('shp:ai-chat')).toBe(null);
    expect(localStorage.getItem('shp:ai')).not.toBe(null);
  });
});
