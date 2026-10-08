// Outils que l'assistant peut appeler pour lire les données de l'app, et contexte de départ.
import { MAIN_DEX, POKEDEX, getPokemon, gamesFor, isAvailableIn } from '../../data/pokedex.js';
import { GAMES, GAME_BY_ID, isLockedIn } from '../../data/games.js';
import { METHOD_BY_ID, gameMethods, oddsAt } from '../../data/methods.js';
import { REGIONS, REGION_BY_ID, TYPE_BY_ID, POKEMON_TYPES, BALL_BY_ID } from '../../data/constants.js';
import { huntTotal, huntOdds, huntChance, huntElapsed } from '../../domain/hunt.js';
import { bestOptions } from '../../domain/bestOptions.js';
import { loadEncounters } from '../encounters.js';
import { normalize } from '../../lib/text.js';
import { formatDuration } from '../../lib/format.js';
import { bestOptionsPrefs, hasCharm, myGamesSet } from '../../domain/settings.js';
import { EVENTS, EVENTS_UPDATED, eventStatus } from '../../data/events.js';
import { BANK_DEADLINE_TEXT, bankDaysLeft, bankPriorities, homeTransfer } from '../../domain/bank.js';

const regionName = id => REGION_BY_ID[id]?.name || id;
const typeNames = types => types.map(t => TYPE_BY_ID[t]?.name || t);

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

const resolveOne = query => {
  const [p] = findPokemon(query, { all: true });
  if (!p) throw new Error(`Pokémon introuvable : « ${query} ». Utilise chercher_pokemon pour trouver la bonne clé.`);
  return p;
};

function describePokemon(p, s) {
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

function huntSummary(h) {
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

const ACTIONS = ['ajouter_objectifs', 'retirer_objectifs', 'creer_liste', 'ajouter_a_liste', 'retirer_de_liste', 'pause_chasse'];

/* ---------- Définitions (format neutre : JSON Schema) ---------- */
export const TOOL_DEFS = [
  {
    name: 'chercher_pokemon',
    description: 'Cherche un Pokémon par nom français ou anglais, ou par numéro. Renvoie sa clé interne, ses types, sa région, les jeux où il est disponible et si l\'utilisateur l\'a déjà en shiny.',
    schema: {
      type: 'object',
      properties: { nom: { type: 'string', description: 'Nom (FR ou EN) ou numéro du Pokédex national' } },
      required: ['nom']
    }
  },
  {
    name: 'meilleures_options',
    description: 'Meilleures façons d\'obtenir un Pokémon en shiny, classées par taux, avec le jeu, la méthode, le taux, les lieux et si le Pokémon pourra aller dans Pokémon HOME. Ce sont les données de référence de l\'app : base tes conseils dessus.',
    schema: {
      type: 'object',
      properties: { pokemon: { type: 'string', description: 'Clé interne (de chercher_pokemon) ou nom' } },
      required: ['pokemon']
    }
  },
  {
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
    }
  },
  {
    name: 'mes_chasses',
    description: 'Chasses en cours (rencontres, taux actuel, chance cumulée, durée) et dernières chasses terminées.',
    schema: { type: 'object', properties: {} }
  },
  {
    name: 'captures_recentes',
    description: 'Derniers shiny capturés par l\'utilisateur, avec jeu, méthode, rencontres et date.',
    schema: {
      type: 'object',
      properties: { limite: { type: 'integer', description: 'Nombre de captures (10 par défaut, 50 au plus)' } }
    }
  },
  {
    name: 'infos_jeu',
    description: 'Méthodes de chasse disponibles dans un jeu (identifiant et nom), taux de base, Charme Chroma, conseil et possibilité de transfert vers Pokémon HOME.',
    schema: {
      type: 'object',
      properties: { jeu: { type: 'string', description: 'Identifiant de jeu' } },
      required: ['jeu']
    }
  },
  {
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
    }
  },
  {
    name: 'priorites_banque',
    description: 'Shiny manquants à chasser en priorité sur DS/3DS avant la fermeture de Pokémon Banque : ceux qu\'on ne peut avoir que sur DS/3DS, puis ceux qui y sont bien plus faciles que sur Switch (selon les jeux de l\'utilisateur).',
    schema: {
      type: 'object',
      properties: { limite: { type: 'integer', description: 'Nombre maximum par catégorie (15 par défaut, 50 au plus)' } }
    }
  },
  {
    name: 'proposer_action',
    description: 'Propose une modification des données de l\'utilisateur. Une carte « Appliquer » s\'affiche : rien n\'est fait tant qu\'il n\'a pas appuyé dessus, donc ne dis jamais que c\'est fait. Actions : ajouter_objectifs, retirer_objectifs, creer_liste (avec nom et Pokémon), ajouter_a_liste, retirer_de_liste, pause_chasse (arrête le chronomètre de la chasse d\'un Pokémon).',
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ACTIONS, description: 'Type de modification' },
        pokemon: { type: 'array', items: { type: 'string' }, description: 'Clés internes ou noms des Pokémon concernés (30 au plus)' },
        liste: { type: 'string', description: 'Nom de la liste (creer_liste, ajouter_a_liste, retirer_de_liste)' },
        emoji: { type: 'string', description: 'Emoji de la nouvelle liste (facultatif)' },
        resume: { type: 'string', description: 'Une phrase courte affichée sur la carte' }
      },
      required: ['action']
    }
  }
];

