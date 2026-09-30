import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Layers, Timer, BookOpen, BarChart3, Wrench, WifiOff, Undo2 } from 'lucide-react';
import { useStore } from './state/store.jsx';
import { NavContext } from './state/nav.jsx';
import { MAIN_DEX } from './data/pokedex.js';
import { TABS } from './data/constants.js';
import { useOnline } from './lib/hooks.js';
import DexView from './views/DexView.jsx';
import HuntsView from './views/HuntsView.jsx';
import PokemonSheet from './components/PokemonSheet.jsx';
import NewHuntSheet from './components/NewHuntSheet.jsx';
import ImportSheet from './components/ImportSheet.jsx';
import { useToast } from './components/ui.jsx';

const JournalView = lazy(() => import('./views/JournalView.jsx'));
const StatsView = lazy(() => import('./views/StatsView.jsx'));
const ToolsView = lazy(() => import('./views/ToolsView.jsx'));

const NAV = [
  { id: 'dex', label: 'Pokédex', icon: Layers },
  { id: 'hunts', label: 'Chasses', icon: Timer },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'tools', label: 'Outils', icon: Wrench }
];

const initialTab = ui => {
  const fromUrl = new URLSearchParams(window.location.search).get('tab');
  if (TABS.includes(fromUrl)) return fromUrl;
  return TABS.includes(ui.tab) ? ui.tab : 'dex';
};

export default function App() {
  const { shinies, hunts, ui, setUiValue, undoStack, undo } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(() => initialTab(ui));
  const [pokemonKey, setPokemonKey] = useState(null);
  const [newHunt, setNewHunt] = useState(null);
  const [importCode, setImportCode] = useState(() => {
    const m = window.location.hash.match(/#import=(.+)$/);
    return m ? m[1] : null;
  });
  const online = useOnline();

  useEffect(() => {
    if (importCode) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [importCode]);

  const goTo = useCallback(next => {
    setTab(next);
    setUiValue('tab', next);
    window.scrollTo({ top: 0 });
  }, [setUiValue]);

  const nav = useMemo(() => ({
    tab,
    goTo,
    openPokemon: key => setPokemonKey(String(key)),
    openNewHunt: (targetKey = null) => setNewHunt({ targetKey })
  }), [tab, goTo]);

  const caughtCount = useMemo(() => MAIN_DEX.reduce((n, p) => n + (shinies[p.key] ? 1 : 0), 0), [shinies]);
  const pct = MAIN_DEX.length ? (caughtCount / MAIN_DEX.length) * 100 : 0;

  // Chaque action annulable affiche un toast « Annuler » ; Ctrl/Cmd+Z annule aussi.
  const doUndo = useCallback(() => {
    const entry = undo();
    if (entry) toast(`Annulé : ${entry.label}`, { type: 'info' });
  }, [undo, toast]);
  const lastUndoId = useRef(undoStack[undoStack.length - 1]?.id);
  useEffect(() => {
    const top = undoStack[undoStack.length - 1];
    if (top && top.id !== lastUndoId.current && Date.now() - top.at < 1000) {
      toast(top.label, { action: { label: 'Annuler', onClick: doUndo }, duration: 4500 });
    }
    lastUndoId.current = top?.id;
  }, [undoStack, toast, doUndo]);
  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        doUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doUndo]);
  const runningCount = hunts.filter(h => h.startedAt).length;
  const activeCount = hunts.filter(h => h.status === 'active').length;

  return (
    <NavContext.Provider value={nav}>
      <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-900">
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

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
              {undoStack.length > 0 && (
                <button onClick={doUndo} className="icon-btn w-10 h-10 bg-slate-900 border border-slate-800" aria-label={`Annuler : ${undoStack[undoStack.length - 1].label}`} title="Annuler (Ctrl+Z)">
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
                  <span className="block text-sm font-black font-mono text-amber-400">{caughtCount}</span>
                  <span className="block text-[10px] text-slate-500 font-mono">/{MAIN_DEX.length}</span>
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative max-w-6xl mx-auto px-4 pt-4 pb-[calc(var(--nav-h)+var(--safe-bottom)+24px)] md:pb-10">
          {tab === 'dex' && <DexView />}
          {tab === 'hunts' && <HuntsView />}
          <Suspense fallback={<div className="py-20 flex justify-center"><Sparkles className="w-8 h-8 text-amber-400 animate-spin" /></div>}>
            {tab === 'journal' && <JournalView />}
            {tab === 'stats' && <StatsView />}
            {tab === 'tools' && <ToolsView />}
          </Suspense>
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 pb-safe" aria-label="Navigation principale">
          <div className="grid grid-cols-5 h-[var(--nav-h)]">
            {NAV.map(item => {
              const Icon = item.icon;
              const active = tab === item.id;
              const badge = item.id === 'hunts' && activeCount > 0 ? activeCount : null;
              return (
                <button key={item.id} onClick={() => goTo(item.id)} aria-current={active ? 'page' : undefined}
                  className="relative flex flex-col items-center justify-center gap-1 active:bg-slate-900/80">
                  <span className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-colors ${active ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400'}`}>
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                    {badge && (
                      <span className={`absolute -top-1 right-1.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${runningCount ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>
                        {badge}
                      </span>
                    )}
                  </span>
                  <span className={`text-[11px] font-bold ${active ? 'text-amber-400' : 'text-slate-500'}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <PokemonSheet pokemonKey={pokemonKey} onClose={() => setPokemonKey(null)} />
        <NewHuntSheet open={!!newHunt} initialTarget={newHunt?.targetKey} onClose={() => setNewHunt(null)} />
        <ImportSheet code={importCode} onClose={() => setImportCode(null)} />
      </div>
    </NavContext.Provider>
  );
}
