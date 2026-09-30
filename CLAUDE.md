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
```

## Repères

- Taux shiny : `src/data/methods.js` (moteur par « tirages ») et `src/data/games.js` (jeux, Charme, méthodes, Pokédex régionaux).
- État global et annulation : `src/state/store.jsx` ; synchro cloud : `src/state/cloud.jsx` + `src/lib/cloud.js`.
- Composants d'interface communs : `src/components/ui.jsx`.
