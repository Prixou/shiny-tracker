// Tutos des méthodes de chasse : prérequis, étapes et astuces. Les taux affichés ne sont pas écrits ici :
// ils sont calculés par le moteur de l'app (data/methods.js) à partir des réglages `odds`, comme pour une chasse.
// Noms d'objets et de talents en français quand ils sont sûrs ; sinon le nom anglais, entre guillemets.
/** @import { OddsConfig } from '../domain/types.js' */

/**
 * Exemple de taux : réglages d'une chasse, et longueur de chaîne pour les méthodes à chaîne.
 * @typedef {object} GuideOdds
 * @property {string} label
 * @property {OddsConfig} cfg
 * @property {number} [chain]
 */

/**
 * Tuto d'une méthode.
 * @typedef {object} Guide
 * @property {string} id
 * @property {string} title
 * @property {string} icon
 * @property {string[]} games Jeux concernés.
 * @property {string[]} methods Méthodes de l'app couvertes (lien depuis une chasse).
 * @property {string} intro
 * @property {string[]} needs
 * @property {string[]} steps
 * @property {string[]} tips
 * @property {GuideOdds[]} odds
 * @property {boolean} [recipes] Renvoie vers l'onglet Recettes.
 */

const sv = (opts, charm = false) => ({ game: 'sv', method: 'sv_wild', opts, charm });

