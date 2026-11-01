import { EyeOff } from 'lucide-react';
import { METHODS } from '../../data/methods.js';
import { Field } from '../../ui/index.js';

// Toutes les méthodes de chasse (hors « Autre » et distributions, qui ne se chassent pas).
const CHOICES = METHODS.filter(m => !['other', 'event', 'gsc_breed'].includes(m.id));

/** « Méthodes à ne jamais proposer » : les meilleures options passent à la méthode suivante. */
export default function HiddenMethodsField({ hidden = [], onChange }) {
  const toggle = id => onChange(hidden.includes(id) ? hidden.filter(x => x !== id) : [...hidden, id]);
  return (
    <Field group label="Méthodes à ne jamais proposer"
      hint="Touche une méthode pour la masquer : meilleures options de la fiche, « Que chasser ce soir ? », plan Banque et carte passent à la méthode suivante. Tu peux toujours la choisir toi-même pour une chasse.">
      <div className="flex flex-wrap gap-1.5">
        {CHOICES.map(m => {
          const off = hidden.includes(m.id);
          return (
            <button key={m.id} type="button" onClick={() => toggle(m.id)} aria-pressed={off} aria-label={`${off ? 'Proposer à nouveau' : 'Ne plus proposer'} : ${m.name}`}
              className={`inline-flex items-center gap-1 min-h-11 px-3 rounded-xl border text-xs font-bold ${off ? 'bg-rose-500/15 border-rose-500/50 text-rose-200 line-through' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
              {off && <EyeOff className="w-3.5 h-3.5 shrink-0" />}
              <span>{m.icon} {m.name}</span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}
