import { Clock, TrendingUp, Target, Zap } from 'lucide-react';
import { METHOD_BY_ID, encountersFor, oddsContext, isDynamic, luckRatio, oddsAt } from '../../data/methods.js';
import { huntTotal, huntChance } from '../../domain/hunt.js';
import { getLuckTier } from '../../domain/luck.js';
import { fmtNumber, fmtOdds, fmtRatio, fmtPercent, formatDuration } from '../../lib/format.js';

/** Sous le compteur : niveau de chance, progression vers le taux, chance cumulée, rythme et temps estimé. */
export default function HuntStats({ hunt, elapsed }) {
  const method = METHOD_BY_ID[hunt.method] || METHOD_BY_ID.other;
  const dynamic = isDynamic(oddsContext(hunt));
  const total = huntTotal(hunt);
  const chance = huntChance(hunt);
  const ratio = luckRatio(chance);
  const luck = getLuckTier(total > 0 ? ratio : null);
  const hours = elapsed / 3600000;
  const rate = hours > 0.01 ? total / hours : 0;
  const need90 = encountersFor(hunt, 0.9);

  return (
    <>
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
    </>
  );
}

const MiniStat = ({ icon, label, value, sub }) => (
  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">{icon}{label}</div>
    <div className="text-base font-black font-mono text-slate-100 mt-0.5">{value} {sub && <span className="text-[11px] font-sans font-semibold text-slate-500">{sub}</span>}</div>
  </div>
);
