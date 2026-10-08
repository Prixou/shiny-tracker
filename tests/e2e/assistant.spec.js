import { test, expect } from './fixtures.js';

// Gemini simulé : liste des modèles, puis un appel d'outil et une réponse.
async function mockGemini(page) {
  let calls = 0;
  await page.route('https://generativelanguage.googleapis.com/**', async route => {
    const url = route.request().url();
    if (/\/models(\?|$)/.test(url)) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-3.5-flash-lite', displayName: 'Gemini 3.5 Flash-Lite', supportedActions: ['generateContent'] }] }) });
    }
    calls++;
    const chunk = parts => `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] })}\r\n\r\n`;
    const body = calls === 1
      ? chunk([{ functionCall: { name: 'proposer_chasse', args: { pokemon: 'Ponchiot', jeu: 'xy', resume: 'Poké Radar' } } }])
      : chunk([{ text: 'Pour **Ponchiot**, le Poké Radar de X / Y.' }]);
    return route.fulfill({ contentType: 'text/event-stream', body });
  });
}

test('Assistant : configuration, réponse et carte « Chasser »', async ({ page }) => {
  await mockGemini(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Assistant de chasse' }).click();
  await page.getByRole('button', { name: 'Configurer l\'assistant' }).click();
  await page.getByPlaceholder('Colle ta clé ici').fill('AIza-test');
  await page.getByRole('button', { name: /Vérifier et enregistrer/ }).click();
  await expect(page.getByRole('button', { name: /Clé enregistrée/ })).toBeVisible();
  await page.goBack();
  await page.getByLabel('Message pour l\'assistant').fill('Où chasser Ponchiot ?');
  await page.keyboard.press('Enter');
  await expect(page.getByText('le Poké Radar de X / Y.')).toBeVisible();
  await page.getByRole('button', { name: 'Chasser' }).click();
  await expect(page.getByRole('dialog', { name: 'Nouvelle chasse' })).toBeVisible();
  // La clé n'est jamais mélangée aux réglages exportés ou synchronisés.
  const settings = await page.evaluate(() => localStorage.getItem('shp:settings') || '');
  expect(settings).not.toContain('AIza');
});
