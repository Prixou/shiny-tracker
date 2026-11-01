import { test, expect } from './fixtures.js';

/** Fait défiler jusqu'en bas tant que de nouvelles cartes arrivent ; renvoie le nombre de cartes affichées. */
async function scrollToEnd(page) {
  const cards = page.getByRole('button', { name: /^(Marquer .+ capturé|Retirer .+)$/ });
  let previous = -1;
  for (let i = 0; i < 60; i++) {
    const count = await cards.count();
    if (count === previous) break;
    previous = count;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);
  }
  return cards.count();
}

/** Nombre total de Pokémon des résultats, lu dans le compteur « obtenus/total · % ». */
const totalShown = async page => Number((await page.locator('text=/^\\d+\\/\\d+ · \\d+%$/').first().innerText()).split('/')[1].split(' ')[0]);

test('Pokédex : tous les Pokémon s\'affichent en défilant, même après une recherche', async ({ page }) => {
  await page.goto('/');
  const total = await totalShown(page);
  expect(total).toBeGreaterThan(1000);

  // Une recherche avec peu de résultats, puis on l'efface : la liste complète doit pouvoir se charger.
  await page.getByLabel('Rechercher un Pokémon').fill('Pikachu');
  await expect.poll(() => totalShown(page)).toBeLessThan(72);
  await page.getByLabel('Rechercher un Pokémon').fill('');
  await expect.poll(() => totalShown(page)).toBe(total);
  expect(await scrollToEnd(page)).toBe(total);

  // Même chose avec un filtre de statut qui vide presque la liste.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('tab', { name: 'Capturés' }).click();
  await page.getByRole('tab', { name: 'Tous' }).click();
  expect(await scrollToEnd(page)).toBe(total);
});
