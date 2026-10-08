// Outils de conseil de chasse : meilleures options, jeux, chasse proposée, priorités avant la Banque.
/** @import { Tool } from './types.js' */
import { gamesFor, isAvailableIn } from '../../../data/pokedex.js';
import { GAMES, GAME_BY_ID, isLockedIn } from '../../../data/games.js';
import { METHOD_BY_ID, gameMethods, oddsAt } from '../../../data/methods.js';
import { bestOptions } from '../../../domain/bestOptions.js';
import { bestOptionsPrefs, hasCharm, myGamesSet } from '../../../domain/settings.js';
import { bankDaysLeft, bankPriorities, homeTransfer } from '../../../domain/bank.js';
import { loadEncounters } from '../../encounters.js';
import { clampInt } from './validate.js';
import { resolveOne } from './lookup.js';

/** @type {Tool} */
export const meilleuresOptions = {
  name: 'meilleures_options',
  description: 'Meilleures façons d\'obtenir un Pokémon en shiny, classées par taux, avec le jeu, la méthode, le taux, les lieux et si le Pokémon pourra aller dans Pokémon HOME. Ce sont les données de référence de l\'app : base tes conseils dessus.',
  schema: {
    type: 'object',
    properties: { pokemon: { type: 'string', description: 'Clé interne (de chercher_pokemon) ou nom' } },
    required: ['pokemon']
  },
  async run(args, { s }) {
    const p = resolveOne(args.pokemon);
    const data = await loadEncounters();
    const { main, extra, others } = bestOptions(p, data, bestOptionsPrefs(s.settings));
    const fmt = o => {
      const g = GAME_BY_ID[o.game];
      return {
        jeu: g?.name || o.game,
        jeu_id: o.game,
        plateforme: g?.platform,
        methode: o.label,
        methode_id: o.cfg.method,
        taux: `1/${Math.round(o.odds)}`,
        lieux: o.locations.slice(0, 8),
        estimation: o.estimate || undefined,
        remarque: o.note || undefined,
        charme_chroma_compte: !!o.cfg.charm,
        transfert_home: homeTransfer(o.game)
      };
    };
    return {
      pokemon: p.name,
      cle: p.key,
      shiny_capture: !!s.shinies[p.key],
      options: main.slice(0, 8).map(fmt),
      options_dans_des_jeux_non_possedes: myGamesSet(s.settings) ? others.slice(0, 5).map(fmt) : undefined,
      pokemon_go: extra.map(fmt),
      a_savoir: main.length ? undefined : 'Aucune option sauvage connue : évènement, échange, reproduction ou évolution.'
    };
  }
};

/** @type {Tool} */
export const infosJeu = {
  name: 'infos_jeu',
  description: 'Méthodes de chasse disponibles dans un jeu (identifiant et nom), taux de base, Charme Chroma, conseil et possibilité de transfert vers Pokémon HOME.',
  schema: {
    type: 'object',
    properties: { jeu: { type: 'string', description: 'Identifiant de jeu' } },
    required: ['jeu']
  },
  async run(args) {
    const g = GAME_BY_ID[args.jeu];
    if (!g) throw new Error(`Jeu inconnu : ${args.jeu}. Identifiants valides : ${GAMES.map(x => x.id).join(', ')}.`);
    return {
      jeu: g.name,
      jeu_id: g.id,
      plateforme: g.platform,
      generation: g.gen,
      taux_de_base: `1/${g.base}`,
      charme_chroma: g.charm ? `+${g.charm} tirage(s)` : 'non disponible',
      methodes: gameMethods(g.id).map(m => ({ id: m.id, nom: m.name, taux_de_depart: `1/${Math.round(oddsAt({ game: g.id, method: m.id, charm: false, opts: {} }, 0))}` })),
      conseil: g.tip || undefined,
      transfert_home: homeTransfer(g.id)
    };
  }
};

