import { lazy, Suspense, useMemo, useState } from 'react';
import { Timer, Plus, History, ChevronRight, Moon } from 'lucide-react';
import { useActions, useAppState } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { huntTotal } from '../../domain/hunt.js';
import { useNow, useWakeLock } from '../../lib/hooks.js';
import { fmtNumber } from '../../lib/format.js';
import { Sprite, EmptyState } from '../../ui/index.js';
import Celebration from './Celebration.jsx';
import ActiveHunt from './ActiveHunt.jsx';
import HistorySheet from './HistorySheet.jsx';

const TonightSheet = lazy(() => import('./TonightSheet.jsx'));

export default function HuntsView() {
  const { hunts, activeHuntId, keepAwake } = useAppState(s => ({ hunts: s.hunts, activeHuntId: s.ui.activeHuntId, keepAwake: s.settings.keepAwake }));
  const { setUiValue } = useActions();
  const { openNewHunt } = useNav();
  const [showHistory, setShowHistory] = useState(false);
  const [celebrate, setCelebrate] = useState(null);
  const [showTonight, setShowTonight] = useState(false);

  const active = useMemo(() => hunts.filter(h => h.status === 'active').sort((a, b) => b.updatedAt - a.updatedAt), [hunts]);
  const done = useMemo(() => hunts.filter(h => h.status === 'done').sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)), [hunts]);
  const current = active.find(h => h.id === activeHuntId) || active[0] || null;
  const anyRunning = hunts.some(h => h.startedAt);
  const now = useNow(anyRunning);
  const wakeLocked = useWakeLock(keepAwake && !!current);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 -mx-4 px-4 overflow-x-auto no-scrollbar">
        {active.map(h => {
          const p = getPokemon(h.targetId);
          const selected = current?.id === h.id;
          return (
            <button key={h.id} onClick={() => setUiValue('activeHuntId', h.id)}
              className={`shrink-0 flex items-center gap-1.5 pl-1 pr-3 h-12 rounded-2xl border transition ${selected ? 'bg-amber-500/15 border-amber-500/60' : 'bg-slate-900 border-slate-800'}`}>
              <Sprite pokemon={p} className="w-10 h-10" />
              <span className="text-left leading-tight">
                <span className={`block text-xs font-bold max-w-24 truncate ${selected ? 'text-amber-200' : 'text-slate-300'}`}>{p?.name}</span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  {h.startedAt && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {fmtNumber(huntTotal(h))}
                </span>
              </span>
            </button>
          );
        })}
        <button onClick={() => openNewHunt()} className="shrink-0 flex items-center gap-1.5 px-4 h-12 rounded-2xl border border-dashed border-amber-500/50 text-amber-400 text-sm font-bold active:bg-amber-500/10">
          <Plus className="w-4 h-4" /> Nouvelle
        </button>
      </div>

      {current ? (
        <ActiveHunt key={current.id} hunt={current} now={now} wakeLocked={wakeLocked} onFound={setCelebrate} />
      ) : (
        <EmptyState icon={<Timer className="w-7 h-7" />} title="Aucune chasse en cours"
          action={(
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button className="btn-primary" onClick={() => openNewHunt()}><Plus className="w-4 h-4" /> Lancer une chasse</button>
              <button className="btn-secondary" onClick={() => setShowTonight(true)}><Moon className="w-4 h-4" /> Que chasser ce soir ?</button>
            </div>
          )}>
          Choisis un Pokémon, un jeu et une méthode : le taux est calculé automatiquement, même quand il évolue avec ta chaîne.
        </EmptyState>
      )}

      {current && (
        <button onClick={() => setShowTonight(true)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-sm font-bold text-slate-300">
          <span className="flex items-center gap-2"><Moon className="w-4 h-4 text-amber-400" /> Que chasser ce soir ?</span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      )}

      {done.length > 0 && (
        <button onClick={() => setShowHistory(true)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-sm font-bold text-slate-300">
          <span className="flex items-center gap-2"><History className="w-4 h-4 text-slate-400" /> Chasses terminées</span>
          <span className="flex items-center gap-1 text-slate-500">{done.length}<ChevronRight className="w-4 h-4" /></span>
        </button>
      )}

      <HistorySheet open={showHistory} onClose={() => setShowHistory(false)} hunts={done} />
      <Celebration data={celebrate} onClose={() => setCelebrate(null)} />
      <Suspense fallback={null}>{showTonight && <TonightSheet onClose={() => setShowTonight(false)} />}</Suspense>
    </div>
  );
}
