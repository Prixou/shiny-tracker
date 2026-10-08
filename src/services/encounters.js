// Données de lieux de capture (≈ 750 Ko) : chargées à la demande, une seule fois.
let cache = null;
export const loadEncounters = () => (cache ||= import('../data/encounters.json').then(m => m.default || m));
