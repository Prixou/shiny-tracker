import { useMemo, useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { useActions, useAppState } from '../../state/StoreProvider.jsx';
import { gameMethods } from '../../data/methods.js';
import { viaBank } from '../../domain/bank.js';
import { commonValue, isEmptyPatch } from '../../domain/bulkEdit.js';
import { todayIso } from '../../lib/format.js';
import { Sheet, Field, BallPicker, GameOptions } from '../../ui/index.js';

/** @import { CatchPatch } from '../../domain/bulkEdit.js' */

const KEEP = '__keep';

/** Rangée de choix « Garder / … » (boutons à bascule). */
function Choices({ label, value, options, onChange }) {
  return (
    <Field group label={label}>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map(o => (
          <button key={o.id} type="button" onClick={() => onChange(o.id)} aria-pressed={value === o.id}
            className={`min-h-11 px-2 rounded-xl border text-xs font-bold ${value === o.id ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

/**
 * Même jeu, méthode, Ball, date ou statut HOME pour tous les shiny sélectionnés. Champs sur « Garder »
 * par défaut ; sans changement, le bouton confirme simplement les détails (les shiny ne sont plus « à vérifier »).
 */
export default function BulkEditSheet({ ids, onClose, onDone }) {
  const catches = useAppState(s => s.catches);
  const { editCatches } = useActions();
  const selected = useMemo(() => {
    const set = new Set(ids);
    return catches.filter(c => set.has(c.id));
  }, [catches, ids]);
  const [patch, setPatch] = useState(/** @type {CatchPatch} */ ({}));
  const [dateMode, setDateMode] = useState('keep');
  const n = selected.length;

  // Jeu visé : celui choisi, sinon celui commun à la sélection (undefined si les jeux diffèrent).
  const game = patch.game !== undefined ? patch.game : commonValue(selected, 'game');
  const methods = game === undefined ? [] : gameMethods(game || 'other');
  const update = (/** @type {CatchPatch} */ p) => setPatch(prev => ({ ...prev, ...p }));

  const changeGame = value => {
    if (value === KEEP) return update({ game: undefined, method: undefined });
    const keepMethod = patch.method && gameMethods(value || 'other').some(m => m.id === patch.method);
    update({ game: value, method: keepMethod ? patch.method : undefined });
  };
  const changeDate = mode => {
    setDateMode(mode);
    update({ date: mode === 'keep' ? undefined : mode === 'unknown' ? '' : patch.date || todayIso() });
  };

  const empty = isEmptyPatch(patch);
  const apply = () => {
    editCatches(selected.map(c => c.id), patch, empty ? `${n} shiny vérifiés` : `${n} shiny modifiés`);
    onDone();
  };

  return (
    <Sheet open onClose={onClose} title={`Modifier ${n} shiny`} subtitle="« Garder » : rien ne change"
      icon={<Pencil className="w-5 h-5" />}
      footer={(
        <div className="space-y-2">
          {empty && <p className="text-xs text-slate-400">Rien à changer ? Confirme : ils ne seront plus « à vérifier ».</p>}
          <button className="btn-primary w-full min-h-12" onClick={apply} disabled={!n}>
            <Check className="w-4 h-4" /> {empty ? `Détails justes (${n})` : `Appliquer à ${n} shiny`}
          </button>
        </div>
      )}>
      <div className="space-y-5">
        <Field label="Jeu">
          <select className="input" value={patch.game ?? KEEP} onChange={e => changeGame(e.target.value)}>
            <option value={KEEP}>Garder</option>
            <option value="">Jeu inconnu</option>
            <GameOptions />
          </select>
        </Field>

        <Field label="Méthode" hint={game === undefined ? 'Jeux différents : choisis d\'abord un jeu.' : undefined}>
          <select className="input" value={patch.method ?? KEEP} disabled={game === undefined} onChange={e => update({ method: e.target.value === KEEP ? undefined : e.target.value })}>
            <option value={KEEP}>{patch.game !== undefined ? 'Garder si possible' : 'Garder'}</option>
            {methods.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </select>
        </Field>

        <BallPicker value={patch.ball || ''} onChange={ball => update({ ball: ball || undefined })} emptyLabel="Garder" />

        <div className="space-y-2">
          <Choices label="Date de capture" value={dateMode} onChange={changeDate}
            options={[{ id: 'keep', label: 'Garder' }, { id: 'unknown', label: 'Inconnue' }, { id: 'set', label: 'Choisir' }]} />
          {dateMode === 'set' && (
            <input type="date" className="input" aria-label="Nouvelle date de capture" value={patch.date || ''} max={todayIso()}
              onChange={e => update({ date: e.target.value || undefined })} />
          )}
        </div>

        {game !== undefined && viaBank(game) && (
          <Choices label="Transféré dans Pokémon HOME" value={patch.inHome === undefined ? 'keep' : patch.inHome ? 'yes' : 'no'}
            onChange={v => update({ inHome: v === 'keep' ? undefined : v === 'yes' })}
            options={[{ id: 'keep', label: 'Garder' }, { id: 'yes', label: 'Oui' }, { id: 'no', label: 'Pas encore' }]} />
        )}
      </div>
    </Sheet>
  );
}
