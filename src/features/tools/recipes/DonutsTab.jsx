import { Info } from 'lucide-react';
import { oddsAt } from '../../../data/methods.js';
import { fmtOdds } from '../../../lib/format.js';

const odds = sparkling => fmtOdds(oddsAt({ game: 'za', method: 'za_wild', opts: { sparkling }, charm: true }));

/** Donuts de Légendes Z-A (Mega Dimension) : ce qui est sûr, et ce qui reste aléatoire. */
export default function DonutsTab() {
  return (
    <>
      <div className="card p-4 space-y-2 text-sm text-slate-300 leading-relaxed">
        <p>
          Dans l'extension <strong className="text-amber-300">Mega Dimension</strong>, un donut peut donner l'<strong>Aura Brillance</strong> d'un type :
          +1 à +3 tirages shiny, seulement pour les Pokémon de ce type. Avec le Charme Chroma : Nv. 1 {odds(1)}, Nv. 2 {odds(2)}, Nv. 3 {odds(3)}.
        </p>
        <p>
          Avec Brillance Nv. 3, le premier Pokémon du type du donut qui apparaît en arrivant dans une zone sauvage de l'Hyperespace est forcément shiny.
        </p>
      </div>
      <div className="card p-4 space-y-2">
        <div className="label-caps">Faire un donut Brillance</div>
        <ul className="text-sm text-slate-300 space-y-1.5 list-disc pl-5">
          <li>Les donuts surtout <strong>sucrés</strong> ont le plus de chances de donner Brillance : utilise des baies Hyper très sucrées.</li>
          <li>Les guides proposent par exemple 8 Baies Hyper Tanga ou 8 Baies Hyper Haban (noms anglais).</li>
          <li>Le résultat reste <strong>aléatoire</strong> : Brillance Nv. 3, un niveau plus bas ou pas de Brillance. Vérifie le donut obtenu et recommence si besoin.</li>
        </ul>
      </div>
      <p className="flex gap-1.5 text-xs text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Aucune recette de donut ne garantit Brillance Nv. 3 dans le jeu. Les fossiles ne profitent ni du Charme ni des donuts.
      </p>
    </>
  );
}
