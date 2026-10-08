// Outils de lecture de la collection : Pokémon, shiny manquants, chasses, captures.
/** @import { Tool } from './types.js' */
import { MAIN_DEX, getPokemon, gamesFor } from '../../../data/pokedex.js';
import { GAME_BY_ID, isLockedIn } from '../../../data/games.js';
import { METHOD_BY_ID } from '../../../data/methods.js';
import { REGIONS, POKEMON_TYPES, BALL_BY_ID } from '../../../data/constants.js';
import { clampInt } from './validate.js';
import { findPokemon, describePokemon, huntSummary, regionName } from './lookup.js';

/** @type {Tool} */
export const chercherPokemon = {
  name: 'chercher_pokemon',
  description: 'Cherche un Pokémon par nom français ou anglais, ou par numéro. Renvoie sa clé interne, ses types, sa région, les jeux où il est disponible et si l\'utilisateur l\'a déjà en shiny.',
  schema: {
    type: 'object',
    properties: { nom: { type: 'string', description: 'Nom (FR ou EN) ou numéro du Pokédex national' } },
    required: ['nom']
  },
  async run(args, { s }) {
    const found = findPokemon(args.nom, { all: true });
    if (!found.length) return { resultats: [], message: 'Aucun Pokémon trouvé.' };
    return { resultats: found.map(p => describePokemon(p, s)) };
  }
};

/** @type {Tool} */
export const pokemonManquants = {
  name: 'pokemon_manquants',
  description: 'Liste les Pokémon que l\'utilisateur n\'a pas encore en shiny, avec des filtres facultatifs.',
  schema: {
    type: 'object',
    properties: {
      region: { type: 'string', description: `Identifiant de région : ${REGIONS.map(r => r.id).join(', ')}` },
      type: { type: 'string', description: `Identifiant de type : ${POKEMON_TYPES.map(t => t.id).join(', ')}` },
      jeu: { type: 'string', description: 'Identifiant de jeu : seulement les Pokémon disponibles (et non Shiny Lock) dans ce jeu' },
      objectifs_seulement: { type: 'boolean', description: 'Seulement ceux marqués comme objectifs' },
      limite: { type: 'integer', description: 'Nombre maximum de résultats (30 par défaut, 100 au plus)' }
    }
  },
  async run(args, { s }) {
    const limite = clampInt(args.limite, 30, 100);
    const list = MAIN_DEX.filter(p => {
      if (s.shinies[p.key]) return false;
      if (args.region && p.region !== args.region) return false;
      if (args.type && !p.types.includes(args.type)) return false;
      if (args.objectifs_seulement && !s.wishlist[p.key]) return false;
      if (args.jeu && !(gamesFor(p).some(g => g.id === args.jeu) && !isLockedIn(p, args.jeu))) return false;
      return true;
    });
    return {
      total_manquants: list.length,
      affiches: Math.min(limite, list.length),
      pokemon: list.slice(0, limite).map(p => ({ cle: p.key, nom: p.name, numero: p.id, region: regionName(p.region) }))
    };
  }
};

/** @type {Tool} */
export const mesChasses = {
  name: 'mes_chasses',
  description: 'Chasses en cours (rencontres, taux actuel, chance cumulée, durée) et dernières chasses terminées.',
  schema: { type: 'object', properties: {} },
  async run(args, { s }) {
    const active = s.hunts.filter(h => h.status === 'active').sort((a, b) => b.updatedAt - a.updatedAt);
    const done = s.hunts.filter(h => h.status === 'done').sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)).slice(0, 5);
    return { en_cours: active.map(huntSummary), terminees_recemment: done.map(huntSummary) };
  }
};

/** @type {Tool} */
export const capturesRecentes = {
  name: 'captures_recentes',
  description: 'Derniers shiny capturés par l\'utilisateur, avec jeu, méthode, rencontres et date.',
  schema: {
    type: 'object',
    properties: { limite: { type: 'integer', description: 'Nombre de captures (10 par défaut, 50 au plus)' } }
  },
  async run(args, { s }) {
    const limite = clampInt(args.limite, 10, 50);
    const recent = [...s.catches].sort((a, b) => b.timestamp - a.timestamp).slice(0, limite);
    return {
      total_captures: s.catches.length,
      captures: recent.map(c => ({
        pokemon: getPokemon(c.key)?.name || c.key,
        date: c.date || null,
        jeu: GAME_BY_ID[c.game]?.short || null,
        methode: METHOD_BY_ID[c.method]?.name || null,
        rencontres: c.count || null,
        taux: c.odds ? `1/${c.odds}` : null,
        ball: BALL_BY_ID[c.ball]?.name || null,
        surnom: c.nickname || undefined
      }))
    };
  }
};
