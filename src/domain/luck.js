// Paliers de chance d'une capture, selon le ratio « rencontres / taux » (1 = pile dans le taux).

export const NO_LUCK = { id: 'none', name: 'Non renseigné', desc: 'Saisie manuelle sans compteur', emoji: '🎲', color: 'text-slate-400', bg: 'bg-slate-800/60 border-slate-700' };

// Du plus chanceux au moins chanceux ; `max` = ratio maximal du palier.
export const LUCK_TIERS = [
  { id: 'king', max: 0.25, name: 'Cocu Master', desc: 'Même pas eu le temps de lancer le café !', emoji: '👑', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/40' },
  { id: 'lucky', max: 0.75, name: 'Chatteux du Dimanche', desc: 'Franchement rapide et indécent !', emoji: '✨', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40' },
  { id: 'fair', max: 1.25, name: 'Respectueux des Stats', desc: 'Pile dans les probabilités, comme dans un livre.', emoji: '⚖️', color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/40' },
  { id: 'sweat', max: 2, name: 'Début de Transpiration', desc: 'La patience commence à s\'effriter sévère…', emoji: '🫠', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/40' },
  { id: 'suffer', max: 3, name: 'Suffer Squad', desc: 'Plus du double des odds. Lâchez une larme.', emoji: '💀', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/40' },
  { id: 'forgotten', max: Infinity, name: 'Arceus t\'a Oublié', desc: 'Over Odds mythique, tu mérites une statue de seum.', emoji: '🗿', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/40' }
];

/** Palier correspondant à un ratio (null ou 0 : pas de compteur). */
export const getLuckTier = ratio => (ratio == null || !(ratio > 0) ? NO_LUCK : LUCK_TIERS.find(t => ratio <= t.max));

/** Ratio de chance d'une capture enregistrée (null si inconnu). */
export const catchRatio = rec => (rec?.luck != null ? rec.luck : rec?.count > 0 && rec?.odds > 0 ? rec.count / rec.odds : null);
