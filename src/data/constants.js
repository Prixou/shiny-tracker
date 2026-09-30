export const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites';

export const POKEMON_TYPES = [
  { id: 'normal', name: 'Normal', color: '#A8A77A' },
  { id: 'fire', name: 'Feu', color: '#EE8130' },
  { id: 'water', name: 'Eau', color: '#6390F0' },
  { id: 'grass', name: 'Plante', color: '#7AC74C' },
  { id: 'electric', name: 'Électrik', color: '#F7D02C' },
  { id: 'ice', name: 'Glace', color: '#96D9D6' },
  { id: 'fighting', name: 'Combat', color: '#C22E28' },
  { id: 'poison', name: 'Poison', color: '#A33EA1' },
  { id: 'ground', name: 'Sol', color: '#E2BF65' },
  { id: 'flying', name: 'Vol', color: '#A98FF3' },
  { id: 'psychic', name: 'Psy', color: '#F95587' },
  { id: 'bug', name: 'Insecte', color: '#A6B91A' },
  { id: 'rock', name: 'Roche', color: '#B6A136' },
  { id: 'ghost', name: 'Spectre', color: '#735797' },
  { id: 'dragon', name: 'Dragon', color: '#6F35FC' },
  { id: 'dark', name: 'Ténèbres', color: '#705746' },
  { id: 'steel', name: 'Acier', color: '#B7B7CE' },
  { id: 'fairy', name: 'Fée', color: '#D685AD' }
];
export const TYPE_BY_ID = Object.fromEntries(POKEMON_TYPES.map(t => [t.id, t]));

// `maxGen` sert au filtre « Jeu » du Pokédex : on masque les espèces des générations suivantes.
export const GAMES = [
  { id: 'za', name: 'Légendes Pokémon : Z-A', short: 'Z-A', icon: '🗼', maxGen: 9, bestMethod: 'Réapparitions sauvages + Charme Chroma' },
  { id: 'sv', name: 'Écarlate / Violet', short: 'ÉV', icon: '🍇', maxGen: 9, bestMethod: 'Apparition massive + Sandwich Brillance Nv.3' },
  { id: 'pla', name: 'Légendes Pokémon : Arceus', short: 'LPA', icon: '📜', maxGen: 8, bestMethod: 'Apparitions massives / Mégapparitions' },
  { id: 'bdsp', name: 'Diamant Étincelant / Perle Scintillante', short: 'DEPS', icon: '💎', maxGen: 4, bestMethod: 'Poké Radar (chaîne 40)' },
  { id: 'swsh', name: 'Épée / Bouclier', short: 'EB', icon: '⚔️', maxGen: 8, bestMethod: 'Expéditions Dynamax (1/100 avec Charme)' },
  { id: 'letsgo', name: 'Let\'s Go Pikachu / Évoli', short: 'LGPE', icon: '⚡', maxGen: 1, bestMethod: 'Combo Capture + Parfum' },
  { id: 'usum', name: 'Ultra-Soleil / Ultra-Lune', short: 'USUL', icon: '☀️', maxGen: 7, bestMethod: 'Appels à l\'aide (SOS)' },
  { id: 'sm', name: 'Soleil / Lune', short: 'SL', icon: '🌺', maxGen: 7, bestMethod: 'Appels à l\'aide (SOS)' },
  { id: 'oras', name: 'Rubis Oméga / Saphir Alpha', short: 'ROSA', icon: '🌋', maxGen: 6, bestMethod: 'Navi-Dex / Masuda' },
  { id: 'xy', name: 'X / Y', short: 'XY', icon: '🏰', maxGen: 6, bestMethod: 'Safari des Amis / Pêche à la chaîne' },
  { id: 'b2w2', name: 'Noir 2 / Blanc 2', short: 'N2B2', icon: '🏙️', maxGen: 5, bestMethod: 'Méthode Masuda + Charme Chroma' },
  { id: 'bw', name: 'Noir / Blanc', short: 'NB', icon: '⬛', maxGen: 5, bestMethod: 'Méthode Masuda' },
  { id: 'hgss', name: 'HeartGold / SoulSilver', short: 'HGSS', icon: '🌙', maxGen: 4, bestMethod: 'Soft Reset / Rencontres' },
  { id: 'dpp', name: 'Diamant / Perle / Platine', short: 'DPPt', icon: '❄️', maxGen: 4, bestMethod: 'Poké Radar (chaîne 40)' },
  { id: 'rse', name: 'Rubis / Saphir / Émeraude', short: 'RSE', icon: '🌊', maxGen: 3, bestMethod: 'Soft Reset / Rencontres sauvages' },
  { id: 'frlg', name: 'Rouge Feu / Vert Feuille', short: 'RFVF', icon: '🔥', maxGen: 3, bestMethod: 'Soft Reset / Rencontres sauvages' },
  { id: 'gsc', name: 'Or / Argent / Cristal', short: 'OAC', icon: '📀', maxGen: 2, bestMethod: 'Reproduction d\'un parent shiny (1/64)' },
  { id: 'rbj', name: 'Rouge / Bleu / Jaune', short: 'RBJ', icon: '🔴', maxGen: 1, bestMethod: 'Transfert vers la Gen 2 (DV)' },
  { id: 'pogo', name: 'Pokémon GO', short: 'GO', icon: '📱', maxGen: 9, bestMethod: 'Community Days / Raids' },
  { id: 'other', name: 'Autre / Évènement', short: 'Autre', icon: '🎁', maxGen: 9 }
];
export const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

