import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useActions, useShinies } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { useEncounters } from '../../state/encounters.js';
import { GAME_BY_ID } from '../../data/games.js';
import { METHOD_BY_ID } from '../../data/methods.js';
import { DEFAULT_FILTERS } from '../../domain/dexFilter.js';
import { caughtIn, huntMethodIndex } from '../../domain/huntIndex.js';

/** Dans un tuto : les Pokémon qu'on peut chasser avec ses méthodes, jeu par jeu ; ouvre le Pokédex filtré. */
export default function GuidePokemonLinks({ guide, onClose }) {
  const data = useEncounters(true);
  const shinies = useShinies();
  const { setUiValue } = useActions();
  const { goTo } = useNav();
  const entries = useMemo(() => (data && !data.error
    ? huntMethodIndex(data).entries.filter(e => guide.methods.includes(e.method) && guide.games.includes(e.game))
    : []), [data, guide]);

  const show = id => {
    setUiValue('dexFilters', { ...DEFAULT_FILTERS, hunt: id });
    onClose();
    goTo('dex');
  };

  if (!data) return <p className="text-xs text-slate-500">Chargement des Pokémon disponibles…</p>;
  if (!entries.length) return null;
  const multiMethod = new Set(entries.map(e => e.method)).size > 1;
  return (
    <section className="space-y-2">
      <h3 className="label-caps">Pokémon disponibles</h3>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {entries.map(e => (
          <button key={e.id} onClick={() => show(e.id)} aria-label={`Voir les Pokémon : ${METHOD_BY_ID[e.method]?.name} · ${GAME_BY_ID[e.game]?.short}`}
            className="flex items-center gap-2 min-h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 active:bg-slate-800 text-left">
            <span className="flex-1 min-w-0 text-sm text-slate-200 truncate">
              {GAME_BY_ID[e.game]?.icon} {GAME_BY_ID[e.game]?.short}{multiMethod ? ` · ${METHOD_BY_ID[e.method]?.name}` : ''}
            </span>
            <span className="shrink-0 text-xs font-mono font-bold text-amber-300">{caughtIn(e, shinies)}/{e.keys.size}</span>
            <ChevronRight className="w-4 h-4 shrink-0 text-slate-500" />
          </button>
        ))}
      </div>
    </section>
  );
}
