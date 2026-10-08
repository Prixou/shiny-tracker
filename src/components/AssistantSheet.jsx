import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Square, Settings2, SquarePen, Timer, Info, WifiOff, AlertTriangle, KeyRound } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { useNav } from '../state/nav.jsx';
import { getPokemon, MAIN_DEX } from '../data/pokedex.js';
import { GAME_BY_ID } from '../data/constants.js';
import { METHOD_BY_ID, oddsAt } from '../data/methods.js';
import { loadAiConfig, saveAiConfig, loadChat, saveChat, activeModel, isConfigured, PROVIDERS, CLAUDE_MODELS } from '../lib/ai/config.js';
import { buildContext, runTool } from '../lib/ai/tools.js';
import { useOnline, feedback } from '../lib/hooks.js';
import { fmtOdds } from '../lib/utils.js';
import { Sheet, Sprite } from './ui.jsx';
import AiSettingsSheet from './AiSettingsSheet.jsx';

const TOOL_LABELS = {
  chercher_pokemon: 'Recherche du Pokémon…',
  meilleures_options: 'Consultation des meilleures options…',
  pokemon_manquants: 'Lecture de tes shiny manquants…',
  mes_chasses: 'Lecture de tes chasses…',
  captures_recentes: 'Lecture de tes captures…',
  infos_jeu: 'Consultation du jeu…',
  proposer_chasse: 'Préparation de la chasse…'
};

const REFUSAL = 'Je ne peux pas répondre à cette demande. Reformule-la ou pose une autre question sur ta chasse.';

const loaders = {
  claude: () => import('../lib/ai/claude.js'),
  gemini: () => import('../lib/ai/gemini.js')
};

/* ---------- Mise en forme légère du texte (gras, listes), sans HTML brut ---------- */
function inline(text, keyBase) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) => (
    chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4
      ? <strong key={`${keyBase}-${i}`} className="font-black text-white">{chunk.slice(2, -2)}</strong>
      : chunk.replace(/(^|\s)\*([^*\s][^*]*)\*/g, '$1$2')
  ));
}

function RichText({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      if (!list) { list = { ordered: /^\s*\d/.test(line), items: [] }; blocks.push(list); }
      list.items.push(<li key={i}>{inline(bullet[1], i)}</li>);
      return;
    }
    list = null;
    if (!line.trim()) return;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(heading
      ? <p key={i} className="font-black text-white">{inline(heading[1], i)}</p>
      : <p key={i}>{inline(line, i)}</p>);
  });
  return (
    <div className="space-y-2 text-[15px] leading-relaxed">
      {blocks.map((b, i) => (b.items ? (
        b.ordered
          ? <ol key={`l${i}`} className="list-decimal pl-5 space-y-1">{b.items}</ol>
          : <ul key={`l${i}`} className="list-disc pl-5 space-y-1 marker:text-amber-400">{b.items}</ul>
      ) : b))}
    </div>
  );
}

