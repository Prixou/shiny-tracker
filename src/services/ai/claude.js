// Connexion à Claude (API Anthropic) depuis le navigateur, avec la clé de l'utilisateur.
import Anthropic from '@anthropic-ai/sdk';
import { TOOL_DEFS } from './tools/index.js';

const MAX_ROUNDS = 8;

const client = apiKey => new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });

const appTools = TOOL_DEFS.map(t => ({
  name: t.name,
  description: t.description,
  input_schema: t.schema,
  eager_input_streaming: true // les arguments arrivent au fil de l'eau ; on les valide avant d'exécuter l'outil
}));

// Recherche et lecture web (outils exécutés par Anthropic, ≈ 0,01 $ par recherche).
// Haiku n'a pas le filtrage dynamique : il garde les versions de base.
function webTools(model) {
  const dynamic = model !== 'claude-haiku-5-5';
  const search = dynamic
    ? { type: /** @type {const} */ ('web_search_20260209'), name: /** @type {const} */ ('web_search') }
    : { type: /** @type {const} */ ('web_search_20250305'), name: /** @type {const} */ ('web_search') };
  const fetch = dynamic
    ? { type: /** @type {const} */ ('web_fetch_20260209'), name: /** @type {const} */ ('web_fetch') }
    : { type: /** @type {const} */ ('web_fetch_20250910'), name: /** @type {const} */ ('web_fetch') };
  return [
    { ...search, max_uses: 3, user_location: { type: /** @type {const} */ ('approximate'), country: 'FR', timezone: 'Europe/Paris' } },
    { ...fetch, max_uses: 3, max_content_tokens: 8000 }
  ];
}

/** Sources citées (ou trouvées) par la recherche web dans un message. */
function collectSources(content, into) {
  for (const block of content) {
    if (block.type === 'text') {
      for (const c of block.citations || []) if (c.url) into.set(c.url, c.title || null);
    }
  }
  if (!into.size) {
    for (const block of content) {
      if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const r of block.content.slice(0, 4)) if (r.url) into.set(r.url, r.title || null);
      }
    }
  }
}

/** Message d'erreur compréhensible à partir d'une erreur du SDK. */
export function describeError(err) {
  if (err instanceof Anthropic.APIUserAbortError) return null;
  if (err instanceof Anthropic.AuthenticationError) return 'Clé API Claude refusée : vérifie-la dans les réglages de l\'assistant.';
  if (err instanceof Anthropic.PermissionDeniedError) return 'Cette clé n\'a pas accès à ce modèle.';
  if (err instanceof Anthropic.NotFoundError) return 'Modèle introuvable : choisis-en un autre dans les réglages.';
  if (err instanceof Anthropic.RateLimitError) return 'Trop de demandes d\'un coup : réessaie dans une minute.';
  if (err instanceof Anthropic.BadRequestError) return `Requête refusée par Claude : ${/** @type {any} */ (err.error)?.error?.message || err.message}`;
  if (err instanceof Anthropic.InternalServerError) return 'Claude est surchargé en ce moment : réessaie dans un instant.';
  if (err instanceof Anthropic.APIConnectionError) return 'Connexion impossible : vérifie ta connexion internet.';
  if (err instanceof Anthropic.APIError) return `Erreur de l'API Claude (${err.status ?? '?'}) : ${err.message}`;
  return err?.message || 'Erreur inconnue.';
}

/** Vérifie la clé en lisant la fiche du modèle choisi. */
export async function checkKey(apiKey, model) {
  await client(apiKey).models.retrieve(model);
  return true;
}

/**
 * Un tour de conversation : envoie l'historique (format Anthropic, jamais modifié, seulement complété),
 * exécute les outils demandés et recommence jusqu'à la réponse finale.
 */
export async function runTurn({ apiKey, model, system, history, userText, execTool, onText, onTool, onRound, signal, webSearch = false }) {
  const anthropic = client(apiKey);
  const tools = webSearch ? [...appTools, ...webTools(model)] : appTools;
  const sources = new Map();
  const result = extra => ({ ...extra, sources: [...sources].map(([url, title]) => ({ url, title })) });
  const messages = [...history, { role: 'user', content: userText }];
  const fallback = model !== 'claude-haiku-5-5'; // pas de repli côté serveur pour Haiku
  let jsonRetries = 0;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    onRound?.(round);
    const params = {
      model,
      max_tokens: 16000,
      system,
      tools,
      messages,
      cache_control: { type: /** @type {const} */ ('ephemeral') }, // met en cache le début de la conversation
      output_config: { effort: /** @type {const} */ ('medium') },
      ...(fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: /** @type {const} */ ('default') } : {})
    };
    const stream = anthropic.beta.messages.stream(params, { signal });
    stream.on('text', delta => onText(delta));
    // Les outils web s'exécutent côté serveur : on l'indique dès le début du bloc.
    stream.on('streamEvent', event => {
      if (event.type === 'content_block_start' && event.content_block.type === 'server_tool_use') onTool(event.content_block.name);
    });

    let message;
    try {
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      // Seul le cas « arguments d'outil illisibles » est relancé ; les erreurs de l'API remontent.
      if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err;
      continue;
    }

    if (message.stop_reason === 'refusal') {
      return result({ history: messages, refused: true });
    }
    collectSources(message.content, sources);
    messages.push({ role: 'assistant', content: message.content });
    if (message.stop_reason === 'pause_turn') continue;

    const calls = message.content.filter(b => b.type === 'tool_use');
    if (!calls.length) return result({ history: messages, truncated: message.stop_reason === 'max_tokens' });
    if (message.stop_reason === 'max_tokens') throw new Error('Réponse coupée pendant un appel d\'outil : réessaie avec une question plus simple.');

    const results = await Promise.all(calls.map(async call => {
      onTool(call.name);
      try {
        const output = await execTool(call.name, call.input);
        return { type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(output) };
      } catch (e) {
        return { type: 'tool_result', tool_use_id: call.id, is_error: true, content: e.message };
      }
    }));
    messages.push({ role: 'user', content: results });
  }
  throw new Error('L\'assistant a fait trop d\'appels d\'outils pour cette question.');
}
