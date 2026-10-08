import { useMemo, useState } from 'react';
import { Hourglass, ChevronDown } from 'lucide-react';
import { forecast } from '../../domain/forecast.js';
import { fmtNumber } from '../../lib/format.js';
import { RegionIcon } from '../../ui/index.js';

const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/** Date de fin estimée du living dex shiny, au rythme des derniers mois. */
export default function Forecast({ catches }) {
  const [open, setOpen] = useState(false);
  const f = useMemo(() => forecast(catches), [catches]);
  const perMonth = f.pace * 30.44;
  const fmtPace = n => (n >= 10 ? Math.round(n) : n.toFixed(1).replace('.', ','));
  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center gap-2 label-caps"><Hourglass className="w-4 h-4 text-amber-400" /> Date de fin estimée</div>
      {f.remaining === 0 ? (
        <p className="text-sm text-emerald-300 font-bold">Living dex shiny terminé (hors Shiny Lock) ! 🎉</p>
      ) : !f.window ? (
        <p className="text-sm text-slate-400">Pas assez de captures récentes : il faut au moins 3 nouvelles espèces sur les 12 derniers mois pour estimer une date.</p>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-black text-white capitalize">{monthYear.format(f.eta)}</div>
              <div className="text-xs text-slate-400">au rythme de <strong className="text-slate-200">{fmtPace(perMonth)} nouvelle{perMonth >= 2 ? 's' : ''} espèce{perMonth >= 2 ? 's' : ''} par mois</strong> ({f.recent} sur les {f.window === 90 ? '3' : '12'} derniers mois)</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-lg font-black font-mono text-amber-400">{fmtNumber(f.remaining)}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">restants</div>
            </div>
          </div>
          <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full flex items-center justify-between min-h-11 text-sm font-bold text-slate-300">
            Par région <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <ul className="space-y-2">
              {f.regions.map(r => (
                <li key={r.id} className="flex items-center gap-2.5">
                  <span className="w-5 flex justify-center shrink-0"><RegionIcon region={r} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-300 truncate">{r.name}</span>
                    {r.eta !== 0 && <span className="block text-[11px] text-slate-500">{r.left} restants</span>}
                  </span>
                  <span className={`shrink-0 text-xs font-bold text-right ${r.eta === 0 ? 'text-emerald-400' : r.eta ? 'text-slate-200' : 'text-slate-500'}`}>
                    {r.eta === 0 ? 'Terminée ✓' : r.eta ? monthYear.format(r.eta) : 'pas de capture récente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-slate-500">Estimation simple, hors Shiny Lock : les dernières espèces sont souvent les plus longues à obtenir.</p>
        </>
      )}
    </section>
  );
}
