import { test, expect, sampleCatches, TODAY } from './fixtures.js';

test('Mes jeux : réglage, filtre « Dans mes jeux » et meilleures options', async ({ page }) => {
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Réglages' }).click();
  await page.getByRole('button', { name: /Mes jeux et Charmes Chroma/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Mes jeux' });
  await sheet.getByRole('button', { name: /^.{0,3}X \/ Y$/ }).click();
  await expect(sheet).toContainText('1 jeu coché');
  await page.goBack();
  await page.getByRole('button', { name: 'Pokédex' }).click();
  await page.getByLabel('Filtres').click();
  await page.getByRole('dialog').locator('select').first().selectOption('mine');
  await expect(page.getByRole('dialog').getByRole('button', { name: /Voir \d+ Pokémon/ })).toBeVisible();
});

test('Stats : date de fin estimée', async ({ page, seed }) => {
  await seed({ catches: sampleCatches(['1', '4', '7', '25', '133', '152'].map(key => ({ key }))) });
  await page.goto('/?tab=stats');
  const card = page.locator('section', { hasText: 'Date de fin estimée' });
  await expect(card).toContainText('nouvelles espèces par mois');
  await card.getByRole('button', { name: /Par région/ }).click();
  await expect(card).toContainText('Kanto');
});

test('Agenda : évènements et accès au plan Banque', async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Agenda' }).click();
  const bank = page.locator('article', { hasText: 'Fermeture de Pokémon Banque' });
  await expect(bank).toBeVisible();
  await bank.getByRole('button', { name: /Mon plan avant la fermeture/ }).click();
  await expect(page.getByRole('dialog', { name: 'Plan Pokémon Banque' })).toBeVisible();
});

test('Plan Banque : transferts, check-list et priorités', async ({ page, seed }) => {
  await seed({
    catches: sampleCatches([{ key: '133', game: 'xy', method: 'radar' }, { key: '506', game: 'bw' }, { key: '25', game: 'sv' }], TODAY.getTime()),
    settings: { myGames: ['xy', 'usum', 'sv'], charmGames: {} }
  });
  await page.clock.setFixedTime(TODAY);
  await page.goto('/');
  await page.getByRole('button', { name: /Banque : J-\d+/ }).click();
  const plan = page.getByRole('dialog', { name: 'Plan Pokémon Banque' });
  await expect(plan).toContainText('À transférer (2)');
  await plan.getByRole('button', { name: 'Transféré', exact: true }).first().click();
  await expect(plan).toContainText('À transférer (1)');
  await plan.getByRole('button', { name: /Pokémon Banque et Poké Transporter sont installés/ }).click();
  await expect(plan).toContainText('1/5');
  await expect(plan.getByRole('tab', { name: /Seulement DS\/3DS \(\d+\)/ })).toBeVisible();
  await plan.getByRole('button', { name: /Ajouter à ma liste/ }).first().click();
  await expect(page.getByRole('status').filter({ hasText: '« Avant la Banque »' })).toBeVisible();
  // Sauvegarde locale différée (250 ms) : on attend qu'elle arrive.
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('shp:lists') || '[]').map(l => l.name)))
    .toContain('Avant la Banque');
});
