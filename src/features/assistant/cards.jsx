// Cartes affichées sous une réponse : chasse à lancer, modification à appliquer.
import { Timer, Info, Check, Star, ListPlus, PauseCircle } from 'lucide-react';
import { useActions, useStoreApi } from '../../state/StoreProvider.jsx';
import { useNav } from '../../app/nav.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { GAME_BY_ID } from '../../data/games.js';
import { METHOD_BY_ID, oddsAt } from '../../data/methods.js';
import { fmtOdds } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Sprite, useToast } from '../../ui/index.js';

/** Carte « Chasser » proposée par l'assistant. */
export function HuntCard({ action }) {
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

const CHANGE_TEXT = {
  ajouter_objectifs: a => ({ icon: Star, title: `Ajouter ${a.keys.length} Pokémon à tes objectifs` }),
  retirer_objectifs: a => ({ icon: Star, title: `Retirer ${a.keys.length} Pokémon de tes objectifs` }),
  creer_liste: a => ({ icon: ListPlus, title: `Créer la liste ${a.emoji} ${a.name}${a.keys.length ? ` (${a.keys.length} Pokémon)` : ''}` }),
  ajouter_a_liste: a => ({ icon: ListPlus, title: `Ajouter ${a.keys.length} Pokémon à ${a.emoji} ${a.name}` }),
  retirer_de_liste: a => ({ icon: ListPlus, title: `Retirer ${a.keys.length} Pokémon de ${a.emoji} ${a.name}` }),
  pause_chasse: a => ({ icon: PauseCircle, title: `Mettre en pause le chrono de ${getPokemon(a.keys[0])?.name || 'la chasse'}` })
};

/** Carte de modification proposée par l'assistant : rien n'est fait avant « Appliquer ». */
export function ChangeCard({ action, onStatus }) {
  const store = useStoreApi();
  const { setWishes, createList, setInList, toggleTimer } = useActions();
  const toast = useToast();
  const text = CHANGE_TEXT[action.kind]?.(action);
  if (!text) return null;
  const Icon = text.icon;
  const pokemons = action.keys.map(getPokemon).filter(Boolean);
  const apply = () => {
    const keyMap = Object.fromEntries(action.keys.map(k => [k, true]));
    switch (action.kind) {
      case 'ajouter_objectifs': setWishes(action.keys, true); break;
      case 'retirer_objectifs': setWishes(action.keys, false); break;
      case 'creer_liste': createList({ name: action.name, emoji: action.emoji, keys: keyMap }); break;
      case 'ajouter_a_liste':
      case 'retirer_de_liste':
        if (!store.getState().lists.some(l => l.id === action.listId)) { toast('Cette liste n\'existe plus', { type: 'error' }); return; }
        setInList(action.listId, action.keys, action.kind === 'ajouter_a_liste');
        break;
      case 'pause_chasse': {
        const h = store.getState().hunts.find(x => x.id === action.huntId);
        if (h?.startedAt) toggleTimer(h.id);
        break;
      }
      default: return;
    }
    feedback.success();
    onStatus('done');
  };
  return (
    <div className={`mt-2 p-3 rounded-2xl border space-y-3 ${action.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-950 border-sky-500/30'}`}>
      <div className="flex items-start gap-2.5">
        <Icon className="w-5 h-5 shrink-0 text-sky-300 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-white">{text.title}</div>
          {action.label && <div className="text-xs text-slate-400 mt-0.5">{action.label}</div>}
        </div>
      </div>
      {pokemons.length > 0 && action.kind !== 'pause_chasse' && (
        <div className="flex flex-wrap gap-1">
          {pokemons.slice(0, 10).map(p => <Sprite key={p.key} pokemon={p} className="w-9 h-9" />)}
          {pokemons.length > 10 && <span className="self-center text-xs font-bold text-slate-400">+{pokemons.length - 10}</span>}
        </div>
      )}
      {action.status === 'done' ? (
        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-300"><Check className="w-4 h-4" /> Fait · annulable avec le bouton ↶ en haut de l'écran</div>
      ) : action.status === 'dismissed' ? (
        <div className="text-xs font-bold text-slate-500">Ignoré</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary min-h-11" onClick={apply}><Check className="w-4 h-4" /> Appliquer</button>
          <button className="btn-secondary min-h-11" onClick={() => onStatus('dismissed')}>Ignorer</button>
        </div>
      )}
    </div>
  );
}
