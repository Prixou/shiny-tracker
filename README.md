# ✨ Shiny Hunter Pro

Tracker de Pokémon chromatiques pensé **d'abord pour le mobile** : Pokédex shiny complet, compteur de rencontres, journal, statistiques et outils. Application web installable (PWA) qui fonctionne **hors ligne**, en français.

## Fonctionnalités

### 📖 Pokédex shiny
- Les **1025 espèces + 57 formes régionales** (Alola, Galar, Hisui, Paldea), noms FR et EN.
- **392 variantes** en option : formes alternatives (Prismillon, Charmilly, Zarbi, Météno…), **Méga-Évolutions** (dont Z-A), **Gigamax** et différences mâle/femelle.
- **Jeux regroupés par console** (Switch, 3DS, DS, GBA, Game Boy / Console virtuelle 3DS, mobile) et filtre « Disponible sur Nintendo 3DS / Switch / … ».
- **Disponibilité réelle par jeu** d'après les Pokédex régionaux (Z-A + Mega Dimension, ÉV + DLC, Champions, LPA, EB + DLC…) et **Shiny Lock par jeu**.
- **Plusieurs exemplaires** d'un même shiny, chacun avec ses détails (nature, talent, niveau, Baron, marque, type Téra…).
- **Listes perso** (« À faire en Z-A », « Préférés »…) en plus des Objectifs.
- **Meilleures options shiny** sur chaque fiche : les jeux classés par meilleur taux atteignable (méthode, bonus, lieux, et à défaut pleine chance ou Soft Reset) avec un bouton « Chasser » pré-réglé.
- **Mes jeux** : jeux possédés et Charme Chroma jeu par jeu ; meilleures options, nouvelles chasses, filtre « Dans mes jeux » et assistant en tiennent compte.
- **Où le trouver** : lieux de capture de tous les jeux, en français (Gen 1 à 9, Légendes Arceus avec apparitions massives et Mégapparitions, Z-A et Hyperespace) ; touche un lieu pour voir tous les Pokémon de la zone.
- **Exemplaires provisoires** : un shiny Shiny Lock reçu par distribution peut être marqué « Provisoire » ; l'app prévient dès qu'il devient chassable dans tes jeux, pour le remplacer par un shiny à ton ID.
- Recherche instantanée tolérante aux accents (« electhor » trouve « Électhor »), par nom FR/EN ou numéro.
- Filtres dans un panneau glissant : régions, types (double type possible), catégories (légendaires, fabuleux, starters, bébés, formes, Shiny Lock), jeu, méthode, Poké Ball.
- Onglets Tous / Capturés / Manquants / **Objectifs** (liste de souhaits ⭐), tri par numéro, nom, date ou rencontres, grille à 3 tailles.
- Fiche détaillée : artwork shiny/normal, types, conseils de chasse, édition complète de la capture (date, ou **date inconnue** pour un vieux shiny, jeu, méthode, Ball parmi 27, rencontres, taux, surnom, sexe, notes), lien Poképédia.

