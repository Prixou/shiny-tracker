// Recherche de texte : sans accents, sans casse, apostrophes unifiées.
export const normalize = s => String(s || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, ' ')
  .toLowerCase()
  .trim();

// Tri avec prise en compte des accents français.
export const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
