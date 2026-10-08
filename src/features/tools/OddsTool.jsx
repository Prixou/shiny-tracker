import { useRef, useState } from 'react';
import { useStore, defaultMethodFor } from '../../state/store.jsx';
import { cumulativeChance, encountersFor, oddsAt, METHOD_BY_ID } from '../../data/methods.js';
import { fmtNumber, fmtOdds, fmtPercent, fmtRatio, clamp } from '../../lib/utils.js';
import { Field } from '../../ui/ui.jsx';
import OddsConfig from '../hunts/OddsConfig.jsx';
import { hasCharm } from '../../domain/myGames.js';

const TARGETS = [0.5, 0.75, 0.9, 0.95, 0.99];

export default function OddsTool() {
  const { settings } = useStore();
  const [cfg, setCfg] = useState(() => {
    const game = settings.defaultGame || 'sv';
    return { game, method: defaultMethodFor(game), opts: {}, charm: hasCharm(settings, game), customOdds: null };
  });
  const [n, setN] = useState(1000);
  const update = patch => setCfg(c => ({ ...c, ...patch }));

  const p = cumulativeChance(cfg, [n]);
  const odds = oddsAt(cfg, n);
  const unit = METHOD_BY_ID[cfg.method]?.unit || 'rencontres';
  const maxN = Math.max(encountersFor(cfg, 0.99), n, 10);

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-4">
        <OddsConfig value={cfg} onChange={update} charmFor={id => hasCharm(settings, id)} />
        <Field label={`Nombre de ${unit}`}>
          <input type="number" inputMode="numeric" min="0" className="input font-mono" value={n} onChange={e => setN(Math.max(0, parseInt(e.target.value, 10) || 0))} />
        </Field>
        <input type="range" min="0" max={maxN} value={Math.min(n, maxN)} onChange={e => setN(Number(e.target.value))} className="w-full accent-amber-500 h-8" aria-label={`Nombre de ${unit}`} />
      </div>

      <div className="card p-5 text-center space-y-1">
        <div className="label-caps">Chance d'avoir au moins 1 shiny</div>
        <div className="text-5xl font-black font-mono text-amber-400">{fmtPercent(p, 2)}</div>
        <div className="text-sm text-slate-400">après {fmtNumber(n)} {unit} · taux actuel {fmtOdds(odds)} · {fmtRatio(-Math.log(1 - Math.min(p, 0.999999)))} le taux</div>
      </div>

      <Curve cfg={cfg} n={n} maxN={maxN} onPick={setN} />

      <div className="card p-4 space-y-2">
        <div className="label-caps">{unit.charAt(0).toUpperCase() + unit.slice(1)} nécessaires</div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {TARGETS.map(t => (
            <button key={t} onClick={() => setN(encountersFor(cfg, t))} className="p-2 rounded-2xl bg-slate-950 border border-slate-800 active:bg-slate-800">
              <div className="text-xs font-bold text-slate-400">{Math.round(t * 100)} %</div>
              <div className="text-sm font-black font-mono text-slate-100">{fmtNumber(encountersFor(cfg, t))}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 pt-1">
          Chaque rencontre est indépendante : les rencontres passées n'augmentent pas la chance de la suivante (sauf méthodes à chaîne, où c'est la chaîne qui améliore le taux).
        </p>
      </div>
    </div>
  );
}

// Courbe de probabilité cumulée ; glisser le doigt dessus pour lire une valeur.
function Curve({ cfg, n, maxN, onPick }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 320, H = 150, pad = { l: 34, r: 10, t: 10, b: 22 };
  const x = v => pad.l + (v / maxN) * (W - pad.l - pad.r);
  const y = pr => pad.t + (1 - pr) * (H - pad.t - pad.b);
  const pts = Array.from({ length: 61 }, (_, i) => {
    const v = Math.round((i / 60) * maxN);
    return `${x(v).toFixed(1)},${y(cumulativeChance(cfg, [v])).toFixed(1)}`;
  });
  const valueAt = e => {
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    return Math.round(clamp((px - pad.l) / (W - pad.l - pad.r), 0, 1) * maxN);
  };
  const shown = hover ?? n;
  const pr = cumulativeChance(cfg, [shown]);
  const baseOdds = oddsAt(cfg, 0);
  return (
    <div className="card p-4 space-y-2">
      <div className="flex justify-between text-xs">
        <span className="label-caps">Probabilité cumulée</span>
        <span className="font-mono text-slate-300">{fmtNumber(shown)} → <strong className="text-slate-100">{fmtPercent(pr)}</strong></span>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setHover(valueAt(e)); }}
        onPointerMove={e => { if (e.buttons || e.pointerType === 'mouse') setHover(valueAt(e)); }}
        onPointerUp={e => { onPick(valueAt(e)); setHover(null); }}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Courbe de probabilité cumulée en fonction du nombre de rencontres"
      >
        {[0, 0.5, 0.9, 1].map(t => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#1e293b" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" className="fill-slate-500 text-[9px] font-mono">{Math.round(t * 100)}%</text>
          </g>
        ))}
        {baseOdds <= maxN && (
          <>
            <line x1={x(baseOdds)} x2={x(baseOdds)} y1={pad.t} y2={H - pad.b} stroke="#475569" strokeDasharray="3 3" />
            <text x={x(baseOdds)} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">{fmtOdds(baseOdds)}</text>
          </>
        )}
        <text x={pad.l} y={H - 8} textAnchor="start" className="fill-slate-500 text-[9px] font-mono">0</text>
        <text x={W - pad.r} y={H - 8} textAnchor="end" className="fill-slate-500 text-[9px] font-mono">{fmtNumber(maxN)}</text>
        <polyline points={pts.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
        <line x1={x(shown)} x2={x(shown)} y1={pad.t} y2={H - pad.b} stroke="#fde68a" strokeWidth="1" />
        <circle cx={x(shown)} cy={y(pr)} r="5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
      </svg>
    </div>
  );
}
