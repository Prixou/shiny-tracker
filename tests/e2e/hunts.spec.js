import { test, expect } from './fixtures.js';

test('Chasse : création, compteur et taux', async ({ page }) => {
  await page.goto('/?tab=hunts');
  await page.getByRole('button', { name: 'Lancer une chasse' }).click();
  const sheet = page.getByRole('dialog', { name: 'Nouvelle chasse' });
  await sheet.getByPlaceholder('Rechercher le Pokémon ciblé…').fill('Évoli');
  await sheet.getByRole('button', { name: /Évoli/ }).first().click();
  await sheet.locator('select').first().selectOption('sv');
  await sheet.getByRole('button', { name: 'Lancer la chasse' }).click();
  const plus = page.getByRole('button', { name: /^Ajouter 1 / });
  for (let i = 0; i < 3; i++) await plus.click();
  await expect(plus).toContainText('3');
  await page.getByRole('button', { name: /^Retirer 1/ }).click();
  await expect(plus).toContainText('2');
  // Le compteur survit à un rechargement.
  await page.reload();
  await expect(page.getByRole('button', { name: /^Ajouter 1 / })).toContainText('2');
});

test('Probas : évènement shiny boosté d\'Écarlate / Violet', async ({ page }) => {
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Probas' }).click();
  await page.locator('select').first().selectOption('sv');
  const rate = page.locator('text=/^1\\/\\d+$/').first();
  await expect(rate).toHaveText('1/4096');
  await page.getByRole('switch', { name: /Évènement shiny boosté/ }).click();
  await expect(rate).toHaveText('1/191');
});

test('Chasse : shiny trouvé, journal sans débordement et annulation', async ({ page, seed }) => {
  const now = Date.now();
  await seed({
    hunts: [{ id: 'h1', targetId: '133', game: 'sv', method: 'sv_wild', opts: { outbreak: true, sparkling: 3 }, charm: true, count: 250, step: 1, phases: [], elapsedMs: 600000, startedAt: null, status: 'active', createdAt: now, updatedAt: now }],
    ui: { activeHuntId: 'h1' }
  });
  await page.goto('/?tab=hunts');
  await page.getByRole('button', { name: /Shiny trouvé/ }).click();
  await page.getByRole('button', { name: 'Enregistrer la capture' }).click();
  await expect(page.getByText('Félicitations !')).toBeVisible();
  await page.getByRole('button', { name: 'Fermer' }).last().click();
  await expect(page.getByRole('button', { name: /Chasses terminées/ })).toBeVisible();

  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name: 'Journal' }).click();
  // Libellé de méthode long : la carte doit rester dans l'écran (le test vérifie aussi l'absence de défilement horizontal).
  const entry = page.getByRole('button', { name: /Évoli/ });
  await expect(entry).toContainText('Sauvage / Apparition massive');
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(entry).toContainText(today);
  expect(await page.evaluate(() => document.documentElement.scrollWidth), 'défilement horizontal du journal').toBeLessThanOrEqual(412);
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeInViewport();

  await page.getByRole('button', { name: 'Annuler : Capture enregistrée' }).click();
  await expect(page.getByText('Journal vide')).toBeVisible();
});
