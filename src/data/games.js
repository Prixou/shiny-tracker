// Jeux suivis. `base` = taux de base (1/x), `charm` = tirages ajoutés par le Charme Chroma (0 = absent),
// `dexes` = Pokédex régionaux PokéAPI définissant les Pokémon disponibles (null = tous),
// `forms` = régions dont les formes régionales sont présentes, `methods` = méthodes proposées.
export const GAMES = [
  { id: 'za', platform: 'switch', name: 'Légendes Pokémon : Z-A (+ Mega Dimension)', short: 'Z-A', icon: '🗼', gen: 9, base: 4096, charm: 3,
    dexes: ['lumiose-city', 'hyperspace'], forms: ['alola', 'galar', 'hisui', 'paldea'],
    methods: ['za_fasttravel', 'za_bench', 'za_stairs', 'za_wild', 'za_fossil', 'reset', 'other'],
    tip: 'Charme Chroma (×4) + donut Brillance Nv.3 : environ 1/586.' },
  { id: 'sv', platform: 'switch', name: 'Écarlate / Violet', short: 'ÉV', icon: '🍇', gen: 9, base: 4096, charm: 2,
    dexes: ['paldea', 'kitakami', 'blueberry'], forms: ['alola', 'galar', 'hisui', 'paldea'],
    methods: ['sv_wild', 'masuda', 'egg', 'raid', 'reset', 'other'],
    tip: 'Apparition massive (60 KO) + sandwich Brillance Nv.3 + Charme : 1/512.' },
  { id: 'champions', platform: 'switch', name: 'Pokémon Champions', short: 'Champ.', icon: '🏆', gen: 9, base: 4096, charm: 0,
    dexes: ['champions'], forms: ['alola', 'galar', 'hisui', 'paldea'], methods: ['other'],
    tip: 'Des shiny peuvent apparaître au recrutement du Ranch ; les taux ne sont pas documentés.' },
  { id: 'pla', platform: 'switch', name: 'Légendes Pokémon : Arceus', short: 'LPA', icon: '📜', gen: 8, base: 4096, charm: 3,
    dexes: ['hisui'], forms: ['hisui'], methods: ['pla_wild', 'pla_mo', 'pla_mmo', 'other'],
    tip: 'Apparition massive + recherche parfaite + Charme : 1/128.' },
  { id: 'bdsp', platform: 'switch', name: 'Diamant Étincelant / Perle Scintillante', short: 'DEPS', icon: '💎', gen: 8, base: 4096, charm: 2,
    dexes: ['extended-sinnoh'], extra: [144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384],
    forms: [], methods: ['radar', 'wild', 'masuda', 'egg', 'reset', 'other'],
    tip: 'Poké Radar chaîne 40 : environ 1/99.' },
  { id: 'swsh', platform: 'switch', name: 'Épée / Bouclier', short: 'EB', icon: '⚔️', gen: 8, base: 4096, charm: 2,
    dexes: ['galar', 'isle-of-armor', 'crown-tundra'], forms: ['alola', 'galar'],
    methods: ['dynamax', 'masuda', 'wild', 'egg', 'raid', 'reset', 'other'],
    tip: 'Expéditions Dynamax : 1/100 avec le Charme.' },
  { id: 'letsgo', platform: 'switch', name: 'Let\'s Go Pikachu / Évoli', short: 'LGPE', icon: '⚡', gen: 7, base: 4096, charm: 2,
    dexes: ['letsgo-kanto'], extra: [808, 809], forms: ['alola'], methods: ['catch_combo', 'wild', 'reset', 'other'],
    tip: 'Combo Capture 31+ avec Parfum et Charme : 1/273.' },
  { id: 'usum', platform: '3ds', name: 'Ultra-Soleil / Ultra-Lune', short: 'USUL', icon: '☀️', gen: 7, base: 4096, charm: 2,
    dexes: ['updated-alola'], forms: ['alola'], methods: ['sos', 'masuda', 'wild', 'egg', 'reset', 'other'],
    tip: 'Chaîne d\'appels à l\'aide 31+ avec Charme : 1/273.' },
  { id: 'sm', platform: '3ds', name: 'Soleil / Lune', short: 'SL', icon: '🌺', gen: 7, base: 4096, charm: 2,
    dexes: ['original-alola'], forms: ['alola'], methods: ['sos', 'masuda', 'wild', 'egg', 'reset', 'other'],
    tip: 'Chaîne d\'appels à l\'aide 31+ avec Charme : 1/273.' },
  { id: 'oras', platform: '3ds', name: 'Rubis Oméga / Saphir Alpha', short: 'ROSA', icon: '🌋', gen: 6, base: 4096, charm: 2,
    dexes: ['updated-hoenn'], forms: [], methods: ['chain_fishing', 'dexnav', 'horde', 'masuda', 'wild', 'egg', 'reset', 'other'],
    tip: 'Pêche à la chaîne (20+) : environ 1/100.' },
  { id: 'xy', platform: '3ds', name: 'X / Y', short: 'XY', icon: '🏰', gen: 6, base: 4096, charm: 2,
    dexes: ['kalos-central', 'kalos-coastal', 'kalos-mountain'], forms: [],
    methods: ['chain_fishing', 'radar', 'friend_safari', 'horde', 'masuda', 'wild', 'egg', 'reset', 'other'],
    tip: 'Pêche à la chaîne ou Poké Radar : environ 1/100.' },
  { id: 'b2w2', platform: 'ds', name: 'Noir 2 / Blanc 2', short: 'N2B2', icon: '🏙️', gen: 5, base: 8192, charm: 2,
    dexes: ['updated-unova'], forms: [], methods: ['masuda', 'wild', 'egg', 'reset', 'other'],
    tip: 'Masuda + Charme Chroma : 1/1024.' },
  { id: 'bw', platform: 'ds', name: 'Noir / Blanc', short: 'NB', icon: '⬛', gen: 5, base: 8192, charm: 0,
    dexes: ['original-unova'], forms: [], methods: ['masuda', 'wild', 'egg', 'reset', 'other'],
    tip: 'Méthode Masuda : 1/1365.' },
  { id: 'hgss', platform: 'ds', name: 'HeartGold / SoulSilver', short: 'HGSS', icon: '🌙', gen: 4, base: 8192, charm: 0,
    dexes: ['updated-johto'], forms: [], methods: ['masuda', 'wild', 'egg', 'reset', 'other'],
    tip: 'Méthode Masuda : 1/1638.' },
  { id: 'dpp', platform: 'ds', name: 'Diamant / Perle / Platine', short: 'DPPt', icon: '❄️', gen: 4, base: 8192, charm: 0,
    dexes: ['extended-sinnoh'], forms: [], methods: ['radar', 'masuda', 'wild', 'egg', 'reset', 'other'],
    tip: 'Poké Radar chaîne 40 : 1/200.' },
  { id: 'rse', platform: 'gba', name: 'Rubis / Saphir / Émeraude', short: 'RSE', icon: '🌊', gen: 3, base: 8192, charm: 0,
    dexes: ['hoenn'], forms: [], methods: ['wild', 'reset', 'egg', 'other'],
    tip: 'Pleine chance uniquement : 1/8192.' },
  { id: 'frlg', platform: 'gba', name: 'Rouge Feu / Vert Feuille (GBA · Switch 2026)', short: 'RFVF', icon: '🔥', gen: 3, base: 8192, charm: 0,
    dexes: ['kanto'], forms: [], methods: ['reset', 'wild', 'egg', 'other'],
    tip: '1/8192 fixe, sans Charme ni Masuda (y compris sur Switch).' },
  { id: 'gsc', platform: 'gb', vc3ds: true, name: 'Or / Argent / Cristal (GB · Console virtuelle 3DS)', short: 'OAC', icon: '📀', gen: 2, base: 8192, charm: 0,
    dexes: ['original-johto'], forms: [], methods: ['wild', 'reset', 'egg', 'other'],
    tip: '1/8192 en pleine chance. Sur 3DS (Console virtuelle), transférable vers Pokémon Banque puis HOME.' },
  { id: 'rbj', platform: 'gb', vc3ds: true, name: 'Rouge / Bleu / Jaune (GB · Console virtuelle 3DS)', short: 'RBJ', icon: '🔴', gen: 1, base: 8192, charm: 0,
    dexes: ['kanto'], forms: [], methods: ['other'],
    tip: 'Pas de shiny en Gen 1. Sur 3DS (Console virtuelle), le transfert via Pokébank vers Soleil / Lune rend shiny les Pokémon aux bons DV.' },
  { id: 'pogo', platform: 'mobile', name: 'Pokémon GO', short: 'GO', icon: '📱', gen: 9, base: 512, charm: 0,
    dexes: null, forms: ['alola', 'galar', 'hisui', 'paldea'], methods: ['go_standard', 'go_boosted', 'go_cday', 'go_raid', 'other'],
    tip: 'Community Day : environ 1/25 ; raids légendaires : environ 1/20.' },
  { id: 'other', platform: 'other', name: 'Autre / Évènement', short: 'Autre', icon: '🎁', gen: 9, base: 4096, charm: 0,
    dexes: null, forms: ['alola', 'galar', 'hisui', 'paldea'], methods: ['event', 'other'] }
];

