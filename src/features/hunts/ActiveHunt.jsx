import { useCallback, useEffect, useState } from 'react';
import { Minus, Play, Pause, Sparkles, Settings2, GitBranch, Sun, Clock, Egg, Link2, BookOpen } from 'lucide-react';
import { useActions } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { guideForMethod } from '../../data/guides.js';
import { GAME_BY_ID } from '../../data/games.js';
import { METHOD_BY_ID, oddsContext, isDynamic } from '../../data/methods.js';
import { huntElapsed, huntTotal, huntOdds } from '../../domain/hunt.js';
import { fmtNumber, fmtOdds, formatDuration } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Sprite } from '../../ui/index.js';
import PhaseList from './PhaseList.jsx';
import FoundSheet from './FoundSheet.jsx';
import PhaseSheet from './PhaseSheet.jsx';
import EditHuntSheet from './EditHuntSheet.jsx';
import HeadsetToggle from './HeadsetToggle.jsx';
import HuntStats from './HuntStats.jsx';
import AddTimeSheet from './AddTimeSheet.jsx';
import GuideSheet from '../tools/GuideSheet.jsx';

export const EGGS_PER_BOX = 30;

/** Chasse affichée : gros bouton +1, chrono, chance cumulée et réglages. */
export default function ActiveHunt({ hunt, now, wakeLocked, onFound }) {
  const { increment, toggleTimer, setUiValue } = useActions();
  const { openPokemon, goTo } = useNav();
  const guide = guideForMethod(hunt.method);
  const [sheet, setSheet] = useState(null);
  const [bump, setBump] = useState(0);
  const p = getPokemon(hunt.targetId);
  const game = GAME_BY_ID[hunt.game];
  const method = METHOD_BY_ID[hunt.method] || METHOD_BY_ID.other;
  const ctx = oddsContext(hunt);
  const dynamic = isDynamic(ctx);
  const unit = method.unit || 'rencontres';
  const total = huntTotal(hunt);
  const elapsed = huntElapsed(hunt, now);
  const odds = huntOdds(hunt);
  const quickSteps = method.eggs ? [5, EGGS_PER_BOX] : [5, 10];

  const add = useCallback(n => {
    increment(hunt.id, n);
    setBump(b => b + 1);
    feedback.tap();
  }, [increment, hunt.id]);
  const plus = useCallback(() => add(hunt.step), [add, hunt.step]);
  const minus = useCallback(() => {
    if (hunt.count <= 0) return;
    increment(hunt.id, -hunt.step);
    feedback.undo();
  }, [increment, hunt.id, hunt.step, hunt.count]);

  // Raccourcis clavier (ordinateur / clavier Bluetooth) : Espace, Entrée, ↑, + / ↓, -
  useEffect(() => {
    const onKey = e => {
      if (sheet || document.documentElement.classList.contains('sheet-open')) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.repeat && e.key !== 'ArrowUp') return;
      if ([' ', 'Enter', 'ArrowUp', '+', '='].includes(e.key)) { e.preventDefault(); plus(); }
      if (['ArrowDown', '-', 'Backspace'].includes(e.key)) { e.preventDefault(); minus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [plus, minus, sheet]);

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => openPokemon(hunt.targetId)} className="shrink-0 rounded-2xl bg-slate-950 border border-slate-800 p-1" aria-label={`Fiche de ${p?.name}`}>
            <Sprite pokemon={p} className="w-16 h-16 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white truncate">{p?.name || 'Pokémon inconnu'}</h2>
            <div className="text-xs text-slate-400 truncate">{game?.icon} {game?.short} · {method.icon} {method.name}</div>
            <div className="text-xs font-mono text-amber-400/90 mt-0.5 truncate">
              {fmtOdds(odds)}{dynamic ? ` (chaîne ${hunt.count})` : ''}{ctx.x.charm ? ' · Charme ✦' : ''}{ctx.custom ? ' · perso' : ''}{hunt.step > 1 ? ` · +${hunt.step}` : ''}
            </div>
          </div>
          <button onClick={() => setSheet('edit')} className="icon-btn bg-slate-950 border border-slate-800" aria-label="Paramètres de la chasse">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => { toggleTimer(hunt.id); feedback.tap(); }}
            className={`flex-1 flex items-center justify-center gap-2 min-h-12 rounded-2xl border font-mono text-lg font-bold ${hunt.startedAt ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
            aria-label={hunt.startedAt ? 'Mettre le chrono en pause' : 'Démarrer le chrono'}>
            {hunt.startedAt ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {formatDuration(elapsed)}
          </button>
          {wakeLocked && (
            <span className="shrink-0 flex items-center gap-1 px-3 min-h-12 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-bold text-amber-300" title="L'écran reste allumé">
              <Sun className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      <button
        onClick={plus}
        className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/25 active:scale-[0.985] transition-transform select-none min-h-[36dvh] flex flex-col items-center justify-center gap-1"
        aria-label={`Ajouter ${hunt.step} ${unit}`}
      >
        {hunt.phases.length > 0 && <span className="text-xs font-black uppercase tracking-widest text-slate-900/60">Phase {hunt.phases.length + 1}</span>}
        <span key={bump} className="text-[clamp(4.5rem,24vw,9rem)] leading-none font-black font-mono tabular-nums animate-bump">{fmtNumber(hunt.count)}</span>
        <span className="text-sm font-black uppercase tracking-wider text-slate-900/70">{unit} · toucher pour +{hunt.step}</span>
        {method.eggs && hunt.count >= EGGS_PER_BOX && (
          <span className="text-xs font-bold text-slate-900/60">{Math.floor(hunt.count / EGGS_PER_BOX)} boîte{hunt.count >= 2 * EGGS_PER_BOX ? 's' : ''} + {hunt.count % EGGS_PER_BOX} œufs</span>
        )}
        {hunt.phases.length > 0 && <span className="text-xs font-bold text-slate-900/60">Total : {fmtNumber(total)}</span>}
      </button>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={minus} disabled={hunt.count <= 0} className="btn-secondary flex-col gap-0.5 min-h-16 px-1" aria-label={`Retirer ${hunt.step}`}>
          <Minus className="w-5 h-5" /><span className="text-[11px]">-{hunt.step}</span>
        </button>
        <button onClick={() => setSheet('phase')} className="btn-secondary flex-col gap-0.5 min-h-16 px-1">
          {dynamic ? <Link2 className="w-5 h-5" /> : <GitBranch className="w-5 h-5" />}
          <span className="text-[11px]">{dynamic ? 'Chaîne' : 'Phase'}</span>
        </button>
        <button onClick={() => setSheet('found')} className="col-span-2 btn-primary bg-emerald-500 active:bg-emerald-400 shadow-emerald-500/20 min-h-16">
          <Sparkles className="w-5 h-5" /> Shiny trouvé !
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickSteps.map(n => (
          <button key={n} onClick={() => add(n)} className="btn-secondary min-h-11 text-sm">
            {method.eggs && n === EGGS_PER_BOX ? <><Egg className="w-4 h-4" /> +1 boîte (30)</> : <>+{n}</>}
          </button>
        ))}
        {!dynamic && (
          <button onClick={() => setSheet('time')} className="col-span-2 btn-secondary min-h-11 text-sm">
            <Clock className="w-4 h-4" /> Ajouter des {unit} par durée
          </button>
        )}
      </div>

      <HeadsetToggle hunt={hunt} />
      {guide && (
        <button onClick={() => setSheet('guide')} className="btn-secondary w-full min-h-11 text-sm">
          <BookOpen className="w-4 h-4" /> Tuto : {guide.title}
        </button>
      )}

      <HuntStats hunt={hunt} elapsed={elapsed} />

      {hunt.phases.length > 0 && <PhaseList hunt={hunt} dynamic={dynamic} />}

      <FoundSheet open={sheet === 'found'} onClose={() => setSheet(null)} hunt={hunt} onFound={onFound} />
      <PhaseSheet open={sheet === 'phase'} onClose={() => setSheet(null)} hunt={hunt} dynamic={dynamic} />
      <EditHuntSheet open={sheet === 'edit'} onClose={() => setSheet(null)} hunt={hunt} elapsed={elapsed} />
      <AddTimeSheet open={sheet === 'time'} onClose={() => setSheet(null)} hunt={hunt} />
      {sheet === 'guide' && (
        <GuideSheet guide={guide} onClose={() => setSheet(null)} onRecipes={() => { setSheet(null); setUiValue('toolsSection', 'recipes'); goTo('tools'); }} />
      )}
    </div>
  );
}
