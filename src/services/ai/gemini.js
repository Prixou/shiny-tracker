// Connexion à Gemini (API Google) depuis le navigateur, avec la clé gratuite de l'utilisateur.
import { GoogleGenAI, ApiError } from '@google/genai';
import { TOOL_DEFS } from './tools/index.js';

const MAX_ROUNDS = 6; // chaque tour compte dans le quota quotidien gratuit

const declarations = TOOL_DEFS.map(t => ({ name: t.name, description: t.description, parametersJsonSchema: t.schema }));

export function describeError(err) {
  if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return null;
  if (err instanceof ApiError) {
    if (err.status === 400 && /api key/i.test(err.message)) return 'Clé Gemini refusée : vérifie-la dans les réglages de l\'assistant.';
    if (err.status === 403) return 'Cette clé n\'a pas accès à l\'API Gemini (vérifie qu\'elle vient bien de Google AI Studio).';
    if (err.status === 404) return 'Modèle Gemini introuvable : choisis-en un autre dans les réglages.';
    if (err.status === 429) return 'Quota gratuit atteint (par minute ou pour la journée ; il repart à zéro vers 9 h). Essaie un modèle Flash-Lite, ou attends un peu.';
    if (err.status >= 500) return 'Gemini est surchargé en ce moment : réessaie dans un instant.';
    return `Erreur de l'API Gemini (${err.status}) : ${err.message}`;
  }
  if (err instanceof TypeError) return 'Connexion impossible : vérifie ta connexion internet.';
  return err?.message || 'Erreur inconnue.';
}

/** Modèles Flash utilisables avec cette clé, du plus économe en quota au plus puissant. */
export async function listModels(apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  const pager = await ai.models.list({ config: { pageSize: 100 } });
  const names = [];
  for await (const m of pager) {
    const id = (m.name || '').replace(/^models\//, '');
    if (!/^gemini-.*flash/.test(id) || /image|tts|audio|live|embedding|exp/.test(id)) continue;
    if (m.supportedActions && !m.supportedActions.includes('generateContent')) continue;
    names.push({ id, name: m.displayName || id, preview: /preview/.test(id), lite: /lite/.test(id) });
  }
  const version = id => parseFloat((id.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1]) || 0;
  return names.sort((a, b) => (b.lite - a.lite) || (a.preview - b.preview) || version(b.id) - version(a.id) || a.id.localeCompare(b.id));
}

/** Un tour de conversation. L'historique (format Gemini) est seulement complété, jamais réécrit. */
export async function runTurn({ apiKey, model, system, history, userText, execTool, onText, onTool, onRound, signal }) {
  const ai = new GoogleGenAI({ apiKey });
  const contents = [...history, { role: 'user', parts: [{ text: userText }] }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    onRound?.(round);
    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: system,
        tools: [{ functionDeclarations: declarations }],
        maxOutputTokens: 8192,
        abortSignal: signal
      }
    });
    // Les parties sont conservées telles quelles (signatures de réflexion comprises).
    const parts = [];
    let blocked = null;
    for await (const chunk of stream) {
      if (chunk.promptFeedback?.blockReason) blocked = chunk.promptFeedback.blockReason;
      const cand = chunk.candidates?.[0];
      if (cand?.finishReason === 'SAFETY' || cand?.finishReason === 'PROHIBITED_CONTENT') blocked = cand.finishReason;
      for (const part of cand?.content?.parts || []) {
        parts.push(part);
        if (part.text && !part.thought) onText(part.text);
      }
    }
    if (blocked) return { history: contents, refused: true };
    if (!parts.length) throw new Error('Gemini n\'a rien répondu : reformule ta question.');
    contents.push({ role: 'model', parts });

    const calls = parts.filter(p => p.functionCall).map(p => p.functionCall);
    if (!calls.length) return { history: contents };

    const results = await Promise.all(calls.map(async call => {
      onTool(call.name);
      let response;
      try {
        response = { output: await execTool(call.name, call.args || {}) };
      } catch (e) {
        response = { error: e.message };
      }
      return { functionResponse: { ...(call.id ? { id: call.id } : {}), name: call.name, response } };
    }));
    contents.push({ role: 'user', parts: results });
  }
  throw new Error('L\'assistant a fait trop d\'appels d\'outils pour cette question.');
}
