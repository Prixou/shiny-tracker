import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Search, Trophy, BarChart3, 
  Layers, Dices, Calculator, Check, Trash2, 
  Plus, Timer, PlusCircle, BookOpen,
  X, QrCode, AlertTriangle, Copy, ShieldAlert,
  Heart, Flame, Droplet, Leaf, Zap, Snowflake, Swords, Skull, Mountain,
  Wind, Eye, Bug, Gem, Ghost, Moon, ShieldCheck, Sparkle, Circle,
  Gamepad2, PieChart, Compass, MapPin, Info
} from 'lucide-react';

const POKEMON_TYPES = [
  { id: 'all', name: 'Tous Types', color: '#64748b' },
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

const TARGET_GAMES = [
  { id: 'all', name: 'Tous les Jeux', icon: '🎮', maxGen: 9 },
  { id: 'sv', name: 'Écarlate / Violet', icon: '🍇', maxGen: 9, hasOutbreaks: true, bestMethod: 'Sandwich Aura Brillance Nv.3' },
  { id: 'pla', name: 'Légendes Arceus', icon: '📜', maxGen: 8, hasOutbreaks: true, bestMethod: 'Apparitions Massives / Mégapparitions' },
  { id: 'bdsp', name: 'Diamant Étincelant / Perle Scintillante', icon: '💎', maxGen: 4, bestMethod: 'Poké Radar (Chaîne 40)' },
  { id: 'swsh', name: 'Épée / Bouclier', icon: '⚔️', maxGen: 8, bestMethod: 'Expéditions Dynamax (1/100)' },
  { id: 'letsgo', name: 'Let\'s Go Pikachu / Évoli', icon: '⚡', maxGen: 1, bestMethod: 'Combo Capture + Parfum' },
  { id: 'usum', name: 'Ultra-Soleil / Ultra-Lune', icon: '☀️', maxGen: 7, bestMethod: 'Méthode Masuda / Intimidation SOS' },
  { id: 'sm', name: 'Soleil / Lune', icon: '🌺', maxGen: 7, bestMethod: 'Intimidation SOS Battles' },
  { id: 'oras', name: 'Rubis Oméga / Saphir Alpha', icon: '🌋', maxGen: 6, bestMethod: 'Navi-Dex / Masuda' },
  { id: 'xy', name: 'X / Y', icon: '🏰', maxGen: 6, bestMethod: 'Safari des Amis / Pêche à la chaîne' },
  { id: 'b2w2', name: 'Noir 2 / Blanc 2', icon: '🏙️', maxGen: 5, bestMethod: 'Méthode Masuda + Charm Chroma' },
  { id: 'bw', name: 'Noir / Blanc', icon: '⬛', maxGen: 5, bestMethod: 'Méthode Masuda' },
  { id: 'hgss', name: 'HeartGold / SoulSilver', icon: '🌙', maxGen: 4, bestMethod: 'Soft Reset Starters / Rencontres' },
  { id: 'dpp', name: 'Diamant / Perle / Platine', icon: '❄️', maxGen: 4, bestMethod: 'Poké Radar (Chaîne 40)' },
  { id: 'rse', name: 'Rubis / Saphir / Émeraude', icon: '🌋', maxGen: 3, bestMethod: 'Soft Reset / Rencontres Sauvages' },
  { id: 'frlg', name: 'Rouge Feu / Vert Feuille', icon: '🔥', maxGen: 3, bestMethod: 'Soft Reset / Rencontres Sauvages' },
  { id: 'gsc', name: 'Or / Argent / Cristal', icon: '📀', maxGen: 2, bestMethod: 'Reproduction Œuf Shiny (1/64)' },
  { id: 'rbj', name: 'Rouge / Bleu / Jaune', icon: '🔴', maxGen: 1, bestMethod: 'Échange DVB vers Gen 2' },
  { id: 'pogo', name: 'Pokémon GO', icon: '📱', maxGen: 9, bestMethod: 'Community Days / Raids' }
];

const SHINY_LOCKED_IDS = new Set([
  494, 647, 648, 720, 721, 789, 790, 801, 802, 891, 892, 893, 898, 905, 
  1001, 1002, 1003, 1004, 1007, 1008, 1017, 1024, 1025
]);

const TypeIcon = ({ typeId, className = "w-4 h-4" }) => {
  const [imgError, setImgError] = useState(false);

  if (typeId === 'all') return <Circle className={`${className} text-slate-300`} />;

  if (!imgError) {
    return (
      <img
        src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${typeId}.svg`}
        alt={typeId}
        className={`${className} object-contain filter drop-shadow shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  switch (typeId) {
    case 'normal': return <Circle className={className} />;
    case 'fire': return <Flame className={className} />;
    case 'water': return <Droplet className={className} />;
    case 'grass': return <Leaf className={className} />;
    case 'electric': return <Zap className={className} />;
    case 'ice': return <Snowflake className={className} />;
    case 'fighting': return <Swords className={className} />;
    case 'poison': return <Skull className={className} />;
    case 'ground': return <Mountain className={className} />;
    case 'flying': return <Wind className={className} />;
    case 'psychic': return <Eye className={className} />;
    case 'bug': return <Bug className={className} />;
    case 'rock': return <Gem className={className} />;
    case 'ghost': return <Ghost className={className} />;
    case 'dragon': return <Sparkle className={className} />;
    case 'dark': return <Moon className={className} />;
    case 'steel': return <ShieldCheck className={className} />;
    case 'fairy': return <Heart className={className} />;
    default: return <Circle className={className} />;
  }
};

const REGIONS = [
  { id: 'all', name: 'Toutes Régions', icon: '🌐', range: [1, 1025] },
  { id: 'kanto', name: 'Kanto', icon: '🔴', range: [1, 151] },
  { id: 'johto', name: 'Johto', icon: '🌙', range: [152, 251] },
  { id: 'hoenn', name: 'Hoenn', icon: '🌿', range: [252, 386] },
  { id: 'sinnoh', name: 'Sinnoh', icon: '❄️', range: [387, 493] },
  { id: 'unova', name: 'Unys', icon: '🏙️', range: [494, 649] },
  { id: 'kalos', name: 'Kalos', icon: '🏰', range: [650, 721] },
  { id: 'alola', name: 'Alola', icon: '🌺', range: [722, 809] },
  { id: 'galar', name: 'Galar', icon: '🛡️', range: [810, 898] },
  { id: 'hisui', name: 'Hisui', icon: '📜', special: 'hisui' },
  { id: 'paldea', name: 'Paldea', icon: '🍇', range: [899, 1025] },
  { id: 'regionals', name: 'Formes Régionales', icon: '✨', special: 'forms' }
];

const SHINY_METHODS = [
  { id: 'wild', name: 'Rencontre sauvage', icon: '🌿', baseOdds: 4096 },
  { id: 'masuda', name: 'Méthode Masuda', icon: '🥚', baseOdds: 512 },
  { id: 'reset', name: 'Soft Reset', icon: '🔄', baseOdds: 4096 },
  { id: 'outbreak', name: 'Apparition Massive', icon: '✨', baseOdds: 1365 },
  { id: 'pokeradar', name: 'Chasse Poké Radar', icon: '📡', baseOdds: 200 },
  { id: 'sandwich', name: 'Sandwich Aura Brillance', icon: '🥪', baseOdds: 1024 },
  { id: 'raid', name: 'Raid Teracristal / Dynamax', icon: '💎', baseOdds: 4096 },
  { id: 'chaining', name: 'Pêche / Combo Capture', icon: '🎣', baseOdds: 315 },
  { id: 'navidex', name: 'Navi-Dex / Safari', icon: '🔍', baseOdds: 512 }
];

const POKE_BALLS = [
  { id: 'pokeball', name: 'Poké Ball', icon: '🔴' },
  { id: 'superball', name: 'Super Ball', icon: '🔵' },
  { id: 'hyperball', name: 'Hyper Ball', icon: '🟡' },
  { id: 'masterball', name: 'Master Ball', icon: '🟣' },
  { id: 'honorball', name: 'Honor Ball', icon: '⚪' },
  { id: 'luxeball', name: 'Luxe Ball', icon: '🖤' },
  { id: 'masseball', name: 'Masse Ball', icon: '⚙️' },
  { id: 'filetball', name: 'Filet Ball', icon: '🕸️' },
  { id: 'bisball', name: 'Bis Ball', icon: '🔁' },
  { id: 'chronoball', name: 'Chrono Ball', icon: '⏰' },
  { id: 'copainball', name: 'Copain Ball', icon: '💚' },
  { id: 'luneball', name: 'Lune Ball', icon: '🌙' },
  { id: 'reveball', name: 'Rêve Ball', icon: '💭' },
  { id: 'safariball', name: 'Safari Ball', icon: '🟩' },
  { id: 'sombreball', name: 'Sombre Ball', icon: '🌑' },
  { id: 'soinball', name: 'Soin Ball', icon: '💖' }
];

const STARTER_IDS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  152, 153, 154, 155, 156, 157, 158, 159, 160,
  252, 253, 254, 255, 256, 257, 258, 259, 260,
  387, 388, 389, 390, 391, 392, 393, 394, 395,
  495, 496, 497, 498, 499, 500, 501, 502, 503,
  650, 651, 652, 653, 654, 655, 656, 657, 658,
  722, 723, 724, 725, 726, 727, 728, 729, 730,
  810, 811, 812, 813, 814, 815, 816, 817, 818,
  906, 907, 908, 909, 910, 911, 912, 913, 914
]);

const LEGENDARY_IDS = new Set([
  144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384,
  480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 643, 644, 645, 646,
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 888, 889, 890, 891, 892, 894, 895, 896, 897, 898,
  1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024
]);

const MYTHICAL_IDS = new Set([
  151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649,
  719, 720, 721, 801, 802, 807, 808, 809, 893, 1025
]);

const REGIONAL_FORMS = [
  { id: '19-alola', baseId: 19, name: 'Rattata d\'Alola', region: 'regionals', apiName: 'rattata-alola', type: ['dark', 'normal'] },
  { id: '20-alola', baseId: 20, name: 'Ratthafack d\'Alola', region: 'regionals', apiName: 'raticate-alola', type: ['dark', 'normal'] },
  { id: '26-alola', baseId: 26, name: 'Raichu d\'Alola', region: 'regionals', apiName: 'raichu-alola', type: ['electric', 'psychic'] },
  { id: '27-alola', baseId: 27, name: 'Sabelette d\'Alola', region: 'regionals', apiName: 'sandshrew-alola', type: ['ice', 'steel'] },
  { id: '28-alola', baseId: 28, name: 'Sablaireau d\'Alola', region: 'regionals', apiName: 'sandslash-alola', type: ['ice', 'steel'] },
  { id: '37-alola', baseId: 37, name: 'Goupix d\'Alola', region: 'regionals', apiName: 'vulpix-alola', type: ['ice'] },
  { id: '38-alola', baseId: 38, name: 'Feunard d\'Alola', region: 'regionals', apiName: 'ninetales-alola', type: ['ice', 'fairy'] },
  { id: '50-alola', baseId: 50, name: 'Taupiqueur d\'Alola', region: 'regionals', apiName: 'diglett-alola', type: ['ground', 'steel'] },
  { id: '51-alola', baseId: 51, name: 'Triopikeur d\'Alola', region: 'regionals', apiName: 'dugtrio-alola', type: ['ground', 'steel'] },
  { id: '52-alola', baseId: 52, name: 'Miaouss d\'Alola', region: 'regionals', apiName: 'meowth-alola', type: ['dark'] },
  { id: '53-alola', baseId: 53, name: 'Persian d\'Alola', region: 'regionals', apiName: 'persian-alola', type: ['dark'] },
  { id: '74-alola', baseId: 74, name: 'Racaillou d\'Alola', region: 'regionals', apiName: 'geodude-alola', type: ['rock', 'electric'] },
  { id: '75-alola', baseId: 75, name: 'Gravalanch d\'Alola', region: 'regionals', apiName: 'graveler-alola', type: ['rock', 'electric'] },
  { id: '76-alola', baseId: 76, name: 'Grolem d\'Alola', region: 'regionals', apiName: 'golem-alola', type: ['rock', 'electric'] },
  { id: '88-alola', baseId: 88, name: 'Tadmorv d\'Alola', region: 'regionals', apiName: 'grimer-alola', type: ['poison', 'dark'] },
  { id: '89-alola', baseId: 89, name: 'Grotadmorv d\'Alola', region: 'regionals', apiName: 'muk-alola', type: ['poison', 'dark'] },
  { id: '103-alola', baseId: 103, name: 'Noadkoko d\'Alola', region: 'regionals', apiName: 'exeggutor-alola', type: ['grass', 'dragon'] },
  { id: '105-alola', baseId: 105, name: 'Ossatueur d\'Alola', region: 'regionals', apiName: 'marowak-alola', type: ['fire', 'ghost'] },
  { id: '52-galar', baseId: 52, name: 'Miaouss de Galar', region: 'regionals', apiName: 'meowth-galar', type: ['steel'] },
  { id: '77-galar', baseId: 77, name: 'Ponyta de Galar', region: 'regionals', apiName: 'ponyta-galar', type: ['psychic'] },
  { id: '78-galar', baseId: 78, name: 'Galopa de Galar', region: 'regionals', apiName: 'rapidash-galar', type: ['psychic', 'fairy'] },
  { id: '79-galar', baseId: 79, name: 'Ramoloss de Galar', region: 'regionals', apiName: 'slowpoke-galar', type: ['psychic'] },
  { id: '80-galar', baseId: 80, name: 'Flagadoss de Galar', region: 'regionals', apiName: 'slowbro-galar', type: ['poison', 'psychic'] },
  { id: '83-galar', baseId: 83, name: 'Canarticho de Galar', region: 'regionals', apiName: 'farfetchd-galar', type: ['fighting'] },
  { id: '110-galar', baseId: 110, name: 'Smogogo de Galar', region: 'regionals', apiName: 'weezing-galar', type: ['poison', 'fairy'] },
  { id: '122-galar', baseId: 122, name: 'M. Mime de Galar', region: 'regionals', apiName: 'mr-mime-galar', type: ['ice', 'psychic'] },
  { id: '144-galar', baseId: 144, name: 'Artikodin de Galar', region: 'regionals', apiName: 'articuno-galar', type: ['psychic', 'flying'] },
  { id: '145-galar', baseId: 145, name: 'Élector de Galar', region: 'regionals', apiName: 'zapdos-galar', type: ['fighting', 'flying'] },
  { id: '146-galar', baseId: 146, name: 'Sulfura de Galar', region: 'regionals', apiName: 'moltres-galar', type: ['dark', 'flying'] },
  { id: '199-galar', baseId: 199, name: 'Roigada de Galar', region: 'regionals', apiName: 'slowking-galar', type: ['poison', 'psychic'] },
  { id: '222-galar', baseId: 222, name: 'Corayon de Galar', region: 'regionals', apiName: 'corsola-galar', type: ['ghost'] },
  { id: '263-galar', baseId: 263, name: 'Zigzaton de Galar', region: 'regionals', apiName: 'zigzagoon-galar', type: ['dark', 'normal'] },
  { id: '264-galar', baseId: 264, name: 'Linoone de Galar', region: 'regionals', apiName: 'linoone-galar', type: ['dark', 'normal'] },
  { id: '554-galar', baseId: 554, name: 'Darumarond de Galar', region: 'regionals', apiName: 'darumaka-galar', type: ['ice'] },
  { id: '555-galar', baseId: 555, name: 'Darumacho de Galar', region: 'regionals', apiName: 'darmanitan-galar-standard', type: ['ice'] },
  { id: '562-galar', baseId: 562, name: 'Tutafeh de Galar', region: 'regionals', apiName: 'yamask-galar', type: ['ground', 'ghost'] },
  { id: '618-galar', baseId: 618, name: 'Limonde de Galar', region: 'regionals', apiName: 'stunfisk-galar', type: ['ground', 'steel'] },
  { id: '58-hisui', baseId: 58, name: 'Caninos de Hisui', region: 'hisui', apiName: 'growlithe-hisui', type: ['fire', 'rock'] },
  { id: '59-hisui', baseId: 59, name: 'Arcanin de Hisui', region: 'hisui', apiName: 'arcanine-hisui', type: ['fire', 'rock'] },
  { id: '100-hisui', baseId: 100, name: 'Voltorbe de Hisui', region: 'hisui', apiName: 'voltorb-hisui', type: ['electric', 'grass'] },
  { id: '101-hisui', baseId: 101, name: 'Électrode de Hisui', region: 'hisui', apiName: 'electrode-hisui', type: ['electric', 'grass'] },
  { id: '157-hisui', baseId: 157, name: 'Typhlosion de Hisui', region: 'hisui', apiName: 'typhlosion-hisui', type: ['fire', 'ghost'] },
  { id: '211-hisui', baseId: 211, name: 'Qwilfish de Hisui', region: 'hisui', apiName: 'qwilfish-hisui', type: ['dark', 'poison'] },
  { id: '215-hisui', baseId: 215, name: 'Farfuret de Hisui', region: 'hisui', apiName: 'sneasel-hisui', type: ['fighting', 'poison'] },
  { id: '503-hisui', baseId: 503, name: 'Clamiral de Hisui', region: 'hisui', apiName: 'samurott-hisui', type: ['water', 'dark'] },
  { id: '549-hisui', baseId: 549, name: 'Fragilady de Hisui', region: 'hisui', apiName: 'lilligant-hisui', type: ['grass', 'fighting'] },
  { id: '570-hisui', baseId: 570, name: 'Zorua de Hisui', region: 'hisui', apiName: 'zorua-hisui', type: ['normal', 'ghost'] },
  { id: '571-hisui', baseId: 571, name: 'Zoroark de Hisui', region: 'hisui', apiName: 'zoroark-hisui', type: ['normal', 'ghost'] },
  { id: '628-hisui', baseId: 628, name: 'Gueriaigle de Hisui', region: 'hisui', apiName: 'braviary-hisui', type: ['psychic', 'flying'] },
  { id: '705-hisui', baseId: 705, name: 'Colimucus de Hisui', region: 'hisui', apiName: 'sliggoo-hisui', type: ['steel', 'dragon'] },
  { id: '706-hisui', baseId: 706, name: 'Muplodocus de Hisui', region: 'hisui', apiName: 'goodra-hisui', type: ['steel', 'dragon'] },
  { id: '713-hisui', baseId: 713, name: 'Séracrawl de Hisui', region: 'hisui', apiName: 'avalugg-hisui', type: ['ice', 'rock'] },
  { id: '724-hisui', baseId: 724, name: 'Archéduc de Hisui', region: 'hisui', apiName: 'decidueye-hisui', type: ['grass', 'fighting'] }
];

export const getLuckTier = (count, baseOdds) => {
  if (!count || count <= 0) return { name: 'Non renseigné', desc: 'Saisie manuelle sans compteur', emoji: '🎲', color: 'text-slate-400', bg: 'bg-slate-800/80 border-slate-700' };
  const ratio = count / (baseOdds || 4096);
  if (ratio <= 0.25) return { name: 'Cocu Master 👑', desc: 'Même pas eu le temps de lancer le café !', emoji: '👑', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/50' };
  if (ratio <= 0.75) return { name: 'Chatteux du Dimanche ✨', desc: 'Franchement rapide et indécent !', emoji: '✨', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/50' };
  if (ratio <= 1.25) return { name: 'Respectueux des Stats ⚖️', desc: 'Pile dans les probabilités, comme dans un livre.', emoji: '⚖️', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/50' };
  if (ratio <= 2.0)  return { name: 'Début de Transpilation 🫠', desc: 'La patience commence à s\'effriter sévère...', emoji: '🫠', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/50' };
  if (ratio <= 3.0)  return { name: 'Suffer Squad 💀', desc: 'Plus du double des odds. Lâchez une larme.', emoji: '💀', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/50' };
  return { name: 'Arceus t\'a Oublié 🗿', desc: 'Over Odds mythique, tu mérites une statue de seum.', emoji: '🗿', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/50' };
};

const getSpriteUrl = (pokemon) => {
  if (typeof pokemon === 'object' && pokemon) {
    if (pokemon.spriteUrl) return pokemon.spriteUrl;
    if (pokemon.pokeId) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokeId}.png`;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon}.png`;
};

const getArtworkUrl = (pokemon) => {
  if (typeof pokemon === 'object' && pokemon) {
    if (pokemon.artworkUrl) return pokemon.artworkUrl;
    if (pokemon.pokeId) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemon.pokeId}.png`;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemon.id}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemon}.png`;
};

const getHuntingTip = (pokemon) => {
  if (!pokemon) return null;
  if (pokemon.isShinyLocked) {
    return { game: 'Aucun', method: 'Impossible', tip: 'Ce Pokémon est Shiny Locked dans les jeux officiels !' };
  }
  if (pokemon.id <= 151) {
    return { game: 'Pokémon Let\'s Go / Écarlate & Violet', method: 'Combo Capture ou Sandwich Aura Brillance Nv. 3', tip: 'Sur Écarlate/Violet, prépare un sandwich Rencontre/Brillance de son type dans la zone adaptée.' };
  }
  if (pokemon.isStarter) {
    return { game: 'Pokémon Écarlate / Violet ou DEPS', method: 'Méthode Masuda (Œufs) ou Masque Turquoise', tip: 'Accouple un Metamorph étranger avec un starter pour un taux maximal de 1/512 !' };
  }
  if (pokemon.isLegendary) {
    return { game: 'Épée / Bouclier (Grand Antre Dynamax)', method: 'Expéditions Dynamax', tip: 'Taux fixe exceptionnel de 1/100 si tu possèdes le Charm Chroma dans les Expéditions Dynamax !' };
  }
  if (pokemon.region === 'hisui') {
    return { game: 'Légendes Pokémon: Arceus', method: 'Apparitions Massives / Mégapparitions', tip: 'Monte la recherche Pokédex au Nv. 10 pour ce Pokémon pour atteindre 1/128 de chances !' };
  }
  return { game: 'Pokémon Écarlate / Violet', method: 'Apparition Massive + Sandwich Nv. 3', tip: 'Elimine 60 Pokémon dans l\'apparition massive pour amener les odds de base à 1/1365 avant Sandwich !' };
};

const formatTime = (totalSeconds) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

export default function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shinyState, setShinyState] = useState(() => {
    try {
      const saved = localStorage.getItem('shiny_tracker_data_v2');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [hunts, setHunts] = useState(() => {
    try {
      const saved = localStorage.getItem('shiny_hunts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState('dex');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGame, setSelectedGame] = useState('all');
  const [filterCaught, setFilterCaught] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Live Counter state
  const [activeHuntId, setActiveHuntId] = useState(null);
  const [showNewHuntModal, setShowNewHuntModal] = useState(false);

  // Random hunt state
  const [randomPokemon, setRandomPokemon] = useState(null);
  const [randomMode, setRandomMode] = useState('uncaught');

  // Calculator state
  const [calcMethod, setCalcMethod] = useState('wild');
  const [calcEncounters, setCalcEncounters] = useState(100);

  useEffect(() => {
    try {
      localStorage.setItem('shiny_tracker_data_v2', JSON.stringify(shinyState));
    } catch (e) {
      console.error(e);
    }
  }, [shinyState]);

  useEffect(() => {
    try {
      localStorage.setItem('shiny_hunts_v1', JSON.stringify(hunts));
    } catch (e) {
      console.error(e);
    }
  }, [hunts]);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        let frenchNames = [];
        try {
          const frRes = await fetch('https://raw.githubusercontent.com/sindresorhus/pokemon/main/data/fr.json');
          if (frRes.ok) frenchNames = await frRes.json();
        } catch (e) {
          console.error("Erreur de chargement des noms FR", e);
        }

        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await response.json();
        
        const typePromises = Array.from({ length: 18 }, (_, i) => 
          fetch(`https://pokeapi.co/api/v2/type/${i + 1}`).then(r => r.json()).catch(() => null)
        );
        const typeResults = await Promise.all(typePromises);
        
        const typeMap = {};
        typeResults.forEach(tData => {
          if (tData && tData.name) {
            const typeName = tData.name;
            tData.pokemon.forEach(p => {
              const pName = p.pokemon.name;
              if (!typeMap[pName]) typeMap[pName] = [];
              typeMap[pName].push(typeName);
            });
          }
        });

        const formatted = data.results.map((p, index) => {
          const id = index + 1;
          const frenchName = (frenchNames && frenchNames[index]) ? frenchNames[index] : (p.name.charAt(0).toUpperCase() + p.name.slice(1));
          return {
            id: id,
            pokeId: id,
            stringId: String(id),
            name: frenchName,
            region: getRegionForId(id),
            types: typeMap[p.name] || [],
            isForm: false,
            apiName: p.name,
            gen: getGenForId(id),
            isStarter: STARTER_IDS.has(id),
            isLegendary: LEGENDARY_IDS.has(id),
            isMythical: MYTHICAL_IDS.has(id),
            isShinyLocked: SHINY_LOCKED_IDS.has(id),
            spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
            artworkUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
          };
        });

        const regionalPromises = REGIONAL_FORMS.map(async (rf) => {
          let pokeId = rf.baseId;
          let spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${rf.baseId}.png`;
          let artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${rf.baseId}.png`;

          try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${rf.apiName}`);
            if (res.ok) {
              const formDetails = await res.json();
              pokeId = formDetails.id;
              if (formDetails.sprites?.front_shiny) spriteUrl = formDetails.sprites.front_shiny;
              if (formDetails.sprites?.other?.['official-artwork']?.front_shiny) {
                artworkUrl = formDetails.sprites.other['official-artwork'].front_shiny;
              }
            }
          } catch (e) {
            console.error(`Impossible de charger la forme ${rf.apiName}`, e);
          }

          return {
            id: rf.id,
            baseId: rf.baseId,
            pokeId: pokeId,
            stringId: rf.id,
            name: rf.name,
            region: rf.region,
            types: rf.type,
            apiName: rf.apiName,
            isForm: true,
            gen: getGenForId(rf.baseId),
            isStarter: STARTER_IDS.has(rf.baseId),
            isLegendary: LEGENDARY_IDS.has(rf.baseId),
            isMythical: MYTHICAL_IDS.has(rf.baseId),
            isShinyLocked: SHINY_LOCKED_IDS.has(rf.baseId),
            spriteUrl: spriteUrl,
            artworkUrl: artworkUrl
          };
        });

        const regionalFormatted = await Promise.all(regionalPromises);
        setPokemonList([...formatted, ...regionalFormatted]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHunts(prev => prev.map(h => (h.isRunning ? { ...h, elapsedSeconds: h.elapsedSeconds + 1 } : h)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRegionForId = (id) => {
    if (id <= 151) return 'kanto';
    if (id <= 251) return 'johto';
    if (id <= 386) return 'hoenn';
    if (id <= 493) return 'sinnoh';
    if (id <= 649) return 'unova';
    if (id <= 721) return 'kalos';
    if (id <= 809) return 'alola';
    if (id <= 898) return 'galar';
    return 'paldea';
  };

  const getGenForId = (id) => {
    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 898) return 8;
    return 9;
  };

  const getPokemonByStringId = (stringId) => {
    return pokemonList.find(p => p.stringId === stringId);
  };

  const toggleShiny = (id, e) => {
    if (e) e.stopPropagation();
    setShinyState(prev => {
      const current = prev[id] || { caught: false };
      const updated = { ...prev };
      if (current.caught) {
        delete updated[id];
      } else {
        updated[id] = {
          caught: true,
          date: new Date().toLocaleDateString('fr-FR'),
          timestamp: Date.now(),
          method: 'wild',
          ball: 'pokeball',
          notes: current.notes || ''
        };
      }
      return updated;
    });
  };

  const incrementCounter = (huntId, step = 1) => {
    setHunts(prev =>
      prev.map(h => h.id === huntId ? { ...h, count: Math.max(0, h.count + step), isRunning: true } : h)
    );
  };

  const markHuntAsFound = (hunt) => {
    setShinyState(prev => ({
      ...prev,
      [hunt.targetId]: {
        caught: true,
        date: new Date().toLocaleDateString('fr-FR'),
        timestamp: Date.now(),
        method: hunt.method,
        ball: 'pokeball',
        count: hunt.count,
        elapsedSeconds: hunt.elapsedSeconds,
        baseOdds: hunt.baseOdds || 4096,
        notes: `Shassé après ${hunt.count} rencontres en ${formatTime(hunt.elapsedSeconds)} !`
      }
    }));
    setHunts(prev => prev.map(h => (h.id === hunt.id ? { ...h, isRunning: false } : h)));
  };

  const exportDataJson = JSON.stringify({ shinyState, hunts });
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(exportDataJson)}`;

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(pastedJson);
      if (parsed.shinyState) setShinyState(parsed.shinyState);
      if (parsed.hunts) setHunts(parsed.hunts);
      alert('Sauvegarde importée avec succès !');
      setShowQrModal(false);
      setPastedJson('');
    } catch (e) {
      alert('Erreur: Le code de sauvegarde JSON n\'est pas valide.');
    }
  };

  const copyDataToClipboard = () => {
    navigator.clipboard.writeText(exportDataJson);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const filteredPokemon = useMemo(() => {
    return pokemonList.filter(p => {
      if (selectedRegion !== 'all') {
        const regConfig = REGIONS.find(r => r.id === selectedRegion);
        if (regConfig) {
          if (regConfig.special === 'forms') {
            if (!p.isForm || p.region !== 'regionals') return false;
          } else if (regConfig.special === 'hisui') {
            if (p.region !== 'hisui') return false;
          } else {
            if (p.isForm || p.id < regConfig.range[0] || p.id > regConfig.range[1]) return false;
          }
        }
      }

      if (selectedType !== 'all') {
        if (!p.types || !p.types.includes(selectedType)) return false;
      }

      if (selectedGame !== 'all') {
        const gameConfig = TARGET_GAMES.find(g => g.id === selectedGame);
        if (gameConfig && p.gen > gameConfig.maxGen && p.region !== 'hisui') {
          return false;
        }
      }

      const shinyInfo = shinyState[p.stringId];
      const isCaught = shinyInfo?.caught;

      if (filterCaught === 'caught' && !isCaught) return false;
      if (filterCaught === 'uncaught' && isCaught) return false;

      if (filterMethod !== 'all') {
        if (!isCaught || shinyInfo?.method !== filterMethod) return false;
      }

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesId = String(p.id).includes(query);
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [pokemonList, selectedRegion, selectedType, selectedGame, filterCaught, filterMethod, searchQuery, shinyState]);

  const stats = useMemo(() => {
    const totalCount = pokemonList.length;
    const caughtList = Object.values(shinyState).filter(s => s?.caught);
    const caughtCount = caughtList.length;
    const percentage = totalCount > 0 ? ((caughtCount / totalCount) * 100).toFixed(1) : 0;

    const methodCounts = {};
    SHINY_METHODS.forEach(m => methodCounts[m.id] = 0);
    caughtList.forEach(s => {
      const m = s.method || 'wild';
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    });

    const ballCounts = {};
    POKE_BALLS.forEach(b => ballCounts[b.id] = 0);
    caughtList.forEach(s => {
      const b = s.ball || 'pokeball';
      ballCounts[b] = (ballCounts[b] || 0) + 1;
    });

    return { totalCount, caughtCount, percentage, methodCounts, ballCounts };
  }, [pokemonList, shinyState]);

  const journalHistory = useMemo(() => {
    return Object.entries(shinyState)
      .filter(([_, data]) => data?.caught)
      .map(([stringId, data]) => ({ stringId, pokemon: getPokemonByStringId(stringId), ...data }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [shinyState, pokemonList]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-900 pb-16">
      
      {/* Dynamic Glow Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-slate-900/85 border-b border-slate-800/80 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3">
              <div className="relative p-2.5 bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 rounded-2xl shadow-lg shadow-amber-500/25 text-slate-950 ring-1 ring-amber-300/50">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                  Shiny Hunter Pro
                </h1>
                <p className="text-[11px] text-slate-400 font-semibold tracking-wide">Tracker Pokédex & Sync Pixel 8 Pro</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-950/90 border border-slate-800/80 p-1.5 rounded-2xl shadow-inner overflow-x-auto max-w-full">
              {[
                { id: 'dex', label: 'Pokédex Shiny', icon: Layers },
                { id: 'counter', label: 'Compteur Live', icon: Timer },
                { id: 'journal', label: 'Journal', icon: BookOpen },
                { id: 'random', label: 'Random', icon: Dices },
                { id: 'calculator', label: 'Calculateur', icon: Calculator }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 scale-100'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQrModal(true)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-amber-400 p-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition shadow-sm"
                title="Transfert QR Code PC <-> Mobile"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Sync QR</span>
              </button>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-inner">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Progression</div>
                  <div className="text-xs font-black text-amber-400 font-mono">
                    {stats.caughtCount} <span className="text-[10px] text-slate-500">/ {stats.totalCount}</span> ({stats.percentage}%)
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowStats(!showStats)} 
                className={`p-2.5 rounded-2xl border transition-all duration-200 ${
                  showStats 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' 
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }`}
                title="Statistiques Détaillées & Graphiques"
              >
                <PieChart className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">
        
        {/* QR Code Sync Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <QrCode className="w-5 h-5" /> Transfert QR Code (PC ⇄ Mobile)
                </h3>
                <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-300">
                  Scannez ce QR Code avec l'appareil photo de votre <strong>Pixel 8 Pro</strong> pour importer votre progression de shasse instantanément.
                </p>

                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg">
                  <img src={qrCodeUrl} alt="QR Code Sauvegarde" className="w-48 h-48 object-contain" />
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    onClick={copyDataToClipboard}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copySuccess ? 'Copié !' : 'Copier le JSON'}</span>
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-4 text-left space-y-2">
                  <label className="text-xs font-bold text-slate-400 block">Restaurer / Importer du JSON :</label>
                  <textarea
                    rows={2}
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    placeholder="Collez ici le code de sauvegarde JSON..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono"
                  />
                  <button
                    onClick={handleImportJson}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition"
                  >
                    Valider l'importation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Stats & Charts Overlay */}
        {showStats && (
          <div className="bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-6 backdrop-blur-xl animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-amber-400" />
                <h2 className="text-lg font-bold text-slate-100">Statistiques & Graphiques de Captures</h2>
              </div>
              <button onClick={() => setShowStats(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Methods Breakdown Chart */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" /> Répartition par Méthode de Shasse
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SHINY_METHODS.map(method => {
                  const count = stats.methodCounts[method.id] || 0;
                  const pct = stats.caughtCount > 0 ? ((count / stats.caughtCount) * 100).toFixed(1) : 0;
                  return (
                    <div key={method.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-200 flex items-center gap-1.5">{method.icon} {method.name}</span>
                        <span className="text-amber-400 font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Poké Balls Usage Chart */}
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Circle className="w-4 h-4 text-amber-400" /> Poké Balls les Plus Utilisées
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {POKE_BALLS.map(ball => {
                  const count = stats.ballCounts[ball.id] || 0;
                  const pct = stats.caughtCount > 0 ? ((count / stats.caughtCount) * 100).toFixed(1) : 0;
                  return (
                    <div key={ball.id} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                      <div className="text-xl">{ball.icon}</div>
                      <div className="text-[10px] font-bold text-slate-300 truncate">{ball.name}</div>
                      <div className="text-xs font-mono font-black text-amber-400">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Tab 1: Pokédex Shiny */}
        {activeTab === 'dex' && (
          <div className="space-y-6">
            
            {/* Control & Filter Panel */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
              
              {/* Row 1: Search, Status, Game & Method Dropdowns */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                
                {/* Search input */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Rechercher par nom FR ou N°..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 w-full md:w-auto overflow-x-auto">
                  {[
                    { id: 'all', label: 'Tous' },
                    { id: 'caught', label: 'Capturés ✨' },
                    { id: 'uncaught', label: 'Manquants' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterCaught(tab.id)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        filterCaught === tab.id 
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Filter by Target Game */}
                <div className="w-full md:w-auto flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full md:w-auto p-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {TARGET_GAMES.map(g => (
                      <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Method Dropdown */}
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full md:w-auto p-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Toutes les Méthodes</option>
                  {SHINY_METHODS.map(m => (
                    <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
                  ))}
                </select>

              </div>

              {/* Row 2: Type Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 pb-2 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1 shrink-0">Types:</span>
                {POKEMON_TYPES.map(t => {
                  const isSelected = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      style={{
                        backgroundColor: isSelected ? t.color : 'rgba(15, 23, 42, 0.8)',
                        borderColor: isSelected ? t.color : `${t.color}50`,
                        color: isSelected ? '#ffffff' : '#cbd5e1'
                      }}
                      className={`px-3 py-1.2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all duration-200 border shadow-sm ${
                        isSelected 
                          ? 'shadow-lg ring-2 ring-white/30 scale-105 font-black' 
                          : 'hover:scale-102 hover:border-slate-500 opacity-90 hover:opacity-100'
                      }`}
                    >
                      <TypeIcon typeId={t.id} className="w-4 h-4 shrink-0" />
                      <span>{t.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Row 3: Regions Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 pb-1 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1 shrink-0">Régions:</span>
                {REGIONS.map(reg => {
                  const isSelected = selectedRegion === reg.id;
                  return (
                    <button
                      key={reg.id}
                      onClick={() => setSelectedRegion(reg.id)}
                      className={`px-3 py-1.2 rounded-xl text-xs font-bold border flex items-center gap-1.5 shrink-0 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-500/20 scale-105' 
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm">{reg.icon}</span>
                      <span>{reg.name}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Selected Pokémon Hunting Tips Modal */}
            {selectedPokemon && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <img src={getSpriteUrl(selectedPokemon)} alt={selectedPokemon.name} className="w-12 h-12 object-contain" />
                      <div>
                        <h3 className="text-lg font-black text-white">{selectedPokemon.name}</h3>
                        <span className="text-xs text-amber-400 font-mono font-bold">#{String(selectedPokemon.id).padStart(3, '0')}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPokemon(null)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Hunting Guide Box */}
                  {(() => {
                    const tip = getHuntingTip(selectedPokemon);
                    return tip ? (
                      <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                          <Compass className="w-4 h-4" /> Guide & Meilleure Zone de Shasse
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-500 text-[10px] font-bold block uppercase">Meilleur Jeu</span>
                            <span className="font-bold text-slate-200">{tip.game}</span>
                          </div>
                          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-500 text-[10px] font-bold block uppercase">Méthode Recommandée</span>
                            <span className="font-bold text-amber-300">{tip.method}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                          💡 {tip.tip}
                        </p>
                      </div>
                    ) : null;
                  })()}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { toggleShiny(selectedPokemon.stringId); setSelectedPokemon(null); }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl transition"
                    >
                      {shinyState[selectedPokemon.stringId]?.caught ? 'Marquer comme Non Possédé' : 'Marquer comme Capturé ✨'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pokémon Cards Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Sparkles className="w-10 h-10 text-amber-400 animate-spin" />
                <p className="text-xs font-bold text-slate-400">Chargement de la base de données Pokédex en français...</p>
              </div>
            ) : filteredPokemon.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
                Aucun Pokémon ne correspond à vos filtres.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {filteredPokemon.map(p => {
                  const shinyInfo = shinyState[p.stringId];
                  const isCaught = shinyInfo?.caught;
                  const ballObj = POKE_BALLS.find(b => b.id === shinyInfo?.ball);

                  return (
                    <div
                      key={p.stringId}
                      onClick={() => setSelectedPokemon(p)}
                      className={`group relative rounded-3xl p-3 border transition-all duration-300 cursor-pointer flex flex-col items-center justify-between text-center overflow-hidden ${
                        isCaught
                          ? 'bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-950 border-amber-500/50 shadow-xl shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 px-1">
                        <span>#{String(p.id).padStart(3, '0')}</span>
                        <div className="flex items-center gap-1">
                          {p.isShinyLocked && (
                            <span 
                              title="Shiny Lock: Impossible à shasser officiellement dans les jeux !" 
                              className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1 rounded flex items-center gap-0.5 text-[9px]"
                            >
                              <ShieldAlert className="w-3 h-3 text-rose-400" /> Lock
                            </span>
                          )}
                          {isCaught && <span title={ballObj?.name || 'Poké Ball'}>{ballObj?.icon || '🔴'}</span>}
                        </div>
                      </div>

                      <div className="relative py-2 my-auto">
                        <img 
                          src={getSpriteUrl(p)} 
                          alt={p.name}
                          className={`w-20 h-20 object-contain transition-transform duration-300 group-hover:scale-110 ${
                            isCaught ? 'filter drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 'opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100'
                          }`}
                          loading="lazy"
                        />
                      </div>

                      <div className="w-full space-y-2">
                        <div className="text-xs font-extrabold text-slate-100 truncate px-1" title={p.name}>
                          {p.name}
                        </div>

                        <button
                          onClick={(e) => toggleShiny(p.stringId, e)}
                          className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isCaught
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold'
                              : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 ${isCaught ? 'opacity-100' : 'opacity-30'}`} />
                          <span>{isCaught ? 'Capturé' : 'Non possédé'}</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Live Counter */}
        {activeTab === 'counter' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-amber-400 flex items-center gap-2">
                  <Timer className="w-6 h-6" /> Compteur de Shasse Multi-Live
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Suivi en direct de tes rencontres avec chronomètre de session</p>
              </div>

              <button
                onClick={() => setShowNewHuntModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
              >
                <PlusCircle className="w-4 h-4" /> Lancer une Nouvelle Shasse
              </button>
            </div>

            {hunts.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <Timer className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="text-slate-400 text-xs">Aucune session de shasse active.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {(() => {
                  const activeHunt = hunts.find(h => h.id === activeHuntId) || hunts[0];
                  if (!activeHunt) return null;
                  const targetPokemon = getPokemonByStringId(activeHunt.targetId) || { name: 'Pokémon Inconnu', id: 1 };
                  const luck = getLuckTier(activeHunt.count, activeHunt.baseOdds);
                  const methodObj = SHINY_METHODS.find(m => m.id === activeHunt.method);

                  return (
                    <div className="lg:col-span-2 bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
                      <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${luck.bg}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{luck.emoji}</span>
                          <div>
                            <div className={`text-xs font-black ${luck.color}`}>{luck.name}</div>
                            <div className="text-[11px] text-slate-300">{luck.desc}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                          <img src={getSpriteUrl(targetPokemon)} alt={targetPokemon.name} className="w-24 h-24 object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                          <div>
                            <span className="text-xs font-mono text-amber-400 font-extrabold uppercase">{activeHunt.game}</span>
                            <h3 className="text-2xl font-black text-white">{targetPokemon.name}</h3>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                              <span>{methodObj?.icon} {methodObj?.name}</span>
                              <span>•</span>
                              <span>Taux: 1/{activeHunt.baseOdds}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800 text-center">
                          <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Durée Totale</div>
                          <div className="text-xl font-mono font-bold text-amber-400">{formatTime(activeHunt.elapsedSeconds)}</div>
                        </div>
                      </div>

                      <div className="text-center py-4 space-y-2">
                        <div className="text-xs text-slate-400 uppercase font-extrabold tracking-widest">Rencontres</div>
                        <div className="text-7xl font-black font-mono tracking-wider text-amber-400">{activeHunt.count}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => incrementCounter(activeHunt.id, 1)} className="py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xl active:scale-95 transition">+1</button>
                        <button onClick={() => incrementCounter(activeHunt.id, 5)} className="py-4 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl font-bold text-lg border border-slate-700 active:scale-95 transition">+5</button>
                        <button onClick={() => markHuntAsFound(activeHunt)} className="py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-1 active:scale-95 transition"><Sparkles className="w-4 h-4" /> Capturé !</button>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chasses actives ({hunts.length})</h3>
                  {hunts.map(h => {
                    const poke = getPokemonByStringId(h.targetId) || { name: 'Pokémon Inconnu' };
                    const isSelected = (activeHuntId || hunts[0]?.id) === h.id;
                    return (
                      <div key={h.id} onClick={() => setActiveHuntId(h.id)} className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${isSelected ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <div className="flex items-center gap-3">
                          <img src={getSpriteUrl(poke)} alt={poke.name} className="w-10 h-10 object-contain" />
                          <div>
                            <div className="text-xs font-bold text-slate-200">{poke.name}</div>
                            <div className="text-[10px] text-slate-500">{h.game}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-bold font-mono text-amber-400">{h.count}</div>
                            <div className="text-[10px] text-slate-500">{formatTime(h.elapsedSeconds)}</div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setHunts(prev => prev.filter(x => x.id !== h.id)); }} className="p-1 text-slate-600 hover:text-rose-400 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Journal */}
        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-amber-400 flex items-center gap-2"><BookOpen className="w-6 h-6" /> Journal de Bord Chronologique</h2>
                <p className="text-xs text-slate-400">Historique complet de tes Shiny capturés</p>
              </div>
              <div className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">{journalHistory.length} Capturés</div>
            </div>

            {journalHistory.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">Aucun Shiny enregistré dans le journal pour l'instant.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {journalHistory.map(entry => {
                  const luck = getLuckTier(entry.count, entry.baseOdds);
                  const methodObj = SHINY_METHODS.find(m => m.id === entry.method);
                  const ballObj = POKE_BALLS.find(b => b.id === entry.ball);

                  return (
                    <div key={entry.stringId} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <img src={getSpriteUrl(entry.pokemon)} alt={entry.pokemon?.name || 'Pokémon'} className="w-14 h-14 object-contain" />
                          <div>
                            <h3 className="text-base font-extrabold text-amber-300">{entry.pokemon?.name || 'Inconnu'}</h3>
                            <span className="text-[11px] text-slate-400">{entry.date || 'Date inconnue'}</span>
                          </div>
                        </div>
                        <span className="text-xl">{ballObj?.icon || '🔴'}</span>
                      </div>
                      <div className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs ${luck.bg}`}>
                        <span className="text-lg">{luck.emoji}</span>
                        <div>
                          <div className={`font-bold ${luck.color}`}>{luck.name}</div>
                          <div className="text-[10px] text-slate-300">{luck.desc}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Random Generator */}
        {activeTab === 'random' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-6">
              <div>
                <h2 className="text-xl font-black text-amber-400 flex items-center justify-center gap-2"><Dices className="w-6 h-6" /> Tirage au Sort Aléatoire</h2>
                <p className="text-xs text-slate-400 mt-1">Trouve ta prochaine cible Shiny au hasard !</p>
              </div>

              {randomPokemon ? (
                <div className="bg-slate-950 p-6 rounded-3xl border border-amber-500/30 space-y-4">
                  <img src={getArtworkUrl(randomPokemon)} alt={randomPokemon.name} className="w-40 h-40 object-contain mx-auto filter drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
                  <div>
                    <span className="text-xs font-mono text-amber-400 font-bold">#{String(randomPokemon.id).padStart(3, '0')}</span>
                    <h3 className="text-2xl font-black text-white">{randomPokemon.name}</h3>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-slate-500 text-xs">Cliquez ci-dessous pour effectuer un tirage.</div>
              )}

              <button onClick={() => {
                const pool = pokemonList.filter(p => !shinyState[p.stringId]?.caught);
                if (pool.length > 0) setRandomPokemon(pool[Math.floor(Math.random() * pool.length)]);
              }} className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition">
                <Dices className="w-5 h-5" /> Lancer le Tirage
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Calculator */}
        {activeTab === 'calculator' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-amber-400 flex items-center gap-2"><Calculator className="w-6 h-6" /> Calculateur de Probabilités</h2>
                <p className="text-xs text-slate-400 mt-1">Calcule tes chances cumulées d'obtenir au moins 1 Shiny.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Méthode</label>
                  <select value={calcMethod} onChange={(e) => setCalcMethod(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200">
                    {SHINY_METHODS.map(m => (
                      <option key={m.id} value={m.id}>{m.icon} {m.name} (1/{m.baseOdds})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nombre d'essais</label>
                  <input type="number" min="1" value={calcEncounters} onChange={(e) => setCalcEncounters(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 font-mono" />
                </div>
              </div>

              {(() => {
                const methodObj = SHINY_METHODS.find(m => m.id === calcMethod) || SHINY_METHODS[0];
                const p = 1 / methodObj.baseOdds;
                const n = calcEncounters;
                const cumulativeChance = (1 - Math.pow(1 - p, n)) * 100;

                return (
                  <div className="bg-slate-950 p-6 rounded-3xl border border-amber-500/30 text-center space-y-2">
                    <div className="text-xs text-slate-400 font-extrabold uppercase">Probabilité Cumulée</div>
                    <div className="text-5xl font-black text-amber-400 font-mono">{cumulativeChance.toFixed(2)}%</div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
