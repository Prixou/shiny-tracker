# Shiny Hunter Pro — consignes du projet

## Règle n° 1 : c'est une application MOBILE

Ce projet est avant tout une **application mobile** (PWA installable, utilisée principalement sur un téléphone Android, Pixel 8 Pro). Toute nouvelle fonctionnalité, tout écran et toute modification doivent être pensés, conçus et testés **d'abord pour le mobile** :

- Mise en page pensée pour ~412 px de large, sans défilement horizontal ; le bureau n'est qu'un bonus.
- Cibles tactiles ≥ 44 px, actions principales atteignables au pouce, navigation par la barre du bas.
- Panneaux glissants (composant `Sheet`) plutôt que des pages ou des modales de bureau ; le bouton retour d'Android doit les fermer.
- Champs de saisie en 16 px minimum (pas de zoom iOS), claviers adaptés (`inputMode`), zones sûres (`pb-safe`, `pt-safe`).
- Fonctionnement hors ligne, données stockées localement, performances sur téléphone (rendu progressif, chargements différés).
- Retours tactiles (vibration) et écran maintenu allumé pendant les chasses quand c'est pertinent.
- Vérifier chaque changement dans un viewport mobile (Chromium, 412 × 915, `isMobile`, `hasTouch`) avant de pousser.

## Langue

Interface, textes, commentaires et messages de commit en **français**.

## Commandes

```bash
npm run dev      # développement
npm run lint     # ESLint (doit passer)
npm run build    # build de production (doit passer)
npm run data     # régénère src/data/*.json depuis PokéAPI (api-data)
npm test         # tests unitaires Vitest (doivent passer)
npm run test:e2e # tests Playwright sur écran de téléphone 412 × 915 (doivent passer)
```

## Tests

- Lint, `npm test` et `npm run test:e2e` doivent passer avant chaque push (la CI les relance sur chaque pull request).
- Toute correction de bug ou nouvelle fonctionnalité s'accompagne d'un test : unitaire dans `tests/unit` pour la logique (taux, meilleures options, Banque, stockage…), de bout en bout dans `tests/e2e` pour un parcours d'écran.
- Les tests e2e tournent sans réseau extérieur (APIs d'IA simulées avec `page.route`) et vérifient qu'il n'y a ni erreur JavaScript ni défilement horizontal. Figer l'horloge (`page.clock.setFixedTime(TODAY)`) pour tout ce qui dépend de la date (Banque, agenda).
- Navigateur déjà installé (environnement sans téléchargement) : `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run test:e2e`.
- Ne jamais affaiblir ou supprimer un test pour le faire passer : corriger le code ou, si le comportement attendu a changé, mettre à jour l'attente.

## Repères

- Taux shiny : `src/data/methods.js` (moteur par « tirages ») et `src/data/games.js` (jeux, Charme, méthodes, Pokédex régionaux).
- État global et annulation : `src/state/store.jsx` ; synchro cloud : `src/state/cloud.jsx` + `src/lib/cloud.js`.
- Composants d'interface communs : `src/components/ui.jsx`.
