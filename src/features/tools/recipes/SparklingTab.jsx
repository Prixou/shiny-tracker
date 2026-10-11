import { SPARKLING_SANDWICHES } from '../../../data/sandwiches.js';
import { TypeBadge } from '../../../ui/index.js';
import { Calculator } from 'lucide-react';
import { Powers, matches, outbreakOdds } from './parts.jsx';

/** Brillance + Insigne + Rencontre Nv. 3 : 1 garniture + 2 Épices Secrètes, avec toutes les paires qui marchent. */
export default function SparklingTab({ query }) {
  const list = SPARKLING_SANDWICHES.filter(r => matches(query, r.type, r.fillings));
  return (
    <>
      <div className="card p-4 space-y-2 text-sm text-slate-300 leading-relaxed">
        <p>
          <strong className="text-amber-300">Brillance + Insigne + Rencontre Nv. 3</strong> du type choisi : 1 garniture (pose tous ses morceaux)
          + 2 Épices Secrètes (raids 5★ et 6★). Avec 60 KO en apparition massive et le Charme Chroma : {outbreakOdds({ charm: true, sparkling: 3 })}.
        </p>
        <p className="text-xs text-slate-400">
          Seules les paires d'Épices indiquées marchent : il faut toujours au moins une Épice salée. Vérifié pour chaque type et chaque paire,
          même si le pain du dessus tombe. Après avoir mangé, l'écran affiche les auras obtenues.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {list.map(r => (
          <article key={r.type} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <TypeBadge type={r.type} />
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-300"><Calculator className="w-3.5 h-3.5" /> Calculée</span>
            </div>
            <div className="text-sm font-bold text-slate-100">{r.fillings.map(f => `${f.n} × ${f.name}`).join(' · ')}</div>
            <ul className="text-xs text-slate-300 space-y-0.5">
              {r.pairs.map((pair, i) => <li key={pair.join()}>{i === 0 ? '+ ' : 'ou + '}{pair[0]} + {pair[1].replace('Épice secrète ', '')}</li>)}
            </ul>
            <Powers powers={r.powers} target="brillance" />
          </article>
        ))}
      </div>
    </>
  );
}
