import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { artworkUrl } from '../data/pokedex.js';
import { fmtNumber, getLuckTier } from '../lib/utils.js';
import { Sprite } from './ui.jsx';

const COLORS = ['#fbbf24', '#fde68a', '#f59e0b', '#ffffff', '#38bdf8', '#f472b6'];

export default function Celebration({ data, onClose }) {
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [data, onClose]);

  const particles = useMemo(() => Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 120 + Math.random() * 160;
    return {
      dx: `${Math.cos(angle) * dist}px`,
      dy: `${Math.sin(angle) * dist}px`,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 10,
      delay: Math.random() * 0.25
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nouvelle gerbe d'étincelles à chaque capture
  }), [data]);

  if (!data) return null;
  const luck = getLuckTier(data.ratio);
  return createPortal(
    <button className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm animate-fade-in text-center px-6" onClick={onClose} aria-label="Fermer">
      <div className="relative">
        {particles.map((pt, i) => (
          <span key={i} className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{ '--dx': pt.dx, '--dy': pt.dy, width: pt.size, height: pt.size, marginLeft: -pt.size / 2, marginTop: -pt.size / 2,
              background: pt.color, clipPath: 'polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)',
              animation: `sparkle-burst 1.4s ${pt.delay}s cubic-bezier(.1,.8,.3,1) both` }} />
        ))}
        <Sprite src={artworkUrl(data.pokemon)} pixel={false} loading="eager" className="w-56 h-56 animate-pop-in drop-shadow-[0_0_40px_rgba(245,158,11,0.6)]" alt={data.pokemon?.name} />
      </div>
      <div className="mt-4 text-3xl font-black bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent">Félicitations !</div>
      <div className="mt-1 text-lg font-bold text-white">{data.pokemon?.name} shiny ✨</div>
      {data.count > 0 && <div className="mt-2 text-sm text-slate-300">après {fmtNumber(data.count)} rencontres · {luck.emoji} {luck.name}</div>}
      <div className="mt-8 text-xs text-slate-500">Touchez pour continuer</div>
    </button>,
    document.body
  );
}
