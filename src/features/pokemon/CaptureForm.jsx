import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { POKEMON_TYPES, NATURES } from '../../data/constants.js';
import { gameMethods, METHOD_BY_ID } from '../../data/methods.js';
import { BANK_DEADLINE_SHORT, viaBank } from '../../domain/bank.js';
import { timestampFromIso, todayIso } from '../../lib/format.js';
import { UNKNOWN_DATE } from '../../domain/catch.js';
import { Field, BallPicker, Toggle, GameOptions } from '../../ui/index.js';

export default function CaptureForm({ value, onChange, showCounts = true, showProvisional = true }) {
  const [more, setMore] = useState(() => !!(value.nature || value.ability || value.level || value.alpha || value.mark || value.teraType));
  const set = key => e => onChange({ [key]: e.target.value });
  const methods = gameMethods(value.game || 'other');
  if (value.method && !methods.some(m => m.id === value.method) && METHOD_BY_ID[value.method]) methods.push(METHOD_BY_ID[value.method]);

  return (
    <div className="space-y-4">
      <BallPicker value={value.ball} onChange={ball => onChange({ ball })} />

      <div className="grid grid-cols-2 gap-3">
        {/* Date inconnue possible (historique saisi après coup) : la capture ne fausse alors ni le journal ni les stats. */}
        <div>
          <span className="block text-xs font-bold text-slate-400 mb-1.5">Date de capture</span>
          {value.date ? (
            <input type="date" className="input" aria-label="Date de capture" value={value.date}
              onChange={e => onChange(e.target.value ? { date: e.target.value, timestamp: timestampFromIso(e.target.value) } : { ...UNKNOWN_DATE })} />
          ) : (
            <div className="input flex items-center text-slate-400">Inconnue</div>
          )}
          <button type="button" onClick={() => onChange(value.date ? { ...UNKNOWN_DATE } : { date: todayIso(), timestamp: Date.now() })}
            className="min-h-11 text-xs font-bold text-amber-400">
            {value.date ? 'Date inconnue' : 'Indiquer une date'}
          </button>
        </div>
        <Field group label="Sexe">
          <div className="flex gap-1.5">
            {[{ id: 'm', label: '♂', cls: 'text-sky-400' }, { id: 'f', label: '♀', cls: 'text-pink-400' }, { id: '', label: '—', cls: 'text-slate-400' }].map(g => (
              <button key={g.id || 'none'} type="button" onClick={() => onChange({ gender: g.id })} aria-pressed={value.gender === g.id}
                className={`flex-1 min-h-12 rounded-2xl border text-lg font-black ${g.cls} ${value.gender === g.id ? 'bg-slate-800 border-amber-500' : 'bg-slate-950 border-slate-800'}`}>
                {g.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Jeu">
        <select className="input" value={value.game || ''} onChange={e => {
          const game = e.target.value;
          const ms = gameMethods(game || 'other');
          onChange(ms.some(m => m.id === value.method) ? { game } : { game, method: ms[0]?.id || 'other' });
        }}>
          <option value="">Non précisé</option>
          <GameOptions />
        </select>
      </Field>

      {viaBank(value.game) && (
        <div className="card px-4">
          <Toggle checked={!!value.inHome} onChange={inHome => onChange({ inHome })} label="Transféré dans Pokémon HOME" desc={`Via Pokémon Banque (possible jusqu'au ${BANK_DEADLINE_SHORT})`} />
        </div>
      )}

      {showProvisional && (
        <div className="card px-4">
          <Toggle checked={!!value.provisional} onChange={provisional => onChange({ provisional })} label="Provisoire (distribution)"
            desc="Shiny Lock reçu par distribution : à remplacer par un shiny à ton ID dès qu'il sera chassable" />
        </div>
      )}

      <Field label="Méthode">
        <select className="input" value={value.method} onChange={set('method')}>
          {methods.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </select>
      </Field>

      {showCounts && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rencontres">
            <input type="number" inputMode="numeric" min="0" className="input font-mono" value={value.count || ''} placeholder="0" onChange={e => onChange({ count: Math.max(0, parseInt(e.target.value, 10) || 0), luck: null })} />
          </Field>
          <Field label="Taux (1/x)">
            <input type="number" inputMode="numeric" min="1" className="input font-mono" value={value.odds || ''} placeholder="4096" onChange={e => onChange({ odds: Math.max(0, parseInt(e.target.value, 10) || 0), luck: null })} />
          </Field>
        </div>
      )}

      <Field label="Surnom">
        <input type="text" className="input" value={value.nickname || ''} maxLength={24} placeholder="Facultatif" onChange={set('nickname')} />
      </Field>

      <button type="button" onClick={() => setMore(m => !m)} className="w-full flex items-center justify-between min-h-11 px-1 text-sm font-bold text-slate-300" aria-expanded={more}>
        Nature, talent, niveau, Baron…
        <ChevronDown className={`w-4 h-4 transition-transform ${more ? 'rotate-180' : ''}`} />
      </button>
      {more && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nature">
              <select className="input" value={value.nature || ''} onChange={set('nature')}>
                <option value="">—</option>
                {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Niveau">
              <input type="number" inputMode="numeric" min="1" max="100" className="input font-mono" value={value.level || ''} placeholder="—" onChange={e => onChange({ level: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) || '' })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Talent">
              <input type="text" className="input" value={value.ability || ''} maxLength={30} placeholder="—" onChange={set('ability')} />
            </Field>
            <Field label="Type Téracristal">
              <select className="input" value={value.teraType || ''} onChange={set('teraType')}>
                <option value="">—</option>
                {POKEMON_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                <option value="stellar">Stellaire</option>
              </select>
            </Field>
          </div>
          <Field label="Marque / ruban">
            <input type="text" className="input" value={value.mark || ''} maxLength={40} placeholder="Ex. : Marque de l'Aube" onChange={set('mark')} />
          </Field>
          <div className="card px-4">
            <Toggle checked={!!value.alpha} onChange={alpha => onChange({ alpha })} label="Baron (Alpha)" desc="Pokémon Baron de Légendes Arceus ou Z-A" />
          </div>
        </div>
      )}

      <Field label="Notes">
        <textarea className="input py-3 min-h-24 resize-y" value={value.notes || ''} placeholder="Lieu, anecdote…" onChange={set('notes')} />
      </Field>
    </div>
  );
}
