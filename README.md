# ✨ Shiny Hunter Pro

Tracker de Pokémon chromatiques pensé **d'abord pour le mobile** : Pokédex shiny complet, compteur de rencontres, journal, statistiques et outils. Application web installable (PWA) qui fonctionne **hors ligne**, en français.

## Fonctionnalités

### 📖 Pokédex shiny
- Les **1025 espèces + 57 formes régionales** (Alola, Galar, Hisui, Paldea), noms FR et EN.
- Recherche instantanée tolérante aux accents (« electhor » trouve « Électhor »), par nom FR/EN ou numéro.
- Filtres dans un panneau glissant : régions, types (double type possible), catégories (légendaires, fabuleux, starters, bébés, formes, Shiny Lock), jeu, méthode, Poké Ball.
- Onglets Tous / Capturés / Manquants / **Objectifs** (liste de souhaits ⭐), tri par numéro, nom, date ou rencontres, grille à 3 tailles.
- Fiche détaillée : artwork shiny/normal, types, conseils de chasse, édition complète de la capture (date, jeu, méthode, Ball parmi 27, rencontres, taux, surnom, sexe, notes), lien Poképédia.

### ⏱️ Compteur de chasse
- **Énorme bouton tactile** (+1 ou pas personnalisé : hordes, œufs…), −1, vibration et son optionnels.
- Plusieurs chasses en parallèle, chronomètre (pause auto quand l'app passe en arrière-plan), **écran maintenu allumé**.
- Taux par méthode avec/sans **Charme Chroma** (Masuda, apparitions massives, sandwichs, Dynamax, Poké Radar, SOS, GO…) ou taux personnalisé.
- **Phases** (un autre shiny apparaît : le compteur repart, le total est conservé), chance cumulée, rythme/heure, temps estimé.
- « Shiny trouvé ! » : enregistrement de la capture + célébration. Historique des chasses terminées (reprise possible).
- Raccourcis clavier : Espace/Entrée/↑ = +1, ↓/− = −1.

### 📚 Journal & 📊 Statistiques
- Journal groupé par mois, recherche (nom, surnom, notes), tris (chance, rencontres…), **export CSV**.
- Stats : progression globale (et hors Shiny Lock), par région, type, méthode, jeu, Ball, répartition de la chance, podiums, captures sur 12 mois.

### 🧰 Outils
- **Tirage aléatoire** de la prochaine cible (manquants / objectifs / tous, par région et type).
- **Calculateur de probabilités** avec courbe interactive (glisser le doigt) et rencontres nécessaires pour 50/75/90/95/99 %.
- **Données** : sauvegarde en fichier ou partage natif, restauration (fusion ou remplacement), **transfert PC ⇄ mobile par QR code** généré localement, scanner intégré (Chrome Android), pré-téléchargement des sprites pour le hors-ligne, installation de l'app.
- **Réglages** : vibrations, sons, écran allumé, pause auto, affichage, jeu/méthode/charme par défaut, effacement.

### 📱 Optimisations mobile
- Navigation par barre du bas, panneaux glissants (bottom sheets), cibles tactiles ≥ 44 px.
- Le **bouton retour d'Android** ferme les panneaux au lieu de quitter l'app.
- Zones sûres (encoche, barre de geste), pas de zoom intempestif sur les champs, pas de délai au toucher, pas de pull-to-refresh accidentel.
- Données du Pokédex **embarquées** (plus aucun appel API au démarrage), rendu progressif de la grille, sprites mis en cache par le service worker.
- Données stockées localement ; les sauvegardes de l'ancienne version sont **migrées automatiquement**.

## Développement

```bash
npm install
npm run dev       # serveur de dev
npm run lint      # ESLint
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build
npm run data      # régénérer src/data/pokedex.json depuis PokéAPI (api-data)
```

Stack : React 19, Vite, Tailwind CSS 4, vite-plugin-pwa (Workbox), lucide-react, qrcode, lz-string.

## Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` construit et publie l'app à chaque push sur `main`.
Dans **Settings → Pages**, choisir la source **GitHub Actions**. L'app sera disponible sur
`https://<utilisateur>.github.io/shiny-tracker/` ; sur le téléphone, ouvrir ce lien puis « Ajouter à l'écran d'accueil » / « Installer ».

## Crédits

Données et sprites : [PokéAPI](https://pokeapi.co). Icônes de types : [duiker101/pokemon-type-svg-icons](https://github.com/duiker101/pokemon-type-svg-icons).
Pokémon est une marque de Nintendo / Game Freak / The Pokémon Company. Application de fan non officielle.
