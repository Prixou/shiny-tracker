import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useActions, useAppState } from '../../state/StoreProvider.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { METHOD_BY_ID } from '../../data/methods.js';
import { huntOdds, huntTotal } from '../../domain/hunt.js';
import { fmtNumber, fmtOdds, todayIso } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Sheet } from '../../ui/index.js';
import CaptureForm from '../pokemon/CaptureForm.jsx';

/** « Shiny trouvé ! » : détails de la capture puis fin de la chasse. */
export default function FoundSheet({ open, onClose, hunt, onFound }) {
  const { finishHunt } = useActions();
  const owned = useAppState(s => s.catches.filter(c => c.key === hunt.targetId).length);
  const [details, setDetails] = useState(null);
  const p = getPokemon(hunt.targetId);
  useEffect(() => {
    if (open) setDetails({ ball: 'pokeball', date: todayIso(), method: hunt.method, game: hunt.game, nickname: '', gender: '', notes: '' });
  }, [open, hunt.method, hunt.game]);
  if (!details) return null;
  const confirm = () => {
    // Date laissée à aujourd'hui : heure réelle de la capture ; date changée : celle choisie (via CaptureForm).
    const c = finishHunt(hunt.id, details);
    feedback.success();
    onClose();
    if (c) onFound({ pokemon: p, ratio: c.luck, count: c.count });
  };
  return (
    <Sheet open={open} onClose={onClose} title={`${p?.name} shiny !`} subtitle={`${fmtNumber(huntTotal(hunt))} ${METHOD_BY_ID[hunt.method]?.unit || 'rencontres'} · ${fmtOdds(huntOdds(hunt))}`}
      icon={<Sparkles className="w-5 h-5" />}
      footer={<button className="btn-primary w-full bg-emerald-500 active:bg-emerald-400" onClick={confirm}><Sparkles className="w-4 h-4" /> Enregistrer la capture</button>}>
      {owned > 0 && (
        <p className="mb-4 text-xs text-sky-200 bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3">
          Tu possèdes déjà {owned} exemplaire{owned > 1 ? 's' : ''} de ce shiny : celui-ci sera ajouté en plus.
        </p>
      )}
      <CaptureForm value={details} onChange={patch => setDetails(d => ({ ...d, ...patch }))} showCounts={false} showProvisional={false} />
    </Sheet>
  );
}
