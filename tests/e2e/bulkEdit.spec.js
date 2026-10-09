import { test, expect, sampleCatches } from './fixtures.js';

// Shiny cochés d'un geste (sans chasse, détails par défaut) : 3 de Kalos, 4 de Kanto, plus 1 shiny de chasse.
const KALOS = ['650', '653', '656'];
const KANTO = ['1', '4', '7', '25'];
const quick = keys => keys.map((key, i) => ({ id: `q${key}`, key, ball: 'pokeball', count: 0, method: 'sv_wild', game: 'sv', date: '', timestamp: 0, odds: 4096 + i }));
const seedData = () => ({ catches: [...quick([...KALOS, ...KANTO]), ...sampleCatches([{ key: '133', huntId: 'h1', count: 812 }])] });

test('Journal : corriger en lot le jeu et la Ball des shiny à vérifier', async ({ page, seed }) => {
  await seed(seedData());
  await page.goto('/?tab=journal');
  await page.getByRole('button', { name: 'À vérifier · 7' }).click();
  await page.getByRole('button', { name: 'N° du Pokédex' }).click();
  await page.getByRole('button', { name: 'Sélectionner plusieurs shiny' }).click();
  await page.getByRole('button', { name: 'Sélectionner : Kalos' }).click();
  await expect(page.getByText('3 sélectionnés')).toBeVisible();

  await page.getByRole('button', { name: 'Modifier', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Modifier 3 shiny' });
  await sheet.getByLabel('Jeu').selectOption('xy');
  await sheet.getByRole('button', { name: 'Luxe Ball' }).click();
  await expect(sheet.getByRole('group', { name: 'Transféré dans Pokémon HOME' })).toBeVisible(); // X / Y passe par la Banque
  await sheet.getByRole('button', { name: 'Appliquer à 3 shiny' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: '3 shiny modifiés' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'À vérifier · 4' })).toBeVisible();
  await expect(page.getByText('0 sélectionné')).toBeVisible(); // toujours en mode sélection, pour le lot suivant
  await page.goBack(); // le bouton retour quitte le mode sélection
  await expect(page.getByRole('button', { name: 'Quitter la sélection' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Tous · 8' }).click();
  const kalos = page.locator('section', { has: page.getByRole('heading', { name: /Kalos/ }) });
  await expect(kalos.getByRole('button', { name: /XY/ })).toHaveCount(3);

  // Une seule annulation remet les trois.
  await page.getByRole('button', { name: /^Annuler : 3 shiny modifiés/ }).click();
  await expect(kalos.getByRole('button', { name: /ÉV/ })).toHaveCount(3);
});

test('Journal : confirmer des shiny justes, jeu inconnu et retour Android', async ({ page, seed }) => {
  await seed(seedData());
  await page.goto('/?tab=journal');
  await page.getByRole('button', { name: 'À vérifier · 7' }).click();
  await page.getByRole('button', { name: 'Sélectionner plusieurs shiny' }).click();
  await page.getByRole('button', { name: /Bulbizarre/ }).click();
  await page.getByRole('button', { name: /Salamèche/ }).click();
  await expect(page.getByRole('button', { name: /Bulbizarre/, pressed: true })).toBeVisible();

  // Le retour ferme le panneau sans perdre la sélection.
  await page.getByRole('button', { name: 'Modifier', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Modifier 2 shiny' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('2 sélectionnés')).toBeVisible();

  // Rien à changer : « Détails justes » les retire de « À vérifier ».
  await page.getByRole('button', { name: 'Modifier', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Détails justes (2)' }).click();
  await expect(page.getByRole('button', { name: 'À vérifier · 5' })).toBeVisible();

  // Jeu inconnu pour un autre.
  await page.getByRole('button', { name: /Pikachu/ }).click();
  await page.getByRole('button', { name: 'Modifier', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Jeu').selectOption({ label: 'Jeu inconnu' });
  await page.getByRole('dialog').getByRole('button', { name: 'Appliquer à 1 shiny' }).click();
  await page.getByRole('button', { name: 'Quitter la sélection' }).click();
  await page.getByRole('button', { name: /Tous · / }).click();
  await expect(page.getByRole('button', { name: /Pikachu.*Jeu inconnu/ })).toBeVisible();
  await page.reload(); // les confirmations sont sauvegardées
  await expect(page.getByRole('button', { name: 'À vérifier · 4' })).toBeVisible();
});
