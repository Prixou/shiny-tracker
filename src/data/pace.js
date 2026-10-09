// Rythme moyen de chaque méthode, en unités par heure (rencontres, œufs, resets, raids…) : ordres de
// grandeur pour estimer la durée d'une chasse, tant que l'utilisateur n'a pas son propre rythme
// (domain/pace.js). Distribution / évènement : absent, ça ne se chasse pas.
/** @type {Record<string, number>} */
export const DEFAULT_PACE = {
  wild: 150, reset: 90, egg: 60, masuda: 80, gsc_breed: 40, horde: 600,
  radar: 120, chain_fishing: 180, friend_safari: 150, dexnav: 100, sos: 150, catch_combo: 200,
  dynamax: 4, raid: 12,
  pla_wild: 120, pla_mo: 300, pla_mmo: 200,
  sv_wild: 400,
  za_wild: 300, za_fasttravel: 120, za_bench: 60, za_stairs: 90, za_fossil: 60,
  go_standard: 400, go_boosted: 400, go_cday: 600, go_raid: 6,
  other: 150
};
