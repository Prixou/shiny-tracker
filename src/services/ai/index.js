// Fournisseurs d'IA, chargés à la demande (leurs bibliothèques pèsent plusieurs centaines de Ko).
const LOADERS = {
  claude: () => import('./claude.js'),
  gemini: () => import('./gemini.js')
};

/** Module du fournisseur : { runTurn, describeError, checkKey? (Claude), listModels? (Gemini) }. */
export const loadProvider = id => LOADERS[id]();
