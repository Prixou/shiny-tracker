import { useCallback, useEffect, useRef, useState } from 'react';
import { useStoreApi } from '../../state/StoreProvider.jsx';
import { selectSnapshot } from '../../state/store.js';
import { loadChat, saveChat, activeModel, webSearchOn, PROVIDERS } from '../../services/ai/config.js';
import { loadProvider } from '../../services/ai/index.js';
import { runTool } from '../../services/ai/tools/index.js';
import { buildContext } from '../../services/ai/context.js';
import { feedback } from '../../lib/feedback.js';

const REFUSAL = 'Je ne peux pas répondre à cette demande. Reformule-la ou pose une autre question sur ta chasse.';

/**
 * Conversation avec l'assistant (conservée sur l'appareil) : envoi, réponse affichée au fil de l'eau,
 * outils de l'app, cartes d'action, arrêt. `cfg` : réglages de l'assistant (fournisseur, clé, modèle…).
 */
export function useChat(cfg) {
  const store = useStoreApi();
  const [chat, setChat] = useState(loadChat);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);

  // Enregistrée sur l'appareil, mais pas pendant qu'une réponse arrive.
  useEffect(() => { if (!busy) saveChat(chat); }, [chat, busy]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setChat(null);
  }, []);
  const stop = useCallback(() => abortRef.current?.abort(), []);

  const patchLast = patch => setChat(c => {
    if (!c) return c;
    const items = [...c.items];
    items[items.length - 1] = { ...items[items.length - 1], ...patch };
    return { ...c, items };
  });

  const send = async text => {
    const provider = cfg.provider;
    const model = activeModel(cfg);
    const web = webSearchOn(cfg);
    // Changer de fournisseur, de modèle ou de recherche web démarre une nouvelle conversation (historiques incompatibles).
    const base = chat && chat.provider === provider && chat.model === model && !!chat.webSearch === web
      ? chat
      : {
        provider, model, webSearch: web,
        system: buildContext(selectSnapshot(store.getState()), cfg.profile, { webSearch: web }),
        native: [],
        items: chat?.items?.length ? [...chat.items, { role: 'note', text: `Nouvelle conversation avec ${PROVIDERS[provider].name}` }] : []
      };
    setBusy(true);
    setChat({ ...base, items: [...base.items, { role: 'user', text }, { role: 'assistant', text: '', actions: [], pending: true }] });

    // Le texte reçu est affiché au plus une fois par image (requestAnimationFrame).
    let acc = '';
    let frame = 0;
    const flush = () => { frame = 0; patchLast({ text: acc }); };
    const actions = [];
    const ctl = new AbortController();
    abortRef.current = ctl;
    let mod;
    try {
      mod = await loadProvider(provider);
      const res = await mod.runTurn({
        apiKey: cfg.keys[provider],
        model,
        system: base.system,
        history: base.native,
        userText: text,
        signal: ctl.signal,
        webSearch: web,
        execTool: (name, args) => runTool(name, args, {
          s: selectSnapshot(store.getState()),
          onAction: a => { actions.push(a); patchLast({ actions: [...actions] }); }
        }),
        onText: delta => {
          acc += delta;
          if (!frame) frame = requestAnimationFrame(flush);
        },
        onTool: name => patchLast({ tool: name }),
        onRound: round => { if (round > 0 && acc && !acc.endsWith('\n')) acc += '\n\n'; }
      });
      cancelAnimationFrame(frame);
      setChat(c => {
        if (!c) return c;
        const items = [...c.items];
        items[items.length - 1] = { ...items[items.length - 1], text: res.refused ? REFUSAL : acc, pending: false, tool: null, sources: res.sources?.length ? res.sources : undefined };
        return { ...c, native: res.history, items };
      });
      if (!res.refused) feedback.vibrate(8);
    } catch (err) {
      cancelAnimationFrame(frame);
      const message = mod ? mod.describeError(err) : 'Impossible de charger l\'assistant : vérifie ta connexion.';
      patchLast({ text: acc || (message === null ? 'Réponse arrêtée.' : ''), pending: false, tool: null, error: message });
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  // Mémorise « appliqué » / « ignoré » sur une carte de modification.
  const setActionStatus = (itemIndex, actionIndex, status) => setChat(c => {
    const item = c?.items[itemIndex];
    if (!item?.actions?.[actionIndex]) return c;
    const items = [...c.items];
    const itemActions = [...item.actions];
    itemActions[actionIndex] = { ...itemActions[actionIndex], status };
    items[itemIndex] = { ...item, actions: itemActions };
    return { ...c, items };
  });

  return { items: chat?.items || [], busy, send, stop, newChat, setActionStatus };
}
