// Données de lieux (volumineuses) chargées à la demande puis gardées en mémoire.
let cache = null;
export const loadEncounters = () => (cache ||= import('../data/encounters.json').then(m => m.default || m));
