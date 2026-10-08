import { useMemo, useState } from 'react';
import { Search, Star, Check } from 'lucide-react';
import { useStore } from '../../state/store.jsx';
import { POKEDEX, getPokemon } from '../../data/pokedex.js';
import { normalize } from '../../lib/utils.js';
import { useDebouncedValue } from '../../lib/hooks.js';
import { Sprite } from '../../ui/ui.jsx';

export default function PokemonPicker({ onPick, autoFocus = true, placeholder = 'Rechercher le Pokémon ciblé…' }) {
  const { shinies, wishlist } = useStore();
  const [query, setQuery] = useState('');
  const q = useDebouncedValue(normalize(query), 100);

  const results = useMemo(() => {
    if (!q) {
      const wishes = Object.keys(wishlist).map(getPokemon).filter(Boolean);
      return { title: wishes.length ? 'Mes objectifs' : 'Suggestions (non capturés)', list: wishes.length ? wishes : POKEDEX.filter(p => !shinies[p.key] && !p.isShinyLocked).slice(0, 30) };
    }
    const num = q.replace(/^#?0*/, '');
    const list = POKEDEX.filter(p => p.search.includes(q) || String(p.id) === num);
    list.sort((a, b) => (b.search.startsWith(q) - a.search.startsWith(q)) || a.id - b.id);
    return { title: `${list.length} résultat${list.length > 1 ? 's' : ''}`, list: list.slice(0, 60) };
  }, [q, wishlist, shinies]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input type="search" enterKeyHint="search" autoFocus={autoFocus} autoComplete="off" autoCorrect="off" spellCheck="false"
          value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder} className="input pl-11" />
      </div>
      <div className="label-caps">{results.title}</div>
      <div className="grid grid-cols-1 gap-1.5">
        {results.list.map(p => (
          <button key={p.key} type="button" onClick={() => onPick(p)}
            className="flex items-center gap-3 p-2 pr-3 rounded-2xl bg-slate-950 border border-slate-800 active:bg-slate-800 text-left">
            <Sprite pokemon={p} className="w-12 h-12" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-slate-100 truncate">{p.name}</span>
              <span className="block text-xs text-slate-500 font-mono">#{String(p.id).padStart(4, '0')}</span>
            </span>
            {wishlist[p.key] && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
            {shinies[p.key] && <Check className="w-4 h-4 text-emerald-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}
