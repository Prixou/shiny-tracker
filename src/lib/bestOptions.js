import { GAME_BY_ID, isLockedIn } from '../data/constants.js';
import { oddsAt, METHOD_BY_ID } from '../data/methods.js';
import { isAvailableIn } from '../data/pokedex.js';
import { REGIONAL_FORMS } from '../data/forms.js';

// Jeux dont les rencontres sauvages sont dans la forme régionale (les données de lieux ne distinguent pas les formes).
const NATIVE_FORM = { sm: 'alola', usum: 'alola', swsh: 'galar', pla: 'hisui', sv: 'paldea' };

// Légendaires disponibles dans les Expéditions Dynamax (Épée / Bouclier, Terres Enneigées).
const DYNAMAX_LEGENDS = new Set([144, 145, 146, 150, 243, 244, 245, 249, 250, 380, 381, 382, 383, 384, 480, 481, 482, 483, 484, 485, 487, 488,
  641, 642, 643, 644, 645, 646, 716, 717, 718, 785, 786, 787, 788, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 805, 806]);

const AREA_ZERO = /^Zone Zéro/;
// Rencontres uniques : pas de chaîne, pas de combo, pas de Poké Radar.
const NOT_WILD = new Set(['static', 'gift', 'gift-egg', 'only-one', 'npc-trade', 'pokeflute', 'max-raid', 'roaming-grass', 'roaming-water']);

/** Regroupe les lieux d'une espèce par jeu et par mode de rencontre. */
function indexEncounters(data, speciesId) {
  const byGame = {};
  for (const [g, loc, m, min, max] of data?.encounters?.[speciesId] || []) {
    const game = data.games[g];
    const method = data.methods[m];
    ((byGame[game] ||= {})[method] ||= []).push({ name: data.locations[loc], min, max });
  }
  return byGame;
}

const uniqueNames = list => [...new Set((list || []).map(l => l.name))];

/**
 * Meilleures façons d'obtenir un Pokémon shiny, classées par taux (le meilleur d'abord).
 * Chaque option contient une configuration de chasse prête à l'emploi (`cfg`).
 * `prefs.owns(jeu)` limite `main` aux jeux possédés (les autres vont dans `others`) ;
 * `prefs.charmFor(jeu)` indique si le Charme Chroma est compté.
 */
