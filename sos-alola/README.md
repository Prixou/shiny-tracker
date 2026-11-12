# Shasse SOS Alola

Outil autonome (un seul fichier, `index.html`) pour la shasse en appels à l'aide dans **Pokémon Ultra-Soleil et Ultra-Lune**.

- 62 zones d'Alola classées par île : Pokémon sauvages, taux, niveaux, et pour chacun les alliés SOS qu'il peut appeler avec leur pourcentage.
- Bascule Ultra-Soleil / Ultra-Lune et jour / nuit.
- Herbes, grottes et surf, embuscades, tas de Baies, pêche (normale et points à bulles), alliés météo.
- Recherche par Pokémon (nom français ou anglais) ou par zone.
- Compteur de chaîne SOS : chances de chromatique, Talent Caché, IV garantis, avec ou sans Charme Chroma.

Pensé pour le téléphone comme pour le bureau, sans dépendance ni build : ouvrir `index.html` dans un navigateur suffit. Seules les polices viennent de Google Fonts (repli sur les polices système hors ligne).

## Données

- Tables de rencontres et règles d'alliés : [3DSRNGTool](https://github.com/wwwwwwzx/3DSRNGTool).
- Alliés SOS recoupés avec le [dump des tables d'Ultra-Soleil de SciresM](https://gist.github.com/SciresM/a539739085e24af55dffdf443cb70eb2) (via un résumé, pas le fichier brut) ; Ultra-Lune n'a pas été recoupée séparément.
- Mécaniques de chaîne : [Bulbapedia, SOS Battle](https://bulbapedia.bulbagarden.net/wiki/SOS_Battle).

Limites connues : quelques appels inhabituels de nuit sont signalés en note sans pourcentage ; les « Zone 1 / 2 / 3 » sont des carrés d'herbes distincts d'un même lieu, non localisés sur la carte. Le Scanner d'Îles, les Ultra-Brèches et les Pokémon fixes ne sont pas inclus.

Ce dossier n'est pas relié à l'application Shiny Hunter Pro : il n'est ni importé par `src/`, ni copié par le build.
