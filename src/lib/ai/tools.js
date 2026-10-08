// Outils que l'assistant peut appeler pour lire les données de l'app, et contexte de départ.
import { MAIN_DEX, POKEDEX, getPokemon, gamesFor, isAvailableIn } from '../../data/pokedex.js';
import { GAMES, GAME_BY_ID, isLockedIn } from '../../data/games.js';
import { METHOD_BY_ID, gameMethods, oddsAt } from '../../data/methods.js';
import { REGIONS, REGION_BY_ID, TYPE_BY_ID, POKEMON_TYPES, BALL_BY_ID } from '../../data/constants.js';
import { huntTotal, huntOdds, huntChance, huntElapsed } from '../../state/store.jsx';
import { bestOptions } from '../bestOptions.js';
import { loadEncounters } from '../encountersData.js';
import { normalize, formatDuration } from '../utils.js';

// Fermeture de Pokémon Banque (et donc de Poké Transporter) : plus de transfert 3DS/DS → HOME.
export const BANK_CLOSING = '2027-02-27';
const bankOpen = () => new Date() < new Date(`${BANK_CLOSING}T00:00:00`);

/** Le jeu permet-il d'envoyer un Pokémon dans Pokémon HOME ? */
function homeTransfer(gameId) {
  const g = GAME_BY_ID[gameId];
  if (!g) return 'inconnu';
  if (g.platform === 'switch' || g.platform === 'mobile') return g.id === 'champions' ? 'à vérifier' : 'oui';
  if (g.platform === '3ds' || g.platform === 'ds' || g.vc3ds) {
    return bankOpen() ? `oui, via Pokémon Banque jusqu'au 27/02/2027 seulement` : 'non (Pokémon Banque fermée le 27/02/2027)';
  }
  if (g.platform === 'gba') return bankOpen() ? 'seulement via une DS (Pal Park) puis la Banque, jusqu\'au 27/02/2027' : 'non';
  return 'inconnu';
}

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
        : typeof value === 'string';
    if (!ok) throw new Error(`Argument « ${key} » : type ${spec.type} attendu.`);
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
      const { main, extra } = bestOptions(p, data);
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
          transfert_home: homeTransfer(o.game)
        };
      };
      return {
        pokemon: p.name,
        cle: p.key,
        shiny_capture: !!s.shinies[p.key],
        options: main.map(fmt),
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
      const options = data ? bestOptions(p, data).main : [];
      const match = options.find(o => o.game === g.id && (!args.methode || o.cfg.method === args.methode));
      if (match) cfg = match.cfg;
      else {
        const methods = gameMethods(g.id);
        const method = methods.find(m => m.id === args.methode) || methods[0];
        cfg = { game: g.id, method: method.id, opts: {}, charm: s.settings.charm };
      }
      ctx.onAction({ type: 'hunt', key: p.key, cfg, label: args.resume || null });
      return { ok: true, carte: `Carte « Chasser ${p.name} en ${g.short} » affichée.`, taux: `1/${Math.round(oddsAt(cfg, METHOD_BY_ID[cfg.method]?.chain || 0))}` };
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
- Pokémon Banque ferme le 27/02/2027 : après cette date, les Pokémon des jeux 3DS, DS et Console virtuelle ne peuvent plus aller dans Pokémon HOME. Signale-le quand c'est utile.
- Les taux s'écrivent « 1/512 ». Le Charme Chroma, les sandwichs (Écarlate/Violet), les apparitions massives, les chaînes et la recherche du Pokédex (Légendes Arceus) changent les taux : précise les conditions.
- Reste dans le sujet Pokémon et chasse aux shiny.`;

/** Instantané de la collection, figé au début de la conversation (les outils donnent l'état à jour). */
export function buildContext(s, profile) {
  const caught = MAIN_DEX.filter(p => s.shinies[p.key]).length;
  const byRegion = REGIONS.map(r => {
    const inRegion = MAIN_DEX.filter(p => p.region === r.id);
    if (!inRegion.length) return null;
    return `${r.name} ${inRegion.filter(p => s.shinies[p.key]).length}/${inRegion.length}`;
  }).filter(Boolean).join(', ');
  const active = s.hunts.filter(h => h.status === 'active');
  const wish = Object.keys(s.wishlist).filter(k => s.wishlist[k] && !s.shinies[k]).map(k => getPokemon(k)?.name).filter(Boolean);
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const lines = [
    `Date du jour : ${today}.`,
    `Collection shiny : ${caught}/${MAIN_DEX.length} (espèces et formes régionales), ${s.catches.length} exemplaire(s) au total.`,
    `Par région : ${byRegion}.`,
    `Chasses en cours : ${active.length ? active.map(h => `${getPokemon(h.targetId)?.name || h.targetId} (${GAME_BY_ID[h.game]?.short}, ${huntTotal(h)} rencontres)`).join(', ') : 'aucune'}.`,
    `Objectifs non capturés : ${wish.length ? wish.slice(0, 40).join(', ') + (wish.length > 40 ? '…' : '') : 'aucun'}.`,
    `Jeu principal : ${GAME_BY_ID[s.settings.defaultGame]?.name || '?'} · Charme Chroma : ${s.settings.charm ? 'oui' : 'non'}.`,
    `Jeux (identifiant : nom court, plateforme) : ${GAMES.filter(g => g.id !== 'other').map(g => `${g.id}: ${g.short} (${g.platform})`).join(' ; ')}.`
  ];
  const about = profile?.trim() ? `\n\nCe que l'utilisateur veut que tu saches sur lui :\n${profile.trim()}` : '';
  return `${INSTRUCTIONS}\n\nÉtat de l'app au début de la conversation :\n${lines.join('\n')}${about}`;
}
