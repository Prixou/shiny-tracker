// Outils que l'assistant peut appeler. Pour en ajouter un : un objet { name, description, schema, run }
// dans le fichier du thème (collection, hunting, actions), puis l'ajouter à TOOLS ci-dessous.
import { validate } from './validate.js';
import { chercherPokemon, pokemonManquants, mesChasses, capturesRecentes } from './collection.js';
import { meilleuresOptions, infosJeu, proposerChasse, prioritesBanque } from './hunting.js';
import { proposerAction } from './actions.js';

export { findPokemon } from './lookup.js';

// Ordre de présentation aux modèles.
export const TOOLS = [
  chercherPokemon, meilleuresOptions, pokemonManquants, mesChasses, capturesRecentes,
  infosJeu, proposerChasse, prioritesBanque, proposerAction
];

/** Définitions au format neutre (nom, description, JSON Schema), traduites par claude.js et gemini.js. */
export const TOOL_DEFS = TOOLS.map(({ name, description, schema }) => ({ name, description, schema }));

/**
 * Exécute un outil. `ctx` : { s (état de l'app, voir selectSnapshot), onAction (cartes sous la réponse) }.
 * Renvoie toujours un objet sérialisable ; lève une erreur si l'appel est invalide.
 */
export async function runTool(name, args, ctx) {
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) throw new Error(`Outil inconnu : ${name}.`);
  validate(tool, args);
  return tool.run(args, ctx);
}
