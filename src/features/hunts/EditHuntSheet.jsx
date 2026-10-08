import { useEffect, useState } from 'react';
import { Settings2, RotateCcw, Trash2 } from 'lucide-react';
import { useActions } from '../../state/StoreProvider.jsx';
import { huntTotal } from '../../domain/hunt.js';
import { fmtNumber } from '../../lib/format.js';
import { Sheet, Field, useConfirm } from '../../ui/index.js';
import OddsConfig from './OddsConfig.jsx';

/** Réglages d'une chasse : jeu, méthode, taux, pas, compteur, chrono, notes ; remise à zéro et suppression. */
export default function EditHuntSheet({ open, onClose, hunt, elapsed }) {
  const { updateHunt, deleteHunt, setElapsed } = useActions();
  const confirm = useConfirm();
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (open) {
      const mins = Math.floor(elapsed / 60000);
      setForm({ game: hunt.game, method: hunt.method, opts: hunt.opts || {}, charm: hunt.charm, customOdds: hunt.customOdds, step: hunt.step, count: hunt.count, hours: Math.floor(mins / 60), minutes: mins % 60, notes: hunt.notes || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!form) return null;
  const set = patch => setForm(f => ({ ...f, ...patch }));
  const save = () => {
    updateHunt(hunt.id, { game: form.game, method: form.method, opts: form.opts, charm: form.charm, customOdds: form.customOdds || null, step: Math.max(1, form.step), count: Math.max(0, form.count), notes: form.notes }, 'Chasse modifiée');
    const newMs = (form.hours * 60 + form.minutes) * 60000;
    if (Math.abs(newMs - Math.floor(elapsed / 60000) * 60000) >= 60000) setElapsed(hunt.id, newMs);
    onClose();
  };
  const remove = async () => {
    const ok = await confirm({ title: 'Supprimer cette chasse ?', message: `Le compteur (${fmtNumber(huntTotal(hunt))}) et le chrono seront supprimés. Tu pourras annuler juste après.`, confirmLabel: 'Supprimer', danger: true });
    if (ok) { onClose(); deleteHunt(hunt.id); }
  };
  const reset = async () => {
    const ok = await confirm({ title: 'Remettre à zéro ?', message: 'Le compteur, les phases et le chronomètre repartent de zéro.', confirmLabel: 'Remettre à zéro', danger: true });
    if (ok) { updateHunt(hunt.id, { count: 0, phases: [], elapsedMs: 0, startedAt: null }, 'Chasse remise à zéro'); onClose(); }
  };
  const num = (key, min = 0) => e => set({ [key]: Math.max(min, parseInt(e.target.value, 10) || 0) });
  return (
    <Sheet open={open} onClose={onClose} title="Paramètres de la chasse" icon={<Settings2 className="w-5 h-5" />}
      footer={<div className="flex gap-3"><button className="btn-secondary flex-1" onClick={onClose}>Annuler</button><button className="btn-primary flex-1" onClick={save}>Enregistrer</button></div>}>
      <div className="space-y-4">
        <OddsConfig value={form} onChange={set} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pas"><input type="number" inputMode="numeric" className="input font-mono" value={form.step} onChange={num('step', 1)} /></Field>
          <Field label="Compteur"><input type="number" inputMode="numeric" className="input font-mono" value={form.count} onChange={num('count')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Heures"><input type="number" inputMode="numeric" className="input font-mono" value={form.hours} onChange={num('hours')} /></Field>
          <Field label="Minutes"><input type="number" inputMode="numeric" className="input font-mono" value={form.minutes} onChange={e => set({ minutes: Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)) })} /></Field>
        </div>
        <Field label="Notes"><textarea className="input py-3 min-h-20" value={form.notes} onChange={e => set({ notes: e.target.value })} placeholder="Lieu, sandwich utilisé…" /></Field>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button className="btn-secondary" onClick={reset}><RotateCcw className="w-4 h-4" /> Remettre à 0</button>
          <button className="btn-secondary text-rose-300" onClick={remove}><Trash2 className="w-4 h-4" /> Supprimer</button>
        </div>
      </div>
    </Sheet>
  );
}
