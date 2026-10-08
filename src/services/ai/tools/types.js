// Forme d'un outil de l'assistant (voir index.js pour en ajouter un).

/**
 * Schéma JSON des arguments (sous-ensemble compris par Claude et Gemini).
 * @typedef {object} ToolSchema
 * @property {'object'} type
 * @property {Record<string, { type: 'string' | 'integer' | 'boolean' | 'array', description?: string, enum?: string[], items?: object }>} properties
 * @property {string[]} [required]
 */

/**
 * Carte affichée sous la réponse : chasse à lancer ou modification à appliquer.
 * @typedef {{ type: 'hunt', key: string, cfg: import('../../../domain/types.js').OddsConfig, label: string | null }
 *   | { type: 'change', kind: string, keys: string[], label: string | null, [extra: string]: unknown }} ToolAction
 */

/**
 * @typedef {object} ToolContext
 * @property {import('../../../domain/types.js').Snapshot} s État de l'app au moment de l'appel.
 * @property {(action: ToolAction) => void} onAction
 */

/**
 * @typedef {object} Tool
 * @property {string} name Identifiant vu par le modèle (snake_case, en français).
 * @property {string} description Quand et pourquoi l'appeler.
 * @property {ToolSchema} schema
 * @property {(args: Record<string, any>, ctx: ToolContext) => Promise<object>} run Renvoie un objet sérialisable ; lève une erreur lisible par le modèle.
 */

export {};
