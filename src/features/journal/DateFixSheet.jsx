import { useMemo } from 'react';
import { CalendarX, Check } from 'lucide-react';
import { useActions, useAppState } from '../../state/StoreProvider.jsx';
import { bulkAddedDays } from '../../domain/catch.js';
import { formatDate } from '../../lib/format.js';
import { Sheet } from '../../ui/index.js';

const NONE = [];

/** Jours où un historique a sans doute été saisi d'un coup, encore à vérifier (dates non confirmées). */
export function useSuspiciousDays() {
  const { catches, kept } = useAppState(s => ({ catches: s.catches, kept: s.ui.dateFixKept || NONE }));
  return useMemo(() => bulkAddedDays(catches).filter(d => !kept.includes(d.date)), [catches, kept]);
}

/** « Corriger les dates » : passe en date inconnue les shiny d'un historique saisi d'un coup. */
export default function DateFixSheet({ open, onClose }) {
  const days = useSuspiciousDays();
  const kept = useAppState(s => s.ui.dateFixKept || NONE);
  const { setCatchDates, setUiValue } = useActions();

  return (
    <Sheet open={open} onClose={onClose} title="Corriger les dates" subtitle="Historique saisi d'un coup" icon={<CalendarX className="w-5 h-5" />}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400 leading-relaxed">
          Ces jours-là, beaucoup de shiny ont été ajoutés à la main, sans chasse : c'est sans doute ton historique saisi d'un coup.
          En « date inconnue », ils ne faussent plus le journal, la courbe des 12 mois ni la date de fin estimée.
          Tu pourras dater chaque shiny dans sa fiche, et tout est annulable.
        </p>
        {days.length ? days.map(d => (
          <section key={d.date} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div>
              <div className="text-base font-black text-white">{formatDate(d.date)}</div>
              <div className="text-xs text-slate-400">
                {d.ids.length} shiny ajoutés à la main{d.fromHunts ? ` · ${d.fromHunts} issu${d.fromHunts > 1 ? 's' : ''} d'une chasse, gardé${d.fromHunts > 1 ? 's' : ''}` : ''}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary min-h-11 text-xs" onClick={() => setCatchDates(d.ids, '', `Date inconnue pour ${d.ids.length} shiny du ${formatDate(d.date)}`)}>
                Date inconnue
              </button>
              <button className="btn-secondary min-h-11 text-xs" onClick={() => setUiValue('dateFixKept', [...kept, d.date])}>
                Dates justes
              </button>
            </div>
          </section>
        )) : (
          <p className="flex gap-2 text-sm text-emerald-300"><Check className="w-4 h-4 shrink-0 mt-0.5" /> Aucun jour suspect : tes dates semblent justes.</p>
        )}
      </div>
    </Sheet>
  );
}