export function bestOptions(p, data, prefs = {}) {
  const owns = prefs.owns || (() => true);
  const charmFor = prefs.charmFor || (() => true);
  if (!p || p.variantKind === 'mega' || p.variantKind === 'gmax') return { main: [], extra: [], others: [] };
  const enc = indexEncounters(data, p.baseId);
  const options = [];
  // Forme régionale : seulement dans les jeux qui l'ont. Forme normale : pas dans les jeux où elle est remplacée.
  const formRegions = new Set(REGIONAL_FORMS.filter(f => f.baseId === p.baseId).map(f => f.region));
  const wrongForm = game => (p.isForm
    ? !(GAME_BY_ID[game]?.forms || []).includes(p.region)
    : !!NATIVE_FORM[game] && formRegions.has(NATIVE_FORM[game]));
  const add = (game, cfg, { label, locations = [], estimate = null, note = null, chain = null }) => {
    if (isLockedIn(p, game) || wrongForm(game)) return;
    const full = { game, opts: {}, ...cfg, charm: cfg.charm ?? charmFor(game) };
    const odds = oddsAt(full, chain ?? METHOD_BY_ID[full.method]?.chain ?? 0);
    options.push({ game, cfg: full, odds, label, locations, estimate, note });
  };
  const has = (game, ...methods) => methods.some(m => enc[game]?.[m]?.length);
  const locs = (game, ...methods) => uniqueNames(methods.flatMap(m => enc[game]?.[m] || []));

  // Écarlate / Violet
  if (enc.sv) {
    const places = locs('sv', 'sv-wild');
    const outsideAreaZero = places.some(n => !AREA_ZERO.test(n));
    const event = data.svEventOutbreaks?.includes(p.baseId);
    if (outsideAreaZero && !p.isLegendary && !p.isMythical) {
      add('sv', { method: 'sv_wild', opts: { outbreak: true, sparkling: 3 } }, {
        label: 'Apparition massive (60 KO) + sandwich Brillance Nv. 3',
        locations: places.filter(n => !AREA_ZERO.test(n)),
        estimate: event ? 'Déjà vu en apparition massive évènementielle' : 'Apparition massive possible (estimation : espèce sauvage hors Zone Zéro)'
      });
    } else {
      add('sv', { method: 'sv_wild', opts: { sparkling: 3 } }, { label: 'Sandwich Brillance Nv. 3', locations: places });
    }
  }
  if (p.canBreed && isAvailableIn(p, 'sv')) {
    add('sv', { method: 'masuda' }, { label: 'Méthode Masuda (Métamorph étranger)', note: 'Reproduction : lieu sans importance.' });
  }

  // Légendes Arceus
  if (has('pla', 'pla-mo')) add('pla', { method: 'pla_mo', opts: { research: 3 } }, { label: 'Apparition massive + recherche parfaite', locations: locs('pla', 'pla-mo') });
  else if (has('pla', 'pla-mmo')) add('pla', { method: 'pla_mmo', opts: { research: 3 } }, { label: 'Mégapparition + recherche parfaite', locations: locs('pla', 'pla-mmo') });
  else if (has('pla', 'pla-wild', 'pla-landmark', 'pla-distortion')) add('pla', { method: 'pla_wild', opts: { research: 3 } }, { label: 'Sauvage + recherche parfaite', locations: locs('pla', 'pla-wild', 'pla-landmark', 'pla-distortion') });

  // Légendes Z-A
  if (has('za', 'za-wild', 'za-hyperspace')) {
    add('za', { method: 'za_fasttravel', opts: { sparkling: 3, spawns: 1 } }, {
      label: 'Téléportation en boucle + donut Brillance Nv. 3',
      locations: locs('za', 'za-wild', 'za-hyperspace'),
      note: has('za', 'za-hyperspace') ? 'En Hyperespace, la quête « Attraper un shiny » en garantit un avec Brillance Nv. 3.' : null
    });
  }

  // Méthodes à chaîne
  const wildLetsGo = Object.keys(enc.letsgo || {}).filter(m => !NOT_WILD.has(m));
  if (wildLetsGo.length) add('letsgo', { method: 'catch_combo', opts: { lure: true } }, { label: 'Combo Capture 31+ avec Parfum', locations: locs('letsgo', ...wildLetsGo) });
  for (const g of ['usum', 'sm']) {
    if (has(g, 'sos', 'sos-from-bubbling-spot')) { add(g, { method: 'sos' }, { label: 'Appels à l\'aide (chaîne 31+)', locations: locs(g, 'sos', 'sos-from-bubbling-spot') }); break; }
  }
  for (const g of ['oras', 'xy']) {
    if (has(g, 'old-rod', 'good-rod', 'super-rod')) add(g, { method: 'chain_fishing' }, { label: 'Pêche à la chaîne (20+)', locations: locs(g, 'old-rod', 'good-rod', 'super-rod') });
  }
  if (has('xy', 'walk')) add('xy', { method: 'radar' }, { label: 'Poké Radar (chaîne 40)', locations: locs('xy', 'walk') });
  // Safari des Amis (X / Y) : 5 tirages de base
  const safari = locs('xy', 'walk').filter(n => n.startsWith('Safari des Amis'));
  if (safari.length) add('xy', { method: 'friend_safari' }, { label: 'Safari des Amis', locations: safari, note: 'Le Pokémon doit figurer dans le Safari d\'un ami (code ami 3DS).' });
  // Navi-Dex (Rubis Oméga / Saphir Alpha)
  if (has('oras', 'walk')) add('oras', { method: 'dexnav' }, { label: 'Navi-Dex (chaîne)', locations: locs('oras', 'walk') });
  if (has('bdsp', 'walk')) add('bdsp', { method: 'radar' }, { label: 'Poké Radar (chaîne 40)', locations: locs('bdsp', 'walk'), note: 'Uniquement dans les hautes herbes.' });
  if (has('dpp', 'walk')) add('dpp', { method: 'radar' }, { label: 'Poké Radar (chaîne 40)', locations: locs('dpp', 'walk') });

  // Or / Argent / Cristal (Console virtuelle 3DS) : un parent shiny donne 1/64 à la reproduction.
  if (p.canBreed && !p.isForm && p.baseId <= 251 && isAvailableIn(p, 'gsc')) {
    add('gsc', { method: 'gsc_breed', charm: false }, {
      label: 'Reproduction avec un parent shiny (Console virtuelle 3DS)',
      note: 'Il faut un parent shiny compatible : un Métamorph shiny marche avec tout (le Léviator rouge du Lac Colère convient aux groupes Eau 2 et Dragon). L\'œuf donne la première forme de l\'évolution. Transfert ensuite via Pokémon Banque et Poké Transporter.'
    });
  }

  // Épée / Bouclier
  if (DYNAMAX_LEGENDS.has(p.baseId) && !p.isForm) add('swsh', { method: 'dynamax' }, { label: 'Expédition Dynamax', locations: ['Grand Antre (Terres Enneigées)'] });

  // Ailleurs, rencontres simples à pleine chance : sauvage, ou Soft Reset pour une rencontre unique.
  const RESET_TYPES = new Set(['static', 'only-one', 'pokeflute', 'roaming-grass', 'roaming-water']);
  const SKIP_TYPES = /^(gift|gift-egg|npc-trade|max-raid|colosseum|pokemon-|pla-|za-|sv-wild)/;
  for (const [game, byMethod] of Object.entries(enc)) {
    const g = GAME_BY_ID[game];
    if (!g || game === 'pogo' || options.some(o => o.game === game)) continue;
    const types = Object.keys(byMethod).filter(m => !SKIP_TYPES.test(m));
    const wildTypes = types.filter(m => !RESET_TYPES.has(m));
    const resetTypes = types.filter(m => RESET_TYPES.has(m));
    if (wildTypes.length && g.methods?.includes('wild')) add(game, { method: 'wild' }, { label: 'Rencontre sauvage (pleine chance)', locations: locs(game, ...wildTypes) });
    else if (resetTypes.length && g.methods?.includes('reset')) add(game, { method: 'reset' }, { label: 'Soft Reset (rencontre unique)', locations: locs(game, ...resetTypes) });
  }

  // Meilleure option par jeu, puis classement par taux.
  const bestByGame = new Map();
  for (const o of options) if (!bestByGame.has(o.game) || o.odds < bestByGame.get(o.game).odds) bestByGame.set(o.game, o);
  const ranked = [...bestByGame.values()].sort((a, b) => a.odds - b.odds || (GAME_BY_ID[b.game]?.gen || 0) - (GAME_BY_ID[a.game]?.gen || 0));
  const main = ranked.filter(o => owns(o.game));
  const others = ranked.filter(o => !owns(o.game));

  // Pokémon GO en complément (taux différents, jeu à part).
  const extra = [];
  if (!p.isMythical && !p.isShinyLocked && owns('pogo')) {
    if (p.isLegendary) extra.push({ game: 'pogo', cfg: { game: 'pogo', method: 'go_raid', opts: {}, charm: false }, odds: 20, label: 'Raids légendaires', locations: [] });
    else extra.push({ game: 'pogo', cfg: { game: 'pogo', method: 'go_standard', opts: {}, charm: false }, odds: 512, label: 'Sauvage (1/64 en œuf ou raid, ~1/25 en Community Day)', locations: [] });
  }
  return { main, extra, others };
}
