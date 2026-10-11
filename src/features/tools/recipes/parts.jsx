import { BadgeCheck, Calculator, BookOpen } from 'lucide-react';
import { TYPE_BY_ID } from '../../../data/constants.js';
import { normalize } from '../../../lib/text.js';
import { oddsAt } from '../../../data/methods.js';
import { fmtOdds } from '../../../lib/format.js';

const POWER_LABEL = {
  rencontre: 'Rencontre', capture: 'Capture', geante: 'Géante', minuscule: 'Minuscule', raid: 'Raid',
  experience: 'Expérience', echantillons: 'Échantillons', oeuf: 'Œuf', insigne: 'Insigne', brillance: 'Brillance'
};
const WHERE = {
  sandwicherie: 'donnée par un homme dans une sandwicherie',
  maman: 'donnée par ta mère, à la maison',
  sushi: 'donnée par un amateur de sushis (Casseroya Lake)'
};

/**
 * Taux en apparition massive d'ÉV après 60 KO, calculé par le moteur de l'app (jamais écrit à la main).
 * @param {{ charm?: boolean, sparkling?: number }} options
 */
export const outbreakOdds = ({ charm = false, sparkling = 0 }) => fmtOdds(oddsAt({ game: 'sv', method: 'sv_wild', opts: { outbreak: true, sparkling }, charm }, 60));

/** « Rencontre Électrik Nv. 2 » */
export const powerText = p => `${POWER_LABEL[p.power] || p.power}${p.type ? ` ${TYPE_BY_ID[p.type]?.name || p.type}` : ''} Nv. ${p.level}`;

/** Une recette correspond-elle à la recherche (type ou ingrédient) ? */
export const matches = (query, typeId, ...lists) => !query || normalize(TYPE_BY_ID[typeId]?.name || '').includes(query)
  || lists.flat().some(i => normalize(i.name).includes(query));

const list = items => items.map(i => `${i.n} × ${i.name}`).join(' · ');

/** Garnitures et condiments, quantités comprises. */
export function Ingredients({ fillings, condiments }) {
  return (
    <div className="text-sm text-slate-100 leading-relaxed">
      <div><span className="text-xs font-bold text-slate-400">Garnitures : </span>{list(fillings)}</div>
      <div><span className="text-xs font-bold text-slate-400">Condiments : </span>{list(condiments)}</div>
    </div>
  );
}

/** Auras obtenues ; `target` met en avant celle qu'on cherche. */
export function Powers({ powers, target }) {
  return (
    <div className="flex flex-wrap gap-1">
      {powers.map(p => {
        const on = p.power === target;
        return (
          <span key={`${p.power}${p.type}`} className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${on ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40' : 'bg-slate-800 text-slate-300'}`}>
            {powerText(p)}
          </span>
        );
      })}
    </div>
  );
}

/** Origine de la recette : recette du jeu, testée en jeu, ou calculée avec la formule du jeu. */
export function SourceBadge({ recipe }) {
  if (recipe.kind === 'official') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300">
        <BookOpen className="w-3.5 h-3.5 shrink-0" /> Recette du jeu n° {recipe.number}
      </span>
    );
  }
  if (recipe.kind === 'tested') {
    return <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-300"><BadgeCheck className="w-3.5 h-3.5 shrink-0" /> Testée en jeu</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-300"><Calculator className="w-3.5 h-3.5 shrink-0" /> Calculée (formule du jeu)</span>;
}

/** Nom et provenance d'une recette du jeu. */
export const RecipeName = ({ recipe }) => (
  <div className="text-xs text-slate-400">« {recipe.name} », {WHERE[recipe.where]}</div>
);
