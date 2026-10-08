// Recherche et descriptions partagées par les outils de l'assistant.
import { MAIN_DEX, POKEDEX, getPokemon, gamesFor } from '../../../data/pokedex.js';
import { GAME_BY_ID, isLockedIn } from '../../../data/games.js';
import { METHOD_BY_ID } from '../../../data/methods.js';
import { REGION_BY_ID, TYPE_BY_ID } from '../../../data/constants.js';
import { huntTotal, huntOdds, huntChance, huntElapsed } from '../../../domain/hunt.js';
import { normalize } from '../../../lib/text.js';
import { formatDuration } from '../../../lib/format.js';

export const regionName = id => REGION_BY_ID[id]?.name || id;
export const typeNames = types => types.map(t => TYPE_BY_ID[t]?.name || t);

/** Retrouve un Pokémon à partir d'un nom (FR ou EN), d'un numéro ou d'une clé interne. */
export function findPokemon(query, { all = false } = {}) {
  const q = String(query ?? '').trim();
  if (!q) return [];
  const direct = getPokemon(q);
  if (direct) return [direct];
  const pool = all ? POKEDEX : MAIN_DEX;
  if (/^#?\d+$/.test(q)) {
    const id = Number(q.replace('#', ''));
    return pool.filter(p => p.id === id).slice(0, 5);
  }
  const n = normalize(q);
  const exact = pool.filter(p => normalize(p.name) === n || normalize(p.enName) === n);
  if (exact.length) return exact.slice(0, 5);
  return pool.filter(p => p.search.includes(n)).slice(0, 5);
}

/** Un seul Pokémon, ou une erreur explicite pour le modèle. */
export const resolveOne = query => {
  const [p] = findPokemon(query, { all: true });
  if (!p) throw new Error(`Pokémon introuvable : « ${query} ». Utilise chercher_pokemon pour trouver la bonne clé.`);
  return p;
};

/** Fiche courte d'un Pokémon, avec l'état de la collection. */
export function describePokemon(p, s) {
  const copies = s.catchesByKey[p.key]?.length || 0;
  return {
    cle: p.key,
    nom: p.name,
    nom_anglais: p.enName,
    numero: p.id,
    types: typeNames(p.types),
    region: regionName(p.region),
    generation: p.gen,
    categorie: p.isMythical ? 'fabuleux' : p.isLegendary ? 'légendaire' : p.isStarter ? 'starter' : null,
    shiny_capture: copies > 0,
    exemplaires: copies,
    dans_mes_objectifs: !!s.wishlist[p.key],
    shiny_lock_partout: p.isShinyLocked,
    jeux: gamesFor(p).filter(g => !isLockedIn(p, g.id)).map(g => g.short)
  };
}

/** Résumé d'une chasse pour le modèle. */
export function huntSummary(h) {
  const p = getPokemon(h.targetId);
  return {
    pokemon: p?.name || h.targetId,
    cle: h.targetId,
    jeu: GAME_BY_ID[h.game]?.short || h.game,
    methode: METHOD_BY_ID[h.method]?.name || h.method,
    rencontres: huntTotal(h),
    taux_actuel: `1/${Math.round(huntOdds(h))}`,
    chance_cumulee: `${Math.round(huntChance(h) * 1000) / 10} %`,
    duree: formatDuration(huntElapsed(h)),
    phases: h.phases.length
  };
}
