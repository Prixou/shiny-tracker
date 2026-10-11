import { test, expect } from './fixtures.js';

const openTool = async (page, name) => {
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name }).click();
};

test('Recettes : sandwichs sans Épice Secrète, paires d\'Épices valides et donuts', async ({ page }) => {
  await openTool(page, 'Recettes');
  // Brillance : seule la paire valide est proposée (Roche : deux salées).
  await page.getByLabel('Chercher une recette').fill('roche');
  const rock = page.locator('article').filter({ hasText: 'Piment' });
  await expect(rock).toHaveCount(1);
  await expect(rock).toContainText('Épice secrète salée + salée');
  await expect(rock.locator('li')).toHaveCount(1);

  await page.getByRole('tab', { name: '🥪 Sans épice' }).click();
  await page.getByLabel('Chercher une recette').fill('électrik');
  const electric = page.getByRole('article', { name: 'Rencontre electric' });
  await expect(electric).toContainText('Mode libre');
  await expect(electric).toContainText('Calculée');
  await expect(electric).toContainText('Rencontre Électrik Nv. 2');
  await page.getByLabel('Chercher une recette').fill('feu');
  await expect(page.getByRole('article', { name: 'Rencontre fire' })).toContainText('Testée en jeu');
  await page.getByLabel('Chercher une recette').fill('dragon');
  await expect(page.getByRole('article', { name: 'Rencontre dragon' })).toContainText('Recette du jeu n° 45');
  await page.getByLabel('Chercher une recette').fill('');
  await expect(page.getByRole('heading', { name: /Aura Œuf Nv\. 2/ })).toBeVisible();
  await expect(page.getByText('60 KO en apparition massive : 1/1366', { exact: false })).toBeVisible();

  await page.getByRole('tab', { name: '🍩 Z-A' }).click();
  await expect(page.getByText(/reste aléatoire/)).toBeVisible();
  await expect(page.getByText(/forcément shiny/)).toBeVisible();
});

test('Tutos : méthode Masuda, taux calculés et chasse pré-réglée', async ({ page }) => {
  await openTool(page, 'Tutos');
  await page.getByRole('button', { name: /Méthode Masuda/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Méthode Masuda' });
  await expect(sheet).toContainText('ton numéro de dresseur');
  await expect(sheet.locator('div', { hasText: /^Masuda \+ Charme Chroma1\/512$/ })).toHaveCount(1);
  await sheet.getByRole('button', { name: 'Chasser avec cette méthode' }).click();
  const hunt = page.getByRole('dialog', { name: 'Nouvelle chasse' });
  await hunt.getByPlaceholder('Rechercher le Pokémon ciblé…').fill('Évoli');
  await hunt.getByRole('button', { name: /Évoli/ }).first().click();
  await expect(hunt.getByLabel('Méthode')).toHaveValue('masuda');
  await page.goBack();
  await expect(page.getByRole('dialog', { name: 'Méthode Masuda' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Chasse : tuto de la méthode en cours, puis les recettes', async ({ page, seed }) => {
  const now = Date.now();
  await seed({ hunts: [{ id: 'h1', targetId: '133', game: 'sv', method: 'sv_wild', opts: { outbreak: true }, charm: true, count: 12, step: 1, phases: [], elapsedMs: 0, startedAt: null, status: 'active', createdAt: now, updatedAt: now }], ui: { activeHuntId: 'h1' } });
  await page.goto('/?tab=hunts');
  await page.getByRole('button', { name: 'Tuto : Apparitions massives + sandwich' }).click();
  const sheet = page.getByRole('dialog', { name: 'Apparitions massives + sandwich' });
  await expect(sheet).toContainText('60 KO + Charme + sandwich Brillance Nv. 3');
  await sheet.getByRole('button', { name: 'Voir les recettes' }).click();
  await expect(page.getByRole('tab', { name: 'Recettes' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: '✨ Brillance' })).toBeVisible();
});
