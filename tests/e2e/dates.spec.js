import { test, expect, TODAY } from './fixtures.js';

const DAY = 86400000;
const YESTERDAY = new Date(TODAY.getTime() - DAY).toISOString().slice(0, 10);

/** Historique saisi d'un coup : `n` shiny ajoutés à la main (sans chasse) le même jour. */
const backfill = n => Array.from({ length: n }, (_, i) => ({
  id: `b${i}`, key: String(i + 1), ball: 'pokeball', count: 0, method: 'wild', game: 'sv',
  date: YESTERDAY, timestamp: new Date(`${YESTERDAY}T12:00:00`).getTime() + i
}));

test('Journal : un historique saisi d\'un coup passe en date inconnue, annulable', async ({ page, seed }) => {
  await seed({ catches: backfill(12) });
  await page.clock.setFixedTime(TODAY);
  await page.goto('/?tab=journal');
  const banner = page.getByRole('button', { name: /12 shiny ajoutés le 7 oct\. 2026/ });
  await expect(banner).toBeVisible();
  await banner.click();

  const sheet = page.getByRole('dialog', { name: 'Corriger les dates' });
  await expect(sheet).toContainText('12 shiny ajoutés à la main');
  await sheet.getByRole('button', { name: 'Date inconnue' }).click();
  await expect(sheet).toContainText('Aucun jour suspect');
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(banner).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Date inconnue/ })).toContainText('12');

  // Une seule annulation remet les 12 dates.
  await page.getByRole('button', { name: /^Annuler : Date inconnue pour 12 shiny/ }).click();
  await expect(banner).toBeVisible();
  await expect(page.getByRole('heading', { name: /Date inconnue/ })).toHaveCount(0);
});

test('Journal : « Dates justes » masque le rappel durablement', async ({ page, seed }) => {
  await seed({ catches: backfill(10) });
  await page.goto('/?tab=journal');
  await page.getByRole('button', { name: /10 shiny ajoutés le/ }).click();
  await page.getByRole('dialog', { name: 'Corriger les dates' }).getByRole('button', { name: 'Dates justes' }).click();
  await page.goBack();
  await expect(page.getByRole('button', { name: /shiny ajoutés le/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: /oct\. 2026|octobre 2026/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /shiny ajoutés le/ })).toHaveCount(0);

  // Toujours accessible depuis Outils → Données.
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Données' }).click();
  await page.getByRole('button', { name: 'Corriger les dates' }).click();
  await expect(page.getByRole('dialog', { name: 'Corriger les dates' })).toContainText('Aucun jour suspect');
});

test('Réglage « Sans date » : un shiny coché n\'a pas de date, la fiche permet d\'en indiquer une', async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto('/?tab=tools');
  await page.getByRole('tab', { name: 'Réglages' }).click();
  await page.getByRole('tab', { name: 'Sans date' }).click();
  await expect(page.getByRole('tab', { name: 'Sans date' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: 'Pokédex' }).click();
  await page.getByLabel('Rechercher un Pokémon').fill('Bulbizarre');
  await page.getByRole('button', { name: 'Marquer Bulbizarre capturé' }).click();
  await page.getByRole('button', { name: 'Journal' }).click();
  await expect(page.getByRole('heading', { name: /Date inconnue/ })).toContainText('1');

  await page.locator('section', { hasText: 'Date inconnue' }).getByRole('button', { name: /Bulbizarre/ }).click();
  const sheet = page.getByRole('dialog').first();
  // Seul exemplaire : ses détails sont déjà ouverts.
  await expect(sheet.getByRole('button', { name: /^Date inconnue/, expanded: true })).toBeVisible();
  await expect(sheet.getByLabel('Date de capture')).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Indiquer une date' }).click();
  await expect(sheet.getByLabel('Date de capture')).toHaveValue('2026-10-08');
  await sheet.getByLabel('Date de capture').fill('2019-03-02');
  await sheet.getByRole('button', { name: 'Date inconnue', exact: true }).click();
  await expect(sheet.getByLabel('Date de capture')).toHaveCount(0);
});
