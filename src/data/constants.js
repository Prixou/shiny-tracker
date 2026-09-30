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

export { GAMES, GAME_BY_ID, isLockedIn } from './games.js';
export { METHODS as SHINY_METHODS, METHOD_BY_ID, gameMethods } from './methods.js';

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

// Chaque région est représentée par les légendaires de jaquette de ses jeux (comme sur les supports officiels).
export const REGIONS = [
  { id: 'kanto', name: 'Kanto', mascots: [6, 9], gen: 1, range: [1, 151] },
  { id: 'johto', name: 'Johto', mascots: [250, 249], gen: 2, range: [152, 251] },
  { id: 'hoenn', name: 'Hoenn', mascots: [383, 382], gen: 3, range: [252, 386] },
  { id: 'sinnoh', name: 'Sinnoh', mascots: [483, 484], gen: 4, range: [387, 493] },
  { id: 'unova', name: 'Unys', mascots: [643, 644], gen: 5, range: [494, 649] },
  { id: 'kalos', name: 'Kalos', mascots: [716, 717], gen: 6, range: [650, 721] },
  { id: 'alola', name: 'Alola', mascots: [791, 792], gen: 7, range: [722, 809] },
  { id: 'galar', name: 'Galar', mascots: [888, 889], gen: 8, range: [810, 898] },
  { id: 'hisui', name: 'Hisui', mascots: [493], gen: 8, range: [899, 905] },
  { id: 'paldea', name: 'Paldea', mascots: [1007, 1008], gen: 9, range: [906, 1025] },
  { id: 'gen10', name: 'Génération 10', mascots: [], gen: 10, range: [1026, 1300] }
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
