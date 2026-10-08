import { Sparkles, AlertTriangle, Globe, ExternalLink } from 'lucide-react';
import RichText from './RichText.jsx';
import { ChangeCard, HuntCard } from './cards.jsx';

// Ce qu'affiche la réponse pendant qu'un outil travaille.
const TOOL_LABELS = {
  chercher_pokemon: 'Recherche du Pokémon…',
  meilleures_options: 'Consultation des meilleures options…',
  pokemon_manquants: 'Lecture de tes shiny manquants…',
  mes_chasses: 'Lecture de tes chasses…',
  captures_recentes: 'Lecture de tes captures…',
  infos_jeu: 'Consultation du jeu…',
  proposer_chasse: 'Préparation de la chasse…',
  proposer_action: 'Préparation de la modification…',
  priorites_banque: 'Calcul des priorités avant la Banque…',
  web_search: 'Recherche sur le web…',
  web_fetch: 'Lecture d\'une page web…'
};

function Sources({ sources }) {
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500"><Globe className="w-3.5 h-3.5" /> Sources</div>
      <div className="flex flex-wrap gap-1.5">
        {sources.slice(0, 6).map(src => (
          <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 max-w-full min-h-8 px-2.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span className="truncate max-w-[14rem]">{src.title || new URL(src.url).hostname}</span> <ExternalLink className="w-3 h-3 shrink-0 text-slate-500" />
          </a>
        ))}
      </div>
    </div>
  );
}

/** Un message de la conversation (question, réponse, cartes, sources, erreur). */
export default function Message({ item, onActionStatus }) {
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
        {item.actions?.map((a, i) => (a.type === 'change'
          ? <ChangeCard key={i} action={a} onStatus={status => onActionStatus(i, status)} />
          : <HuntCard key={i} action={a} />))}
        {item.sources?.length > 0 && <Sources sources={item.sources} />}
        {item.error && (
          <div className="mt-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {item.error}
          </div>
        )}
      </div>
    </div>
  );
}
