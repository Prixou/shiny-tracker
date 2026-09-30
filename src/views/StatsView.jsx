import { useMemo, useState } from 'react';
import { BarChart3, Timer, Clock, Target, Sparkles, Trophy, Frown } from 'lucide-react';
import { useStore, huntTotal } from '../state/store.jsx';
import { useNav } from '../state/nav.jsx';
import { MAIN_DEX, POKEDEX, getPokemon } from '../data/pokedex.js';
import { REGIONS, POKEMON_TYPES, SHINY_METHODS, POKE_BALLS, GAMES } from '../data/constants.js';
import { fmtNumber, fmtRatio, formatDuration, getLuckTier, formatDate, catchRatio } from '../lib/utils.js';
import { Sprite, BallIcon, TypeIcon, EmptyState, RegionIcon } from '../components/ui.jsx';

const TIERS = [
  { id: 'king', ratio: 0.25 }, { id: 'lucky', ratio: 0.75 }, { id: 'fair', ratio: 1.25 },
  { id: 'sweat', ratio: 2 }, { id: 'suffer', ratio: 3 }, { id: 'forgotten', ratio: 4 }
];

export default function StatsView() {
  const { shinies, catches, hunts } = useStore();
  const { openPokemon, goTo } = useNav();

  const s = useMemo(() => {
    const caught = MAIN_DEX.filter(p => shinies[p.key]);
    const recs = catches.map(rec => ({ p: getPokemon(rec.key), rec })).filter(r => r.p);
    const huntable = MAIN_DEX.filter(p => !p.isShinyLocked);
    const variantsAll = POKEDEX.filter(p => p.isVariant);
    const byRegion = REGIONS.map(r => {
      const all = MAIN_DEX.filter(p => p.region === r.id);
      return { ...r, total: all.length, value: all.filter(p => shinies[p.key]).length };
    }).filter(r => r.total > 0);
    const byType = POKEMON_TYPES.map(t => {
      const all = MAIN_DEX.filter(p => p.types.includes(t.id));
      return { ...t, total: all.length, value: all.filter(p => shinies[p.key]).length };
    });
    const countBy = (list, field) => list.map(item => ({ ...item, value: recs.filter(r => r.rec[field] === item.id).length }))
      .filter(x => x.value > 0).sort((a, b) => b.value - a.value);
    const withCount = recs.filter(r => r.rec.count > 0);
    const ratios = recs.map(r => ({ ...r, ratio: catchRatio(r.rec) })).filter(r => r.ratio != null).sort((a, b) => a.ratio - b.ratio);
    const luck = TIERS.map(t => ({ ...getLuckTier(t.ratio), id: t.id, value: 0 }));
    ratios.forEach(r => { const tier = getLuckTier(r.ratio); const l = luck.find(x => x.id === tier.id); if (l) l.value++; });

    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        key,
        short: d.toLocaleDateString('fr-FR', { month: 'narrow' }),
        label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        value: recs.filter(r => r.rec.date?.startsWith(key)).length
      };
    });

    const huntEncounters = hunts.filter(h => h.status === 'active').reduce((n, h) => n + huntTotal(h), 0);
    const huntTime = hunts.filter(h => h.status === 'active').reduce((n, h) => n + h.elapsedMs, 0);

    return {
      caught: caught.length,
      total: MAIN_DEX.length,
      copies: recs.length,
      variantsCaught: variantsAll.filter(p => shinies[p.key]).length,
      variantsTotal: variantsAll.length,
      huntableCaught: huntable.filter(p => shinies[p.key]).length,
      huntableTotal: huntable.length,
      encounters: withCount.reduce((n, r) => n + r.rec.count, 0),
      time: recs.reduce((n, r) => n + (r.rec.elapsedMs || 0), 0),
      avg: withCount.length ? withCount.reduce((n, r) => n + r.rec.count, 0) / withCount.length : 0,
      avgRatio: ratios.length ? ratios.reduce((n, r) => n + r.ratio, 0) / ratios.length : 0,
      luckiest: ratios.slice(0, 3),
      unluckiest: ratios.length > 3 ? ratios.slice(-Math.min(3, ratios.length - 3)).reverse() : [],
      byRegion, byType,
      byMethod: countBy(SHINY_METHODS, 'method'),
      byBall: countBy(POKE_BALLS, 'ball'),
      byGame: countBy(GAMES, 'game'),
      luck,
      months,
      huntEncounters, huntTime,
      activeHunts: hunts.filter(h => h.status === 'active').length
    };
  }, [shinies, catches, hunts]);

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

      <MonthlyChart months={s.months} />

      {(s.luckiest.length > 0) && (
        <section className="grid sm:grid-cols-2 gap-3">
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

const Tile = ({ icon, label, value, sub }) => (
  <div className="card p-3.5">
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">{icon}{label}</div>
    <div className="text-xl font-black font-mono text-slate-100 mt-1 truncate">{value}</div>
    {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
  </div>
);

const Panel = ({ title, children }) => (
  <section className="card p-4 space-y-2.5">
    <h3 className="label-caps">{title}</h3>
    <div className="space-y-2">{children}</div>
  </section>
);

// Barre horizontale : `total` = progression (x/total), sinon comparaison au `max`.
function BarRow({ label, icon, value, total, max }) {
  const ratio = total ? value / total : max ? value / max : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-5 flex justify-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-semibold text-slate-300 truncate">{label}</span>
          <span className="font-mono font-bold text-slate-200 shrink-0 ml-2">
            {value}{total ? <span className="text-slate-500">/{total}</span> : null}
          </span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(value ? 2 : 0, ratio * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function MonthlyChart({ months }) {
  const [sel, setSel] = useState(null);
  const max = Math.max(1, ...months.map(m => m.value));
  const total = months.reduce((n, m) => n + m.value, 0);
  const shown = sel != null ? months[sel] : null;
  const peak = months.reduce((best, m, i) => (m.value > (months[best]?.value || 0) ? i : best), 0);
  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="label-caps">Captures sur 12 mois</h3>
        <span className="text-xs text-slate-400 text-right">
          {shown ? <><strong className="text-slate-100 capitalize">{shown.label}</strong> : {shown.value} shiny</> : <>{total} au total</>}
        </span>
      </div>
      <div className="relative h-36 pt-5 flex items-end gap-1.5" role="img" aria-label={`Captures par mois : ${months.map(m => `${m.label} ${m.value}`).join(', ')}`}>
        <div className="absolute inset-x-0 bottom-0 border-t border-slate-700" />
        {months.map((m, i) => (
          <button key={m.key} onClick={() => setSel(sel === i ? null : i)} className="relative flex-1 h-full flex flex-col justify-end items-center group" aria-label={`${m.label} : ${m.value}`}>
            {(i === sel || (sel == null && i === peak && m.value > 0)) && (
              <span className="absolute text-[11px] font-mono font-bold text-slate-100" style={{ bottom: `calc(${(m.value / max) * 100}% + 4px)` }}>{m.value}</span>
            )}
            <span className={`w-full max-w-7 rounded-t-[4px] transition-all ${sel === i ? 'bg-amber-300' : 'bg-amber-500'} ${m.value ? '' : 'opacity-0'}`}
              style={{ height: `${(m.value / max) * 85}%`, minHeight: m.value ? 4 : 0 }} />
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {months.map((m, i) => <span key={m.key} className={`flex-1 text-center text-[10px] font-bold uppercase ${sel === i ? 'text-amber-300' : 'text-slate-500'}`}>{m.short}</span>)}
      </div>
    </section>
  );
}

function Podium({ title, icon, items, onOpen }) {
  return (
    <section className="card p-4 space-y-2">
      <h3 className="label-caps flex items-center gap-1.5">{icon}{title}</h3>
      {items.map(({ p, rec, ratio }) => (
        <button key={rec.id} onClick={() => onOpen(p.key)} className="w-full flex items-center gap-3 p-1.5 rounded-2xl active:bg-slate-800 text-left">
          <Sprite pokemon={p} className="w-11 h-11" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-100 truncate">{p.name}</div>
            <div className="text-[11px] text-slate-500">{fmtNumber(rec.count)} renc. · {formatDate(rec.date)}</div>
          </div>
          <span className="text-xs font-mono font-black text-slate-200">{fmtRatio(ratio)}</span>
        </button>
      ))}
    </section>
  );
}
