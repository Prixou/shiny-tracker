import { useCallback, useEffect, useState } from 'react';
import { Minus, Play, Pause, Sparkles, Settings2, GitBranch, Sun, Zap, Clock, TrendingUp, Target, Egg, Link2 } from 'lucide-react';
import { useActions } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { GAME_BY_ID } from '../../data/games.js';
import { METHOD_BY_ID, encountersFor, oddsContext, isDynamic, luckRatio, oddsAt } from '../../data/methods.js';
import { huntElapsed, huntTotal, huntChance, huntOdds } from '../../domain/hunt.js';
import { getLuckTier } from '../../domain/luck.js';
import { fmtNumber, fmtOdds, fmtRatio, fmtPercent, formatDuration } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Sprite } from '../../ui/index.js';
import PhaseList from './PhaseList.jsx';
import FoundSheet from './FoundSheet.jsx';
import PhaseSheet from './PhaseSheet.jsx';
import EditHuntSheet from './EditHuntSheet.jsx';

export const EGGS_PER_BOX = 30;

/** Chasse affichée : gros bouton +1, chrono, chance cumulée et réglages. */
export default function ActiveHunt({ hunt, now, wakeLocked, onFound }) {
  const { increment, toggleTimer } = useActions();
  const { openPokemon } = useNav();
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
  const chance = huntChance(hunt);
  const ratio = luckRatio(chance);
  const luck = getLuckTier(total > 0 ? ratio : null);
  const odds = huntOdds(hunt);
  const hours = elapsed / 3600000;
  const rate = hours > 0.01 ? total / hours : 0;
  const need90 = encountersFor(hunt, 0.9);
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
      </div>

      <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${luck.bg}`}>
        <span className="text-2xl">{luck.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-black ${luck.color}`}>{luck.name}</div>
          <div className="text-xs text-slate-300">{luck.desc}</div>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-400">Progression vers le taux</span>
          <span className={ratio > 1 ? 'text-rose-400' : 'text-amber-400'}>{ratio > 1 ? `Over odds ${fmtRatio(ratio)}` : `${Math.round(ratio * 100)} %`}</span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${ratio > 1 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-yellow-300'}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon={<Target className="w-4 h-4" />} label="Chance cumulée" value={fmtPercent(chance)} />
          <MiniStat icon={<TrendingUp className="w-4 h-4" />} label="Rythme" value={rate ? `${fmtNumber(rate)}/h` : '—'} />
          <MiniStat icon={<Zap className="w-4 h-4" />} label="Pour 90 %" value={fmtNumber(Math.max(0, need90 - hunt.count))} sub="restantes" />
          <MiniStat icon={<Clock className="w-4 h-4" />} label="Temps estimé (90 %)"
            value={rate && hunt.count < need90 ? formatDuration(((need90 - hunt.count) / rate) * 3600000, { short: true }) : '—'} />
        </div>
        {dynamic && (
          <p className="text-xs text-slate-400">
            Taux dynamique : {fmtOdds(oddsAt(hunt, 0))} au départ, {fmtOdds(oddsAt(hunt, method.chain))} à partir de {method.chain}. {method.note}
          </p>
        )}
      </div>

      {hunt.phases.length > 0 && <PhaseList hunt={hunt} dynamic={dynamic} />}

      <FoundSheet open={sheet === 'found'} onClose={() => setSheet(null)} hunt={hunt} onFound={onFound} />
      <PhaseSheet open={sheet === 'phase'} onClose={() => setSheet(null)} hunt={hunt} dynamic={dynamic} />
      <EditHuntSheet open={sheet === 'edit'} onClose={() => setSheet(null)} hunt={hunt} elapsed={elapsed} />
    </div>
  );
}

const MiniStat = ({ icon, label, value, sub }) => (
  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">{icon}{label}</div>
    <div className="text-base font-black font-mono text-slate-100 mt-0.5">{value} {sub && <span className="text-[11px] font-sans font-semibold text-slate-500">{sub}</span>}</div>
  </div>
);
