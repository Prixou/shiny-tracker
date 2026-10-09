import { test, expect, sampleCatches } from './fixtures.js';

const openBoxes = async page => {
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Boîtes' }).click();
};

/** Glisse le doigt sur la grille (vers la gauche : boîte suivante). */
const swipe = (page, dx) => page.locator('section[aria-label^="Boîte"] .grid').evaluate((grid, dx) => {
  const r = grid.getBoundingClientRect();
  const at = x => [new Touch({ identifier: 1, target: grid, clientX: x, clientY: r.top + 40 })];
  const x0 = r.left + r.width / 2;
  grid.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: at(x0), changedTouches: at(x0) }));
  grid.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: at(x0 + dx) }));
}, dx);

test('Boîtes : ranger un shiny, toute une boîte, et annuler', async ({ page, seed }) => {
  await seed({ catches: sampleCatches([{ key: '1' }, { key: '4' }, { key: '7' }, { key: '200' }]) });
  await openBoxes(page);
  const box = page.locator('section[aria-label="Boîte 1"]');
  await expect(box.getByRole('heading', { name: 'Boîte 1' })).toBeVisible();
  await expect(box.getByRole('button', { name: 'Herbizarre · manquant' })).toBeVisible();

  await box.getByRole('button', { name: 'Bulbizarre · à ranger' }).click();
  await expect(box.getByRole('button', { name: 'Bulbizarre · rangé' })).toBeVisible();
  await box.getByRole('button', { name: 'Tout ranger dans la boîte 1 (2)' }).click();
  await expect(box.getByRole('button', { name: /· à ranger$/ })).toHaveCount(0);
  await expect(page.getByText('3 rangés')).toBeVisible();

  // Une autre boîte attend : raccourci vers elle (Feuforêve, n° 200, après les formes régionales de Kanto et Johto).
  await page.getByRole('button', { name: /^Boîte \d+ : 1 à ranger/ }).click();
  await expect(page.locator('section[aria-label^="Boîte"]').getByRole('button', { name: 'Feuforêve · à ranger' })).toBeVisible();
  const feuforeve = await page.getByRole('combobox', { name: 'Boîte' }).inputValue();

  await page.getByRole('button', { name: /^Annuler : Boîte 1 : 2 shiny rangés/ }).click();
  await page.getByRole('button', { name: 'Boîte précédente' }).click();
  await swipe(page, 120); // vers la droite : encore la précédente
  await expect(page.getByRole('combobox', { name: 'Boîte' })).toHaveValue(String(Number(feuforeve) - 2));
  await page.getByRole('combobox', { name: 'Boîte' }).selectOption('0');
  await expect(page.locator('section[aria-label="Boîte 1"]').getByRole('button', { name: /· à ranger$/ })).toHaveCount(2);
});

test('Boîtes : fiches, place dans la fiche et réglages', async ({ page, seed }) => {
  await seed({ catches: sampleCatches([{ key: '25' }]) });
  await openBoxes(page);
  await swipe(page, -120); // vers la gauche : boîte suivante
  await expect(page.getByRole('heading', { name: 'Boîte 2' })).toBeVisible();
  await swipe(page, 120);
  await expect(page.getByRole('heading', { name: 'Boîte 1' })).toBeVisible();
  await page.getByRole('tab', { name: 'Fiches' }).click();
  await page.getByRole('button', { name: 'Pikachu · à ranger' }).click();

  // 25e espèce, après les formes d'Alola de Rattata et Rattatac : 27e place.
  const sheet = page.getByRole('dialog');
  await expect(sheet).toContainText('Boîte 1 · ligne 5, colonne 3');
  await expect(sheet).toContainText('À ranger dans HOME');
  await sheet.getByRole('button', { name: 'Ranger', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Rangé' })).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Pikachu · rangé' })).toBeVisible();

  // Formes régionales à la fin : Pikachu prend la 25e place ; living dex à partir de la boîte 3.
  await page.getByRole('tab', { name: 'À la fin' }).click();
  await page.getByLabel('Première boîte du living dex dans HOME').fill('3');
  await page.getByRole('combobox', { name: 'Boîte' }).selectOption('0');
  await expect(page.locator('section[aria-label="Boîte 3"]').getByRole('button', { name: 'Pikachu · rangé' })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Boîtes' }).click();
  await expect(page.getByRole('heading', { name: 'Boîte 3' })).toBeVisible(); // boîte et réglages retrouvés
  await page.getByRole('tab', { name: 'Fiches' }).click();
  await page.getByRole('button', { name: 'Pikachu · rangé' }).click();
  await expect(page.getByRole('dialog')).toContainText('Boîte 3 · ligne 5, colonne 1');
});
