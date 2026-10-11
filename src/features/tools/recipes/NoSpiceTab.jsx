import { ENCOUNTER_SANDWICHES, EGG_SANDWICHES } from '../../../data/sandwiches.js';
import { TypeBadge } from '../../../ui/index.js';
import { Ingredients, Powers, RecipeName, SourceBadge, matches, outbreakOdds } from './parts.jsx';

/** Une recette (du jeu ou libre) avec sa provenance. */
function Recipe({ recipe, title, target }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-xs font-black text-slate-200">{title}</span>
        <SourceBadge recipe={recipe} />
      </div>
      {recipe.kind === 'official' && <RecipeName recipe={recipe} />}
      <Ingredients fillings={recipe.fillings} condiments={recipe.condiments} />
      <Powers powers={recipe.powers} target={target} />
    </div>
  );
}

/** Sandwichs utiles sans Épice Secrète : Aura Rencontre Nv. 2 par type, et Aura Œuf pour la méthode Masuda. */
export default function NoSpiceTab({ query }) {
  const list = ENCOUNTER_SANDWICHES.filter(e => matches(query, e.type, e.free.fillings, e.free.condiments, e.official?.fillings || [], e.official?.condiments || []));
  return (
    <>
      <div className="card p-4 space-y-2 text-sm text-slate-300 leading-relaxed">
        <p>
          <strong className="text-amber-300">Aura Rencontre Nv. 2</strong> : bien plus de Pokémon du type apparaissent autour de toi, donc plus de rencontres
          à l'heure. Sans Épice Secrète, pas d'Aura Brillance : le taux shiny ne change pas (60 KO en apparition massive : {outbreakOdds({})}, avec le Charme : {outbreakOdds({ charm: true })}).
        </p>
        <p className="text-xs text-slate-400">
          Recette du jeu : à choisir dans ton livre de recettes une fois débloquée (effets fixes). Mode libre : sans recette, pose
          toutes les garnitures en entier, puis le pain. « Testée en jeu » : relevée par des joueurs ; « calculée » : formule du jeu,
          validée sur 147 sandwichs réels, avec le même résultat si un morceau ou le pain tombe.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {list.map(e => (
          <article key={e.type} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3" aria-label={`Rencontre ${e.type}`}>
            <TypeBadge type={e.type} />
            {e.official && <Recipe recipe={e.official} title="Recette du jeu" target="rencontre" />}
            <Recipe recipe={e.free} title="Mode libre" target="rencontre" />
          </article>
        ))}
      </div>

      {!query && (
        <section className="space-y-2">
          <h3 className="label-caps pt-2">Aura Œuf Nv. 2 (pique-nique, méthode Masuda)</h3>
          <p className="text-xs text-slate-400">Beaucoup plus d'œufs dans le panier du pique-nique. Aucune recette libre simple n'atteint le Nv. 2 : prends l'une de ces recettes du jeu.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EGG_SANDWICHES.map(r => (
              <article key={r.number} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <Recipe recipe={r} title="Recette du jeu" target="oeuf" />
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
