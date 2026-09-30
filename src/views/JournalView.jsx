import { useMemo, useState } from 'react';
import { BookOpen, Search, FileDown, Sparkles } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { useNav } from '../state/nav.jsx';
import { getPokemon } from '../data/pokedex.js';
import { GAME_BY_ID, METHOD_BY_ID, BALL_BY_ID } from '../data/constants.js';
import { normalize, formatDate, fmtNumber, formatDuration, getLuckTier, monthLabel } from '../lib/utils.js';
import { downloadFile } from '../lib/sync.js';
import { Sprite, BallIcon, EmptyState } from '../components/ui.jsx';

const SORTS = [
  { id: 'recent', label: 'Plus récents' },
  { id: 'oldest', label: 'Plus anciens' },
  { id: 'most', label: 'Plus de rencontres' },
  { id: 'luckiest', label: 'Les plus chanceux' },
  { id: 'unluckiest', label: 'Les plus longs (vs taux)' }
];

export default function JournalView() {
  const { shinies } = useStore();
  const { openPokemon, goTo } = useNav();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');

  const entries = useMemo(() => Object.entries(shinies)
    .map(([key, rec]) => ({ key, rec, p: getPokemon(key) }))
    .filter(e => e.p), [shinies]);

  const totals = useMemo(() => entries.reduce((acc, e) => {
    acc.count += e.rec.count || 0;
    acc.time += e.rec.elapsedMs || 0;
    return acc;
  }, { count: 0, time: 0 }), [entries]);

  const list = useMemo(() => {
    const q = normalize(query);
    const out = entries.filter(e => !q || e.p.search.includes(q) || normalize(e.rec.nickname).includes(q) || normalize(e.rec.notes).includes(q));
    const ratio = e => (e.rec.count > 0 ? e.rec.count / (e.rec.odds || 4096) : null);
    const cmp = {
      recent: (a, b) => (b.rec.timestamp || 0) - (a.rec.timestamp || 0),
      oldest: (a, b) => (a.rec.timestamp || 0) - (b.rec.timestamp || 0),
      most: (a, b) => (b.rec.count || 0) - (a.rec.count || 0),
      luckiest: (a, b) => (ratio(a) ?? Infinity) - (ratio(b) ?? Infinity),
      unluckiest: (a, b) => (ratio(b) ?? -1) - (ratio(a) ?? -1)
    }[sort];
    return out.sort(cmp);
  }, [entries, query, sort]);

  const groups = useMemo(() => {
    if (sort !== 'recent' && sort !== 'oldest') return [{ key: 'all', label: null, items: list }];
    const map = new Map();
    for (const e of list) {
      const k = e.rec.date ? e.rec.date.slice(0, 7) : 'unknown';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    }
    return [...map.entries()].map(([k, items]) => ({ key: k, label: k === 'unknown' ? 'Date inconnue' : monthLabel(k), items }));
  }, [list, sort]);

  const exportCsv = () => {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['N°', 'Pokémon', 'Surnom', 'Date', 'Jeu', 'Méthode', 'Ball', 'Rencontres', 'Taux', 'Durée', 'Sexe', 'Notes']];
    for (const { p, rec } of list) {
      rows.push([p.id, p.name, rec.nickname, rec.date, GAME_BY_ID[rec.game]?.name, METHOD_BY_ID[rec.method]?.name, BALL_BY_ID[rec.ball]?.name,
        rec.count, rec.odds ? `1/${rec.odds}` : '', rec.elapsedMs ? formatDuration(rec.elapsedMs) : '', rec.gender === 'm' ? '♂' : rec.gender === 'f' ? '♀' : '', rec.notes]);
    }
    downloadFile(`journal-shiny-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + rows.map(r => r.map(esc).join(';')).join('\n'), 'text/csv;charset=utf-8');
  };

  if (!entries.length) {
    return (
      <EmptyState icon={<BookOpen className="w-7 h-7" />} title="Journal vide"
        action={<button className="btn-primary" onClick={() => goTo('dex')}><Sparkles className="w-4 h-4" /> Ouvrir le Pokédex</button>}>
        Chaque shiny capturé apparaîtra ici avec sa date, sa Ball et ta chance.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Shiny', value: fmtNumber(entries.length) },
          { label: 'Rencontres', value: fmtNumber(totals.count) },
          { label: 'Temps', value: formatDuration(totals.time, { short: true }) }
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-lg font-black font-mono text-amber-400 truncate">{s.value}</div>
            <div className="text-[11px] font-bold text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nom, surnom, note…" className="input pl-11" />
        </div>
        <button onClick={exportCsv} className="icon-btn w-12 h-12 bg-slate-900 border border-slate-800" aria-label="Exporter en CSV" title="Exporter en CSV">
          <FileDown className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {SORTS.map(s => (
          <button key={s.id} onClick={() => setSort(s.id)} className={`chip shrink-0 min-h-9 text-xs ${sort === s.id ? 'chip-on' : 'chip-off'}`}>{s.label}</button>
        ))}
      </div>

      {groups.map(g => (
        <section key={g.key} className="space-y-2">
          {g.label && <h3 className="label-caps pt-2 flex items-center justify-between">{g.label}<span className="text-slate-600">{g.items.length}</span></h3>}
          <div className="grid gap-2 md:grid-cols-2">
            {g.items.map(({ key, rec, p }) => {
              const luck = getLuckTier(rec.count, rec.odds);
              const game = GAME_BY_ID[rec.game];
              const method = METHOD_BY_ID[rec.method];
              return (
                <button key={key} onClick={() => openPokemon(key)} className="cv-auto w-full flex items-center gap-3 p-2.5 pr-3 rounded-2xl bg-slate-900/80 border border-slate-800 active:bg-slate-800 text-left">
                  <div className="relative shrink-0">
                    <Sprite pokemon={p} className="w-16 h-16 drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]" />
                    <BallIcon id={rec.ball} className="w-6 h-6 absolute -bottom-1 -right-1" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-amber-200 truncate">{rec.nickname || p.name}</span>
                      {rec.gender === 'm' && <span className="text-sky-400 text-sm">♂</span>}
                      {rec.gender === 'f' && <span className="text-pink-400 text-sm">♀</span>}
                    </div>
                    {rec.nickname && <div className="text-[11px] text-slate-500 -mt-0.5">{p.name}</div>}
                    <div className="text-xs text-slate-400 truncate">{formatDate(rec.date)}{game ? ` · ${game.icon} ${game.short}` : ''}</div>
                    <div className="text-xs text-slate-500 truncate">{method?.icon} {method?.name}{rec.count ? ` · ${fmtNumber(rec.count)} renc.` : ''}</div>
                  </div>
                  <span className={`shrink-0 text-xl w-10 h-10 rounded-xl border flex items-center justify-center ${luck.bg}`} title={luck.name}>{luck.emoji}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {list.length === 0 && <p className="text-center text-sm text-slate-500 py-10">Aucun résultat pour « {query} ».</p>}
    </div>
  );
}
