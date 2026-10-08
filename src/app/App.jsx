import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { useActions, useStoreApi } from '../state/StoreProvider.jsx';
import { NavContext } from './nav.jsx';
import { initialTab } from './navigation.js';
import { useUndo } from './useUndo.js';
import Header from './Header.jsx';
import BottomNav from './BottomNav.jsx';
import DexView from '../features/dex/DexView.jsx';

// Chargés à la demande (fichiers déjà en cache grâce au service worker) : démarrage plus léger.
const HuntsView = lazy(() => import('../features/hunts/HuntsView.jsx'));
const PokemonSheet = lazy(() => import('../features/pokemon/PokemonSheet.jsx'));
const NewHuntSheet = lazy(() => import('../features/hunts/NewHuntSheet.jsx'));
const ImportSheet = lazy(() => import('../features/backup/ImportSheet.jsx'));
const JournalView = lazy(() => import('../features/journal/JournalView.jsx'));
const StatsView = lazy(() => import('../features/stats/StatsView.jsx'));
const ToolsView = lazy(() => import('../features/tools/ToolsView.jsx'));
const AssistantSheet = lazy(() => import('../features/assistant/AssistantSheet.jsx'));
const BankPlanSheet = lazy(() => import('../features/bank/BankPlanSheet.jsx'));

const Loading = () => <div className="py-20 flex justify-center"><Sparkles className="w-8 h-8 text-amber-400 animate-spin" /></div>;

// Lien d'import ouvert depuis un QR code ou un message : #import=…
const importFromHash = () => window.location.hash.match(/#import=(.+)$/)?.[1] || null;

export default function App() {
  const store = useStoreApi();
  const { setUiValue } = useActions();
  const doUndo = useUndo();
  const [tab, setTab] = useState(() => initialTab(store.getState().ui));
  const [pokemonKey, setPokemonKey] = useState(null);
  const [newHunt, setNewHunt] = useState(null);
  // Panneaux chargés à la demande : montés à la première ouverture, puis gardés (conversation, onglet…).
  const [open, setOpen] = useState({ assistant: false, bank: false });
  const [mounted, setMounted] = useState({ assistant: false, bank: false });
  const [importCode, setImportCode] = useState(importFromHash);

  useEffect(() => {
    if (importCode) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [importCode]);

  const goTo = useCallback(next => {
    setTab(next);
    setUiValue('tab', next);
    window.scrollTo({ top: 0 });
  }, [setUiValue]);

  const nav = useMemo(() => {
    const show = id => { setMounted(m => ({ ...m, [id]: true })); setOpen(o => ({ ...o, [id]: true })); };
    return {
      tab,
      goTo,
      openPokemon: key => setPokemonKey(String(key)),
      openNewHunt: (targetKey = null, preset = null) => setNewHunt({ targetKey, preset }),
      openAssistant: () => show('assistant'),
      openBankPlan: () => show('bank')
    };
  }, [tab, goTo]);
  const hide = id => setOpen(o => ({ ...o, [id]: false }));

  return (
    <NavContext.Provider value={nav}>
      <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-900">
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <Header tab={tab} goTo={goTo} onUndo={doUndo} />

        <main className="relative max-w-6xl mx-auto px-4 pt-4 pb-[calc(var(--nav-h)+var(--safe-bottom)+24px)] md:pb-10">
          {tab === 'dex' && <DexView />}
          <Suspense fallback={<Loading />}>
            {tab === 'hunts' && <HuntsView />}
            {tab === 'journal' && <JournalView />}
            {tab === 'stats' && <StatsView />}
            {tab === 'tools' && <ToolsView />}
          </Suspense>
        </main>

        <BottomNav tab={tab} goTo={goTo} />

        {tab !== 'hunts' && (
          <button onClick={nav.openAssistant} aria-label="Assistant de chasse"
            className="fixed z-30 right-4 bottom-[calc(var(--nav-h)+var(--safe-bottom)+16px)] md:bottom-6 w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/30 flex items-center justify-center active:scale-95 transition">
            <MessageCircle className="w-6 h-6" />
            <Sparkles className="w-3.5 h-3.5 absolute top-2.5 right-2.5" />
          </button>
        )}
        <Suspense fallback={null}>
          {mounted.bank && <BankPlanSheet open={open.bank} onClose={() => hide('bank')} />}
          {mounted.assistant && <AssistantSheet open={open.assistant} onClose={() => hide('assistant')} />}
        </Suspense>

        <Suspense fallback={null}>
          {pokemonKey && <PokemonSheet pokemonKey={pokemonKey} onClose={() => setPokemonKey(null)} />}
          {newHunt && <NewHuntSheet open initialTarget={newHunt.targetKey} preset={newHunt.preset} onClose={() => setNewHunt(null)} />}
          {importCode && <ImportSheet code={importCode} onClose={() => setImportCode(null)} />}
        </Suspense>
      </div>
    </NavContext.Provider>
  );
}
