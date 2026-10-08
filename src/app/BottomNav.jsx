import { useAppState } from '../state/StoreProvider.jsx';
import { NAV } from './navigation.js';

/** Barre de navigation du bas (mobile), avec le nombre de chasses en cours. */
export default function BottomNav({ tab, goTo }) {
  const { active, running } = useAppState(s => ({
    active: s.hunts.filter(h => h.status === 'active').length,
    running: s.hunts.some(h => h.startedAt)
  }));
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 pb-safe" aria-label="Navigation principale">
      <div className="grid grid-cols-5 h-[var(--nav-h)]">
        {NAV.map(item => {
          const Icon = item.icon;
          const current = tab === item.id;
          const badge = item.id === 'hunts' && active > 0 ? active : null;
          return (
            <button key={item.id} onClick={() => goTo(item.id)} aria-current={current ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center gap-1 active:bg-slate-900/80">
              <span className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-colors ${current ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400'}`}>
                <Icon className="w-5 h-5" strokeWidth={current ? 2.5 : 2} />
                {badge && (
                  <span className={`absolute -top-1 right-1.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${running ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>
                    {badge}
                  </span>
                )}
              </span>
              <span className={`text-[11px] font-bold ${current ? 'text-amber-400' : 'text-slate-500'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
