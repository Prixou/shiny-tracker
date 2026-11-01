import { test, expect, sampleCatches } from './fixtures.js';

/** Compteur « obtenus/total · % » au-dessus de la grille du Pokédex. */
const counter = page => page.locator('text=/^\\d+\\/\\d+ · \\d+%$/').first();

test('Pokédex : choisir une méthode, voir tous ses Pokémon, tes shiny reconnaissables', async ({ page, seed }) => {
  await seed({ catches: sampleCatches([{ key: '129', game: 'xy', method: 'chain_fishing' }]) }); // Magicarpe shiny
  await page.goto('/');
  await page.getByLabel('Filtres').click();
  const sheet = page.getByRole('dialog', { name: 'Filtres' });
  const select = sheet.getByLabel('Chassable avec (méthode)');
  // Chaque méthode de chaque jeu, avec tes shiny sur le total.
  const fishing = select.locator('optgroup[label="X / Y"] option', { hasText: 'Pêche à la chaîne' });
  await expect(fishing).toHaveText(/— 1\/\d+$/);
  const total = Number((await fishing.innerText()).split('/').pop());
  expect(total).toBeGreaterThan(10);
  await select.selectOption('xy|chain_fishing');
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await expect(counter(page)).toHaveText(new RegExp(`^1/${total} · `));
  await expect(page.getByRole('button', { name: 'Magicarpe, capturé' })).toBeVisible(); // déjà obtenu : coché, en couleur
  await expect(page.getByRole('button', { name: 'Retirer Magicarpe' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pikachu, / })).toHaveCount(0); // ne se pêche pas
  await page.getByRole('tab', { name: 'Manquants' }).click();
  await expect(counter(page)).toHaveText(new RegExp(`^0/${total - 1} · `));
  await expect(page.getByRole('button', { name: /^Magicarpe, / })).toHaveCount(0);

  // La puce efface le filtre : tout le Pokédex revient.
  await page.getByRole('tab', { name: 'Tous' }).click();
  await page.getByRole('button', { name: /Chassable : 🎣 Pêche à la chaîne · XY/ }).click();
  await expect.poll(async () => Number((await counter(page).innerText()).split('/')[1].split(' ')[0])).toBeGreaterThan(1000);
});

test('Tuto : « Pokémon disponibles » ouvre le Pokédex filtré sur la méthode et le jeu', async ({ page }) => {
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Tutos' }).click();
  await page.getByRole('button', { name: /Appels à l'aide \(SOS\)/ }).click();
  const guide = page.getByRole('dialog', { name: 'Appels à l\'aide (SOS)' });
  await expect(guide.getByRole('heading', { name: 'Pokémon disponibles' })).toBeVisible();
  const link = guide.getByRole('button', { name: 'Voir les Pokémon : Appels à l\'aide (SOS) · USUL' });
  const total = Number((await link.innerText()).match(/0\/(\d+)/)[1]);
  await link.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Chassable : .+ · USUL/ })).toBeVisible();
  await expect(counter(page)).toHaveText(new RegExp(`^0/${total} · `));
  await expect(page.getByRole('button', { name: 'Pokédex' })).toHaveAttribute('aria-current', 'page');
});

test('Réglages : masquer le Poké Radar, la fiche passe à la méthode suivante', async ({ page }) => {
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Réglages' }).click();
  const field = page.getByRole('group', { name: 'Méthodes à ne jamais proposer' });
  // Toutes les méthodes de chasse sont proposées, pas seulement quelques-unes.
  for (const name of ['Poké Radar', 'Méthode Masuda', 'Appels à l\'aide', 'Hordes', 'Navi-Dex', 'Raids (Téracristal / Dynamax)', 'Pokémon GO (standard)']) {
    await expect(field.getByRole('button', { name: new RegExp(`^Ne plus proposer : ${name.replace(/[()/]/g, '\\$&')}`) })).toBeVisible();
  }
  await field.getByRole('button', { name: 'Ne plus proposer : Poké Radar' }).click();
  await expect(field.getByRole('button', { name: 'Proposer à nouveau : Poké Radar' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Pokédex' }).click();
  await page.getByLabel('Rechercher un Pokémon').fill('Ponchiot');
  await page.getByRole('button', { name: /^Ponchiot, / }).first().click();
  const best = page.getByRole('dialog').locator('section', { hasText: 'Meilleures options shiny' });
  await expect(best).toContainText('Masquées dans les Réglages : Poké Radar.');
  await expect(best).not.toContainText('Poké Radar (chaîne 40)');
  await expect(best.getByRole('button', { name: 'Chasser avec ces réglages' }).first()).toBeVisible();

  // Réglage sauvegardé.
  await page.reload();
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Réglages' }).click();
  await expect(page.getByRole('button', { name: 'Proposer à nouveau : Poké Radar' })).toBeVisible();
});
