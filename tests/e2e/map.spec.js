import { test, expect, sampleCatches } from './fixtures.js';

test('Carte : zones d\'un jeu, shiny manquants et chasse pré-réglée', async ({ page, seed }) => {
  await seed({ catches: sampleCatches([{ key: '16', game: 'frlg' }]), settings: { defaultGame: 'frlg' } });
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Carte' }).click();
  await expect(page.getByRole('combobox', { name: 'Jeu' })).toHaveValue('frlg');
  // Rouge / Bleu / Jaune (sans shiny) ne sont pas proposés.
  await expect(page.locator('option[value="rbj"]')).toHaveCount(0);

  await page.getByLabel('Rechercher une zone').fill('Route 1');
  await page.getByRole('button', { name: /^Route 1 \d+ ✨/ }).click();
  const zone = page.getByRole('dialog', { name: 'Route 1' });
  await expect(zone).toContainText('Roucool');
  await expect(zone.getByLabel('Déjà shiny')).toHaveCount(1); // Roucool, capturé
  await zone.getByRole('button', { name: 'Chasser Rattata' }).click();
  const hunt = page.getByRole('dialog', { name: 'Nouvelle chasse' });
  await expect(hunt).toContainText('Rattata');
  await expect(hunt.locator('select').first()).toHaveValue('frlg');
});

test('Carte : filtre « Manquants » et retour à la liste', async ({ page }) => {
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Carte' }).click();
  await page.getByRole('combobox', { name: 'Jeu' }).selectOption('xy');
  const rows = page.getByRole('listitem');
  const all = await rows.count();
  expect(all).toBeGreaterThan(30);
  await page.getByRole('button', { name: 'Manquants' }).click();
  await expect(page.getByRole('button', { name: 'Manquants' })).toHaveAttribute('aria-pressed', 'true');
  expect(await rows.count()).toBeLessThanOrEqual(all);
  await page.getByRole('button', { name: /^Route 2 / }).click();
  await expect(page.getByRole('dialog', { name: 'Route 2' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Fiche : un lieu de « Où le trouver » ouvre la zone', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Rechercher un Pokémon').fill('Rattata');
  await page.getByRole('button', { name: /^Rattata, / }).first().click();
  const sheet = page.getByRole('dialog').first();
  await sheet.getByRole('button', { name: /Rouge Feu \/ Vert Feuille/ }).click();
  await sheet.getByRole('button', { name: /^Route 1 / }).first().click();
  await expect(page.getByRole('dialog', { name: 'Route 1' })).toBeVisible();
  await page.goBack(); // le bouton retour ferme la zone, la fiche reste ouverte
  await expect(page.getByRole('dialog', { name: 'Route 1' })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(1);
});

test('Provisoire : rappel quand le Pokémon devient chassable, puis remplacement', async ({ page, seed }) => {
  await seed({ catches: sampleCatches([{ key: '150', provisional: true, method: 'event', game: 'other' }]) });
  await page.goto('/');
  const banner = page.getByRole('button', { name: /Mewtwo provisoire : chassable/ });
  await expect(banner).toBeVisible();
  await banner.click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toContainText('Provisoire');
  await expect(sheet).toContainText('Ton exemplaire est provisoire');

  // Son propre exemplaire : le rappel disparaît, l'ancien est signalé comme remplaçable.
  await sheet.getByRole('button', { name: 'Un de plus' }).click();
  await expect(sheet).not.toContainText('Ton exemplaire est provisoire');
  await page.goBack();
  await expect(banner).toHaveCount(0);
});

test('Provisoire : la case du formulaire et le masquage du rappel', async ({ page, seed }) => {
  await seed({ catches: sampleCatches([{ key: '150', provisional: true, method: 'event', game: 'other' }]) });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /provisoire : chassable/ })).toBeVisible();
  await page.getByRole('button', { name: 'Masquer le rappel des provisoires' }).click();
  await expect(page.getByRole('button', { name: /provisoire : chassable/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: /provisoire : chassable/ })).toHaveCount(0);

  await page.getByLabel('Rechercher un Pokémon').fill('Mewtwo');
  await page.getByRole('button', { name: /^Mewtwo, / }).first().click();
  await expect(page.getByRole('switch', { name: /Provisoire \(distribution\)/ })).toHaveAttribute('aria-checked', 'true');
});
