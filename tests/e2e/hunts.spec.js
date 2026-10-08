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
