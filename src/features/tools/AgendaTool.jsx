import { useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, Copy, Timer, Sparkles, Info, Hourglass } from 'lucide-react';
import { useNav } from '../../app/nav.jsx';
import { EVENTS, EVENTS_UPDATED, EVENT_TYPES, eventStatus } from '../../data/events.js';
import { GAME_BY_ID } from '../../data/games.js';
import { getPokemon } from '../../data/pokedex.js';
import { oddsAt } from '../../data/methods.js';
import { fmtOdds, formatDate } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Segmented, Sprite, useToast } from '../../ui/index.js';

const DAY = 86400000;
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const deadlineFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function period(e) {
  const start = new Date(e.start);
  if (e.type === 'deadline' && e.end) return `Jusqu'au ${deadlineFmt.format(new Date(e.end))}`;
  if (!e.end) return `Depuis le ${dateFmt.format(start)}`;
  const end = new Date(e.end);
  if (end - start < DAY) return dateFmt.format(start);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return `${(sameYear ? shortFmt : dateFmt).format(start)} → ${dateFmt.format(end)}`;
}

function countdown(e, status, now) {
  const target = status === 'soon' ? Date.parse(e.start) : e.end ? Date.parse(e.end) : null;
  if (!target) return null;
  const ms = target - now;
  const days = Math.floor(ms / DAY);
  const hours = Math.floor(ms / 3600000);
  const span = days >= 1 ? `${days} j` : hours >= 1 ? `${hours} h` : 'moins d\'une heure';
  if (status === 'soon') return `Commence dans ${span}`;
  return e.type === 'deadline' ? `Plus que ${span}` : `Se termine dans ${span}`;
}

function EventCard({ e, status, now }) {
  const { openNewHunt, openBankPlan } = useNav();
  const toast = useToast();
  const type = EVENT_TYPES[e.type];
  const game = GAME_BY_ID[e.game];
  const left = status !== 'past' ? countdown(e, status, now) : null;
  const copy = async code => {
    try {
      await navigator.clipboard.writeText(code);
      feedback.tap();
      toast(`Code ${code} copié`);
    } catch {
      toast('Copie impossible : sélectionne le code à la main', { type: 'error' });
    }
  };
  return (
    <article className={`card p-4 space-y-3 ${e.important && status !== 'past' ? 'border-amber-500/40' : ''} ${status === 'past' ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5" aria-hidden="true">{type?.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{game && game.id !== 'other' ? `${game.icon} ${game.short}` : 'Tous jeux'} · {type?.label}</span>
            {e.shiny && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black">✨ Shiny boostés</span>}
            {e.approx && <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black">À confirmer</span>}
          </div>
          <h3 className="text-[15px] font-black text-white leading-snug">{e.title}</h3>
          <p className="text-xs text-slate-400 mt-1">{period(e)}{left ? <> · <span className={status === 'live' ? 'text-emerald-400 font-bold' : 'text-sky-300 font-bold'}>{left}</span></> : null}</p>
        </div>
      </div>
      {e.desc && <p className="text-sm text-slate-300 leading-relaxed">{e.desc}</p>}
      {e.codes && (
        <div className="flex flex-wrap gap-2">
          {e.codes.map(code => (
            <button key={code} onClick={() => copy(code)} className="flex items-center gap-1.5 min-h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sm font-bold text-amber-300 active:bg-slate-800">
              {code} <Copy className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ))}
        </div>
      )}
      {e.hunt && (
        <div className="space-y-2">
          {e.hunt.keys.map(key => {
            const p = getPokemon(key);
            if (!p) return null;
            return (
              <button key={key} onClick={() => openNewHunt(key, e.hunt.cfg)} className="w-full flex items-center gap-3 min-h-12 pl-1 pr-3 rounded-2xl bg-slate-950 border border-slate-800 text-left active:bg-slate-800">
                <Sprite pokemon={p} className="w-10 h-10 shrink-0" />
                <span className="flex-1 min-w-0 text-sm font-bold text-slate-100 truncate">Chasser {p.name}</span>
                <span className="text-xs font-mono font-black text-amber-300 shrink-0">{fmtOdds(oddsAt({ ...e.hunt.cfg, charm: true }, 60))}</span>
                <Timer className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
      {e.plan && status !== 'past' && (
        <button onClick={openBankPlan} className="btn-primary w-full"><Hourglass className="w-4 h-4" /> Mon plan avant la fermeture</button>
      )}
      {e.url && (
        <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 min-h-10 text-xs font-bold text-amber-400">
          <ExternalLink className="w-3.5 h-3.5" /> Source
        </a>
      )}
    </article>
  );
}

export default function AgendaTool() {
  const { openAssistant } = useNav();
  const [view, setView] = useState('current');
  const [now] = useState(() => Date.now());
  const groups = useMemo(() => {
    const withStatus = EVENTS.map(e => ({ e, status: eventStatus(e, now) }));
    const byStart = (a, b) => Date.parse(a.e.start) - Date.parse(b.e.start);
    const byEnd = (a, b) => (a.e.end ? Date.parse(a.e.end) : Infinity) - (b.e.end ? Date.parse(b.e.end) : Infinity);
    return {
      current: [
        ...withStatus.filter(x => x.status === 'live').sort(byEnd),
        ...withStatus.filter(x => x.status === 'soon').sort(byStart)
      ],
      past: withStatus.filter(x => x.status === 'past').sort((a, b) => Date.parse(b.e.end) - Date.parse(a.e.end))
    };
  }, [now]);
  const list = groups[view];

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 label-caps text-amber-400"><CalendarDays className="w-4 h-4" /> Agenda des jeux</div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Raids, apparitions massives, distributions, codes et dates limites. Mis à jour le {formatDate(EVENTS_UPDATED)} : les évènements changent souvent, vérifie la source avant de te lancer.
        </p>
        <button onClick={openAssistant} className="btn-secondary w-full"><Sparkles className="w-4 h-4" /> Demander l'actualité à l'assistant</button>
      </div>
      <Segmented size="sm" value={view} onChange={setView}
        options={[{ id: 'current', label: `En cours et à venir (${groups.current.length})` }, { id: 'past', label: `Passés (${groups.past.length})` }]} />
      {list.length ? list.map(({ e, status }) => <EventCard key={e.id} e={e} status={status} now={now} />) : (
        <p className="flex gap-2 text-sm text-slate-400 p-4"><Info className="w-4 h-4 shrink-0 mt-0.5" /> Rien pour le moment.</p>
      )}
    </div>
  );
}
