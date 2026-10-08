// Briques visuelles de l'écran Stats : tuiles, panneaux, barres, histogramme, podiums.
import { useState } from 'react';
import { fmtNumber, fmtRatio, formatDate } from '../../lib/format.js';
import { Sprite } from '../../ui/index.js';

export const Tile = ({ icon, label, value, sub }) => (
  <div className="card p-3.5">
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">{icon}{label}</div>
    <div className="text-xl font-black font-mono text-slate-100 mt-1 truncate">{value}</div>
    {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
  </div>
);

export const Panel = ({ title, children }) => (
  <section className="card p-4 space-y-2.5">
    <h3 className="label-caps">{title}</h3>
    <div className="space-y-2">{children}</div>
  </section>
);

// Barre horizontale : `total` = progression (x/total), sinon comparaison au `max`.
export function BarRow({ label, icon, value, total, max }) {
  const ratio = total ? value / total : max ? value / max : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-5 flex justify-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-semibold text-slate-300 truncate">{label}</span>
          <span className="font-mono font-bold text-slate-200 shrink-0 ml-2">
            {value}{total ? <span className="text-slate-500">/{total}</span> : null}
          </span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(value ? 2 : 0, ratio * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export function MonthlyChart({ months }) {
  const [sel, setSel] = useState(null);
  const max = Math.max(1, ...months.map(m => m.value));
  const total = months.reduce((n, m) => n + m.value, 0);
  const shown = sel != null ? months[sel] : null;
  const peak = months.reduce((best, m, i) => (m.value > (months[best]?.value || 0) ? i : best), 0);
  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="label-caps">Captures sur 12 mois</h3>
        <span className="text-xs text-slate-400 text-right">
          {shown ? <><strong className="text-slate-100 capitalize">{shown.label}</strong> : {shown.value} shiny</> : <>{total} au total</>}
        </span>
      </div>
      <div className="relative h-36 pt-5 flex items-end gap-1.5" role="img" aria-label={`Captures par mois : ${months.map(m => `${m.label} ${m.value}`).join(', ')}`}>
        <div className="absolute inset-x-0 bottom-0 border-t border-slate-700" />
        {months.map((m, i) => (
          <button key={m.key} onClick={() => setSel(sel === i ? null : i)} className="relative flex-1 h-full flex flex-col justify-end items-center group" aria-label={`${m.label} : ${m.value}`}>
            {(i === sel || (sel == null && i === peak && m.value > 0)) && (
              <span className="absolute text-[11px] font-mono font-bold text-slate-100" style={{ bottom: `calc(${(m.value / max) * 100}% + 4px)` }}>{m.value}</span>
            )}
            <span className={`w-full max-w-7 rounded-t-[4px] transition-all ${sel === i ? 'bg-amber-300' : 'bg-amber-500'} ${m.value ? '' : 'opacity-0'}`}
              style={{ height: `${(m.value / max) * 85}%`, minHeight: m.value ? 4 : 0 }} />
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {months.map((m, i) => <span key={m.key} className={`flex-1 text-center text-[10px] font-bold uppercase ${sel === i ? 'text-amber-300' : 'text-slate-500'}`}>{m.short}</span>)}
      </div>
    </section>
  );
}

export function Podium({ title, icon, items, onOpen }) {
  return (
    <section className="card p-4 space-y-2">
      <h3 className="label-caps flex items-center gap-1.5">{icon}{title}</h3>
      {items.map(({ p, rec, ratio }) => (
        <button key={rec.id} onClick={() => onOpen(p.key)} className="w-full flex items-center gap-3 p-1.5 rounded-2xl active:bg-slate-800 text-left">
          <Sprite pokemon={p} className="w-11 h-11" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-100 truncate">{p.name}</div>
            <div className="text-[11px] text-slate-500">{fmtNumber(rec.count)} renc. · {formatDate(rec.date)}</div>
          </div>
          <span className="text-xs font-mono font-black text-slate-200">{fmtRatio(ratio)}</span>
        </button>
      ))}
    </section>
  );
}