/* ---------- Validation légère des arguments (les modèles peuvent se tromper) ---------- */
function validate(def, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Arguments invalides : un objet JSON est attendu.');
  for (const key of def.schema.required || []) {
    if (args[key] == null || args[key] === '') throw new Error(`Argument manquant : ${key}.`);
  }
  for (const [key, value] of Object.entries(args)) {
    const spec = def.schema.properties[key];
    if (!spec) continue;
    const ok = spec.type === 'integer' ? Number.isFinite(Number(value))
      : spec.type === 'boolean' ? typeof value === 'boolean'
        : spec.type === 'array' ? Array.isArray(value) && value.every(v => typeof v === 'string' || typeof v === 'number')
          : typeof value === 'string';
    if (!ok) throw new Error(`Argument « ${key} » : type ${spec.type} attendu.`);
    if (spec.enum && !spec.enum.includes(value)) throw new Error(`Argument « ${key} » : valeur parmi ${spec.enum.join(', ')} attendue.`);
  }
}

const clampInt = (v, def, max) => Math.min(max, Math.max(1, Math.round(Number(v) || def)));

/**
 * Exécute un outil. `ctx` donne l'état de l'app (`s`) et un callback `onAction` pour les cartes.
 * Renvoie toujours un objet sérialisable ; lève une erreur si l'appel est invalide.
 */
