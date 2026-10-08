import { useEffect, useState } from 'react';
import { GitBranch } from 'lucide-react';
import { useActions } from '../../state/StoreProvider.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { huntOdds } from '../../domain/hunt.js';
import { fmtNumber } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Sheet, Field } from '../../ui/index.js';
import PokemonPicker from '../pokemon/PokemonPicker.jsx';

/** Nouvelle phase (autre shiny apparu) ou chaîne rompue : le compteur repart à 0. */
export default function PhaseSheet({ open, onClose, hunt, dynamic }) {
  const { addPhase, addCatch } = useActions();
  const [note, setNote] = useState('');
  const [register, setRegister] = useState(true);
  useEffect(() => { if (open) { setNote(''); setRegister(true); } }, [open]);
  const done = (p = null) => {
    const n = hunt.phases.length + 1;
    addPhase(hunt.id, { key: p?.key || '', note }, `${dynamic ? 'Chaîne' : 'Phase'} ${n} enregistrée à ${fmtNumber(hunt.count)}`);
    if (p && register) {
      addCatch(p.key, { method: hunt.method, opts: hunt.opts, game: hunt.game, count: hunt.count, odds: Math.round(huntOdds(hunt)), notes: `Phase de la chasse ${getPokemon(hunt.targetId)?.name || ''}` },
        `${p.name} ajouté (phase ${n})`);
    }
    feedback.success();
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={dynamic ? 'Chaîne rompue / phase' : 'Nouvelle phase'}
      subtitle={dynamic ? 'Le compteur (et la chaîne) repart à 0, le total est conservé.' : 'Un autre shiny est apparu ? Le compteur repart à 0, le total est conservé.'}
      icon={<GitBranch className="w-5 h-5" />} full
      footer={<button className="btn-secondary w-full" onClick={() => done(null)}>{dynamic ? 'Chaîne rompue (sans shiny)' : 'Enregistrer sans préciser le Pokémon'}</button>}>
      <div className="space-y-4">
        <Field label="Note (facultatif)">
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex. : fui, capturé, mauvais sexe…" />
        </Field>
        <div className="card px-4">
          <label className="flex items-center gap-3 py-3">
            <input type="checkbox" className="w-5 h-5 accent-amber-500" checked={register} onChange={e => setRegister(e.target.checked)} />
            <span className="text-sm font-bold text-slate-100">Ajouter le shiny choisi à ma collection</span>
          </label>
        </div>
        <PokemonPicker onPick={done} autoFocus={false} placeholder="Quel shiny est apparu ?" />
      </div>
    </Sheet>
  );
}
