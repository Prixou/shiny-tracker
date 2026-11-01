import { test, expect } from './fixtures.js';

const MIN = 60000;
const huntOf = (id, method, count, minutes, targetId = '144') => {
  const now = Date.now();
  return { id, targetId, game: 'usum', method, opts: {}, charm: true, count, step: 1, phases: [], elapsedMs: minutes * MIN, startedAt: null, status: 'active', createdAt: now, updatedAt: now };
};

test('Chasse : ajouter 1 h de resets d\'après le temps moyen, annulable', async ({ page, seed }) => {
  await seed({ hunts: [huntOf('h1', 'reset', 100, 50)], ui: { activeHuntId: 'h1' } }); // 100 resets en 50 min : 30 s
  await page.goto('/?tab=hunts');
  const counter = page.getByRole('button', { name: /^Ajouter 1 resets/ });
  await expect(counter).toContainText('100');
  await page.getByRole('button', { name: 'Ajouter des resets par durée' }).click();

  const sheet = page.getByRole('dialog', { name: 'Ajouter du temps' });
  const avg = sheet.getByLabel('Temps moyen par reset (secondes)');
  await expect(avg).toHaveValue('30');
  await expect(sheet).toContainText('Ta moyenne sur cette chasse (50 min pour 100 resets)');
  await expect(sheet.getByRole('button', { name: '1 h', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet).toContainText('+120');

  // Mon vrai rythme ce soir : 40 s par reset, pendant 1 h 30.
  await avg.fill('40');
  await sheet.getByLabel('Minutes').fill('30');
  await expect(sheet).toContainText('+135');
  await expect(sheet).toContainText('compteur 100 → 235');
  await expect(sheet.getByRole('switch', { name: /Ajouter aussi ce temps au chrono/ })).toContainText('Chrono : 50 min → 2 h 20');
  await sheet.getByRole('button', { name: 'Ajouter 135 resets' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(counter).toContainText('235');
  await expect(page.getByRole('button', { name: 'Démarrer le chrono' })).toContainText('2:20:00');
  await page.getByRole('button', { name: /^Annuler : \+135 resets \(1 h 30\)/ }).click();
  await expect(counter).toContainText('100');
  await expect(page.getByRole('button', { name: 'Démarrer le chrono' })).toContainText('50:00');

  // Retour Android : ferme le panneau sans rien ajouter.
  await page.getByRole('button', { name: 'Ajouter des resets par durée' }).click();
  await expect(sheet).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(counter).toContainText('100');
});

test('Chasse : temps moyen estimé sans chrono, chrono inchangé au choix ; pas pour une chaîne', async ({ page, seed }) => {
  await seed({ hunts: [huntOf('h1', 'masuda', 0, 0), huntOf('h2', 'sos', 12, 30, '741')], ui: { activeHuntId: 'h1' } });
  await page.goto('/?tab=hunts');
  await page.getByRole('button', { name: 'Ajouter des œufs par durée' }).click();
  const sheet = page.getByRole('dialog', { name: 'Ajouter du temps' });
  await expect(sheet).toContainText('Estimation pour Méthode Masuda');
  await expect(sheet.getByLabel('Temps moyen par œuf (secondes)')).toHaveValue('45'); // 80 œufs / h
  await sheet.getByRole('button', { name: '30 min', exact: true }).click();
  await expect(sheet).toContainText('+40');
  await sheet.getByRole('switch', { name: /Ajouter aussi ce temps au chrono/ }).click();
  await sheet.getByRole('button', { name: 'Ajouter 40 œufs' }).click();
  await expect(page.getByRole('button', { name: /^Ajouter 1 œufs/ })).toContainText('40');
  await expect(page.getByRole('button', { name: 'Démarrer le chrono' })).toContainText('00:00');

  // Chaîne SOS : le compteur est la chaîne, pas d'ajout par durée.
  await page.getByRole('button', { name: /^Plumeline/ }).click();
  await expect(page.getByRole('button', { name: /^Ajouter 1 chaîne/ })).toContainText('12');
  await expect(page.getByRole('button', { name: /par durée$/ })).toHaveCount(0);
});