// Taux moyens (1/x) sans et avec Charme Chroma. Les valeurs restent éditables dans chaque chasse.
export const SHINY_METHODS = [
  { id: 'wild', name: 'Rencontre sauvage', icon: '🌿', odds: 4096, charmOdds: 1365 },
  { id: 'reset', name: 'Soft Reset', icon: '🔄', odds: 4096, charmOdds: 1365 },
  { id: 'masuda', name: 'Méthode Masuda', icon: '🥚', odds: 683, charmOdds: 512 },
  { id: 'egg', name: 'Œufs (sans Masuda)', icon: '🐣', odds: 4096, charmOdds: 1365 },
  { id: 'outbreak', name: 'Apparition massive (60+ KO)', icon: '✨', odds: 1365, charmOdds: 819 },
  { id: 'sandwich', name: 'Sandwich Brillance Nv.3', icon: '🥪', odds: 1024, charmOdds: 683 },
  { id: 'outbreak_sandwich', name: 'Apparition massive + Sandwich', icon: '🌟', odds: 683, charmOdds: 512 },
  { id: 'mmo', name: 'Mégapparition (LPA)', icon: '📜', odds: 158, charmOdds: 128 },
  { id: 'dynamax', name: 'Expédition Dynamax', icon: '🌀', odds: 300, charmOdds: 100 },
  { id: 'raid', name: 'Raid Téracristal / Dynamax', icon: '💎', odds: 4096, charmOdds: 4096 },
  { id: 'pokeradar', name: 'Poké Radar (chaîne 40)', icon: '📡', odds: 99, charmOdds: 99 },
  { id: 'sos', name: 'Appels à l\'aide (SOS 31+)', icon: '📣', odds: 315, charmOdds: 273 },
  { id: 'chaining', name: 'Pêche / Combo Capture', icon: '🎣', odds: 315, charmOdds: 273 },
  { id: 'navidex', name: 'Navi-Dex / Safari des Amis', icon: '🔍', odds: 512, charmOdds: 512 },
  { id: 'pogo', name: 'Pokémon GO (standard)', icon: '📱', odds: 500, charmOdds: 500 },
  { id: 'cday', name: 'Community Day (GO)', icon: '🎉', odds: 25, charmOdds: 25 },
  { id: 'event', name: 'Distribution / Évènement', icon: '🎁', odds: 1, charmOdds: 1 },
  { id: 'other', name: 'Autre', icon: '❔', odds: 4096, charmOdds: 1365 }
];
export const METHOD_BY_ID = Object.fromEntries(SHINY_METHODS.map(m => [m.id, m]));

export const methodOdds = (methodId, charm) => {
  const m = METHOD_BY_ID[methodId] || SHINY_METHODS[0];
  return charm ? m.charmOdds : m.odds;
};

