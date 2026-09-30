import { useRef, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { SHINY_METHODS, methodOdds } from '../data/constants.js';
import { cumulativeChance, encountersFor, fmtNumber, fmtOdds, fmtPercent, fmtRatio, clamp } from '../lib/utils.js';
import { Field, Toggle } from '../components/ui.jsx';

const TARGETS = [0.5, 0.75, 0.9, 0.95, 0.99];

export default function OddsTool() {
  const { settings } = useStore();
  const [method, setMethod] = useState(settings.defaultMethod || 'wild');
  const [charm, setCharm] = useState(settings.charm);
  const [custom, setCustom] = useState('');
  const [n, setN] = useState(1000);

  const odds = Number(custom) > 0 ? Number(custom) : methodOdds(method, charm);
  const p = cumulativeChance(n, odds);
  const maxN = Math.max(encountersFor(0.99, odds), n, 10);

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-4">
        <Field label="Méthode">
          <select className="input" value={method} onChange={e => { setMethod(e.target.value); setCustom(''); }}>
            {SHINY_METHODS.filter(m => m.odds > 1).map(m => <option key={m.id} value={m.id}>{m.icon} {m.name} (1/{m.odds})</option>)}
          </select>
        </Field>
        <Toggle checked={charm} onChange={v => { setCharm(v); setCustom(''); }} label="Charme Chroma" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Taux personnalisé (1/x)">
            <input type="number" inputMode="numeric" min="1" className="input font-mono" value={custom} placeholder={String(methodOdds(method, charm))} onChange={e => setCustom(e.target.value)} />
          </Field>
          <Field label="Rencontres">
            <input type="number" inputMode="numeric" min="0" className="input font-mono" value={n} onChange={e => setN(Math.max(0, parseInt(e.target.value, 10) || 0))} />
          </Field>
        </div>
        <input type="range" min="0" max={maxN} value={Math.min(n, maxN)} onChange={e => setN(Number(e.target.value))} className="w-full accent-amber-500 h-8" aria-label="Nombre de rencontres" />
      </div>

      <div className="card p-5 text-center space-y-1">
        <div className="label-caps">Chance d'avoir au moins 1 shiny</div>
        <div className="text-5xl font-black font-mono text-amber-400">{fmtPercent(p, 2)}</div>
        <div className="text-sm text-slate-400">après {fmtNumber(n)} rencontres à {fmtOdds(odds)} · {fmtRatio(n / odds)} le taux</div>
      </div>

      <Curve odds={odds} n={n} maxN={maxN} onPick={setN} />

      <div className="card p-4 space-y-2">
        <div className="label-caps">Rencontres nécessaires</div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {TARGETS.map(t => (
            <button key={t} onClick={() => setN(encountersFor(t, odds))} className="p-2 rounded-2xl bg-slate-950 border border-slate-800 active:bg-slate-800">
              <div className="text-xs font-bold text-slate-400">{Math.round(t * 100)} %</div>
              <div className="text-sm font-black font-mono text-slate-100">{fmtNumber(encountersFor(t, odds))}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 pt-1">
          Chaque rencontre est indépendante : les rencontres passées n'augmentent pas la chance de la suivante. Ces valeurs indiquent la probabilité globale sur toute la chasse.
        </p>
      </div>
    </div>
  );
}

// Courbe de probabilité cumulée ; glisser le doigt dessus pour lire une valeur.
function Curve({ odds, n, maxN, onPick }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 320, H = 150, pad = { l: 34, r: 10, t: 10, b: 22 };
  const x = v => pad.l + (v / maxN) * (W - pad.l - pad.r);
  const y = pr => pad.t + (1 - pr) * (H - pad.t - pad.b);
  const pts = Array.from({ length: 61 }, (_, i) => {
    const v = (i / 60) * maxN;
    return `${x(v).toFixed(1)},${y(cumulativeChance(v, odds)).toFixed(1)}`;
  });
  const valueAt = e => {
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    return Math.round(clamp((px - pad.l) / (W - pad.l - pad.r), 0, 1) * maxN);
  };
  const shown = hover ?? n;
  const pr = cumulativeChance(shown, odds);
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
        <line x1={x(odds)} x2={x(odds)} y1={pad.t} y2={H - pad.b} stroke="#475569" strokeDasharray="3 3" />
        <text x={x(odds)} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">{fmtOdds(odds)}</text>
        <text x={pad.l} y={H - 8} textAnchor="start" className="fill-slate-500 text-[9px] font-mono">0</text>
        <text x={W - pad.r} y={H - 8} textAnchor="end" className="fill-slate-500 text-[9px] font-mono">{fmtNumber(maxN)}</text>
        <polyline points={pts.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
        <line x1={x(shown)} x2={x(shown)} y1={pad.t} y2={H - pad.b} stroke="#fde68a" strokeWidth="1" />
        <circle cx={x(shown)} cy={y(pr)} r="5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
      </svg>
    </div>
  );
}
