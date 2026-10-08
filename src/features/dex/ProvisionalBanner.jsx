import { useMemo, useState } from 'react';
import { RefreshCw, ChevronRight, X } from 'lucide-react';
import { useActions, useAppState } from '../../state/StoreProvider.jsx';
import { useEncounters } from '../../state/encounters.js';
import { useNav } from '../../state/nav.jsx';
import { GAME_BY_ID } from '../../data/games.js';
import { replaceableProvisionals } from '../../domain/provisional.js';
import { bestOptionsPrefs } from '../../domain/settings.js';
import { fmtOdds } from '../../lib/format.js';
import { Sheet, Sprite } from '../../ui/index.js';

/**
 * Rappel au-dessus de la grille : des shiny provisoires (distribution) sont maintenant chassables.
 * Masquable ; il revient si un autre Pokémon devient chassable.
 */
export default function ProvisionalBanner() {
  const hasProvisional = useAppState(s => s.catches.some(c => c.provisional));
  const { catches, settings, seen } = useAppState(s => ({ catches: s.catches, settings: s.settings, seen: s.ui.provisionalSeen }));
  const data = useEncounters(hasProvisional); // lieux chargés seulement s'il y a un exemplaire provisoire
  const { setUiValue } = useActions();
  const { openPokemon } = useNav();
  const [showList, setShowList] = useState(false);

  const list = useMemo(
    () => (hasProvisional && data && !data.error ? replaceableProvisionals(catches, data, bestOptionsPrefs(settings)) : []),
    [hasProvisional, data, catches, settings]
  );
  const signature = list.map(e => e.p.key).sort().join(',');
  if (!list.length || seen === signature) return null;

  const open = () => (list.length === 1 ? openPokemon(list[0].p.key) : setShowList(true));
  return (
    <>
      <div className="flex items-center gap-1 pl-3 rounded-2xl bg-sky-500/10 border border-sky-500/30">
        <button onClick={open} className="flex-1 min-w-0 flex items-center gap-2.5 min-h-12 text-left">
          <RefreshCw className="w-4 h-4 text-sky-300 shrink-0" />
          <span className="flex-1 min-w-0 text-sm text-slate-200 truncate">
            {list.length === 1
              ? <><strong className="text-sky-200">{list[0].p.name}</strong> provisoire : chassable</>
              : <><strong className="text-sky-200">{list.length} provisoires</strong> chassables</>}
          </span>
          <ChevronRight className="w-4 h-4 text-sky-300 shrink-0" />
        </button>
        <button onClick={() => setUiValue('provisionalSeen', signature)} className="icon-btn" aria-label="Masquer le rappel des provisoires"><X className="w-4 h-4" /></button>
      </div>
      <Sheet open={showList} onClose={() => setShowList(false)} title="Provisoires à remplacer" subtitle="Chassables dans tes jeux" icon={<RefreshCw className="w-5 h-5" />}>
        <ul className="space-y-1">
          {list.map(({ p, option }) => (
            <li key={p.key}>
              <button onClick={() => { setShowList(false); openPokemon(p.key); }} className="w-full flex items-center gap-3 min-h-14 text-left rounded-2xl active:bg-slate-800/60">
                <Sprite pokemon={p} className="w-12 h-12 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-100 truncate">{p.name}</span>
                  <span className="block text-[11px] text-slate-400 truncate">{GAME_BY_ID[option.game]?.short} · {option.label} · {fmtOdds(option.odds)}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
