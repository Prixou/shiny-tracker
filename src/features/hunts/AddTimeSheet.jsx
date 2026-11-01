import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useActions, useStoreApi } from '../../state/StoreProvider.jsx';
import { METHOD_BY_ID } from '../../data/methods.js';
import { huntElapsed, huntTotal } from '../../domain/hunt.js';
import { countForDuration, secondsPerUnit } from '../../domain/pace.js';
import { fmtNumber, formatDuration } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Sheet, Field, Toggle } from '../../ui/index.js';

const MIN = 60000;
const PRESETS = [[15, '15 min'], [30, '30 min'], [60, '1 h'], [120, '2 h']];
const decimal = v => parseFloat(String(v).replace(',', '.')) || 0;
const short = ms => formatDuration(ms, { short: true });

/**
 * « J'ai fait des resets pendant 1 h sans compter » : le compteur gagne le nombre estimé d'après
 * le temps moyen par reset (celui de la chasse, sinon ton rythme, sinon l'estimation), modifiable.
 */
export default function AddTimeSheet({ open, onClose, hunt }) {
  const store = useStoreApi();
  const { addHuntTime } = useActions();
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (!open) return;
    const avg = secondsPerUnit(hunt, store.getState().hunts);
    setForm({ hours: 1, minutes: 0, seconds: String(Math.round(avg.seconds * 10) / 10).replace('.', ','), source: avg.source, timer: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open || !form) return null;

  const method = METHOD_BY_ID[hunt.method] || METHOD_BY_ID.other;
  const unit = method.unit || 'rencontres';
  const one = unit.replace(/s$/, '');
  const set = patch => setForm(f => ({ ...f, ...patch }));
  const ms = (form.hours * 60 + form.minutes) * MIN;
  const count = countForDuration(ms, decimal(form.seconds));
  const elapsed = huntElapsed(hunt);
  const sourceHint = {
    hunt: `Ta moyenne sur cette chasse (${short(elapsed)} pour ${fmtNumber(huntTotal(hunt))} ${unit}).`,
    mine: `Ta moyenne en ${method.name}, d'après tes chasses chronométrées.`,
    estimate: `Estimation pour ${method.name} : ajuste-la à ton rythme (elle deviendra celle de la chasse).`
  }[form.source];
  const submit = () => {
    addHuntTime(hunt.id, { count, ms: form.timer ? ms : 0 }, `+${fmtNumber(count)} ${count > 1 ? unit : one} (${short(ms)})`);
    feedback.tap();
    onClose();
  };
  const int = (key, max) => e => set({ [key]: Math.min(max, Math.max(0, parseInt(e.target.value, 10) || 0)) });

  return (
    <Sheet open={open} onClose={onClose} title="Ajouter du temps" subtitle="Chassé sans compter ? Indique la durée."
      icon={<Clock className="w-5 h-5" />}
      footer={(
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button className="btn-primary flex-1" disabled={!count} onClick={submit}>Ajouter {fmtNumber(count)} {count > 1 ? unit : one}</button>
        </div>
      )}>
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Durée rapide">
          {PRESETS.map(([mins, label]) => (
            <button key={mins} type="button" onClick={() => set({ hours: Math.floor(mins / 60), minutes: mins % 60 })} aria-pressed={ms === mins * MIN}
              className={`min-h-11 rounded-xl border text-sm font-bold ${ms === mins * MIN ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Heures"><input type="number" inputMode="numeric" className="input font-mono" value={form.hours} onChange={int('hours', 99)} /></Field>
          <Field label="Minutes"><input type="number" inputMode="numeric" className="input font-mono" value={form.minutes} onChange={int('minutes', 59)} /></Field>
        </div>
        <Field label={`Temps moyen par ${one} (secondes)`} hint={sourceHint}>
          <input type="text" inputMode="decimal" className="input font-mono" value={form.seconds} onChange={e => set({ seconds: e.target.value.replace(/[^\d.,]/g, '') })} />
        </Field>
        <div className="card p-4 text-center" aria-live="polite">
          <div className="text-3xl font-black font-mono text-amber-300">+{fmtNumber(count)}</div>
          <div className="text-xs text-slate-400 mt-1">
            {count > 1 ? unit : one} en {short(ms)} · compteur {fmtNumber(hunt.count)} → {fmtNumber(hunt.count + count)}
          </div>
        </div>
        <div className="card px-4">
          <Toggle checked={form.timer} onChange={timer => set({ timer })} label="Ajouter aussi ce temps au chrono"
            desc={form.timer ? `Chrono : ${short(elapsed)} → ${short(elapsed + ms)}` : 'Le chrono ne change pas (tu l\'avais déjà lancé).'} />
        </div>
      </div>
    </Sheet>
  );
}
