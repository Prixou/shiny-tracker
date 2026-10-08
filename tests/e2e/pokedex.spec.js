import { test, expect } from './fixtures.js';

test('Pokédex : recherche, capture et annulation', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Rechercher un Pokémon').fill('Pikachu');
  await page.getByRole('button', { name: 'Marquer Pikachu capturé' }).click();
  await expect(page.getByRole('button', { name: 'Retirer Pikachu' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Progression' })).toContainText('1');
  await page.getByRole('button', { name: /^Annuler/ }).first().click();
  await expect(page.getByRole('button', { name: 'Marquer Pikachu capturé' })).toBeVisible();
});

test('Pokédex : filtre par région, fermeture par le bouton retour', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Filtres').click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('button', { name: 'Johto' }).click();
  await expect(sheet.getByRole('button', { name: /Voir 100 Pokémon/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Johto' })).toBeVisible(); // puce du filtre actif
});

test('Fiche Pokémon : meilleures options et chasse pré-réglée', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Rechercher un Pokémon').fill('Ponchiot');
  await page.getByRole('button', { name: /^Ponchiot, / }).first().click();
  const best = page.getByRole('dialog').locator('section', { hasText: 'Meilleures options shiny' });
  await expect(best).toContainText('Poké Radar');
  await best.getByRole('button', { name: 'Chasser avec ces réglages' }).first().click();
  const hunt = page.getByRole('dialog', { name: 'Nouvelle chasse' });
  await expect(hunt).toBeVisible();
  await expect(hunt.locator('select').first()).toHaveValue('xy');
});