export const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));
/** Identifiant de jeu à partir d'un identifiant ou d'un nom complet (anciennes sauvegardes) ; '' si inconnu. */
export const gameIdFrom = g => (GAME_BY_ID[g] ? g : (GAMES.find(x => x.name === g)?.id || ''));

// Consoles, dans l'ordre d'affichage des menus. Les jeux GB sont aussi sur 3DS (Console virtuelle).
export const PLATFORMS = [
  { id: 'switch', name: 'Nintendo Switch' },
  { id: '3ds', name: 'Nintendo 3DS' },
  { id: 'ds', name: 'Nintendo DS' },
  { id: 'gba', name: 'Game Boy Advance' },
  { id: 'gb', name: 'Game Boy (Console virtuelle 3DS)' },
  { id: 'mobile', name: 'Mobile' },
  { id: 'other', name: 'Autre' }
];
export const gamesOnPlatform = platform => GAMES.filter(g => g.platform === platform || (platform === '3ds' && g.vc3ds));

export const ALL_DEX_NAMES = [...new Set(GAMES.flatMap(g => g.dexes || []))];

// Shiny Lock propres à certains jeux (indicatif). Les Fabuleux sont bloqués partout hors distribution.
const GAME_LOCKS = {
  sv: { legends: true },
  pla: { legends: true },
  za: { legends: true, allow: [380, 381, 638, 639, 640] },
  swsh: { ids: [888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898] },
  usum: { ids: [785, 786, 787, 788, 789, 790, 800] },
  sm: { ids: [785, 786, 787, 788, 789, 790, 791, 792] },
  xy: { ids: [716, 717] },
  b2w2: { ids: [643, 644, 646] },
  bw: { ids: [494, 643, 644] }
};

export function isLockedIn(p, gameId) {
  if (!gameId || gameId === 'all') return p.isShinyLocked;
  if (gameId === 'pogo' || gameId === 'other') return false;
  if (p.isShinyLocked || p.isMythical) return true;
  const rule = GAME_LOCKS[gameId];
  if (!rule) return false;
  if (rule.legends && p.isLegendary && !(rule.allow || []).includes(p.baseId)) return true;
  return (rule.ids || []).includes(p.baseId);
}

// Jeux où les Méga-Évolutions / formes Gigamax existent.
export const MEGA_GAMES = ['xy', 'oras', 'sm', 'usum', 'letsgo', 'za', 'pogo', 'other'];
export const GMAX_GAMES = ['swsh', 'pogo', 'other'];