// `id` = clé de sauvegarde (compatibilité v1), `item` = sprite PokéAPI.
export const POKE_BALLS = [
  { id: 'pokeball', name: 'Poké Ball', item: 'poke-ball' },
  { id: 'superball', name: 'Super Ball', item: 'great-ball' },
  { id: 'hyperball', name: 'Hyper Ball', item: 'ultra-ball' },
  { id: 'masterball', name: 'Master Ball', item: 'master-ball' },
  { id: 'honorball', name: 'Honor Ball', item: 'premier-ball' },
  { id: 'luxeball', name: 'Luxe Ball', item: 'luxury-ball' },
  { id: 'soinball', name: 'Soin Ball', item: 'heal-ball' },
  { id: 'filetball', name: 'Filet Ball', item: 'net-ball' },
  { id: 'scubaball', name: 'Scuba Ball', item: 'dive-ball' },
  { id: 'faibloball', name: 'Faiblo Ball', item: 'nest-ball' },
  { id: 'bisball', name: 'Bis Ball', item: 'repeat-ball' },
  { id: 'chronoball', name: 'Chrono Ball', item: 'timer-ball' },
  { id: 'sombreball', name: 'Sombre Ball', item: 'dusk-ball' },
  { id: 'rapideball', name: 'Rapide Ball', item: 'quick-ball' },
  { id: 'memoireball', name: 'Mémoire Ball', item: 'cherish-ball' },
  { id: 'luneball', name: 'Lune Ball', item: 'moon-ball' },
  { id: 'copainball', name: 'Copain Ball', item: 'friend-ball' },
  { id: 'loveball', name: 'Love Ball', item: 'love-ball' },
  { id: 'niveauball', name: 'Niveau Ball', item: 'level-ball' },
  { id: 'appatball', name: 'Appât Ball', item: 'lure-ball' },
  { id: 'masseball', name: 'Masse Ball', item: 'heavy-ball' },
  { id: 'speedball', name: 'Speed Ball', item: 'fast-ball' },
  { id: 'competball', name: 'Compét\'Ball', item: 'sport-ball' },
  { id: 'safariball', name: 'Safari Ball', item: 'safari-ball' },
  { id: 'reveball', name: 'Rêve Ball', item: 'dream-ball' },
  { id: 'ultraball', name: 'Ultra Ball', item: 'beast-ball' },
  { id: 'parcball', name: 'Parc Ball', item: 'park-ball' }
];
export const BALL_BY_ID = Object.fromEntries(POKE_BALLS.map(b => [b.id, b]));
export const ballSprite = id => `${SPRITES}/items/${(BALL_BY_ID[id] || POKE_BALLS[0]).item}.png`;

export const REGIONS = [
  { id: 'kanto', name: 'Kanto', icon: '🔴', gen: 1, range: [1, 151] },
  { id: 'johto', name: 'Johto', icon: '🌙', gen: 2, range: [152, 251] },
  { id: 'hoenn', name: 'Hoenn', icon: '🌿', gen: 3, range: [252, 386] },
  { id: 'sinnoh', name: 'Sinnoh', icon: '❄️', gen: 4, range: [387, 493] },
  { id: 'unova', name: 'Unys', icon: '🏙️', gen: 5, range: [494, 649] },
  { id: 'kalos', name: 'Kalos', icon: '🏰', gen: 6, range: [650, 721] },
  { id: 'alola', name: 'Alola', icon: '🌺', gen: 7, range: [722, 809] },
  { id: 'galar', name: 'Galar', icon: '🛡️', gen: 8, range: [810, 898] },
  { id: 'hisui', name: 'Hisui', icon: '📜', gen: 8, range: [899, 905] },
  { id: 'paldea', name: 'Paldea', icon: '🍇', gen: 9, range: [906, 1025] }
];
export const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));

export const regionForId = id => (REGIONS.find(r => id >= r.range[0] && id <= r.range[1]) || REGIONS[REGIONS.length - 1]).id;
export const genForId = id => REGION_BY_ID[regionForId(id)].gen;

export const STARTER_IDS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 25, 133,
  152, 153, 154, 155, 156, 157, 158, 159, 160,
  252, 253, 254, 255, 256, 257, 258, 259, 260,
  387, 388, 389, 390, 391, 392, 393, 394, 395,
  495, 496, 497, 498, 499, 500, 501, 502, 503,
  650, 651, 652, 653, 654, 655, 656, 657, 658,
  722, 723, 724, 725, 726, 727, 728, 729, 730,
  810, 811, 812, 813, 814, 815, 816, 817, 818,
  906, 907, 908, 909, 910, 911, 912, 913, 914
]);

// Pokémon qu'on ne peut pas obtenir chromatiques en jeu autrement que par distribution.
export const SHINY_LOCKED_IDS = new Set([
  494, 647, 648, 720, 721, 789, 790, 801, 802, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905,
  1001, 1002, 1003, 1004, 1007, 1008, 1009, 1010, 1014, 1015, 1016, 1017,
  1020, 1021, 1022, 1023, 1024, 1025
]);

export const TABS = ['dex', 'hunts', 'journal', 'stats', 'tools'];
