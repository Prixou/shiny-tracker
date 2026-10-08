// Instructions de l'assistant et instantané de l'app envoyé au début de chaque conversation.
import { MAIN_DEX, getPokemon } from '../../data/pokedex.js';
import { GAMES, GAME_BY_ID } from '../../data/games.js';
import { REGIONS } from '../../data/constants.js';
import { EVENTS, EVENTS_UPDATED, eventStatus } from '../../data/events.js';
import { huntTotal } from '../../domain/hunt.js';
import { hasCharm, myGamesSet } from '../../domain/settings.js';
import { BANK_DEADLINE_TEXT } from '../../domain/bank.js';

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