function HuntCard({ action }) {
  const { openNewHunt, openPokemon } = useNav();
  const p = getPokemon(action.key);
  if (!p) return null;
  const game = GAME_BY_ID[action.cfg.game];
  const method = METHOD_BY_ID[action.cfg.method];
  const odds = oddsAt(action.cfg, method?.chain || 0);
  return (
    <div className="mt-2 p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
      <div className="flex items-center gap-3">
        <Sprite pokemon={p} className="w-12 h-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-white truncate">{p.name}</div>
          <div className="text-xs text-slate-400 truncate">{game?.icon} {game?.short} · {method?.name}</div>
          {action.label && <div className="text-xs text-slate-300 mt-0.5">{action.label}</div>}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-bold uppercase text-slate-500">Taux</div>
          <div className="text-sm font-black font-mono text-amber-400">{fmtOdds(odds)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary min-h-11" onClick={() => openNewHunt(p.key, action.cfg)}><Timer className="w-4 h-4" /> Chasser</button>
        <button className="btn-secondary min-h-11" onClick={() => openPokemon(p.key)}><Info className="w-4 h-4" /> Fiche</button>
      </div>
    </div>
  );
}

function Message({ item }) {
  if (item.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-2.5 rounded-3xl rounded-br-lg bg-amber-500 text-slate-950 text-[15px] font-semibold whitespace-pre-wrap break-words">{item.text}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1 text-slate-200 break-words">
        {item.text ? <RichText text={item.text} /> : item.pending && !item.tool && (
          <div className="flex gap-1 py-3" aria-label="Réflexion en cours">
            {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
          </div>
        )}
        {item.pending && item.tool && (
          <div className="mt-1 text-xs font-bold text-amber-300/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> {TOOL_LABELS[item.tool] || 'Consultation de l\'app…'}
          </div>
        )}
        {item.actions?.map((a, i) => <HuntCard key={i} action={a} />)}
        {item.error && (
          <div className="mt-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {item.error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssistantSheet({ open, onClose }) {
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const online = useOnline();
  const [cfg, setCfg] = useState(loadAiConfig);
  const [chat, setChat] = useState(loadChat);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const abortRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const configured = isConfigured(cfg);
  const model = activeModel(cfg);
  const modelName = cfg.provider === 'claude' ? CLAUDE_MODELS.find(m => m.id === model)?.name || model : model;

  const updateCfg = useCallback(next => { setCfg(next); saveAiConfig(next); }, []);

  // Conversation conservée sur l'appareil (pas pendant qu'une réponse arrive).
  useEffect(() => { if (!busy) saveChat(chat); }, [chat, busy]);

  // Défilement automatique vers le dernier message.
  const items = chat?.items || [];
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

  useEffect(() => () => abortRef.current?.abort(), []);

  const newChat = () => {
    abortRef.current?.abort();
    setChat(null);
    feedback.tap();
  };

  const send = async raw => {
    const text = raw.trim();
    if (!text || busy) return;
    if (!configured) { setShowSettings(true); return; }
    const provider = cfg.provider;
    const s = storeRef.current;
    // Changer de fournisseur ou de modèle démarre une nouvelle conversation (historiques incompatibles).
    const base = chat && chat.provider === provider && chat.model === model
      ? chat
      : { provider, model, system: buildContext(s, cfg.profile), native: [], items: chat?.items?.length ? [...chat.items, { role: 'note', text: `Nouvelle conversation avec ${PROVIDERS[provider].name}` }] : [] };
    setInput('');
    setBusy(true);
    feedback.tap();
    setChat({ ...base, items: [...base.items, { role: 'user', text }, { role: 'assistant', text: '', actions: [], pending: true }] });

    const patchLast = patch => setChat(c => {
      if (!c) return c;
      const next = [...c.items];
      next[next.length - 1] = { ...next[next.length - 1], ...patch };
      return { ...c, items: next };
    });
    let acc = '';
    let frame = 0;
    const flush = () => { frame = 0; patchLast({ text: acc }); };
    const actions = [];
    const ctl = new AbortController();
    abortRef.current = ctl;
    let mod;
    try {
      mod = await loaders[provider]();
      const res = await mod.runTurn({
        apiKey: cfg.keys[provider],
        model,
        system: base.system,
        history: base.native,
        userText: text,
        signal: ctl.signal,
        execTool: (name, args) => runTool(name, args, {
          s: storeRef.current,
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
        const next = [...c.items];
        next[next.length - 1] = { ...next[next.length - 1], text: res.refused ? REFUSAL : acc, pending: false, tool: null };
        return { ...c, native: res.history, items: next };
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

  const stop = () => abortRef.current?.abort();

  const missingWish = MAIN_DEX.find(p => store.wishlist[p.key] && !store.shinies[p.key]);
  const suggestions = [
    'Qu\'est-ce que je chasse ce soir ?',
    'Quelles chasses 3DS faire en priorité avant la fermeture de Pokémon Banque ?',
    missingWish ? `Comment obtenir ${missingWish.name} shiny le plus facilement ?` : 'Quel est le shiny le plus facile qu\'il me manque ?',
    'Fais le point sur mes chasses en cours.'
  ];

  const footer = (
    <div className="space-y-2">
      {!online && <p className="text-xs text-slate-400 flex items-center gap-1.5"><WifiOff className="w-3.5 h-3.5" /> Hors ligne : l'assistant a besoin d'internet.</p>}
      <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); send(input); }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
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
            {items.length > 0 && <button onClick={newChat} className="icon-btn" aria-label="Nouvelle conversation"><SquarePen className="w-5 h-5" /></button>}
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
                <button key={sug} onClick={() => send(sug)} disabled={!online}
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
              : <Message key={i} item={item} />))}
          </div>
        )}
      </Sheet>
      <AiSettingsSheet open={showSettings} onClose={() => setShowSettings(false)} cfg={cfg} onChange={updateCfg} />
    </>
  );
}