/** @type {Tool} */
export const proposerChasse = {
  name: 'proposer_chasse',
  description: 'Affiche sous ta réponse une carte avec un bouton pour lancer cette chasse dans l\'app (l\'utilisateur confirme lui-même). Utilise-la quand tu recommandes une chasse précise. Si jeu et méthode correspondent à une option de meilleures_options, ses réglages (sandwich, apparition massive…) sont repris.',
  schema: {
    type: 'object',
    properties: {
      pokemon: { type: 'string', description: 'Clé interne ou nom' },
      jeu: { type: 'string', description: 'Identifiant de jeu' },
      methode: { type: 'string', description: 'Identifiant de méthode (facultatif)' },
      resume: { type: 'string', description: 'Une phrase courte affichée sur la carte' }
    },
    required: ['pokemon', 'jeu']
  },
  async run(args, { s, onAction }) {
    const p = resolveOne(args.pokemon);
    const g = GAME_BY_ID[args.jeu];
    if (!g) throw new Error(`Jeu inconnu : ${args.jeu}.`);
    const data = await loadEncounters().catch(() => null);
    // Disponible si le Pokémon est dans un Pokédex du jeu, ou s'il a des lieux de capture connus dans ce jeu.
    const hasEncounters = !!data?.encounters?.[p.baseId]?.some(([gi]) => data.games[gi] === g.id);
    if (g.dexes && !isAvailableIn(p, g.id) && !hasEncounters) {
      throw new Error(`${p.name} n'est pas disponible dans ${g.short} d'après les données de l'app. Jeux possibles : ${gamesFor(p).map(x => `${x.id} (${x.short})`).join(', ') || 'aucun'}.`);
    }
    if (isLockedIn(p, g.id)) throw new Error(`${p.name} est Shiny Lock dans ${g.short}.`);
    let cfg;
    const options = data ? (({ main, others }) => [...main, ...others])(bestOptions(p, data, bestOptionsPrefs(s.settings))) : [];
    const match = options.find(o => o.game === g.id && (!args.methode || o.cfg.method === args.methode));
    if (match) cfg = match.cfg;
    else {
      const methods = gameMethods(g.id);
      const method = methods.find(m => m.id === args.methode) || methods[0];
      cfg = { game: g.id, method: method.id, opts: {}, charm: hasCharm(s.settings, g.id) };
    }
    onAction({ type: 'hunt', key: p.key, cfg, label: args.resume || null });
    return { ok: true, carte: `Carte « Chasser ${p.name} en ${g.short} » affichée.`, taux: `1/${Math.round(oddsAt(cfg, METHOD_BY_ID[cfg.method]?.chain || 0))}` };
  }
};

/** @type {Tool} */
export const prioritesBanque = {
  name: 'priorites_banque',
  description: 'Shiny manquants à chasser en priorité sur DS/3DS avant la fermeture de Pokémon Banque : ceux qu\'on ne peut avoir que sur DS/3DS, puis ceux qui y sont bien plus faciles que sur Switch (selon les jeux de l\'utilisateur).',
  schema: {
    type: 'object',
    properties: { limite: { type: 'integer', description: 'Nombre maximum par catégorie (15 par défaut, 50 au plus)' } }
  },
  async run(args, { s }) {
    const limite = clampInt(args.limite, 15, 50);
    const data = await loadEncounters();
    const { only, easier } = bankPriorities(data, { shinies: s.shinies, prefs: bestOptionsPrefs(s.settings) });
    const fmt = e => ({
      pokemon: e.p.name,
      cle: e.p.key,
      objectif: !!s.wishlist[e.p.key] || undefined,
      meilleur_ds_3ds: `${GAME_BY_ID[e.best.game]?.short} · ${e.best.label} · 1/${Math.round(e.best.odds)}`,
      jeu_id: e.best.game,
      methode_id: e.best.cfg.method,
      jeu_non_possede: e.notOwned || undefined,
      meilleur_switch: e.switchBest ? `${GAME_BY_ID[e.switchBest.game]?.short} · 1/${Math.round(e.switchBest.odds)}`
        : e.switchElsewhere ? `aucun dans ses jeux (possible dans ${GAME_BY_ID[e.switchElsewhere.game]?.short} · 1/${Math.round(e.switchElsewhere.odds)})` : 'aucun jeu Switch',
      gain: Number.isFinite(e.gain) ? `×${Math.round(e.gain * 10) / 10}` : 'seul moyen'
    });
    return {
      jours_restants: bankDaysLeft(),
      seulement_ds_3ds: { total: only.length, pokemon: only.slice(0, limite).map(fmt) },
      bien_plus_faciles: { total: easier.length, pokemon: easier.slice(0, limite).map(fmt) },
      a_savoir: 'Calcul fait avec les données de lieux de l\'app : certains Pokémon peuvent aussi s\'obtenir sur Switch par d\'autres moyens (fossiles, raids, dons).'
    };
  }
};
