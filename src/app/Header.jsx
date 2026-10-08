import { Sparkles, WifiOff, Undo2 } from 'lucide-react';
import { useAppState } from '../state/StoreProvider.jsx';
import { selectCaughtCount } from '../state/store.js';
import { MAIN_DEX } from '../data/pokedex.js';
import { useOnline } from '../lib/hooks.js';
import { NAV } from './navigation.js';

/** En-tête : logo, onglets (grand écran), hors ligne, annulation et progression du Pokédex. */
export default function Header({ tab, goTo, onUndo }) {
  const caught = useAppState(selectCaughtCount);
  const undoLabel = useAppState(s => s.undoStack.at(-1)?.label);
  const online = useOnline();
  const pct = MAIN_DEX.length ? (caught / MAIN_DEX.length) * 100 : 0;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/70 pt-safe">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <button onClick={() => goTo('dex')} className="flex items-center gap-2.5 min-w-0" aria-label="Accueil">
          <span className="p-2 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-xl text-slate-950 shadow-lg shadow-amber-500/25">
            <Sparkles className="w-5 h-5" />
          </span>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-amber-300 bg-clip-text text-transparent truncate">
            Shiny Hunter
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1 mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => goTo(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition ${active ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}>
                <Icon className="w-4 h-4" /> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto md:ml-0 flex items-center gap-2">
          {!online && <WifiOff className="w-4 h-4 text-slate-500" aria-label="Hors ligne" />}
          {undoLabel && (
            <button onClick={onUndo} className="icon-btn w-10 h-10 bg-slate-900 border border-slate-800" aria-label={`Annuler : ${undoLabel}`} title="Annuler (Ctrl+Z)">
              <Undo2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => goTo('stats')} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl pl-2 pr-3 py-1.5" aria-label="Progression">
            <svg viewBox="0 0 36 36" className="w-7 h-7 -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 94.25} 94.25`} />
            </svg>
            <span className="text-left leading-tight">
              <span className="block text-sm font-black font-mono text-amber-400">{caught}</span>
              <span className="block text-[10px] text-slate-500 font-mono">/{MAIN_DEX.length}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
