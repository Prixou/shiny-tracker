import { test, expect, TODAY } from './fixtures.js';

const openTonight = async page => {
  await page.goto('/?tab=hunts');
  await page.getByRole('button', { name: 'Que chasser ce soir ?' }).click();
  const sheet = page.getByRole('dialog', { name: 'Que chasser ce soir ?' });
  await expect(sheet.locator('article').first()).toBeVisible();
  return sheet;
};
const firstChance = async sheet => Number((await sheet.locator('article').first().locator('.font-mono').first().innerText()).replace(/\D/g, ''));

test('Ce soir : sessions selon le temps et les consoles, puis chasse pré-réglée', async ({ page, seed }) => {
  await seed({ settings: { myGames: ['sv', 'xy'] } });
  await page.clock.setFixedTime(TODAY);
  const sheet = await openTonight(page);
  // Consoles de « Mes jeux » cochées par défaut.
  await expect(sheet.getByRole('button', { name: 'Switch' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet.getByRole('button', { name: '3DS' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet.getByRole('button', { name: 'DS', exact: true })).toHaveAttribute('aria-pressed', 'false');

  await sheet.getByRole('button', { name: '3DS' }).click();
  await expect(sheet.locator('article').first()).toHaveAttribute('aria-label', /^Écarlate \/ Violet/);
  expect(await sheet.locator('article').evaluateAll(list => list.every(a => a.getAttribute('aria-label').startsWith('Écarlate / Violet')))).toBe(true);

  await sheet.getByRole('tab', { name: '30 min' }).click();
  const short = await firstChance(sheet);
  await sheet.getByRole('tab', { name: '3 h' }).click();
  await expect.poll(() => firstChance(sheet)).toBeGreaterThan(short);

  const chip = sheet.locator('article').first().getByRole('button', { name: /^Chasser / }).first();
  const name = (await chip.getAttribute('aria-label')).replace('Chasser ', '');
  await chip.click();
  const hunt = page.getByRole('dialog', { name: 'Nouvelle chasse' });
  await expect(hunt).toContainText(name);
  await expect(hunt.locator('select').first()).toHaveValue('sv');
  await page.goBack(); // retour aux suggestions
  await expect(page.getByRole('dialog', { name: 'Que chasser ce soir ?' })).toBeVisible();

  await page.reload(); // temps et consoles retenus
  const again = await openTonight(page);
  await expect(again.getByRole('tab', { name: '3 h' })).toHaveAttribute('aria-selected', 'true');
  await expect(again.getByRole('button', { name: '3DS' })).toHaveAttribute('aria-pressed', 'false');
});

test('Ce soir : ton rythme et les évènements shiny en cours', async ({ page, seed }) => {
  const now = new Date('2026-08-10T18:00:00Z').getTime();
  await seed({
    settings: { myGames: ['sv'] },
    hunts: [{ id: 'old', targetId: '133', game: 'sv', method: 'sv_wild', opts: {}, charm: false, count: 1000, step: 1, phases: [], elapsedMs: 2 * 3600000, startedAt: null, status: 'done', createdAt: now, updatedAt: now, finishedAt: now }]
  });
  await page.clock.setFixedTime(now); // pendant les apparitions massives boostées de Germéclat (Agenda)
  await page.goto('/?tab=hunts');
  await page.getByRole('button', { name: 'Que chasser ce soir ?' }).click();
  const first = page.getByRole('dialog', { name: 'Que chasser ce soir ?' }).locator('article').first();
  await expect(first).toContainText('Évènement en cours');
  await expect(first).toContainText('Germéclat');
  await expect(first).toContainText('ton rythme : 500 rencontres/h');
});
