import { Timer, ChefHat } from 'lucide-react';
import { GAME_BY_ID } from '../../data/games.js';
import { oddsAt } from '../../data/methods.js';
import { fmtOdds } from '../../lib/format.js';
import { Sheet } from '../../ui/index.js';

const Section = ({ title, items, ordered = false }) => {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <section className="space-y-2">
      <h3 className="label-caps">{title}</h3>
      <Tag className={`text-sm text-slate-300 leading-relaxed space-y-1.5 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`}>
        {items.map(t => <li key={t}>{t}</li>)}
      </Tag>
    </section>
  );
};

/**
 * Tuto d'une méthode : prérequis, étapes, astuces et taux (calculés par le moteur de l'app).
 * `onHunt(cfg)` lance une chasse pré-réglée ; `onRecipes` ouvre les recettes (sandwichs, donuts).
 */
export default function GuideSheet({ guide, onClose, onHunt, onRecipes }) {
  if (!guide) return null;
  const best = guide.odds.at(-1);
  return (
    <Sheet open onClose={onClose} title={guide.title} subtitle={guide.games.map(g => GAME_BY_ID[g]?.short).filter(Boolean).join(' · ')}
      icon={<span className="text-xl leading-none">{guide.icon}</span>}>
      <div className="space-y-5">
        <p className="text-sm text-slate-200 leading-relaxed">{guide.intro}</p>
        <section className="space-y-2">
          <h3 className="label-caps">Taux</h3>
          <div className="rounded-2xl border border-slate-800 divide-y divide-slate-800 overflow-hidden">
            {guide.odds.map(o => (
              <div key={o.label} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-950/60">
                <span className="text-xs text-slate-300 min-w-0">{o.label}</span>
                <span className="shrink-0 text-sm font-black font-mono text-amber-300">{fmtOdds(oddsAt(o.cfg, o.chain || 0))}</span>
              </div>
            ))}
          </div>
        </section>
        <Section title="Il te faut" items={guide.needs} />
        <Section title="Étapes" items={guide.steps} ordered />
        {guide.tips.length > 0 && <Section title="Astuces" items={guide.tips} />}
        <div className="grid grid-cols-1 gap-2">
          {onHunt && (
            <button className="btn-primary" onClick={() => onHunt(best.cfg)}>
              <Timer className="w-4 h-4" /> Chasser avec cette méthode
            </button>
          )}
          {guide.recipes && onRecipes && (
            <button className="btn-secondary" onClick={onRecipes}><ChefHat className="w-4 h-4" /> Voir les recettes</button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
