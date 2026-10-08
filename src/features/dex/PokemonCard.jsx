import { memo } from 'react';
import { Check, Star, ShieldAlert } from 'lucide-react';
import { Sprite, BallIcon } from '../../ui/index.js';

/** Case de la grille : ouvrir la fiche, cocher / décocher la capture. */
const PokemonCard = memo(function PokemonCard({ p, rec, copies, locked, wished, compact, colorUncaught, onOpen, onToggle }) {
  const caught = !!rec;
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-colors ${
        caught ? 'bg-gradient-to-b from-amber-500/15 to-slate-900 border-amber-500/40' : 'bg-slate-900/70 border-slate-800/80'
      }`}
    >
      <button onClick={() => onOpen(p.key)} className="w-full flex flex-col items-center pt-1.5 pb-2 px-1 active:bg-slate-800/60" aria-label={`${p.name}, ${caught ? 'capturé' : 'non capturé'}`}>
        <div className="w-full flex items-center gap-0.5 pl-1 pr-7 text-[10px] font-mono font-bold text-slate-500 h-4">
          <span>{p.isForm ? '◆' : p.isVariant ? '✦' : ''}{String(p.id).padStart(3, '0')}</span>
          {locked && <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" aria-label="Shiny Lock" />}
          {wished && !caught && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
        </div>
        <div className="relative w-full flex justify-center">
          <Sprite
            pokemon={p}
            className={`${compact ? 'w-14 h-14' : 'w-full max-w-20 aspect-square'} ${caught ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]' : colorUncaught ? 'opacity-80' : 'opacity-45 grayscale'}`}
          />
          {caught && <BallIcon id={rec.ball} className="w-4 h-4 absolute bottom-0 right-0.5" />}
          {copies > 1 && <span className="absolute bottom-0 left-0.5 px-1 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black leading-4">×{copies}</span>}
        </div>
        {!compact && <span className={`w-full text-[11px] leading-tight font-bold truncate px-0.5 ${caught ? 'text-amber-200' : 'text-slate-300'}`}>{p.name}</span>}
      </button>
      <button
        onClick={() => onToggle(p)}
        className="absolute top-0 right-0 w-10 h-10 flex items-start justify-end p-1"
        aria-label={caught ? `Retirer ${p.name}` : `Marquer ${p.name} capturé`}
      >
        <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${caught ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950/80 border-slate-600 text-transparent'}`}>
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </span>
      </button>
    </div>
  );
});

export default PokemonCard;
