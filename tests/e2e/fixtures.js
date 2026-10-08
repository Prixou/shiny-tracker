import { test as base, expect } from '@playwright/test';

/**
 * - Aucun accès réseau externe (sprites, IA…) : l'app doit rester utilisable hors ligne.
 * - `seed(data)` : prépare le stockage local avant le chargement de la page.
 * - Vérifie à la fin de chaque test qu'il n'y a ni erreur JS ni défilement horizontal.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
    await use(page);
    expect(errors, 'erreurs JavaScript').toEqual([]);
    const width = await page.evaluate(() => document.documentElement.scrollWidth).catch(() => 412);
    expect(width, 'défilement horizontal').toBeLessThanOrEqual(412);
  },
  seed: async ({ page }, use) => {
    await use(async (data = {}) => {
      await page.addInitScript(entries => {
        if (sessionStorage.getItem('seeded')) return;
        for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, JSON.stringify(v));
        sessionStorage.setItem('seeded', '1');
      }, Object.fromEntries(Object.entries(data).map(([k, v]) => [k.startsWith('shp:') ? k : `shp:${k}`, v])));
    });
  }
});

export { expect };

const DAY = 86400000;
/** Date figée pour les tests qui dépendent du calendrier (Banque ouverte jusqu'en février 2027, agenda). */
export const TODAY = new Date('2026-10-08T10:00:00Z');
/** Captures d'exemple (dates relatives à aujourd'hui). */
export const sampleCatches = (list, now = Date.now()) => list.map((c, i) => ({
  id: `c${i}`, ball: 'pokeball', count: 100, method: 'wild', game: 'sv',
  date: new Date(now - (i + 1) * 7 * DAY).toISOString().slice(0, 10), timestamp: now - (i + 1) * 7 * DAY, ...c
}));