### ⏱️ Compteur de chasse
- **Énorme bouton tactile** (+1 ou pas personnalisé : hordes, œufs…), −1, vibration et son optionnels.
- Plusieurs chasses en parallèle, chronomètre (pause auto quand l'app passe en arrière-plan), **écran maintenu allumé**.
- **Compter avec les écouteurs**, téléphone en poche : un appui sur les écouteurs Bluetooth = +1, trois appuis = −1, avec un bip de confirmation dans les écouteurs. Le lecteur de l'écran verrouillé affiche le Pokémon, le compteur et la chance cumulée, et ses boutons comptent aussi (▶ / ⏭ = +1, ⏮ = −1). Fonctionne depuis n'importe quel onglet, sans pause automatique du chrono, et s'arrête tout seul quand le shiny est trouvé (Media Session, sans installation).
- **Taux exacts par jeu** (1/8192 en Gen 2-5, 1/4096 ensuite, Charme Chroma ×4 en Z-A…) calculés par « tirages » et combinables : Brillance (sandwich / donut), recherche Pokédex LPA, apparitions massives, Parfum…
- **Taux dynamiques** qui évoluent avec la chaîne : Combo Capture, SOS, pêche à la chaîne, Poké Radar, KO en apparition massive (ÉV).
- **Apparitions massives boostées** d'ÉV : option « Évènement shiny boosté » (+0,5 %, tirée avant sandwich et Charme).
- **Mode œufs** (+30 = une boîte, décompte des boîtes) et hordes (+5).
- **Méthodes Z-A** : téléportation en boucle, banc jour/nuit et escalier de la Zone Sauvage 3, avec le nombre de Pokémon ciblés par cycle.
- **Phases** (un autre shiny apparaît : le compteur repart, le total est conservé), chance cumulée, rythme/heure, temps estimé.
- « Shiny trouvé ! » : enregistrement de la capture + célébration. Historique des chasses terminées (reprise possible).
- **« Que chasser ce soir ? »** : selon le temps disponible (30 min à 3 h) et les consoles à portée de main, les sessions (un jeu, une méthode) où tu as le plus de chances de trouver un shiny manquant, avec la probabilité de réussir dans ce temps et la durée moyenne. Calculé au meilleur taux de tes jeux et à **ton rythme** par méthode (d'après tes chasses chronométrées, sinon un rythme moyen), avec un bonus pour les évènements shiny en cours de l'Agenda, tes objectifs ⭐ et les shiny à chasser sur DS / 3DS avant la fermeture de la Banque. Un toucher sur un Pokémon lance la chasse pré-réglée.
- Raccourcis clavier : Espace/Entrée/↑ = +1, ↓/− = −1.

### 📚 Journal & 📊 Statistiques
- Journal groupé par mois (ou par région avec le tri « N° du Pokédex »), recherche (nom, surnom, notes), tris (chance, rencontres…), **export CSV**.
- **Édition en lot** : filtre **« À vérifier »** (shiny cochés d'un geste, avec le jeu, la méthode et la Ball par défaut) et « Sans date », mode sélection (un shiny, ou toute une région / un mois d'un coup), puis même jeu (ou « Jeu inconnu »), méthode, Ball, date ou statut HOME pour tous, annulable en un geste. « Détails justes » les confirme sans rien changer. Le plan Pokémon Banque se met à jour avec les bons jeux.
- **Historique saisi d'un coup** : le journal repère les jours où beaucoup de shiny ont été ajoutés à la main (sans chasse) et propose de les passer en **date inconnue** en un geste (annulable, aussi dans Outils → Données). Les shiny sans date ne faussent ni le journal, ni la courbe des 12 mois, ni la date de fin estimée.
- Stats : progression globale (et hors Shiny Lock), **date de fin estimée** du living dex (au total et par région, selon ton rythme récent), par région, type, méthode, jeu, Ball, répartition de la chance, podiums, captures sur 12 mois.

### 📦 Boîtes HOME du living dex
- **Place de chaque shiny** dans les boîtes de Pokémon HOME : 30 par boîte (6 × 5), dans l'ordre du Pokédex, formes régionales juste après l'espèce ou toutes à la fin, à partir de la boîte de ton choix.
- Boîte par boîte (flèches, liste ou glissement du doigt) : ✓ rangé, ● à ranger, grisé manquant, 🔒 Shiny Lock. Un toucher marque un shiny rangé, « Tout ranger » range la boîte d'un coup (annulable) ; raccourci vers la prochaine boîte à ranger.
- La fiche de chaque Pokémon et l'écran « Félicitations » indiquent sa place (« boîte 7, ligne 2, colonne 5 »).

### 🧰 Outils
- **Carte des zones** : pour chaque jeu, ses lieux (routes, villes, grottes…) avec le nombre de shiny qui te manquent ; une zone montre ses Pokémon (mode, niveaux, %) avec un bouton « Chasser » pré-réglé. Hors ligne, sans Rouge / Bleu / Jaune (pas de shiny).
- **Tirage aléatoire** de la prochaine cible (manquants / objectifs / tous, par région, type et jeu).
- **Agenda des jeux** : raids 7★, apparitions massives, distributions, codes Cadeau Mystère (copie en un geste) et échéances (fermeture de Pokémon Banque), mis à jour à la main (`src/data/events.js`).
- **Recettes** : sandwichs Brillance Nv.3 par type (ÉV) et donuts Brillance (Z-A Mega Dimension).
- **Calculateur de probabilités** avec courbe interactive (glisser le doigt) et rencontres nécessaires pour 50/75/90/95/99 %.
- **Synchronisation cloud** (optionnelle) : compte par e-mail, données à jour en direct entre téléphone et PC.
- **Annuler** n'importe quelle action (toast « Annuler », bouton dans l'en-tête, Ctrl+Z).
- **Données** : sauvegarde en fichier ou partage natif, restauration (fusion ou remplacement), **transfert PC ⇄ mobile par QR code** généré localement, scanner intégré (Chrome Android), pré-téléchargement des sprites pour le hors-ligne, installation de l'app.
- **Réglages** : vibrations, sons, écran allumé, pause auto, affichage, jeu/méthode/charme par défaut, date des shiny cochés d'un geste (**« Sans date »** pour saisir son historique), effacement.

### ⏳ Plan « Pokémon Banque »
- Compte à rebours jusqu'à la fin des transferts Banque → HOME (25 février 2027, 19 h heure du Pacifique), rappel dans le Pokédex et dans l'Agenda.
- **Shiny à chasser en priorité** sur DS/3DS : ceux qu'aucun jeu Switch ne permet de chasser, puis ceux qui sont au moins 3 fois plus faciles (ou absents de tes jeux Switch), regroupés par jeu et méthode, avec bouton « Chasser » et ajout à une liste « Avant la Banque ».
- **À transférer** : tes shiny DS/3DS pas encore marqués « Transféré dans HOME » (case dans la fiche de capture).
- Check-list (Banque installée, Premium HOME, transfert test, sauvegardes PKSM) et conseils (Ultra-Brèches, Masuda).
- Meilleures options complétées : Masuda dans les jeux DS/3DS, Épée/Bouclier et Diamant Étincelant / Perle Scintillante, fossiles des Grands Souterrains.

### 🤖 Assistant de chasse (IA)
- **Bouton flottant** ✨ : une discussion en panneau glissant, qui connaît ta collection, tes chasses, tes objectifs et les meilleures options de l'app.
- **Cartes « Chasser »** : quand l'assistant recommande une chasse, un bouton la lance pré-réglée (jeu, méthode, bonus).
- **Cartes « Appliquer »** : l'assistant peut proposer d'ajouter des objectifs, créer ou remplir une liste, mettre un chrono en pause ; rien n'est fait sans ta validation (et tout est annulable).
- **Recherche web** (avec Claude) pour l'actualité : raids, évènements, codes, avec les sources affichées (≈ 1 centime par recherche, désactivable).
- **Deux fournisseurs au choix** : **Gemini** avec une clé gratuite Google AI Studio (quota quotidien), ou **Claude** avec une clé API Anthropic payante à l'usage (Opus 5.5, Sonnet 5.5 ou Haiku 5.5).
- **Clé gardée sur l'appareil** : jamais incluse dans les sauvegardes, QR codes ni la synchro cloud. Les bibliothèques IA ne sont téléchargées qu'à la première utilisation.
- Champ « Ce que l'assistant doit savoir sur toi » (préférences, consoles, règles de ton living dex) et rappel de la fermeture de Pokémon Banque (27/02/2027).

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
npm run typecheck # vérification des types (JSDoc + TypeScript)
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build
npm run data      # régénérer src/data/pokedex.json et encounters.json depuis PokéAPI (api-data)
npm test          # tests unitaires (Vitest)
npm run test:e2e  # tests de bout en bout sur écran de téléphone (Playwright)
```

Stack : React 19, Vite, Tailwind CSS 4, vite-plugin-pwa (Workbox), zustand (état global), TypeScript (vérification des types JSDoc), lucide-react, qrcode, lz-string, supabase-js (chargé seulement si la synchro est configurée).

### Architecture

```
src/
  data/       tables statiques (jeux, méthodes et taux, Pokédex, évènements)
  lib/        utilitaires génériques (formats, texte, partage, vibrations, hooks)
  domain/     logique métier pure et testée (chasses, captures, meilleures options, Banque, stats…)
  services/   accès extérieurs (IA, cloud, données de lieux)
  state/      store zustand à sélecteurs, sauvegarde locale, synchro, navigation
  ui/         composants d'interface génériques (Sheet, contrôles, sprites, toasts)
  features/   écrans et panneaux par fonctionnalité (dex, hunts, pokemon, assistant, bank…)
  app/        coquille : en-tête, barre du bas, annulation
```

Chaque couche n'importe que les couches inférieures (vérifié par ESLint). Les données (captures, chasses, listes, réglages, Pokémon…) sont typées en JSDoc (`src/domain/types.js`) et vérifiées par TypeScript, sans réécrire le code en TypeScript. Les composants s'abonnent à l'état par sélecteur : un appui sur le compteur ne redessine que l'écran de chasse. Le détail des règles est dans [`CLAUDE.md`](CLAUDE.md).

### Tests automatiques

- **Unitaires** (`tests/unit`, Vitest, quelques secondes) : store (annulation, chasses, synchro, sauvegarde automatique), taux shiny publiés de chaque méthode (Charme, chaînes, Masuda, sandwichs, apparitions massives…), meilleures options par Pokémon (formes régionales, Shiny Lock, « Mes jeux », Charme par jeu), priorités avant la fermeture de la Banque, migrations et stockage local, dates inconnues et jours d'historique saisi d'un coup, compteur aux écouteurs (fichier audio de silence, texte de l'écran verrouillé), boîtes HOME (places, formes régionales, rangement annulable), « Que chasser ce soir ? » (rythme personnel, chance dans le temps donné, consoles, évènements, objectifs, Banque, sessions), édition en lot (jeu, méthode, taux recalculé, shiny à vérifier), filtres et tris du journal, export / import / QR / fusion de la synchro, date de fin estimée, agenda, outils de l'assistant (validation des arguments, actions proposées) et dialogue avec Gemini et Claude (réseau simulé).
- **De bout en bout** (`tests/e2e`, Playwright) : l'app de production tourne dans Chromium en **412 × 915, tactile, en français**, sans réseau extérieur. Parcours testés : Pokédex (recherche, capture, annulation, filtres et bouton retour), fiche et chasse pré-réglée, compteur de chasse conservé après rechargement, shiny trouvé puis annulé, évènement shiny boosté, Mes jeux, date de fin estimée, Agenda, plan Pokémon Banque, correction des dates d'un historique saisi d'un coup, édition en lot des shiny à vérifier (sélection par région, retour Android), compteur aux écouteurs (appuis simulés, arrière-plan, autre onglet, arrêt quand le shiny est trouvé), boîtes HOME (rangement, glissement du doigt, place dans la fiche, réglages), « Que chasser ce soir ? » (consoles, temps, chasse pré-réglée, rythme personnel, évènement en cours), réglage « Sans date » et assistant (Gemini simulé). Chaque test vérifie aussi l'absence d'erreur JavaScript et de défilement horizontal.
- Première fois : `npx playwright install chromium` (ou `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/chemin/vers/chrome` pour utiliser un navigateur déjà installé).
- Le workflow `.github/workflows/ci.yml` lance le lint, la vérification des types et tous les tests sur chaque pull request et sur `main` ; le déploiement ne part que si les tests unitaires passent.

## Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` vérifie (lint, tests unitaires), construit et publie l'app à chaque push sur `main`.
Dans **Settings → Pages**, choisir la source **GitHub Actions**. L'app sera disponible sur
`https://<utilisateur>.github.io/shiny-tracker/` ; sur le téléphone, ouvrir ce lien puis « Ajouter à l'écran d'accueil » / « Installer ».

## Synchronisation cloud (Supabase, optionnel)

1. Créer un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécuter [`supabase/schema.sql`](supabase/schema.sql) (table `shiny_data` protégée par RLS + temps réel).
3. Dans **Authentication → URL Configuration**, ajouter l'URL du site (ex. `https://<utilisateur>.github.io/shiny-tracker/`).
4. Pour se connecter depuis l'app installée, ajouter le code au modèle d'e-mail **Magic Link** (`{{ .Token }}`), sinon utiliser le lien.
5. Renseigner l'URL du projet et la clé publique `anon` :
   - soit dans l'app (**Outils → Données → Synchronisation cloud → Configurer**),
   - soit au build via les secrets GitHub `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (utilisés par le workflow de déploiement).

Chaque utilisateur ne peut lire et modifier que sa propre ligne. En cas de modifications simultanées sur deux appareils, les données sont fusionnées.

## Sources des données

- **PokéAPI** : Pokédex, noms, types, Pokédex régionaux, lieux des Gen 1 à 7 et d'Épée / Bouclier.
- **PKHeX** (tables extraites des jeux, non officielles) : lieux de Diamant Étincelant / Perle Scintillante (dont Grands Souterrains), Légendes Arceus (apparitions massives et Mégapparitions exactes), Écarlate / Violet + DLC, Légendes Z-A + Hyperespace, et la liste des apparitions massives évènementielles d'ÉV.
- Les apparitions massives classiques d'ÉV sont **estimées** (espèces sauvages hors Zone Zéro, hors légendaires) : signale toute coquille pour corriger.

## Crédits

Données et sprites : [PokéAPI](https://pokeapi.co). Icônes de types : [duiker101/pokemon-type-svg-icons](https://github.com/duiker101/pokemon-type-svg-icons).
Pokémon est une marque de Nintendo / Game Freak / The Pokémon Company. Application de fan non officielle.
