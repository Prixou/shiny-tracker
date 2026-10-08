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

## Architecture

Couches, de la plus basse à la plus haute. Une couche n'importe que des couches inférieures ; ESLint le vérifie (`no-restricted-imports` dans `eslint.config.js`).

| Dossier | Rôle | Peut importer |
| --- | --- | --- |
| `src/data/` | Tables statiques : jeux, méthodes et moteur de taux, Pokédex, formes, évènements, constantes | `lib/` |
| `src/lib/` | Utilitaires génériques : `format.js`, `text.js`, `id.js`, `share.js`, `feedback.js`, `hooks.js` | — |
| `src/domain/` | Logique métier **pure, sans React** : chasses, captures, listes, réglages, chance, meilleures options, Banque, stats, filtres du Pokédex, sauvegardes | `data/`, `lib/` |
| `src/services/` | Accès extérieurs : IA (`services/ai/`), cloud Supabase, données de lieux | `data/`, `lib/`, `domain/` |
| `src/state/` | État global (`store.js`, zustand, sans React), branchement React (`StoreProvider.jsx`), sauvegarde locale, synchro cloud, navigation, `useEncounters` | couches ci-dessus |
| `src/ui/` | Composants d'interface génériques (`Sheet`, contrôles, sprites, toast, confirmation), importés via `ui/index.js` | `data/`, `lib/` |
| `src/features/<fonctionnalité>/` | Écrans et panneaux : `dex`, `pokemon`, `hunts`, `journal`, `stats`, `tools`, `settings`, `lists`, `backup`, `assistant`, `bank` | tout sauf `app/` |
| `src/app/` | Coquille : `App.jsx`, en-tête, barre du bas, annulation | tout |

Règles :

- Calcul, règle de jeu, format de données → `domain/` (avec un test unitaire), jamais dans un composant.
- Lire l'état : `useAppState(s => …)` (rendu seulement si la valeur change). Le sélecteur doit renvoyer des valeurs stables : tranches du store, primitives, ou sélecteurs mémorisés (`selectShinies`, `selectCatchesByKey`, `selectCaughtCount`). Jamais d'objet ou de tableau recalculé à l'intérieur d'un objet (boucle de rendus) ; un tableau filtré seul est accepté (comparé élément par élément).
- Modifier l'état : `useActions()` (référence stable). Toute action de données passe par `commit` dans `state/store.js` : horodatage pour la synchro et, avec un libellé, entrée d'annulation (le toast « Annuler » s'affiche tout seul).
- Lecture ponctuelle sans abonnement (dans un gestionnaire d'évènement) : `useStoreApi().getState()`.
- Panneaux et onglets secondaires chargés à la demande (`lazy`) dans `app/App.jsx`.
- Un fichier = un rôle ; au-delà d'environ 200 lignes, découper (sous-composants, hook `useXxx.js`, logique vers `domain/`).
- Grilles : toujours une colonne explicite (`grid-cols-1 sm:grid-cols-2`), sinon un texte tronqué élargit la page sur mobile.

## Repères

- Taux shiny : `src/data/methods.js` (moteur par « tirages ») et `src/data/games.js` (jeux, Charme, méthodes, Pokédex régionaux).
- Meilleures options : `src/domain/bestOptions.js` ; Banque : `src/domain/bank.js` (date limite et libellés uniques).
- État global, actions et annulation : `src/state/store.js` ; sauvegarde locale : `src/state/persistence.js` ; synchro cloud : `src/state/cloud.jsx` + `src/services/cloud.js`.
- Assistant : `src/services/ai/` (outils, Claude, Gemini) et `src/features/assistant/` (`useChat.js`).
- Composants d'interface communs : `src/ui/index.js`.
