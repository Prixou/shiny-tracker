import { GAMES, SHINY_METHODS, POKE_BALLS, BALL_BY_ID } from '../data/constants.js';
import { Field, BallIcon } from './ui.jsx';

export default function CaptureForm({ value, onChange, showCounts = true }) {
  const set = key => e => onChange({ [key]: e.target.value });
  const setNumber = key => e => onChange({ [key]: Math.max(0, parseInt(e.target.value, 10) || 0) });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Poké Ball</span>
          <span className="text-xs font-bold text-amber-300">{BALL_BY_ID[value.ball]?.name}</span>
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
          {POKE_BALLS.map(b => (
            <button key={b.id} type="button" onClick={() => onChange({ ball: b.id })} aria-label={b.name} aria-pressed={value.ball === b.id}
              className={`aspect-square rounded-xl flex items-center justify-center border transition active:scale-90 ${value.ball === b.id ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-950 border-slate-800'}`}>
              <BallIcon id={b.id} className="w-7 h-7" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de capture">
          <input type="date" className="input" value={value.date || ''} onChange={e => onChange({ date: e.target.value, timestamp: e.target.value ? new Date(`${e.target.value}T12:00:00`).getTime() : Date.now() })} />
        </Field>
        <Field label="Sexe">
          <div className="flex gap-1.5">
            {[{ id: 'm', label: '♂', cls: 'text-sky-400' }, { id: 'f', label: '♀', cls: 'text-pink-400' }, { id: '', label: '—', cls: 'text-slate-400' }].map(g => (
              <button key={g.id || 'none'} type="button" onClick={() => onChange({ gender: g.id })}
                className={`flex-1 min-h-12 rounded-2xl border text-lg font-black ${g.cls} ${value.gender === g.id ? 'bg-slate-800 border-amber-500' : 'bg-slate-950 border-slate-800'}`}>
                {g.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Jeu">
        <select className="input" value={value.game || ''} onChange={set('game')}>
          <option value="">Non précisé</option>
          {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
        </select>
      </Field>

      <Field label="Méthode">
        <select className="input" value={value.method} onChange={set('method')}>
          {SHINY_METHODS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </select>
      </Field>

      {showCounts && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rencontres">
            <input type="number" inputMode="numeric" min="0" className="input font-mono" value={value.count || ''} placeholder="0" onChange={setNumber('count')} />
          </Field>
          <Field label="Taux (1/x)">
            <input type="number" inputMode="numeric" min="1" className="input font-mono" value={value.odds || ''} placeholder="4096" onChange={setNumber('odds')} />
          </Field>
        </div>
      )}

      <Field label="Surnom">
        <input type="text" className="input" value={value.nickname || ''} maxLength={24} placeholder="Facultatif" onChange={set('nickname')} />
      </Field>

      <Field label="Notes">
        <textarea className="input py-3 min-h-24 resize-y" value={value.notes || ''} placeholder="Nature, lieu, anecdote…" onChange={set('notes')} />
      </Field>
    </div>
  );
}
