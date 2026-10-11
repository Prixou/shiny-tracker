import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { GUIDES } from '../../data/guides.js';
import { GAME_BY_ID } from '../../data/games.js';
import { useNav } from '../../state/nav.jsx';
import GuideSheet from './GuideSheet.jsx';

/** Tutos des méthodes de chasse, du plus récent au plus ancien jeu. */
export default function GuidesTool({ onRecipes }) {
  const [open, setOpen] = useState(null);
  const { openNewHunt } = useNav();
  const guide = GUIDES.find(g => g.id === open) || null;
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-400">Chaque méthode pas à pas : ce qu'il faut, les étapes, les astuces et les taux (calculés comme pour tes chasses).</p>
      {GUIDES.map(g => (
        <button key={g.id} onClick={() => setOpen(g.id)}
          className="w-full flex items-center gap-3 min-h-16 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 active:bg-slate-800 text-left">
          <span className="text-2xl w-9 text-center shrink-0" aria-hidden="true">{g.icon}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-slate-100">{g.title}</span>
            <span className="block text-xs text-slate-400 truncate">{g.games.map(id => GAME_BY_ID[id]?.short).filter(Boolean).join(' · ')}</span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-slate-500" />
        </button>
      ))}
      <GuideSheet guide={guide} onClose={() => setOpen(null)} onHunt={cfg => openNewHunt(null, cfg)}
        onRecipes={onRecipes ? () => { setOpen(null); onRecipes(); } : null} />
    </div>
  );
}
