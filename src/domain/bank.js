// Fermeture de Pokémon Banque : fin des transferts DS/3DS → Pokémon HOME.
import { GAME_BY_ID } from '../data/games.js';
import { MAIN_DEX } from '../data/pokedex.js';
import { bestOptions } from './bestOptions.js';

// Date officielle : 25 février 2027 à 19 h, heure du Pacifique (= 26 février 03:00 UTC, 4 h en France).
export const BANK_DEADLINE = Date.parse('2027-02-26T03:00:00Z');
const DAY = 86400000;

export const bankOpen = (now = Date.now()) => now < BANK_DEADLINE;
export const bankDaysLeft = (now = Date.now()) => Math.max(0, Math.ceil((BANK_DEADLINE - now) / DAY));

/** Jeux dont les Pokémon ne peuvent rejoindre HOME que par Poké Transporter / Pokémon Banque. */
export const viaBank = gameId => {
  const g = GAME_BY_ID[gameId];
  return !!g && (g.platform === '3ds' || g.platform === 'ds' || !!g.vc3ds);
};

const onSwitch = gameId => GAME_BY_ID[gameId]?.platform === 'switch' && gameId !== 'champions';

// Écart minimal de taux pour qu'une chasse DS/3DS soit « bien plus facile ».
export const MIN_GAIN = 3;

/**
 * Pokémon manquants à chasser en priorité sur DS/3DS avant la fermeture.
 * `only` : aucune option dans aucun jeu Switch (vraiment perdus après la fermeture) ;
 * `easier` : au moins MIN_GAIN fois plus facile sur DS/3DS que dans tes jeux Switch, ou absent de tes jeux Switch.
 * Chaque entrée : { p, best (option DS/3DS), switchBest (option Switch ou null), gain, notOwned, switchElsewhere }.
 */
export function bankPriorities(data, { shinies, prefs = {} }) {
  const owns = prefs.owns || (() => true);
  const only = [];
  const easier = [];
  const min = list => (list.length ? list.reduce((a, b) => (b.odds < a.odds ? b : a)) : null);
  for (const p of MAIN_DEX) {
    if (p.isShinyLocked || shinies[p.key]) continue;
    // Tous les jeux (pour savoir si la Switch le permet), avec les Charmes de l'utilisateur.
    const { main } = bestOptions(p, data, { charmFor: prefs.charmFor });
    const legacyAll = main.filter(o => viaBank(o.game));
    if (!legacyAll.length) continue;
    const legacyMine = legacyAll.filter(o => owns(o.game));
    const best = min(legacyMine) || min(legacyAll);
    const notOwned = !legacyMine.length;
    const switchAll = main.filter(o => onSwitch(o.game));
    if (!switchAll.length) {
      only.push({ p, best, switchBest: null, gain: Infinity, notOwned });
      continue;
    }
    if (notOwned) continue; // ni dans tes jeux DS/3DS, ni exclusif : rien d'urgent
    const switchBest = min(switchAll.filter(o => owns(o.game)));
    if (!switchBest) easier.push({ p, best, switchBest: null, gain: Infinity, switchElsewhere: min(switchAll) });
    else if (switchBest.odds / best.odds >= MIN_GAIN) easier.push({ p, best, switchBest, gain: switchBest.odds / best.odds });
  }
  only.sort((a, b) => a.notOwned - b.notOwned || a.best.odds - b.best.odds || a.p.id - b.p.id);
  easier.sort((a, b) => b.gain - a.gain || a.best.odds - b.best.odds || a.p.id - b.p.id);
  return { only, easier };
}

/** Regroupe des priorités par jeu et méthode (une session de chasse = un jeu, une méthode). */
export function groupByMethod(entries) {
  const groups = new Map();
  for (const e of entries) {
    const id = `${e.best.game}|${e.best.cfg.method}`;
    if (!groups.has(id)) groups.set(id, { id, game: e.best.game, label: e.best.label, odds: e.best.odds, items: [] });
    groups.get(id).items.push(e);
  }
  return [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.odds - b.odds);
}
