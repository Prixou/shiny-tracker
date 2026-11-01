import { useMemo } from 'react';
import { useShinies } from '../../state/StoreProvider.jsx';
import { useEncounters } from '../../state/encounters.js';
import { GAME_BY_ID } from '../../data/games.js';
import { METHOD_BY_ID } from '../../data/methods.js';
import { caughtIn, huntMethodIndex, huntMethodLabel } from '../../domain/huntIndex.js';

/**
 * Filtre « Chassable avec » : une méthode dans un jeu, avec pour chacune tes shiny déjà obtenus sur le total.
 * Les données de lieux se chargent à l'ouverture du panneau.
 */
export default function HuntMethodSelect({ value = 'all', onChange, enabled }) {
  const data = useEncounters(enabled);
  const shinies = useShinies();
  const groups = useMemo(() => {
    if (!data || data.error) return null;
    /** @type {Map<string, Array<{ id: string, method: string, caught: number, total: number }>>} */
    const byGame = new Map();
    for (const e of huntMethodIndex(data).entries) {
      if (!byGame.has(e.game)) byGame.set(e.game, []);
      byGame.get(e.game).push({ id: e.id, method: e.method, caught: caughtIn(e, shinies), total: e.keys.size });
    }
    return [...byGame];
  }, [data, shinies]);

  return (
    <label className="block space-y-1.5 sm:col-span-2">
      <span className="label-caps">Chassable avec (méthode)</span>
      <select className="input" value={value} onChange={e => onChange(e.target.value)} disabled={!groups && value === 'all'}>
        <option value="all">{groups || data?.error ? 'Toutes les méthodes' : 'Chargement des méthodes…'}</option>
        {!groups && value !== 'all' && <option value={value}>{huntMethodLabel(value)}</option>}
        {groups?.map(([game, entries]) => (
          <optgroup key={game} label={GAME_BY_ID[game]?.name || game}>
            {entries.map(e => (
              <option key={e.id} value={e.id}>{METHOD_BY_ID[e.method]?.icon} {METHOD_BY_ID[e.method]?.name} — {e.caught}/{e.total}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className="block text-[11px] text-slate-500">
        Tous les Pokémon qu'on peut chasser avec cette méthode dans ce jeu. Tes shiny restent cochés et en couleur ; « Manquants » ne garde que ceux qu'il te reste.
      </span>
    </label>
  );
}
