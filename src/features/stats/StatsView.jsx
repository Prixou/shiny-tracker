import { useMemo } from 'react';
import { BarChart3, Timer, Clock, Target, Sparkles, Trophy, Frown } from 'lucide-react';
import { useAppState, useShinies } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { computeStats } from '../../domain/stats.js';
import { fmtNumber, fmtRatio, formatDuration } from '../../lib/format.js';
import { BallIcon, TypeIcon, EmptyState, RegionIcon } from '../../ui/index.js';
import { Tile, Panel, BarRow, MonthlyChart, Podium } from './charts.jsx';
import Forecast from './Forecast.jsx';

export default function StatsView() {
  const shinies = useShinies();
  const { catches, hunts } = useAppState(s => ({ catches: s.catches, hunts: s.hunts }));
  const { openPokemon, goTo } = useNav();

  const s = useMemo(() => computeStats({ shinies, catches, hunts }), [shinies, catches, hunts]);

  if (!s.caught && !s.activeHunts) {
    return (
      <EmptyState icon={<BarChart3 className="w-7 h-7" />} title="Pas encore de statistiques"
        action={<button className="btn-primary" onClick={() => goTo('dex')}><Sparkles className="w-4 h-4" /> Commencer</button>}>
        Marque tes premiers shiny ou lance une chasse pour voir apparaître tes graphiques.
      </EmptyState>
    );
  }

  const pct = (s.caught / s.total) * 100;
  return (
    <div className="space-y-4">
      <section className="card p-5 flex items-center gap-5">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" role="img" aria-label={`${pct.toFixed(1)} % du Pokédex shiny complété`}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="12" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 326.7} 326.7`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{pct.toFixed(1).replace('.', ',')}<span className="text-sm">%</span></span>
          </div>
        </div>
        <div className="min-w-0 space-y-1">
          <div className="label-caps">Pokédex shiny</div>
          <div className="text-3xl font-black font-mono text-amber-400">{s.caught}<span className="text-base text-slate-500">/{s.total}</span></div>
          <div className="text-xs text-slate-400">Hors Shiny Lock : <strong className="text-slate-200">{s.huntableCaught}/{s.huntableTotal}</strong></div>
          <div className="text-xs text-slate-400">{s.copies} exemplaire{s.copies > 1 ? 's' : ''} · variantes {s.variantsCaught}/{s.variantsTotal}</div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Tile icon={<Target className="w-4 h-4" />} label="Rencontres (captures)" value={fmtNumber(s.encounters)} />
        <Tile icon={<Clock className="w-4 h-4" />} label="Temps de chasse" value={formatDuration(s.time, { short: true })} />
        <Tile icon={<BarChart3 className="w-4 h-4" />} label="Moyenne / shiny" value={s.avg ? fmtNumber(s.avg) : '—'} sub={s.avgRatio ? `${fmtRatio(s.avgRatio)} le taux` : null} />
        <Tile icon={<Timer className="w-4 h-4" />} label="Chasses en cours" value={s.activeHunts} sub={s.huntEncounters ? `${fmtNumber(s.huntEncounters)} renc.` : null} />
      </section>

      <Forecast catches={catches} />

      <MonthlyChart months={s.months} />

      {(s.luckiest.length > 0) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Podium title="Les plus chanceux" icon={<Trophy className="w-4 h-4 text-amber-400" />} items={s.luckiest} onOpen={openPokemon} />
          {s.unluckiest.length > 0 && <Podium title="Les plus douloureux" icon={<Frown className="w-4 h-4 text-rose-400" />} items={s.unluckiest} onOpen={openPokemon} />}
        </section>
      )}

      {s.luck.some(l => l.value) && (
        <Panel title="Répartition de la chance">
          {s.luck.map(l => <BarRow key={l.id} label={l.name} icon={<span className="text-base">{l.emoji}</span>} value={l.value} max={Math.max(...s.luck.map(x => x.value))} />)}
        </Panel>
      )}

      <Panel title="Par région">
        {s.byRegion.map(r => <BarRow key={r.id} label={r.name} icon={<RegionIcon region={r} />} value={r.value} total={r.total} />)}
      </Panel>

      <Panel title="Par type">
        {s.byType.map(t => <BarRow key={t.id} label={t.name} icon={<TypeIcon type={t.id} className="w-4 h-4" />} value={t.value} total={t.total} />)}
      </Panel>

      {s.byMethod.length > 0 && (
        <Panel title="Méthodes">
          {s.byMethod.map(m => <BarRow key={m.id} label={m.name} icon={<span>{m.icon}</span>} value={m.value} max={s.byMethod[0].value} />)}
        </Panel>
      )}
      {s.byGame.length > 0 && (
        <Panel title="Jeux">
          {s.byGame.map(g => <BarRow key={g.id} label={g.name} icon={<span>{g.icon}</span>} value={g.value} max={s.byGame[0].value} />)}
        </Panel>
      )}
      {s.byBall.length > 0 && (
        <Panel title="Poké Balls">
          {s.byBall.map(b => <BarRow key={b.id} label={b.name} icon={<BallIcon id={b.id} className="w-5 h-5" />} value={b.value} max={s.byBall[0].value} />)}
        </Panel>
      )}
    </div>
  );
}
