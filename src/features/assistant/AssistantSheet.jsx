import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Square, Settings2, SquarePen, WifiOff, KeyRound } from 'lucide-react';
import { useAppState } from '../../state/StoreProvider.jsx';
import { selectShinies } from '../../state/store.js';
import { MAIN_DEX } from '../../data/pokedex.js';
import { loadAiConfig, saveAiConfig, activeModel, isConfigured, PROVIDERS, CLAUDE_MODELS } from '../../services/ai/config.js';
import { useOnline } from '../../lib/hooks.js';
import { feedback } from '../../lib/feedback.js';
import { Sheet } from '../../ui/index.js';
import AiSettingsSheet from './AiSettingsSheet.jsx';
import Message from './Message.jsx';
import { useChat } from './useChat.js';

/** Assistant de chasse (Gemini ou Claude) : conversation, cartes d'action et réglages. */
export default function AssistantSheet({ open, onClose }) {
  const online = useOnline();
  const [cfg, setCfg] = useState(loadAiConfig);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { items, busy, send, stop, newChat, setActionStatus } = useChat(cfg);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const configured = isConfigured(cfg);
  const model = activeModel(cfg);
  const modelName = cfg.provider === 'claude' ? CLAUDE_MODELS.find(m => m.id === model)?.name || model : model;

  const updateCfg = useCallback(next => { setCfg(next); saveAiConfig(next); }, []);

  // Défilement automatique vers le dernier message.
  const lastText = items[items.length - 1]?.text;
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [items.length, lastText, open]);

  // Hauteur automatique de la zone de saisie.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const submit = raw => {
    const text = raw.trim();
    if (!text || busy) return;
    if (!configured) { setShowSettings(true); return; }
    setInput('');
    feedback.tap();
    send(text);
  };

  // Premier objectif pas encore capturé (pour une suggestion de question).
  const missingWish = useAppState(s => {
    const shinies = selectShinies(s);
    return MAIN_DEX.find(p => s.wishlist[p.key] && !shinies[p.key])?.name;
  });
  const suggestions = [
    'Qu\'est-ce que je chasse ce soir ?',
    'Quelles chasses 3DS faire en priorité avant la fermeture de Pokémon Banque ?',
    missingWish ? `Comment obtenir ${missingWish} shiny le plus facilement ?` : 'Quel est le shiny le plus facile qu\'il me manque ?',
    'Fais le point sur mes chasses en cours.'
  ];

  const footer = (
    <div className="space-y-2">
      {!online && <p className="text-xs text-slate-400 flex items-center gap-1.5"><WifiOff className="w-3.5 h-3.5" /> Hors ligne : l'assistant a besoin d'internet.</p>}
      <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); submit(input); }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(input); } }}
          enterKeyHint="send"
          placeholder={configured ? 'Pose ta question…' : 'Configure d\'abord l\'assistant'}
          aria-label="Message pour l'assistant"
          className="input flex-1 py-3 resize-none leading-snug max-h-36"
          disabled={!configured}
        />
        {busy ? (
          <button type="button" onClick={stop} className="shrink-0 w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 flex items-center justify-center" aria-label="Arrêter">
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button type="submit" disabled={!input.trim() || !online || !configured} className="shrink-0 w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center disabled:opacity-40" aria-label="Envoyer">
            <Send className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  );

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        full
        bodyRef={bodyRef}
        title="Assistant"
        subtitle={configured ? `${PROVIDERS[cfg.provider].name} · ${modelName}` : 'À configurer'}
        icon={<Sparkles className="w-5 h-5" />}
        actions={(
          <>
            {items.length > 0 && <button onClick={() => { newChat(); feedback.tap(); }} className="icon-btn" aria-label="Nouvelle conversation"><SquarePen className="w-5 h-5" /></button>}
            <button onClick={() => setShowSettings(true)} className="icon-btn" aria-label="Réglages de l'assistant"><Settings2 className="w-5 h-5" /></button>
          </>
        )}
        footer={footer}
      >
        {!configured ? (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center"><Sparkles className="w-8 h-8" /></div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">Ton assistant de chasse</h3>
              <p className="text-sm text-slate-400 max-w-xs">Il connaît ta collection, tes chasses et les meilleurs lieux pour chaque shiny. Pour l'activer, colle une clé API : gratuite avec Gemini, ou payante à l'usage avec Claude.</p>
            </div>
            <button className="btn-primary w-full max-w-xs" onClick={() => setShowSettings(true)}><KeyRound className="w-4 h-4" /> Configurer l'assistant</button>
          </div>
        ) : items.length === 0 ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-400">Demande-moi quoi chasser, où trouver un shiny, ou fais le point sur ta collection. Je peux aussi préparer une chasse que tu lances d'un geste.</p>
            <div className="space-y-2">
              {suggestions.map(sug => (
                <button key={sug} onClick={() => submit(sug)} disabled={!online}
                  className="w-full text-left min-h-12 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-semibold text-slate-200 active:bg-slate-800 disabled:opacity-50">
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 pb-2">
            {items.map((item, i) => (item.role === 'note'
              ? <div key={i} className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">{item.text}</div>
              : <Message key={i} item={item} onActionStatus={(ai, status) => setActionStatus(i, ai, status)} />))}
          </div>
        )}
      </Sheet>
      <AiSettingsSheet open={showSettings} onClose={() => setShowSettings(false)} cfg={cfg} onChange={updateCfg} />
    </>
  );
}
