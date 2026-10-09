import { memo, useRef } from 'react';
import { Check, Lock } from 'lucide-react';
import { normalSpriteUrl } from '../../data/pokedex.js';
import { slotStatus } from '../../domain/boxes.js';
import { Sprite } from '../../ui/index.js';

const STATUS_LABEL = { stored: 'rangé', toStore: 'à ranger', missing: 'manquant', locked: 'Shiny Lock, manquant' };
const STATUS_CLASS = {
  stored: 'bg-emerald-500/10 border-emerald-500/40',
  toStore: 'bg-amber-500/10 border-amber-500/70',
  missing: 'bg-slate-950 border-slate-800',
  locked: 'bg-slate-950 border-slate-800'
};

/** Une place de la boîte. */
const Slot = memo(function Slot({ p, status, onTap }) {
  const empty = status === 'missing' || status === 'locked';
  return (
    <button onClick={() => onTap(p, status)} aria-label={`${p.name} · ${STATUS_LABEL[status]}`}
      className={`relative aspect-square rounded-xl border flex items-center justify-center active:scale-95 transition ${STATUS_CLASS[status]}`}>
      <Sprite pokemon={p} src={empty ? normalSpriteUrl(p) : undefined} alt="" className={`w-full h-full ${empty ? 'opacity-20 grayscale' : ''}`} />
      {status === 'stored' && (
        <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center"><Check className="w-3 h-3" strokeWidth={3} /></span>
      )}
      {status === 'toStore' && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />}
      {status === 'locked' && <Lock className="absolute w-4 h-4 text-rose-300/80" />}
    </button>
  );
});

/**
 * Grille 6 × 5 d'une boîte HOME. Glisser vers la gauche / droite change de boîte.
 * @param {{ slots: import('../../data/pokedex.js').Pokemon[], shinies: Record<string, any>, boxed: Set<string>,
 *   onTap: (p: any, status: string) => void, onSwipe: (dir: 1 | -1) => void }} props
 */
export default function BoxGrid({ slots, shinies, boxed, onTap, onSwipe }) {
  const start = useRef(null);
  return (
    <div className="grid grid-cols-6 gap-1.5"
      onTouchStart={e => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={e => {
        if (!start.current) return;
        const dx = e.changedTouches[0].clientX - start.current.x;
        const dy = e.changedTouches[0].clientY - start.current.y;
        start.current = null;
        if (Math.abs(dx) > 60 && Math.abs(dy) < 40) onSwipe(dx < 0 ? 1 : -1);
      }}>
      {slots.map(p => <Slot key={p.key} p={p} status={slotStatus(p, shinies, boxed)} onTap={onTap} />)}
    </div>
  );
}
