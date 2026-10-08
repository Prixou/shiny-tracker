// Noms français des modes de rencontre PokéAPI (« walk », « old-rod »…) et des modes ajoutés (PKHeX, ÉV, LPA, Z-A).
export const METHOD_NAMES = {
  walk: 'Herbes / grotte', surf: 'Surf', 'old-rod': 'Canne', 'good-rod': 'Super Canne', 'super-rod': 'Méga Canne',
  'rock-smash': 'Éclate-Roc', headbutt: 'Coup d\'Boule', gift: 'Cadeau', 'gift-egg': 'Œuf offert', 'only-one': 'Rencontre unique',
  'dark-grass': 'Herbes sombres', 'grass-spots': 'Herbes qui bougent', 'cave-spots': 'Nuage de poussière', 'bridge-spots': 'Ombre sur un pont',
  'surf-spots': 'Remous (surf)', 'super-rod-spots': 'Remous (pêche)', 'yellow-flowers': 'Fleurs jaunes', 'purple-flowers': 'Fleurs violettes',
  'red-flowers': 'Fleurs rouges', 'rough-terrain': 'Terrain accidenté', pokeflute: 'Poké Flûte', 'sos-encounter': 'Appel à l\'aide',
  'island-scan': 'Scan des îles', 'npc-trade': 'Échange', seaweed: 'Algues', 'roaming-grass': 'Errant (herbes)', 'roaming-water': 'Errant (eau)',
  'devon-scope': 'Devon Scope', 'squirt-bottle': 'Carapuce à O', 'wailmer-pail': 'Wailmerrosoir', 'berry-piles': 'Tas de baies',
  'bubbling-spots': 'Bulles', ambush: 'Embuscade', 'sweet-scent': 'Doux Parfum', 'horde': 'Horde', 'poke-radar': 'Poké Radar',
  'sv-wild': 'Sauvage', 'pla-wild': 'Sauvage', 'pla-distortion': 'Distorsion spatiale', 'pla-landmark': 'Arbre / minerai',
  'pla-mo': 'Apparition massive', 'pla-mmo': 'Mégapparition', 'honey-tree': 'Arbre à Miel', underground: 'Grands Souterrains',
  'za-wild': 'Sauvage', 'za-hyperspace': 'Hyperespace',
  static: 'Rencontre fixe', overworld: 'Visible sur la carte', 'overworld-special': 'Apparition rare', 'overworld-flying': 'En vol',
  'overworld-flying-special': 'En vol (rare)', 'overworld-water': 'Sur l\'eau', 'overworld-water-special': 'Sur l\'eau (rare)',
  'overworld-dirt': 'Terrain (dans le sol)', sos: 'Appel à l\'aide', 'sos-from-bubbling-spot': 'Appel à l\'aide (remous)',
  'max-raid': 'Raid Dynamax', wanderer: 'Errant', 'wanderer-water': 'Errant (eau)', 'hidden-grotto': 'Trouée Cachée',
  'headbutt-low': 'Coup d\'Boule', 'headbutt-normal': 'Coup d\'Boule', 'headbutt-high': 'Coup d\'Boule (rare)',
  'sky-ambush': 'Embuscade (ciel)', 'ground-ambush': 'Embuscade (sol)', 'ceiling-ambush': 'Embuscade (plafond)',
  'trash-can-ambush': 'Poubelle', 'rustling-bush-ambush': 'Buisson qui bouge', 'berry-trees': 'Arbre à baies',
  'feebas-tile-fishing': 'Pêche (Barpau)', 'pokemon-ranger': 'Pokémon Ranger', 'pokemon-channel-pal': 'Pokémon Channel',
  'colosseum-bonus-disc-jpn': 'Disque bonus', 'colosseum-bonus-disc-us': 'Disque bonus'
};

/**
 * Nom lisible d'un mode de rencontre.
 * @param {string} m
 * @returns {string}
 */
export const encounterMethodName = m => METHOD_NAMES[m] || m.replace(/-/g, ' ');
