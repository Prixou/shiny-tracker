import { test, expect } from './fixtures.js';

// Les boutons d'écouteurs passent par la Media Session : on garde les commandes enregistrées par l'app
// pour simuler un appui (1 appui = « pause » / « lecture », 3 appuis = « précédent »).
const captureMediaHandlers = () => {
  window.__media = {};
  const session = navigator.mediaSession;
  const original = session.setActionHandler.bind(session);
  session.setActionHandler = (action, fn) => {
    window.__media[action] = fn;
    try { original(action, fn); } catch { /* action inconnue */ }
  };
};

const huntSeed = () => {
  const now = Date.now();
  return {
    hunts: [{ id: 'h1', targetId: '133', game: 'sv', method: 'sv_wild', opts: {}, charm: false, count: 40, step: 1, phases: [], elapsedMs: 0, startedAt: null, status: 'active', createdAt: now, updatedAt: now }],
    ui: { activeHuntId: 'h1', tab: 'hunts' },
    settings: { autoPause: true }
  };
};

test('Écouteurs : un appui compte, même hors de l\'écran de chasse et en arrière-plan', async ({ page, seed }) => {
  await page.addInitScript(captureMediaHandlers);
  await seed(huntSeed());
  await page.goto('/?tab=hunts');
  await page.getByRole('button', { name: 'Compter avec les écouteurs' }).click();
  await expect(page.getByText('Écouteurs actifs')).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title)).toMatch(/^Évoli · 40$/);
  expect(await page.evaluate(() => navigator.mediaSession.playbackState)).toBe('playing');

  const press = action => page.evaluate(a => window.__media[a]?.(), action);
  await press('pause'); // 1 appui
  await press('play');
  await press('nexttrack');
  await expect(page.getByRole('button', { name: /^Ajouter 1 / })).toContainText('43');
  await press('previoustrack'); // 3 appuis
  await expect(page.getByRole('button', { name: /^Ajouter 1 / })).toContainText('42');
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title)).toBe('Évoli · 42');
  // Le premier appui a lancé le chrono.
  await expect(page.getByRole('button', { name: 'Mettre le chrono en pause' })).toBeVisible();

  // Écran verrouillé : pas de pause automatique pendant le compteur aux écouteurs.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });
  await expect(page.getByRole('button', { name: 'Mettre le chrono en pause' })).toBeVisible();

  // Sur un autre onglet, les écouteurs comptent toujours.
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name: 'Pokédex' }).click();
  await press('pause');
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title)).toBe('Évoli · 43');
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name: 'Chasses' }).click();
  await expect(page.getByRole('button', { name: /^Ajouter 1 / })).toContainText('43');

  await page.getByRole('button', { name: 'Arrêter', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Compter avec les écouteurs' })).toBeVisible();
  expect(await page.evaluate(() => [navigator.mediaSession.playbackState, navigator.mediaSession.metadata])).toEqual(['none', null]);
});

test('Écouteurs : arrêt automatique quand le shiny est trouvé', async ({ page, seed }) => {
  await page.addInitScript(captureMediaHandlers);
  await seed(huntSeed());
  await page.goto('/?tab=hunts');
  await page.getByRole('button', { name: 'Compter avec les écouteurs' }).click();
  await expect(page.getByText('Écouteurs actifs')).toBeVisible();
  await page.getByRole('button', { name: /Shiny trouvé/ }).click();
  await page.getByRole('button', { name: 'Enregistrer la capture' }).click();
  await expect(page.getByText('Félicitations !')).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.playbackState)).toBe('none');
});
