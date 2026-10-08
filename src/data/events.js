// Agenda des évènements des jeux (mis à jour à la main : il n'existe pas de source officielle exploitable).
// Dates en UTC. `end: null` = sans date de fin connue. `approx` = dates à confirmer.
// `hunt` : préréglage de chasse proposé pour les évènements shiny (clés Pokémon + configuration).
export const EVENTS_UPDATED = '2026-10-08';

export const EVENT_TYPES = {
  raid: { label: 'Raid', icon: '💎' },
  outbreak: { label: 'Apparitions massives', icon: '✨' },
  distribution: { label: 'Distribution', icon: '🎁' },
  code: { label: 'Code', icon: '🔑' },
  release: { label: 'Sortie', icon: '📦' },
  deadline: { label: 'Échéance', icon: '⏳' },
  tournament: { label: 'Tournoi', icon: '🏆' }
};

export const EVENTS = [
  {
    id: 'bank-closing', game: 'other', type: 'deadline', important: true,
    title: 'Fermeture de Pokémon Banque et Poké Transporter',
    start: '2026-08-13T00:00:00Z', end: '2027-02-26T03:00:00Z',
    desc: 'Fin des transferts le 25 février 2027 à 19 h, heure du Pacifique (le 26 à 4 h en France). Après, plus aucun transfert 3DS, DS ou Console virtuelle vers Pokémon HOME. L\'abonnement Premium de HOME est nécessaire pour transférer, et la Banque ne peut plus être téléchargée : ne la supprime pas.',
    url: 'https://support.pokemon.com/hc/en-us/articles/52629477077012-Pok%C3%A9mon-Bank-and-Pok%C3%A9mon-HOME', plan: true
  },
  {
    id: 'sv-tyranitar-7', game: 'sv', type: 'raid',
    title: 'Raid 7★ Tyranocif (Téra Spectre)',
    start: '2026-10-02T00:00:00Z', end: '2026-10-08T23:59:00Z',
    desc: 'Rediffusion des Pokémon puissants. Tyranocif porte la Marque du Puissant. Ne peut pas être shiny.',
    url: 'https://www.serebii.net/scarletviolet/teraraidbattleevents.shtml'
  },
  {
    id: 'sv-powerhouse-reruns', game: 'sv', type: 'raid', approx: true,
    title: 'Suite des raids 7★ « puissants » (Carchacrok, Trioxhydre, Ékaïser, Glaivodo…)',
    start: '2026-10-23T00:00:00Z', end: '2026-12-10T23:59:00Z',
    desc: 'Rediffusions annoncées par plusieurs guides pour fin octobre à début décembre, une espèce par semaine. Dates exactes à confirmer.',
    url: 'https://game8.co/games/Pokemon-Scarlet-Violet/archives/395831'
  },
  {
    id: 'sv-glimmet-outbreak', game: 'sv', type: 'outbreak', shiny: true,
    title: 'Apparitions massives de Germéclat et Floréclat (shiny boostés)',
    start: '2026-08-07T00:00:00Z', end: '2026-08-13T23:59:00Z',
    desc: '+0,5 % de chance shiny, en plus du sandwich et du Charme. Exemple d\'évènement boosté : coche « Évènement shiny boosté » dans la chasse.',
    url: 'https://www.serebii.net/scarletviolet/massoutbreakevent/glimmetandglimmoraoutbreaks.shtml',
    hunt: { keys: ['969', '970'], cfg: { game: 'sv', method: 'sv_wild', opts: { outbreak: true, sparkling: 3, eventBoost: true } } }
  },
  {
    id: 'sv-codes-cosmetic', game: 'sv', type: 'code', end: null,
    title: 'Codes Cadeau Mystère (tenues et coques de Motisma)',
    start: '2026-01-01T00:00:00Z',
    codes: ['VB00KC0VER', 'SB00KC0VER', 'NE0R0T0MC0VER', 'VTRACKSU1T', 'STRACKSU1T'],
    desc: 'Codes encore valides en septembre 2026, uniquement cosmétiques. Aucun code de Pokémon shiny actif.',
    url: 'https://www.nintendolife.com/guides/pokemon-scarlet-and-violet-mystery-gift-codes-list'
  },
  {
    id: 'za-mega-garchomp-z', game: 'za', type: 'distribution', end: null,
    title: 'Méga-Carchacrok Z (Mega Dimension)',
    start: '2026-02-27T00:00:00Z',
    desc: 'Mission annexe débloquée par Internet, sans date de fin. Nécessite le DLC Mega Dimension et au moins une aventure en Hyperespace.',
    url: 'https://game8.co/games/Pokemon-Legends-Z-A/archives/556197'
  },
  {
    id: 'za-switch2-edition', game: 'za', type: 'release',
    title: 'Z-A + Mega Dimension en boîte (Switch 2)',
    start: '2026-10-29T00:00:00Z', end: '2026-10-29T23:59:00Z',
    desc: 'Le jeu et le DLC sur une seule cartouche. Un code pour 100 Hyper Balls serait inclus (à confirmer).',
    url: 'https://www.nintendolife.com/news/2026/09/pokemon-legends-z-a-is-getting-a-new-switch-2-physical-release-next-month'
  },
  {
    id: 'home-frlg-celebi', game: 'frlg', type: 'distribution', end: null,
    title: 'Pokémon HOME : Rouge Feu / Vert Feuille (Switch) + Celebi',
    start: '2026-10-07T00:00:00Z',
    desc: 'HOME 4.1.0 accepte les Pokémon de la version Switch (aller simple). Complète le Pokédex de Kanto pour recevoir Celebi dans l\'app mobile HOME ; vaincre la Ligue donne aussi le Ticketmystik (Lugia, Ho-Oh) et le Ticket Aurora (Deoxys).',
    url: 'https://www.nintendolife.com/news/2026/10/pokemon-home-firered-and-leafgreen-compatibility-update-now-live-version-4-1-0'
  },
  {
    id: 'champions-october-challenge', game: 'champions', type: 'tournament',
    title: 'Pokémon Champions : compétition mensuelle d\'octobre',
    start: '2026-10-16T02:00:00Z', end: '2026-10-26T01:59:00Z',
    desc: 'Inscriptions du 16 au 26 octobre, combats du 23 au 26 (simples, 3 Pokémon, règlement M-C). Récompense : Palarticho.',
    url: 'https://pocketmonsters.net/news/9608'
  }
];

/** Statut d'un évènement à un instant donné : 'live', 'soon', 'past'. */
export function eventStatus(e, now = Date.now()) {
  const start = Date.parse(e.start);
  const end = e.end ? Date.parse(e.end) : Infinity;
  if (now > end) return 'past';
  if (now < start) return 'soon';
  return 'live';
}