/** @type {Guide[]} */
export const GUIDES = [
  {
    id: 'sv-outbreak', title: 'Apparitions massives + sandwich', icon: '🥪', games: ['sv'], methods: ['sv_wild'], recipes: true,
    intro: 'La méthode reine d\'Écarlate / Violet : on cumule les KO d\'une apparition massive, un sandwich Aura Brillance et le Charme Chroma.',
    needs: [
      'Une apparition massive du Pokémon voulu (icône sur la carte).',
      'Un sandwich Aura Brillance Nv. 3 du type du Pokémon : il demande 2 Épices Secrètes, obtenues dans les raids 5★ et 6★ (voir Recettes).',
      'Le Charme Chroma : il s\'obtient en complétant le Pokédex de Paldea.'
    ],
    steps: [
      'Mets KO ou capture 60 Pokémon de l\'apparition massive : le taux s\'améliore à 30, puis à 60. Le combat automatique (touche R) compte aussi.',
      'Mange le sandwich Aura Brillance Nv. 3 du bon type : ses effets durent 30 minutes.',
      'Fais réapparaître les Pokémon en ouvrant puis en rangeant le pique-nique, et inspecte-les.',
      'Repère le shiny à sa couleur : en ÉV, il n\'y a ni étincelle ni son quand il apparaît.'
    ],
    tips: [
      'Sans Épice Secrète, un sandwich Aura Rencontre Nv. 2 du type fait apparaître plus de Pokémon de ce type (voir Recettes, « Sans épice »).',
      'Certains évènements boostent les apparitions massives (+0,5 %) : coche « Évènement shiny boosté » dans la chasse (voir Agenda).',
      'Compte les KO dans l\'app avec l\'option « Apparition massive » : le taux affiché suit ton compteur.'
    ],
    odds: [
      { label: 'Sauvage, sans rien', cfg: sv({}) },
      { label: 'Apparition massive, 60 KO', cfg: sv({ outbreak: true }), chain: 60 },
      { label: '60 KO + Charme Chroma', cfg: sv({ outbreak: true }, true), chain: 60 },
      { label: '60 KO + Charme + sandwich Brillance Nv. 3', cfg: sv({ outbreak: true, sparkling: 3 }, true), chain: 60 }
    ]
  },
  {
    id: 'masuda', title: 'Méthode Masuda', icon: '🥚', games: ['sv', 'swsh', 'bdsp', 'usum', 'sm', 'oras', 'xy', 'b2w2', 'bw', 'hgss', 'dpp'], methods: ['masuda', 'egg'], recipes: true,
    intro: 'Faire éclore des œufs dont les deux parents viennent de jeux de langues différentes : chaque œuf a plusieurs tirages shiny de plus.',
    needs: [
      'Un parent d\'une autre langue que ton jeu (souvent un Métamorph) : par échange, ou depuis ton propre jeu dans une autre langue via Pokémon HOME.',
      'Le Pokémon voulu (ou un membre de son évolution) comme second parent.'
    ],
    steps: [
      'Dépose les deux parents à la pension (ou, en ÉV, prends-les dans l\'équipe et lance un pique-nique : les œufs arrivent dans le panier).',
      'Récupère les œufs, puis fais-les éclore en marchant ou en roulant.',
      'Le bébé éclos porte ton numéro de dresseur : il compte comme le tien, même si un parent vient d\'un échange.'
    ],
    tips: [
      'Un Pokémon avec le talent Corps Ardent dans l\'équipe divise par deux les pas nécessaires à l\'éclosion.',
      'En ÉV, un sandwich Aura Œuf fait venir beaucoup plus d\'œufs au pique-nique (voir Recettes, « Sans épice »).',
      'Le Charme Chroma s\'ajoute aux tirages de la méthode Masuda.'
    ],
    odds: [
      { label: 'Œuf sans Masuda (Gen 6 et +)', cfg: { game: 'sv', method: 'egg', opts: {}, charm: false } },
      { label: 'Masuda (Gen 6 et +)', cfg: { game: 'sv', method: 'masuda', opts: {}, charm: false } },
      { label: 'Masuda + Charme Chroma', cfg: { game: 'sv', method: 'masuda', opts: {}, charm: true } },
      { label: 'Masuda en Gen 4', cfg: { game: 'dpp', method: 'masuda', opts: {}, charm: false } }
    ]
  },
  {
    id: 'radar', title: 'Poké Radar', icon: '📡', games: ['dpp', 'bdsp', 'xy'], methods: ['radar'],
    intro: 'Le Poké Radar fait trembler des touffes d\'herbes hautes. En enchaînant les rencontres de la même espèce, le taux shiny grimpe jusqu\'à une chaîne de 40.',
    needs: ['Le Poké Radar et une zone d\'herbes hautes assez grande.', 'Un Max Repousse, pour ne pas être dérangé par les rencontres normales.'],
    steps: [
      'Active le Poké Radar : des touffes d\'herbe se mettent à trembler.',
      'Entre dans une touffe qui tremble et bats ou capture le Pokémon (ne fuis pas : la chaîne casserait).',
      'Après le combat, entre dans une nouvelle touffe qui tremble. Plus elle est loin de toi, plus la chaîne a de chances de continuer.',
      'Une touffe qui scintille annonce un shiny.'
    ],
    tips: [
      'Si plus aucune touffe ne tremble, fais quelques pas pour recharger le Radar et relance-le.',
      'Au-delà de 40, la chaîne n\'améliore plus le taux.'
    ],
    odds: [
      { label: 'DPPt, chaîne de 40', cfg: { game: 'dpp', method: 'radar', opts: {}, charm: false }, chain: 40 },
      { label: 'X / Y, chaîne de 40', cfg: { game: 'xy', method: 'radar', opts: {}, charm: false }, chain: 40 },
      { label: 'X / Y, chaîne de 40 + Charme', cfg: { game: 'xy', method: 'radar', opts: {}, charm: true }, chain: 40 }
    ]
  },
  {
    id: 'chain-fishing', title: 'Pêche à la chaîne', icon: '🎣', games: ['xy', 'oras'], methods: ['chain_fishing'],
    intro: 'Pêcher au même endroit sans bouger : chaque prise consécutive ajoute 2 tirages shiny, jusqu\'à 20 prises.',
    needs: ['Une canne (la Super Canne offre plus d\'espèces).', 'En tête d\'équipe, un Pokémon au talent Ventouse ou Glue, pour que ça morde presque à chaque fois.'],
    steps: [
      'Place-toi face à l\'eau et pêche sans changer de case.',
      'Bats ou capture chaque Pokémon, puis repêche aussitôt.',
      'Si rien ne mord, la chaîne casse : recommence.'
    ],
    tips: ['Changer de zone ou de position casse la chaîne.', 'Après 20 prises, le taux n\'augmente plus.'],
    odds: [
      { label: 'Chaîne de 20', cfg: { game: 'xy', method: 'chain_fishing', opts: {}, charm: false }, chain: 20 },
      { label: 'Chaîne de 20 + Charme', cfg: { game: 'xy', method: 'chain_fishing', opts: {}, charm: true }, chain: 20 }
    ]
  },
  {
    id: 'friend-safari', title: 'Safari des Amis', icon: '🌳', games: ['xy'], methods: ['friend_safari'],
    intro: 'Dans le Safari des Amis de X / Y, chaque rencontre a 5 tirages shiny au lieu d\'un.',
    needs: ['Avoir battu la Ligue (le Safari est à Batisques).', 'Des amis enregistrés sur ta 3DS : leurs codes ami déterminent les zones et les Pokémon.'],
    steps: ['Choisis une zone où vit le Pokémon voulu.', 'Rencontre-le encore et encore dans les herbes.'],
    tips: ['L\'ajout d\'amis en ligne n\'est plus possible depuis l\'arrêt des services en ligne de la 3DS (avril 2024).'],
    odds: [
      { label: 'Safari des Amis', cfg: { game: 'xy', method: 'friend_safari', opts: {}, charm: false } },
      { label: 'Safari des Amis + Charme', cfg: { game: 'xy', method: 'friend_safari', opts: {}, charm: true } }
    ]
  },
  {
    id: 'hordes', title: 'Hordes', icon: '🐝', games: ['xy', 'oras'], methods: ['horde'],
    intro: 'Une horde, ce sont 5 Pokémon d\'un coup : chacun a sa propre chance d\'être shiny, donc 5 chances par combat.',
    needs: ['Un Pokémon connaissant Doux Parfum (ou du Miel).', 'Une zone où le Pokémon voulu apparaît en horde.'],
    steps: ['Utilise Doux Parfum dans les herbes ou une grotte : une horde apparaît.', 'Regarde les 5 Pokémon, fuis et recommence. Compte +5 par horde (le compteur le fait tout seul).'],
    tips: ['Garde des Huiles pour restaurer les PP de Doux Parfum.'],
    odds: [{ label: 'Par Pokémon de la horde', cfg: { game: 'xy', method: 'horde', opts: {}, charm: false } }, { label: 'Par Pokémon, avec le Charme', cfg: { game: 'xy', method: 'horde', opts: {}, charm: true } }]
  },
  {
    id: 'dexnav', title: 'Navi-Dex', icon: '🔍', games: ['oras'], methods: ['dexnav'],
    intro: 'Dans Rubis Oméga / Saphir Alpha, le Navi-Dex révèle des Pokémon cachés. Plus tu en rencontres de la même espèce, meilleures sont les chances.',
    needs: ['Avoir déjà vu le Pokémon dans la zone.'],
    steps: [
      'Sélectionne le Pokémon dans le Navi-Dex : il apparaît caché dans les herbes, dans l\'eau ou dans une grotte.',
      'Approche-toi très lentement (incline à peine le stick) : s\'il s\'enfuit, la chaîne casse.',
      'Chaque rencontre réussie fait monter la chaîne et le niveau de recherche de l\'espèce.'
    ],
    tips: ['Les rencontres n° 50 et 100 de la chaîne ont un bonus.', 'Le niveau de recherche augmente aussi les chances, mais l\'app ne le compte pas.'],
    odds: [{ label: 'Taux moyen de l\'app (bonus de chaîne compris)', cfg: { game: 'oras', method: 'dexnav', opts: {}, charm: false } }, { label: 'Avec le Charme', cfg: { game: 'oras', method: 'dexnav', opts: {}, charm: true } }]
  },
  {
    id: 'sos', title: 'Appels à l\'aide (SOS)', icon: '📣', games: ['sm', 'usum'], methods: ['sos'],
    intro: 'Dans Soleil / Lune et Ultra-Soleil / Ultra-Lune, un Pokémon sauvage peut appeler un allié. Les tirages shiny augmentent avec le nombre d\'appels consécutifs.',
    needs: [
      'L\'objet « Adrenaline Orb » (nom anglais), vendu en boutique : il pousse à appeler à l\'aide.',
      'Un Pokémon connaissant Faux-Chage, pour laisser le Pokémon appelant à 1 PV sans le mettre KO.',
      'Des Huiles ou Huiles Max pour les PP : un Pokémon sans PP utiliserait Lutte et pourrait tout casser.'
    ],
    steps: [
      'Commence un combat contre l\'espèce voulue, baisse ses PV avec Faux-Chage et utilise l\'Adrenaline Orb.',
      'Laisse-le appeler, mets KO l\'allié arrivé (jamais le Pokémon qui appelle) et recommence.',
      'Les alliés peuvent être shiny : le bonus augmente après 10, 20 et 30 appels.'
    ],
    tips: ['Ne capture pas et ne mets pas KO le Pokémon qui appelle : la chaîne s\'arrêterait.'],
    odds: [
      { label: 'Chaîne de 31 et plus', cfg: { game: 'usum', method: 'sos', opts: {}, charm: false }, chain: 31 },
      { label: 'Chaîne de 31 et plus + Charme', cfg: { game: 'usum', method: 'sos', opts: {}, charm: true }, chain: 31 }
    ]
  },
  {
    id: 'catch-combo', title: 'Combo Capture', icon: '🎯', games: ['letsgo'], methods: ['catch_combo'],
    intro: 'Dans Let\'s Go, capturer la même espèce à la suite fait monter le combo, et avec lui les chances shiny.',
    needs: ['Beaucoup de Poké Balls.', 'Un Parfum pour un tirage de plus (facultatif).'],
    steps: [
      'Capture le Pokémon voulu encore et encore : chaque capture ajoute 1 au combo.',
      'Fuir face à une autre espèce ne casse pas le combo ; en capturer une autre le casse, tout comme laisser fuir l\'espèce visée.',
      'Les shiny sont visibles directement sur la carte.'
    ],
    tips: ['Le bonus augmente après 10, 20 et 30 captures.'],
    odds: [
      { label: 'Combo de 31 et plus', cfg: { game: 'letsgo', method: 'catch_combo', opts: {}, charm: false }, chain: 31 },
      { label: 'Combo 31 + Parfum + Charme', cfg: { game: 'letsgo', method: 'catch_combo', opts: { lure: true }, charm: true }, chain: 31 }
    ]
  },
  {
    id: 'dynamax', title: 'Expéditions Dynamax', icon: '🌀', games: ['swsh'], methods: ['dynamax'],
    intro: 'Dans le Grand Antre (Terres Enneigées, Épée / Bouclier), chaque Pokémon d\'une expédition a un taux shiny fixe très élevé.',
    needs: ['L\'extension Terres Enneigées.', 'Le Charme Chroma, qui triple les chances.'],
    steps: [
      'Lance une expédition et choisis le légendaire visé.',
      'Gagne les combats jusqu\'au légendaire : à la fin, tu ne gardes qu\'un seul Pokémon capturé.',
      'Les shiny se voient sur l\'écran de choix final.'
    ],
    tips: ['Si tu perds, l\'expédition s\'arrête : prends des Pokémon solides.'],
    odds: [
      { label: 'Sans Charme', cfg: { game: 'swsh', method: 'dynamax', opts: {}, charm: false } },
      { label: 'Avec le Charme Chroma', cfg: { game: 'swsh', method: 'dynamax', opts: {}, charm: true } }
    ]
  },
  {
    id: 'pla', title: 'Légendes Arceus : apparitions massives', icon: '📜', games: ['pla'], methods: ['pla_wild', 'pla_mo', 'pla_mmo'],
    intro: 'Dans Légendes Pokémon : Arceus, la recherche du Pokédex, le Charme Chroma et les apparitions massives se cumulent.',
    needs: [
      'La recherche du Pokémon au niveau 10, puis « parfaite » (toutes les tâches).',
      'Le Charme Chroma : il s\'obtient quand toutes les entrées du Pokédex sont au niveau 10.'
    ],
    steps: [
      'Cherche une apparition massive (ou une Mégapparition après l\'histoire) de l\'espèce voulue.',
      'Capture ou mets KO les Pokémon pour faire arriver les vagues suivantes.',
      'Un son et une étincelle signalent un shiny tout proche.'
    ],
    tips: ['Les apparitions massives donnent beaucoup plus de tirages que les Mégapparitions.'],
    odds: [
      { label: 'Sauvage, recherche parfaite + Charme', cfg: { game: 'pla', method: 'pla_wild', opts: { research: 3 }, charm: true } },
      { label: 'Mégapparition, recherche parfaite + Charme', cfg: { game: 'pla', method: 'pla_mmo', opts: { research: 3 }, charm: true } },
      { label: 'Apparition massive, recherche parfaite + Charme', cfg: { game: 'pla', method: 'pla_mo', opts: { research: 3 }, charm: true } }
    ]
  },
  {
    id: 'za', title: 'Légendes Z-A : relancer les apparitions', icon: '🧭', games: ['za'], methods: ['za_fasttravel', 'za_bench', 'za_stairs', 'za_wild', 'za_fossil'],
    intro: 'Dans Légendes Pokémon : Z-A, on fait réapparaître les Pokémon d\'une zone encore et encore, avec le Charme Chroma et, dans Mega Dimension, un donut Aura Brillance.',
    needs: ['Le Charme Chroma.', 'Pour Brillance : l\'extension Mega Dimension et un donut aux baies sucrées (voir Recettes, résultat aléatoire).'],
    steps: [
      'Téléportation en boucle : téléporte-toi vers un point à moins de 50 m des apparitions ; chaque voyage relance les Pokémon (le plus rapide).',
      'Banc : s\'asseoir fait passer du jour à la nuit et relance les apparitions dans un rayon de 50 m.',
      'Escalier de la Zone Sauvage 3 : monter et descendre l\'escalier du pilier relance les apparitions.',
      'Dans l\'app, règle le nombre de Pokémon visés par cycle : le taux par cycle en tient compte.'
    ],
    tips: ['Le Charme Chroma ne s\'applique pas aux fossiles.'],
    odds: [
      { label: 'Une apparition, avec le Charme', cfg: { game: 'za', method: 'za_wild', opts: {}, charm: true } },
      { label: 'Avec le Charme + donut Brillance Nv. 3', cfg: { game: 'za', method: 'za_wild', opts: { sparkling: 3 }, charm: true } }
    ]
  },
  {
    id: 'raids', title: 'Raids', icon: '💎', games: ['sv', 'swsh'], methods: ['raid'],
    intro: 'Les Pokémon de raid ont un taux fixe : le Charme Chroma n\'y change rien.',
    needs: ['Des raids de l\'espèce voulue (certains évènements de raid sont garantis shiny : voir Agenda).'],
    steps: [
      'Rejoins ou lance le raid : un Pokémon shiny apparaît shiny pendant le combat (la Téracristallisation peut le rendre difficile à repérer : regarde bien).',
      'Le statut shiny est fixé dès l\'apparition du cristal de raid : recommencer le même raid ne change rien.'
    ],
    tips: ['Les raids 7★ (Marque du Puissant) ne peuvent pas être shiny.'],
    odds: [{ label: 'Raid', cfg: { game: 'sv', method: 'raid', opts: {}, charm: false } }]
  },
  {
    id: 'reset', title: 'Soft Reset et rencontres simples', icon: '🔄', games: ['za', 'sv', 'bdsp', 'swsh', 'letsgo', 'usum', 'sm', 'oras', 'xy', 'b2w2', 'bw', 'hgss', 'dpp', 'rse', 'frlg', 'gsc'], methods: ['reset', 'wild'],
    intro: 'Pour un Pokémon fixe (légendaire, cadeau, starter) : sauvegarder juste avant, vérifier, et relancer le jeu tant qu\'il n\'est pas shiny.',
    needs: ['Une sauvegarde juste avant la rencontre ou le cadeau.'],
    steps: [
      'Sauvegarde devant le Pokémon.',
      'Lance la rencontre et regarde s\'il est shiny.',
      'Sinon, relance le jeu sans sauvegarder (sur Switch : touche HOME, puis fermer le logiciel).'
    ],
    tips: ['Vérifie sur la fiche du Pokémon qu\'il n\'est pas Shiny Lock dans ce jeu avant de te lancer.', 'Le taux de base est de 1/8192 jusqu\'à la 5e génération, 1/4096 ensuite.'],
    odds: [
      { label: 'Gen 2 à 5', cfg: { game: 'hgss', method: 'reset', opts: {}, charm: false } },
      { label: 'Gen 6 et +', cfg: { game: 'sv', method: 'reset', opts: {}, charm: false } },
      { label: 'Gen 6 et +, avec le Charme', cfg: { game: 'sv', method: 'reset', opts: {}, charm: true } }
    ]
  }
];

export const GUIDE_BY_ID = Object.fromEntries(GUIDES.map(g => [g.id, g]));

/**
 * Tuto d'une méthode de l'app (lien depuis une chasse).
 * @param {string} methodId
 * @returns {Guide | undefined}
 */
export const guideForMethod = methodId => GUIDES.find(g => g.methods.includes(methodId));