export async function runTool(name, args, ctx) {
  const def = TOOL_DEFS.find(t => t.name === name);
  if (!def) throw new Error(`Outil inconnu : ${name}.`);
  validate(def, args);
  const s = ctx.s;

  switch (name) {
    case 'chercher_pokemon': {
      const found = findPokemon(args.nom, { all: true });
      if (!found.length) return { resultats: [], message: 'Aucun Pokémon trouvé.' };
      return { resultats: found.map(p => describePokemon(p, s)) };
    }

    case 'meilleures_options': {
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

    case 'pokemon_manquants': {
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

    case 'mes_chasses': {
      const active = s.hunts.filter(h => h.status === 'active').sort((a, b) => b.updatedAt - a.updatedAt);
      const done = s.hunts.filter(h => h.status === 'done').sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)).slice(0, 5);
      return { en_cours: active.map(huntSummary), terminees_recemment: done.map(huntSummary) };
    }

    case 'captures_recentes': {
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

    case 'infos_jeu': {
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

    case 'proposer_chasse': {
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
      ctx.onAction({ type: 'hunt', key: p.key, cfg, label: args.resume || null });
      return { ok: true, carte: `Carte « Chasser ${p.name} en ${g.short} » affichée.`, taux: `1/${Math.round(oddsAt(cfg, METHOD_BY_ID[cfg.method]?.chain || 0))}` };
    }

    case 'priorites_banque': {
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

    case 'proposer_action': {
      const keys = [...new Set((args.pokemon || []).slice(0, 30).map(q => resolveOne(String(q)).key))];
      const listName = (args.liste || '').trim();
      const findList = () => {
        const n = normalize(listName);
        const list = s.lists.find(l => normalize(l.name) === n) || s.lists.find(l => normalize(l.name).includes(n));
        if (!list) throw new Error(`Liste introuvable : « ${listName} ». Listes existantes : ${s.lists.map(l => l.name).join(', ') || 'aucune'}.`);
        return list;
      };
      const needKeys = () => { if (!keys.length) throw new Error('Indique au moins un Pokémon dans « pokemon ».'); };
      let action;
      switch (args.action) {
        case 'ajouter_objectifs':
        case 'retirer_objectifs': {
          needKeys();
          action = { kind: args.action, keys };
          break;
        }
        case 'creer_liste': {
          if (!listName) throw new Error('Indique le nom de la liste dans « liste ».');
          action = { kind: 'creer_liste', keys, name: listName.slice(0, 40), emoji: (args.emoji || '📌').slice(0, 4) };
          break;
        }
        case 'ajouter_a_liste':
        case 'retirer_de_liste': {
          needKeys();
          const list = findList();
          action = { kind: args.action, keys, listId: list.id, name: list.name, emoji: list.emoji };
          break;
        }
        case 'pause_chasse': {
          needKeys();
          const hunt = s.hunts.find(h => h.status === 'active' && h.targetId === keys[0]);
          if (!hunt) throw new Error('Aucune chasse en cours pour ce Pokémon.');
          if (!hunt.startedAt) return { deja_en_pause: true, message: 'Le chronomètre de cette chasse est déjà arrêté.' };
          action = { kind: 'pause_chasse', keys: [hunt.targetId], huntId: hunt.id };
          break;
        }
        default:
          throw new Error('Action inconnue.');
      }
      ctx.onAction({ type: 'change', ...action, label: args.resume || null });
      return { en_attente: true, message: 'Carte affichée. L\'utilisateur doit appuyer sur « Appliquer » : ne dis pas que c\'est déjà fait.' };
    }

    default:
      throw new Error(`Outil inconnu : ${name}.`);
  }
}

/* ---------- Instructions et contexte de départ ---------- */
const INSTRUCTIONS = `Tu es l'assistant de chasse de « Shiny Hunter Pro », une application mobile (PWA) de suivi de Pokémon chromatiques (shiny). Tu parles à son utilisateur, un chasseur de shiny francophone.

Règles :
- Réponds en français, de façon courte et directe : l'utilisateur lit sur son téléphone. Phrases courtes, listes à puces, pas de longs paragraphes, pas de tableaux.
- Utilise les noms français des Pokémon, des jeux et des lieux.
- Pour les lieux, les taux et les méthodes, appuie-toi sur les outils de l'app (meilleures_options, infos_jeu) plutôt que sur ta mémoire. Si tu complètes avec tes connaissances, dis-le et reste prudent.
- Pour connaître la collection, les chasses ou ce qui manque, appelle les outils : ne devine pas.
- Quand tu recommandes une chasse précise, appelle proposer_chasse pour que l'utilisateur puisse la lancer d'un geste.
- Pour modifier ses objectifs ou ses listes, ou mettre en pause le chrono d'une chasse, appelle proposer_action : l'utilisateur valide lui-même.
- Si l'utilisateur a renseigné ses jeux, privilégie-les ; ne propose un autre jeu que s'il le demande ou si c'est nettement plus simple, en le signalant.
- Pokémon Banque ferme le ${BANK_DEADLINE_TEXT} : après, les Pokémon des jeux 3DS, DS et Console virtuelle ne peuvent plus aller dans Pokémon HOME. Pour savoir quoi chasser avant, appelle priorites_banque. L'écran « Avant la fermeture de la Banque » de l'app (bouton dans le Pokédex et l'Agenda) donne le plan complet.
- Pour l'actualité (raids, évènements, codes), sers-toi de l'agenda ci-dessous ; s'il est daté et que tu as la recherche web, vérifie en ligne. Sans recherche web, renvoie vers Outils → Agenda.
- Les taux s'écrivent « 1/512 ». Le Charme Chroma, les sandwichs (Écarlate/Violet), les apparitions massives, les chaînes et la recherche du Pokédex (Légendes Arceus) changent les taux : précise les conditions.
- Reste dans le sujet Pokémon et chasse aux shiny.`;

/** Instantané de la collection, figé au début de la conversation (les outils donnent l'état à jour). */
export function buildContext(s, profile, { webSearch = false } = {}) {
  const caught = MAIN_DEX.filter(p => s.shinies[p.key]).length;
  const byRegion = REGIONS.map(r => {
    const inRegion = MAIN_DEX.filter(p => p.region === r.id);
    if (!inRegion.length) return null;
    return `${r.name} ${inRegion.filter(p => s.shinies[p.key]).length}/${inRegion.length}`;
  }).filter(Boolean).join(', ');
  const active = s.hunts.filter(h => h.status === 'active');
  const wish = Object.keys(s.wishlist).filter(k => s.wishlist[k] && !s.shinies[k]).map(k => getPokemon(k)?.name).filter(Boolean);
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const owned = myGamesSet(s.settings);
  const mine = owned ? GAMES.filter(g => owned.has(g.id)) : [];
  const day = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const agenda = EVENTS.filter(e => eventStatus(e) !== 'past')
    .map(e => `${e.title} (${GAME_BY_ID[e.game]?.short || 'tous jeux'}, ${e.end ? `${day(e.start)} → ${day(e.end)}` : `depuis le ${day(e.start)}`}${e.approx ? ', à confirmer' : ''})`).join(' ; ');
  const lines = [
    `Date du jour : ${today}.`,
    `Collection shiny : ${caught}/${MAIN_DEX.length} (espèces et formes régionales), ${s.catches.length} exemplaire(s) au total.`,
    `Par région : ${byRegion}.`,
    `Chasses en cours : ${active.length ? active.map(h => `${getPokemon(h.targetId)?.name || h.targetId} (${GAME_BY_ID[h.game]?.short}, ${huntTotal(h)} rencontres)`).join(', ') : 'aucune'}.`,
    `Objectifs non capturés : ${wish.length ? wish.slice(0, 40).join(', ') + (wish.length > 40 ? '…' : '') : 'aucun'}.`,
    `Jeu principal : ${GAME_BY_ID[s.settings.defaultGame]?.name || '?'}.`,
    mine.length
      ? `Jeux possédés : ${mine.map(g => `${g.short}${g.charm > 0 ? (hasCharm(s.settings, g.id) ? ' (avec Charme Chroma)' : ' (sans Charme)') : ''}`).join(', ')}.`
      : `Jeux possédés : non renseignés. Charme Chroma : ${s.settings.charm ? 'oui' : 'non'} (réglage général).`,
    `Listes perso : ${s.lists.length ? s.lists.map(l => `${l.emoji} ${l.name} (${Object.keys(l.keys).length})`).join(', ') : 'aucune'}.`,
    `Agenda de l'app (mis à jour le ${EVENTS_UPDATED}) : ${agenda || 'rien en cours'}.`,
    `Jeux (identifiant : nom court, plateforme) : ${GAMES.filter(g => g.id !== 'other').map(g => `${g.id}: ${g.short} (${g.platform})`).join(' ; ')}.`
  ];
  const about = profile?.trim() ? `\n\nCe que l'utilisateur veut que tu saches sur lui :\n${profile.trim()}` : '';
  const web = webSearch
    ? '\n\nTu as la recherche web (web_search, web_fetch) : sers-t\'en pour l\'actualité (raids, évènements, codes, nouveautés, dates), pas pour les taux et lieux que l\'app connaît. Une recherche coûte environ 1 centime : n\'en fais que si c\'est utile, et cite tes sources.'
    : '\n\nTu n\'as pas accès au web : pour l\'actualité, appuie-toi sur l\'agenda de l\'app et dis que l\'information peut avoir changé.';
  return `${INSTRUCTIONS}${web}\n\nÉtat de l'app au début de la conversation :\n${lines.join('\n')}${about}`;
}
