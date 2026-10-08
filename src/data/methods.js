import { GAME_BY_ID } from './games.js';

// Probabilité d'être shiny avec `n` tirages au taux de base 1/base.
const roll = (base, n) => 1 - Math.pow(1 - 1 / base, n);
// Ajoute des tirages à une probabilité déjà calculée.
const addRolls = (p, base, n) => 1 - (1 - p) * Math.pow(1 - 1 / base, n);
const tier = (c, steps) => steps.reduce((bonus, [min, value]) => (c >= min ? value : bonus), 0);

/** @returns {MethodOption} */
const SPARKLING = label => ({ id: 'sparkling', label, type: 'select', values: [[0, 'Aucune'], [1, 'Nv. 1'], [2, 'Nv. 2'], [3, 'Nv. 3']] });
/** @type {MethodOption} */
const SPAWNS = { id: 'spawns', label: 'Pokémon ciblés par cycle', type: 'select', default: 1, values: [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8']] };
// Z-A : probabilité qu'au moins une des apparitions ciblées d'un cycle soit shiny.
const cycle = x => 1 - Math.pow(1 - roll(x.base, 1 + x.charm + (x.o.sparkling || 0)), x.o.spawns || 1);
/** @type {MethodOption} */
const RESEARCH = { id: 'research', label: 'Recherche Pokédex', type: 'select', values: [[0, 'Incomplète'], [1, 'Niveau 10'], [3, 'Parfaite']] };

// `p(ctx)` renvoie la probabilité qu'une rencontre soit shiny. ctx = { base, gen, charm (tirages), c (chaîne en cours), o (options) }.
// `chain` : le taux dépend du compteur (la chaîne repart à 0 à chaque phase).
/**
 * Contexte de calcul d'une méthode.
 * @typedef {object} RollContext
 * @property {number} base Taux de base du jeu (1/x).
 * @property {number} gen
 * @property {number} charm Tirages du Charme Chroma (0 si absent ou non coché).
 * @property {number} c Longueur de la chaîne en cours.
 * @property {Record<string, any>} o Options de la méthode.
 */
/**
 * Option réglable d'une méthode (case à cocher ou choix).
 * @typedef {object} MethodOption
 * @property {string} id
 * @property {string} label
 * @property {'toggle' | 'select'} type
 * @property {Array<[number, string]>} [values]
 * @property {number} [default]
 */
/**
 * Méthode de chasse.
 * @typedef {object} Method
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} unit Ce qu'on compte (« rencontres », « œufs »…).
 * @property {(x: RollContext) => number} p Probabilité qu'une rencontre soit shiny.
 * @property {number} [chain] Le taux progresse jusqu'à cette chaîne.
 * @property {number} [step] Pas par défaut du compteur.
 * @property {boolean} [eggs]
 * @property {false} [charm] false : le Charme Chroma ne s'applique pas.
 * @property {MethodOption[]} [options]
 * @property {string} [note]
 */

/** @type {Method[]} */
export const METHODS = [
  { id: 'wild', name: 'Rencontre sauvage', icon: '🌿', unit: 'rencontres', p: x => roll(x.base, 1 + x.charm) },
  { id: 'reset', name: 'Soft Reset', icon: '🔄', unit: 'resets', p: x => roll(x.base, 1 + x.charm) },
  { id: 'egg', name: 'Œufs (sans Masuda)', icon: '🐣', unit: 'œufs', eggs: true, p: x => roll(x.base, 1 + x.charm) },
  { id: 'masuda', name: 'Méthode Masuda', icon: '🥚', unit: 'œufs', eggs: true, p: x => roll(x.base, (x.gen === 4 ? 5 : 6) + x.charm) },
  // Plus proposé dans aucun jeu ; conservé pour les chasses et captures déjà enregistrées.
  { id: 'gsc_breed', name: 'Parent shiny (Gen 2)', icon: '🥚', unit: 'œufs', eggs: true, charm: false, p: () => 1 / 64 },
  { id: 'horde', name: 'Hordes', icon: '🐝', unit: 'rencontres', step: 5, p: x => roll(x.base, 1 + x.charm), note: 'Chaque horde compte 5 rencontres.' },
  {
    id: 'radar', name: 'Poké Radar', icon: '📡', unit: 'chaîne', chain: 40,
    p: x => {
      const p4 = 1 / (8200 - 200 * Math.min(x.c, 40));
      return addRolls(x.gen === 4 ? p4 : Math.min(1, 2 * p4), x.base, x.charm);
    },
    note: 'Le taux augmente jusqu\'à une chaîne de 40 (1/200 en Gen 4, environ 1/99 ensuite).'
  },
  { id: 'chain_fishing', name: 'Pêche à la chaîne', icon: '🎣', unit: 'chaîne', chain: 20, p: x => roll(x.base, 1 + 2 * Math.min(x.c, 20) + x.charm), note: '+2 tirages par prise consécutive, jusqu\'à 20.' },
  { id: 'friend_safari', name: 'Safari des Amis', icon: '🌳', unit: 'rencontres', p: x => roll(x.base, 5 + x.charm) },
  {
    id: 'dexnav', name: 'Navi-Dex', icon: '🔍', unit: 'rencontres',
    p: x => roll(x.base, 1.15 + x.charm),
    note: 'Moyenne tenant compte des bonus aux rencontres n° 50 et 100 de la chaîne ; le niveau de recherche n\'est pas pris en compte.'
  },
  { id: 'sos', name: 'Appels à l\'aide (SOS)', icon: '📣', unit: 'chaîne', chain: 31, p: x => roll(x.base, 1 + x.charm + tier(x.c, [[11, 4], [21, 8], [31, 12]])), note: 'Bonus à 11, 21 et 31 appels consécutifs.' },
  {
    id: 'catch_combo', name: 'Combo Capture', icon: '🎯', unit: 'combo', chain: 31,
    options: [{ id: 'lure', label: 'Parfum actif', type: 'toggle' }],
    p: x => roll(x.base, 1 + x.charm + (x.o.lure ? 1 : 0) + tier(x.c, [[11, 3], [21, 7], [31, 11]])),
    note: 'Bonus à 11, 21 et 31 captures consécutives de la même espèce.'
  },
  { id: 'dynamax', name: 'Expédition Dynamax', icon: '🌀', unit: 'expéditions', p: x => (x.charm ? 1 / 100 : 1 / 300) },
  { id: 'raid', name: 'Raids (Téracristal / Dynamax)', icon: '💎', unit: 'raids', charm: false, p: () => 1 / 4096, note: 'Le Charme Chroma n\'a pas d\'effet sur les raids.' },
  { id: 'pla_wild', name: 'Rencontre sauvage (LPA)', icon: '🌿', unit: 'rencontres', options: [RESEARCH], p: x => roll(x.base, 1 + x.charm + (x.o.research || 0)) },
  { id: 'pla_mo', name: 'Apparition massive (LPA)', icon: '✨', unit: 'rencontres', options: [RESEARCH], p: x => roll(x.base, 26 + x.charm + (x.o.research || 0)) },
  { id: 'pla_mmo', name: 'Mégapparition (LPA)', icon: '📜', unit: 'rencontres', options: [RESEARCH], p: x => roll(x.base, 13 + x.charm + (x.o.research || 0)) },
  {
    id: 'sv_wild', name: 'Sauvage / Apparition massive (ÉV)', icon: '🥪', unit: 'rencontres',
    options: [
      SPARKLING('Sandwich Brillance'),
      { id: 'outbreak', label: 'Apparition massive (compter les KO)', type: 'toggle' },
      { id: 'eventBoost', label: 'Évènement shiny boosté (+0,5 %)', type: 'toggle' }
    ],
    chain: 60,
    // Évènements boostés : une chance fixe de 0,5 % est tirée avant le sandwich et le Charme.
    p: x => addRolls(roll(x.base, 1 + x.charm + (x.o.sparkling || 0) + (x.o.outbreak ? tier(x.c, [[30, 1], [60, 2]]) : 0)), 200, x.o.eventBoost ? 1 : 0),
    note: 'En apparition massive : +1 tirage à 30 KO, +2 à 60 KO. Certaines apparitions massives évènementielles ajoutent 0,5 % de chance shiny.'
  },
  { id: 'za_wild', name: 'Rencontre sauvage (Z-A)', icon: '🍩', unit: 'rencontres', options: [SPARKLING('Donut Brillance')], p: x => roll(x.base, 1 + x.charm + (x.o.sparkling || 0)), note: 'Avec un donut Brillance Nv. 3, la quête d\'Hyperespace « Attraper un shiny » garantit un shiny.' },
  // Resets d'apparitions : chaque cycle relance toutes les apparitions proches (jusqu'à 50 m).
  { id: 'za_fasttravel', name: 'Téléportation en boucle (Z-A)', icon: '🧭', unit: 'téléportations', options: [SPARKLING('Donut Brillance'), SPAWNS], p: x => cycle(x), note: 'Téléporte-toi vers un point à moins de 50 m des apparitions : chaque voyage relance les Pokémon. La méthode la plus rapide.' },
  { id: 'za_bench', name: 'Banc jour / nuit (Z-A)', icon: '🪑', unit: 'bancs', options: [SPARKLING('Donut Brillance'), SPAWNS], p: x => cycle(x), note: 'S\'asseoir sur un banc fait passer du jour à la nuit et relance les apparitions dans un rayon de 50 m. Un peu plus lent (cinématique).' },
  { id: 'za_stairs', name: 'Escalier Zone Sauvage 3 (Z-A)', icon: '🪜', unit: 'passages', options: [SPARKLING('Donut Brillance'), SPAWNS], p: x => cycle(x), note: 'Monter/descendre l\'escalier du pilier relance les apparitions : bloque le joystick pour chasser sans jouer. Pense à revenir compter.' },
  { id: 'za_fossil', name: 'Fossiles (Z-A)', icon: '🦴', unit: 'fossiles', charm: false, p: x => roll(x.base, 1), note: 'Le Charme Chroma ne s\'applique pas aux fossiles.' },
  { id: 'go_standard', name: 'Pokémon GO (standard)', icon: '📱', unit: 'rencontres', charm: false, p: () => 1 / 512 },
  { id: 'go_boosted', name: 'Pokémon GO (taux boosté)', icon: '⭐', unit: 'rencontres', charm: false, p: () => 1 / 64 },
  { id: 'go_cday', name: 'Community Day (GO)', icon: '🎉', unit: 'rencontres', charm: false, p: () => 1 / 25 },
  { id: 'go_raid', name: 'Raid légendaire (GO)', icon: '⚔️', unit: 'raids', charm: false, p: () => 1 / 20 },
  { id: 'event', name: 'Distribution / Évènement', icon: '🎁', unit: 'tentatives', charm: false, p: () => 1 },
  { id: 'other', name: 'Autre / taux personnalisé', icon: '❔', unit: 'rencontres', p: x => roll(x.base, 1 + x.charm) }
];
export const METHOD_BY_ID = Object.fromEntries(METHODS.map(m => [m.id, m]));

// Anciennes méthodes (v1/v2) → nouvelle méthode + options
export const LEGACY_METHODS = {
  outbreak: { method: 'sv_wild', opts: { outbreak: true } },
  sandwich: { method: 'sv_wild', opts: { sparkling: 3 } },
  outbreak_sandwich: { method: 'sv_wild', opts: { outbreak: true, sparkling: 3 } },
  mmo: { method: 'pla_mmo', opts: {} },
  pokeradar: { method: 'radar', opts: {} },
  chaining: { method: 'catch_combo', opts: {} },
  navidex: { method: 'dexnav', opts: {} },
  pogo: { method: 'go_standard', opts: {} },
  cday: { method: 'go_cday', opts: {} }
};
export const migrateMethod = id => (METHOD_BY_ID[id] ? { method: id, opts: {} } : LEGACY_METHODS[id] || { method: 'wild', opts: {} });

export const gameMethods = gameId => (GAME_BY_ID[gameId]?.methods || ['wild', 'other']).map(id => METHOD_BY_ID[id]).filter(Boolean);

export const charmAvailable = (gameId, methodId) => (GAME_BY_ID[gameId]?.charm || 0) > 0 && METHOD_BY_ID[methodId]?.charm !== false;

/**
 * Contexte de calcul pour une configuration de taux.
 * @param {import('../domain/types.js').OddsConfig} cfg
 */
export function oddsContext(cfg) {
  const game = GAME_BY_ID[cfg.game] || GAME_BY_ID.other;
  const method = METHOD_BY_ID[cfg.method] || METHOD_BY_ID.wild;
  const charm = cfg.charm && charmAvailable(game.id, method.id) ? game.charm : 0;
  return { game, method, custom: Number(cfg.customOdds) > 0 ? Number(cfg.customOdds) : null, x: { base: game.base, gen: game.gen, charm, o: cfg.opts || {} } };
}

/** Probabilité shiny de la rencontre suivante, pour une chaîne en cours de longueur `c`. */
export function probAt(ctx, c = 0) {
  if (ctx.custom) return 1 / ctx.custom;
  return Math.min(1, Math.max(0, ctx.method.p({ ...ctx.x, c })));
}

export const isDynamic = ctx => !ctx.custom && !!ctx.method.chain && (ctx.method.id !== 'sv_wild' || !!ctx.x.o.outbreak);

/** Taux actuel (1/x) pour une configuration et une chaîne. */
export const oddsAt = (cfg, c = 0) => 1 / probAt(oddsContext(cfg), c);

// Au-delà de ce seuil, toutes les méthodes ont un taux constant.
const STABLE = 200;

/** Log de la probabilité de n'avoir aucun shiny après `n` tentatives (chaîne partant de 0). */
function logMiss(ctx, n) {
  if (n <= 0) return 0;
  if (!isDynamic(ctx)) return n * Math.log1p(-probAt(ctx, 0));
  let sum = 0;
  const upto = Math.min(n, STABLE);
  for (let c = 0; c < upto; c++) sum += Math.log1p(-probAt(ctx, c));
  if (n > STABLE) sum += (n - STABLE) * Math.log1p(-probAt(ctx, STABLE));
  return sum;
}

/** Probabilité cumulée d'avoir obtenu au moins un shiny sur plusieurs segments (phases / chaînes). */
export function cumulativeChance(cfg, segments) {
  const ctx = oddsContext(cfg);
  if (probAt(ctx, 0) >= 1) return segments.some(n => n > 0) ? 1 : 0;
  const lm = segments.reduce((s, n) => s + logMiss(ctx, n), 0);
  return 1 - Math.exp(lm);
}

/** Nombre de tentatives (en une seule chaîne) pour atteindre une probabilité cible. */
export function encountersFor(cfg, target) {
  const ctx = oddsContext(cfg);
  const p0 = probAt(ctx, 0);
  if (p0 >= 1) return 1;
  const goal = Math.log1p(-target);
  if (!isDynamic(ctx)) return Math.ceil(goal / Math.log1p(-p0));
  let sum = 0;
  for (let c = 0; c < STABLE; c++) {
    sum += Math.log1p(-probAt(ctx, c));
    if (sum <= goal) return c + 1;
  }
  return STABLE + Math.ceil((goal - sum) / Math.log1p(-probAt(ctx, STABLE)));
}

/** « Ratio de chance » équivalent à rencontres / taux, valable aussi pour les taux dynamiques. */
export const luckRatio = chance => (chance >= 1 ? 10 : -Math.log(1 - chance));
