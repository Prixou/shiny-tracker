import { useCallback, useMemo, useState } from 'react';
import { BookOpen, Search, FileDown, Sparkles, CalendarX, ChevronRight, ListChecks } from 'lucide-react';
import { useAppState } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { formatDate, fmtNumber, formatDuration, todayIso } from '../../lib/format.js';
import { downloadFile } from '../../lib/share.js';
import { JOURNAL_SORTS, journalCounts, journalCsv, journalEntries, journalGroups, journalList } from '../../domain/journal.js';
import { EmptyState } from '../../ui/index.js';
import DateFixSheet, { useSuspiciousDays } from './DateFixSheet.jsx';
import JournalEntry from './JournalEntry.jsx';
import SelectionBar from './SelectionBar.jsx';
import BulkEditSheet from './BulkEditSheet.jsx';
import { useSelection } from './useSelection.js';

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'review', label: 'À vérifier' },
  { id: 'undated', label: 'Sans date' }
];

const EMPTY_TEXT = { review: 'Plus rien à vérifier ✨', undated: 'Aucun shiny sans date.' };

export default function JournalView() {
  const catches = useAppState(s => s.catches);
  const { openPokemon, goTo } = useNav();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [filter, setFilter] = useState('all');
  const [showDateFix, setShowDateFix] = useState(false);
  const [editing, setEditing] = useState(false);
  const suspicious = useSuspiciousDays();
  const sel = useSelection();

  const entries = useMemo(() => journalEntries(catches), [catches]);
  const counts = useMemo(() => journalCounts(catches), [catches]);
  const list = useMemo(() => journalList(entries, { query, filter, sort }), [entries, query, filter, sort]);
  const groups = useMemo(() => journalGroups(list, sort), [list, sort]);
  const totals = useMemo(() => entries.reduce((acc, e) => {
    acc.count += e.rec.count || 0;
    acc.time += e.rec.elapsedMs || 0;
    return acc;
  }, { count: 0, time: 0 }), [entries]);
  // Sélection limitée aux shiny qui existent encore (une annulation peut en retirer).
  const selectedIds = useMemo(() => catches.filter(c => sel.ids.has(c.id)).map(c => c.id), [catches, sel.ids]);
  const open = useCallback(key => openPokemon(key), [openPokemon]);

  const exportCsv = () => downloadFile(`journal-shiny-${todayIso()}.csv`, journalCsv(list), 'text/csv;charset=utf-8');

  if (!entries.length) {
    return (
      <EmptyState icon={<BookOpen className="w-7 h-7" />} title="Journal vide"
        action={<button className="btn-primary" onClick={() => goTo('dex')}><Sparkles className="w-4 h-4" /> Ouvrir le Pokédex</button>}>
        Chaque shiny capturé apparaîtra ici avec sa date, sa Ball et ta chance.
      </EmptyState>
    );
  }

  return (
    <div className={`space-y-4 ${sel.active ? 'pb-20' : ''}`}>
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

      {suspicious.length > 0 && (
        <button onClick={() => setShowDateFix(true)} className="w-full flex items-center gap-3 min-h-14 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
          <CalendarX className="w-5 h-5 shrink-0 text-amber-400" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-slate-100 truncate">{suspicious[0].ids.length} shiny ajoutés le {formatDate(suspicious[0].date)}</span>
            <span className="block text-xs text-slate-400 truncate">Ton historique saisi d'un coup ? Corrige les dates</span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-amber-400" />
        </button>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nom, surnom, note…" className="input pl-11" aria-label="Rechercher dans le journal" />
        </div>
        <button onClick={sel.active ? sel.stop : sel.start} aria-pressed={sel.active} aria-label="Sélectionner plusieurs shiny" title="Sélectionner"
          className={`icon-btn w-12 h-12 shrink-0 border ${sel.active ? 'bg-amber-500/15 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-800'}`}>
          <ListChecks className="w-5 h-5" />
        </button>
        <button onClick={exportCsv} className="icon-btn w-12 h-12 shrink-0 bg-slate-900 border border-slate-800" aria-label="Exporter en CSV" title="Exporter en CSV">
          <FileDown className="w-5 h-5" />
        </button>
      </div>

      {(counts.review > 0 || counts.undated > 0 || filter !== 'all') && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" role="group" aria-label="Filtrer le journal">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
              className={`chip shrink-0 min-h-9 text-xs ${filter === f.id ? 'chip-on' : 'chip-off'}`}>
              {f.label} · {counts[f.id]}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" role="group" aria-label="Trier le journal">
        {JOURNAL_SORTS.map(s => (
          <button key={s.id} onClick={() => setSort(s.id)} aria-pressed={sort === s.id} className={`chip shrink-0 min-h-9 text-xs ${sort === s.id ? 'chip-on' : 'chip-off'}`}>{s.label}</button>
        ))}
      </div>

      {filter === 'review' && list.length > 0 && (
        <p className="text-xs text-slate-400 leading-relaxed">
          Ajoutés d'un geste : jeu, méthode et Ball sont ceux par défaut. Sélectionne-les (le tri « N° du Pokédex » les range par région),
          puis « Modifier » pour leur donner le bon jeu, la Ball… ou confirmer qu'ils sont justes.
        </p>
      )}

      {groups.map(g => {
        const ids = g.items.map(e => e.id);
        const all = sel.active && ids.every(id => sel.ids.has(id));
        const label = g.label || (sel.active ? 'Résultats' : null);
        return (
          <section key={g.key} className="space-y-2">
            {label && (
              <div className="flex items-center justify-between gap-2 pt-2">
                <h3 className="label-caps flex-1 min-w-0 flex items-center justify-between gap-2">
                  <span className="truncate">{label}</span><span className="text-slate-600">{g.items.length}</span>
                </h3>
                {sel.active && (
                  <button onClick={() => sel.setMany(ids, !all)} className="shrink-0 min-h-11 -my-2 px-3 text-xs font-bold text-amber-400"
                    aria-label={`${all ? 'Désélectionner' : 'Sélectionner'} : ${label}`}>
                    {all ? 'Aucun' : 'Tout'}
                  </button>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {g.items.map(e => (
                <JournalEntry key={e.id} entry={e} selecting={sel.active} selected={sel.ids.has(e.id)} onOpen={open} onToggle={sel.toggle} />
              ))}
            </div>
          </section>
        );
      })}
      {list.length === 0 && (
        <p className="text-center text-sm text-slate-500 py-10">{query ? `Aucun résultat pour « ${query} ».` : EMPTY_TEXT[filter] || 'Aucun résultat.'}</p>
      )}

      {sel.active && <SelectionBar count={selectedIds.length} onEdit={() => setEditing(true)} onClose={sel.stop} />}
      {editing && <BulkEditSheet ids={selectedIds} onClose={() => setEditing(false)} onDone={() => { setEditing(false); sel.clear(); }} />}
      <DateFixSheet open={showDateFix} onClose={() => setShowDateFix(false)} />
    </div>
  );
}
